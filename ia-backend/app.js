// app.js (ESM) — Backend adaptativo (cola + prefetch) con LLM opcional cargado en background
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ================== Config ==================
const envBool = (v) => typeof v === "string" && /^(1|true|t|yes|y|on)$/i.test(v.trim());
const USE_LLM = envBool(process.env.USE_LLM);           // Off por defecto (velocidad)
const QUEUE_TARGET = Number(process.env.QUEUE_TARGET ?? 3); // Problemas precargados por sesión

console.log(`[boot] Node ${process.version} | USE_LLM=${USE_LLM} (raw="${process.env.USE_LLM || ""}")`);

// ================== Estado LLM (carga en background) ==================
let text2text = null;
let llmReady = false;

async function loadLLM() {
  if (!USE_LLM) {
    console.log("USE_LLM=false → omito carga de modelo (modo rápido).");
    return;
  }
  console.log("USE_LLM=true → iniciando carga del modelo (t5-small) en background…");
  try {
    // Import dinámico para no requerir la dep si no se usa
    const { pipeline } = await import("@xenova/transformers");
    text2text = await pipeline("text2text-generation", "Xenova/t5-small", {
      progress_callback: (d) => {
        const status = d?.status ?? "status";
        const file = d?.file ? ` ${d.file}` : "";
        const prog = (d?.progress ?? "") !== "" ? ` ${d.progress}%` : "";
        console.log(`[transformers] ${status}${file}${prog}`);
      },
    });
    // Warm-up para evitar “congelón” en la 1ª inferencia real
    await text2text("{}", { max_new_tokens: 1, do_sample: false });
    llmReady = true;
    console.log("✅ Modelo listo (t5-small)");
  } catch (e) {
    console.error("❌ No se pudo cargar el LLM; sigo en modo rápido:", e?.message || e);
    text2text = null;
    llmReady = false;
  }
}

// ================== Healthcheck ==================
app.get("/health", (_req, res) =>
  res.json({ ok: true, useLLM: USE_LLM, llmReady, queueTarget: QUEUE_TARGET })
);

// ================== Sesiones ==================
/*
sessions[sessionId] = {
  op: "add"|"sub"|"mul"|"div",
  level: 1..5, streak: 0.., correct: 0, wrong: 0,
  lastProblem: {...} | null,
  nextPrefetchedProblem: {...} | null,
  problemQueue: Array<{...}>
}
*/
const sessions = new Map();
const OPS = /** @type const */ (["add","sub","mul","div"]);
const isOp = (x) => OPS.includes(String(x));
const sym = { add: "+", sub: "−", mul: "×", div: "÷" };

const coerceInt = (v, d = 0) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : d;
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const nowId = (p = "p") => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

const newSession = (op = "add") => ({
  op: isOp(op) ? op : "add",
  level: 1,
  streak: 0,
  correct: 0,
  wrong: 0,
  lastProblem: null,
  nextPrefetchedProblem: null,
  problemQueue: [],
});

function levelConfig(op, level) {
  const L = clamp(level | 0, 1, 5);
  const ranges = {
    add: [9, 20, 50, 99, 999],
    sub: [9, 20, 50, 99, 999],
    mul: [5, 10, 12, 20, 50],
    div: [5, 10, 12, 20, 50],
  };
  const carries = {
    add: [0, .2, .4, .6, .8],
    sub: [0, .2, .4, .6, .8],
    mul: [0, .15, .3, .45, .6],
    div: [0, .15, .3, .45, .6],
  };
  return { level: L, maxNum: ranges[op][L - 1], carryBorrowBias: carries[op][L - 1] };
}

function computeSolution(op, a, b, { integerDiv = true } = {}) {
  switch (op) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return integerDiv ? Math.floor(a / b) : a / b;
    default: return a + b;
  }
}

function makeOperands(op, { maxNum, wantCarryBorrow }) {
  if (op === "add") {
    if (!wantCarryBorrow) return [
      Math.floor(Math.random() * (maxNum + 1)),
      Math.floor(Math.random() * (maxNum + 1)),
    ];
    if (maxNum < 10) {
      const a1 = Math.floor(1 + Math.random() * Math.min(9, maxNum));
      const b1 = Math.max(10 - a1, 1);
      return [a1, Math.min(b1, maxNum)];
    }
    const a = Math.floor(Math.random() * (maxNum + 1));
    const need = 10 - (a % 10);
    let b = Math.floor(Math.random() * (maxNum + 1));
    if ((b % 10) < need) {
      b += (need - (b % 10));
      if (b > maxNum) b = Math.max(0, a - need);
    }
    return [a, b];
  }
  if (op === "sub") {
    let a = Math.floor(Math.random() * (maxNum + 1));
    let b = Math.floor(Math.random() * (maxNum + 1));
    if (a < b) [a, b] = [b, a];
    if (wantCarryBorrow && a >= 10) {
      const au = a % 10;
      let bu = au === 0 ? 1 : au;
      bu = clamp(bu, 1, 9);
      const tens = Math.floor(b / 10);
      b = tens * 10 + clamp(bu, 1, 9);
      if (b > a) [a, b] = [b, a];
    }
    return [a, b];
  }
  if (op === "mul") {
    let a = Math.floor(Math.random() * (maxNum + 1));
    let b = Math.floor(Math.random() * (maxNum + 1));
    if (wantCarryBorrow) {
      const tweak = (n) => {
        if (n < 10 && maxNum >= 10) n = 10 + (n % 10);
        const u = n % 10;
        if (u < 6) n += (6 - u);
        return clamp(n, 0, maxNum);
      };
      a = tweak(a); b = tweak(b);
    }
    return [a, b];
  }
  if (op === "div") {
    const divisor = Math.max(1, Math.floor(1 + Math.random() * maxNum));
    let quotient = Math.floor(1 + Math.random() * maxNum);
    if (wantCarryBorrow) quotient = Math.max(quotient, Math.floor(maxNum * 0.6));
    return [divisor * quotient, divisor];
  }
  return [
    Math.floor(Math.random() * (maxNum + 1)),
    Math.floor(Math.random() * (maxNum + 1)),
  ];
}

function problemFor(op, L, locale = "es") {
  const { maxNum, carryBorrowBias } = levelConfig(op, L);
  const want = Math.random() < carryBorrowBias;
  const [a, b] = makeOperands(op, { maxNum, wantCarryBorrow: want });
  const S = sym[op] ?? "+";
  const diffs = ["fácil", "medio", "difícil"];
  const pTextEs = [
    (x, y, s) => `¿Cuánto es ${x} ${s} ${y}?`,
    (x, y, s) => `Resuelve: ${x} ${s} ${y}`,
    (x, y, s) => `Completa la operación: ${x} ${s} ${y} = ?`,
  ];
  const pTextEn = [
    (x, y, s) => `What is ${x} ${s} ${y}?`,
    (x, y, s) => `Solve: ${x} ${s} ${y}`,
    (x, y, s) => `Complete: ${x} ${s} ${y} = ?`,
  ];

  const solution = computeSolution(op, a, b, { integerDiv: true });
  const steps =
    op === "add"
      ? (want
          ? [`Suma unidades con llevada.`,`Suma decenas/centenas con llevada.`,`Resultado: ${solution}.`]
          : [`Suma unidades.`,`Suma decenas/centenas.`,`Resultado: ${solution}.`])
      : op === "sub"
      ? (want
          ? [`Si no alcanzan unidades, pide prestado.`,`Resta unidades y decenas.`,`Resultado: ${solution}.`]
          : [`Resta unidades.`,`Resta decenas/centenas.`,`Resultado: ${solution}.`])
      : op === "mul"
      ? [`Multiplica por columnas.`,`Suma parciales.`,`Resultado: ${solution}.`]
      : op === "div"
      ? [`Divide ${a} entre ${b}.`,`Toma cociente entero.`,`Resultado: ${solution}.`]
      : [`Resultado: ${solution}.`];

  return {
    id: nowId("pr"),
    op, a, b,
    questionText: (locale === "es" ? pick(pTextEs) : pick(pTextEn))(a, b, S),
    difficulty: pick(diffs),
    solution, steps,
  };
}

function fallbackProblems(count, op, L, locale) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(problemFor(op, L, locale));
  return { problems: arr };
}

function tryParseJSON(text) {
  try {
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) return JSON.parse(text.slice(s, e + 1));
  } catch {}
  try { return JSON.parse(text.replace(/```json|```/g, "")); } catch {}
  try { const m = text.match(/\{[\s\S]*"problems"[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch {}
  return null;
}

function sanitizeProblems(obj, count, op, L, locale) {
  if (!obj || !Array.isArray(obj.problems) || obj.problems.length === 0)
    return fallbackProblems(count, op, L, locale);
  const out = obj.problems.map((p) => {
    const a = coerceInt(p?.a, 0), b = coerceInt(p?.b, 0);
    const opx = isOp(p?.op) ? p.op : op;
    let A = a, B = b;
    if (opx === "sub" && A < B) [A, B] = [B, A];
    if (opx === "div") {
      const divisor = Math.max(1, B || 1);
      const q = Math.max(1, Math.floor(Math.abs(A || 0) / Math.max(1, divisor)) || 1);
      A = divisor * q; B = divisor;
    }
    return {
      id: p?.id ?? nowId("p"),
      op: opx, a: A, b: B,
      questionText:
        typeof p?.questionText === "string" && p.questionText.trim()
          ? p.questionText.trim()
          : (locale === "es" ? `¿Cuánto es ${A} ${sym[opx] ?? "?"} ${B}?`
                             : `What is ${A} ${sym[opx] ?? "?"} ${B}?`),
      difficulty: ["fácil","medio","difícil"].includes(p?.difficulty) ? p.difficulty : "fácil",
      solution: coerceInt(p?.solution, computeSolution(opx, A, B, { integerDiv: true })),
      steps: Array.isArray(p?.steps) ? p.steps.map(String) : [],
    };
  });
  return { problems: out };
}

// ================== Adaptación ==================
function updateLevel(session, wasCorrect) {
  if (wasCorrect) {
    session.streak += 1;
    session.correct += 1;
    if (session.streak >= 3 && session.level < 5) {
      const prev = session.level;
      session.level += 1;
      session.streak = 0;
      console.log(`[nivel↑] ${prev}→${session.level}`);
    }
  } else {
    session.streak = Math.max(0, session.streak - 1);
    session.wrong += 1;
    if (session.wrong % 2 === 0 && session.level > 1) {
      console.log(`[nivel↓] ${session.level}→${session.level - 1} (errores=${session.wrong})`);
      session.level -= 1;
    }
  }
}

// ================== Generación (LLM si listo; si no, instantáneo) ==================
async function generateOneProblem(op, level, locale, preferLLM = (USE_LLM && llmReady)) {
  if (!preferLLM || !text2text) return problemFor(op, level, locale);
  const { maxNum, carryBorrowBias } = levelConfig(op, level);
  const want = Math.random() < carryBorrowBias;
  const [a, b] = makeOperands(op, { maxNum, wantCarryBorrow: want });
  try {
    const out = await text2text(
      `Return ONLY JSON for ONE problem.
{"problems":[{"id":"${nowId("p")}","op":"${op}","a":${a},"b":${b},"questionText":"${locale==="es"?"¿Cuánto es":"What is"} ${a} ${sym[op]} ${b}?","difficulty":"fácil","solution":${computeSolution(op,a,b,{integerDiv:true})},"steps":[]}]}
`,
      { max_new_tokens: 64, do_sample: false }
    );
    const raw = (out?.[0]?.generated_text ?? "").trim();
    const parsed = tryParseJSON(raw);
    return sanitizeProblems(parsed, 1, op, level, locale).problems[0];
  } catch {
    return problemFor(op, level, locale);
  }
}

// ================== Cola y Prefetch ==================
async function fillQueue(sess, locale, target = QUEUE_TARGET, preferLLM = false) {
  while (sess.problemQueue.length < target) {
    const p = await generateOneProblem(sess.op, sess.level, locale, preferLLM);
    sess.problemQueue.push(p);
  }
}
async function takeFromQueueOrGenerate(sess, locale) {
  if (sess.problemQueue.length > 0) return sess.problemQueue.shift();
  return await generateOneProblem(sess.op, sess.level, locale, /*preferLLM*/ false);
}

// ================== Endpoints ==================

// Crear sesión
app.post("/session/start", (req, res) => {
  const op = isOp(req.body?.op) ? req.body.op : "add";
  const id = nowId("sess");
  const state = newSession(op);
  sessions.set(id, state);

  // Precarga (no bloquea la respuesta)
  const locale = String(req.body?.locale || "es");
  setImmediate(() => fillQueue(state, locale, QUEUE_TARGET, /*preferLLM*/ false).catch(() => {}));

  res.json({ sessionId: id, state });
});

// Siguiente problema (instantáneo con prefetched/cola)
app.post("/session/next", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const locale = String(req.body?.locale || "es");
  const sess = sessions.get(sessionId);
  if (!sess) return res.status(400).json({ error: "Invalid sessionId" });

  if (isOp(req.body?.op)) sess.op = req.body.op;

  // 1) Usa prefetched si hay
  if (sess.nextPrefetchedProblem) {
    const prob = sess.nextPrefetchedProblem;
    sess.lastProblem = prob;
    sess.nextPrefetchedProblem = null;
    setImmediate(() => fillQueue(sess, locale, QUEUE_TARGET, false).catch(() => {}));
    return res.json({ problem: prob, state: { op: sess.op, level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong } });
  }

  // 2) Toma de cola o genera instantáneo (fallback si LLM no está listo)
  const prob = await takeFromQueueOrGenerate(sess, locale);
  sess.lastProblem = prob;
  setImmediate(() => fillQueue(sess, locale, QUEUE_TARGET, false).catch(() => {}));

  res.json({ problem: prob, state: { op: sess.op, level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong } });
});

// Calificar + prefetch inmediato del siguiente
app.post("/session/grade", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const userAnswer = coerceInt(req.body?.userAnswer);
  const locale = String(req.body?.locale || "es");
  const sess = sessions.get(sessionId);
  if (!sess || !sess.lastProblem)
    return res.status(400).json({ error: "Invalid session or no last problem" });

  const { op, a, b, solution } = sess.lastProblem;
  const correct = userAnswer === solution;

  const messages = {
    es: {
      ok: "¡Excelente! Respuesta correcta.",
      bad: `Casi. ${a} ${sym[op]} ${b} = ${solution}.`,
      up: "Subiremos un poco la dificultad.",
      down: "Practica: trabaja paso a paso y revisa tus operaciones.",
    },
    en: {
      ok: "Great job! Correct answer.",
      bad: `Almost. ${a} ${sym[op]} ${b} = ${solution}.`,
      up: "We will increase the difficulty a bit.",
      down: "Practice step by step and check your operations.",
    },
  };
  const M = locale === "es" ? messages.es : messages.en;

  updateLevel(sess, correct);

  const nextHint = correct ? M.up : (op === "add"
    ? (locale === "es" ? "Suma unidades; si ≥10, lleva 1." : "Add ones; if ≥10, carry 1.")
    : op === "sub"
    ? (locale === "es" ? "Si no alcanzan unidades, pide prestado." : "If ones too small, borrow.")
    : op === "mul"
    ? (locale === "es" ? "Multiplica por columnas y suma parciales." : "Multiply columns; add partials.")
    : (locale === "es" ? "Divide y toma cociente entero." : "Divide and take integer quotient.")
  );

  // Prefetch del siguiente (instantáneo, sin bloquear)
  const nextProblem = await takeFromQueueOrGenerate(sess, locale);
  sess.nextPrefetchedProblem = nextProblem;
  setImmediate(() => fillQueue(sess, locale, QUEUE_TARGET, false).catch(() => {}));

  res.json({
    correct,
    expected: solution,
    feedback: correct ? M.ok : M.bad,
    nextHint,
    nextProblemPreview: nextProblem, // la UI puede mostrarlo sin otro round-trip
    state: { op: sess.op, level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong },
  });
});

// Generar lote (rápido; usa LLM solo si está listo y activado)
app.post("/generate", async (req, res) => {
  const op = isOp(req.body?.op) ? req.body.op : "add";
  const count = clamp(coerceInt(req.body?.count ?? 10, 10), 1, 200);
  const locale = String(req.body?.locale || "es");
  const level = clamp(coerceInt(req.body?.level ?? 1, 1), 1, 5);

  // Si LLM no está listo, respondemos inmediato con fallback
  if (!USE_LLM || !llmReady || !text2text) {
    return res.json(fallbackProblems(count, op, level, locale));
  }

  const out = [];
  for (let i = 0; i < count; i++) out.push(await generateOneProblem(op, level, locale, true));
  res.json({ problems: out });
});

// Alias compatibilidad (no adaptativo)
app.post("/grade", (req, res) => {
  const { op: opIn, a, b, userAnswer, locale = 'es' } = req.body || {};
  const op = isOp(opIn) ? opIn : "add";
  let A = coerceInt(a), B = coerceInt(b), UA = coerceInt(userAnswer);
  if (op === "sub" && A < B) [A, B] = [B, A];
  if (op === "div") B = Math.max(1, B || 1);
  const solution = computeSolution(op, A, B, { integerDiv: true });
  const correct = UA === solution;
  const feedback = correct ? (locale === "es" ? "¡Excelente! Respuesta correcta." : "Great job! Correct answer.")
                           : (locale === "es" ? `Casi. ${A} ${sym[op]} ${B} = ${solution}.` : `Almost. ${A} ${sym[op]} ${B} = ${solution}.`);
  res.json({ op, correct, expected: solution, feedback, nextHint: "" });
});

// ================== Server ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧠 Backend en http://localhost:${PORT} | useLLM=${USE_LLM} | llmReady=${llmReady} | QUEUE_TARGET=${QUEUE_TARGET}`);
  // Cargar LLM en background (no bloquea el arranque)
  setImmediate(loadLLM);
});