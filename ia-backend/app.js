// app.js (ESM) — Backend adaptativo multi-operación (add/sub/mul/div) con Transformer + fallback
import express from "express";
import cors from "cors";
import { pipeline } from "@xenova/transformers";

const app = express();
app.use(cors());
app.use(express.json());

// =============== Healthcheck ===============
app.get("/health", (_req, res) => res.json({ ok: true }));

// =============== Sesiones en memoria ===============
/*
  sessions[sessionId] = {
    op: "add" | "sub" | "mul" | "div",
    level: 1..5,
    streak: 0..,
    correct: 0,
    wrong: 0,
    lastProblem: { id,a,b,op,questionText,solution,steps,... }
  }
*/
const sessions = new Map();
const OPS = /** @type const */ (["add","sub","mul","div"]);
const isOp = (x) => OPS.includes(String(x));

// Estado inicial
const newSession = (op = "add") => ({
  op: isOp(op) ? op : "add",
  level: 1,
  streak: 0,
  correct: 0,
  wrong: 0,
  lastProblem: null,
});

// =============== Utilidades ===============
const coerceInt = (v, d = 0) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : d;
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const nowId = (p = "p") => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

function levelConfig(op, level) {
  // Rango por nivel según operación (tunea a gusto)
  // L1: números chicos; L5: grandes
  const L = clamp(level | 0, 1, 5);
  // Base ranges
  const ranges = {
    add:  [9, 20, 50, 99, 999],
    sub:  [9, 20, 50, 99, 999],
    mul:  [5, 10, 12, 20, 50],     // factores
    div:  [5, 10, 12, 20, 50],     // divisor y cociente objetivo
  };
  const carries = { add: [0, .2, .4, .6, .8], sub: [0, .2, .4, .6, .8], mul: [0, .15, .3, .45, .6], div: [0, .15, .3, .45, .6] };
  const arr = ranges[op] ?? ranges.add;
  const maxNum = arr[L - 1];
  const carryBorrowBias = carries[op][L - 1];
  return { level: L, maxNum, carryBorrowBias };
}

const sym = { add: "+", sub: "−", mul: "×", div: "÷" };

function computeSolution(op, a, b, { integerDiv = true } = {}) {
  switch (op) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return integerDiv ? Math.floor(a / b) : a / b;
    default: return a + b;
  }
}

// Generadores por operación, intentando forzar “llevada”/“préstamo” o multiplicaciones/divisiones con cierta dificultad
function makeOperands(op, { maxNum, wantCarryBorrow }) {
  if (op === "add") {
    if (!wantCarryBorrow) {
      const a = Math.floor(Math.random() * (maxNum + 1));
      const b = Math.floor(Math.random() * (maxNum + 1));
      return [a, b];
    }
    if (maxNum < 10) {
      const a1 = Math.floor(1 + Math.random() * Math.min(9, maxNum));
      const b1 = Math.max(10 - a1, 1);
      return [a1, Math.min(b1, maxNum)];
    }
    const a = Math.floor(Math.random() * (maxNum + 1));
    const u1 = a % 10;
    const need = 10 - u1;
    let b = Math.floor(Math.random() * (maxNum + 1));
    const u2 = b % 10;
    if (u2 < need) {
      b += (need - u2);
      if (b > maxNum) b = Math.max(0, a - need);
    }
    return [a, b];
  }

  if (op === "sub") {
    let a = Math.floor(Math.random() * (maxNum + 1));
    let b = Math.floor(Math.random() * (maxNum + 1));
    // asegura a >= b para resultado no negativo
    if (a < b) [a, b] = [b, a];
    if (wantCarryBorrow && a >= 10 && b >= 0) {
      // intenta forzar préstamo: (a%10) < (b%10)
      const au = a % 10;
      let bu = au === 0 ? 1 : au; // buscar mayor que au
      bu = clamp(bu, 1, 9);
      const tens = Math.floor(b / 10);
      b = tens * 10 + clamp(bu, 1, 9);
      if (b > a) [a, b] = [b, a];
    }
    return [a, b];
  }

  if (op === "mul") {
    // factores (0..maxNum). Con wantCarryBorrow intenta multiplicaciones con llevada (unidades grandes)
    let a = Math.floor(Math.random() * (maxNum + 1));
    let b = Math.floor(Math.random() * (maxNum + 1));
    if (wantCarryBorrow) {
      // empuja a y/o b a 2 dígitos y unidades altas
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
    // Evitar división entre 0; preferir divisiones exactas (enteras)
    const divisor = Math.max(1, Math.floor(1 + Math.random() * maxNum));
    let quotient = Math.floor(1 + Math.random() * maxNum);
    if (wantCarryBorrow) {
      // empuja a cocientes/divisores más “grandes”
      quotient = Math.max(quotient, Math.floor(maxNum * 0.6));
    }
    const dividend = divisor * quotient; // exacta
    return [dividend, divisor];
  }

  // fallback add
  const a = Math.floor(Math.random() * (maxNum + 1));
  const b = Math.floor(Math.random() * (maxNum + 1));
  return [a, b];
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
          ? [
              `Suma unidades: ${a % 10} + ${b % 10} (si ≥10, lleva 1).`,
              `Suma decenas (y centenas si aplica), incluyendo llevada.`,
              `Resultado: ${solution}.`,
            ]
          : [
              `Suma unidades: ${a % 10} + ${b % 10}.`,
              `Suma decenas (y centenas si aplica).`,
              `Resultado: ${solution}.`,
            ])
      : op === "sub"
      ? (want
          ? [
              `Compara unidades: ${a % 10} y ${b % 10}. Si ${a % 10} < ${b % 10}, pide préstamo a decenas.`,
              `Resta unidades y luego decenas (y centenas si aplica).`,
              `Resultado: ${solution}.`,
            ]
          : [
              `Resta unidades: ${a % 10} − ${b % 10}.`,
              `Resta decenas (y centenas si aplica).`,
              `Resultado: ${solution}.`,
            ])
      : op === "mul"
      ? [
          `Multiplica unidades y maneja llevadas si aparecen.`,
          `Multiplica decenas (y centenas) y suma los parciales.`,
          `Resultado: ${solution}.`,
        ]
      : op === "div"
      ? [
          `Divide ${a} entre ${b} paso a paso.`,
          `Calcula cociente entero (sin residuo aquí).`,
          `Resultado: ${solution}.`,
        ]
      : [`Resultado: ${solution}.`];

  return {
    id: nowId("pr"),
    op,
    a,
    b,
    questionText:
      (locale === "es" ? pick(pTextEs) : pick(pTextEn))(a, b, S),
    difficulty: pick(diffs),
    solution,
    steps,
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
  try {
    const m = text.match(/\{[\s\S]*"problems"[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

function sanitizeProblems(obj, count, op, L, locale) {
  if (!obj || !Array.isArray(obj.problems) || obj.problems.length === 0)
    return fallbackProblems(count, op, L, locale);
  const out = obj.problems.map((p) => {
    const a = coerceInt(p?.a, 0), b = coerceInt(p?.b, 0);
    const opx = isOp(p?.op) ? p.op : op;
    let A = a, B = b;
    // Normalizaciones por operación para mantener consistencia didáctica
    if (opx === "sub" && A < B) [A, B] = [B, A];
    if (opx === "div") {
      // Evita divisor 0. Si no es exacto, ajusta a una división exacta
      const divisor = Math.max(1, B || 1);
      const q = Math.max(1, Math.floor(Math.abs(A || 0) / Math.max(1, divisor)) || 1);
      A = divisor * q; // exacta
      B = divisor;
    }
    return {
      id: p?.id ?? nowId("p"),
      op: opx,
      a: A,
      b: B,
      questionText:
        typeof p?.questionText === "string" && p.questionText.trim()
          ? p.questionText.trim()
          : (locale === "es"
              ? `¿Cuánto es ${A} ${sym[opx] ?? "?"} ${B}?`
              : `What is ${A} ${sym[opx] ?? "?"} ${B}?`),
      difficulty: ["fácil","medio","difícil"].includes(p?.difficulty) ? p.difficulty : "fácil",
      solution: coerceInt(p?.solution, computeSolution(opx, A, B, { integerDiv: true })),
      steps: Array.isArray(p?.steps) ? p.steps.map(String) : [],
    };
  });
  return { problems: out };
}

// =============== Carga Transformer ===============
console.log("Cargando modelo (t5-small)...");
const text2text = await pipeline("text2text-generation", "Xenova/t5-small");
console.log("Modelo listo ✅");

// =============== Prompts (generativo) ===============
const genOnePrompt = ({ op, a, b, locale }) => `
Eres un generador de problemas de matemáticas para niños.
Crea UN problema de ${op} con los números ${a} y ${b}.
Usa el símbolo correcto: ${sym[op] ?? "?"}.
Devuelve SOLO JSON:
{
  "problems": [
    {
      "id": "string",
      "op": "${op}",
      "a": ${a},
      "b": ${b},
      "questionText": "string",
      "difficulty": "fácil"|"medio"|"difícil",
      "solution": ${computeSolution(op, a, b, { integerDiv: true })},
      "steps": ["string", "string"]
    }
  ]
}
Idioma: ${locale}. Solo JSON, nada más.
`;

const genBatchPrompt = ({ op, count, maxNum, locale }) => `
You are a math exercise generator for kids.
Create ${count} ${op} problems with operands between 0 and ${maxNum}.
Use the correct operator symbol (${sym[op] ?? "?"}).
Return ONLY valid JSON:
{ "problems": [ { "id":"string", "op":"${op}", "a":number, "b":number, "questionText":"string", "difficulty":"fácil"|"medio"|"difícil", "solution":number, "steps":["string"] } ] }
Language: ${locale}. JSON only.
`;

// =============== Lógica adaptativa ===============
function updateLevel(session, wasCorrect) {
  // Subir si 3 aciertos seguidos; bajar si 2 fallos seguidos
  if (wasCorrect) {
    session.streak += 1;
    session.correct += 1;
    if (session.streak >= 3 && session.level < 5) {
      session.level += 1;
      session.streak = 0;
    }
  } else {
    session.streak = Math.max(0, session.streak - 1);
    session.wrong += 1;
    if (session.wrong % 2 === 0 && session.level > 1) {
      session.level -= 1;
    }
  }
}

// =============== Endpoints ===============

// 1) Crear sesión (puedes enviar { op: "add"|"sub"|"mul"|"div" })
app.post("/session/start", (req, res) => {
  const op = isOp(req.body?.op) ? req.body.op : "add";
  const id = nowId("sess");
  const state = newSession(op);
  sessions.set(id, state);
  res.json({ sessionId: id, state });
});

// 2) Siguiente problema (adaptativo). Puedes cambiar op en caliente enviando { op }
app.post("/session/next", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const locale = String(req.body?.locale || "es");
  const sess = sessions.get(sessionId);
  if (!sess) return res.status(400).json({ error: "Invalid sessionId" });

  if (isOp(req.body?.op)) sess.op = req.body.op;

  const { maxNum, carryBorrowBias } = levelConfig(sess.op, sess.level);
  const want = Math.random() < carryBorrowBias;
  const [a, b] = makeOperands(sess.op, { maxNum, wantCarryBorrow: want });

  try {
    const out = await text2text(genOnePrompt({ op: sess.op, a, b, locale }), {
      max_new_tokens: 200, temperature: 0.2, top_p: 0.9, repetition_penalty: 1.05,
    });
    const raw = (out?.[0]?.generated_text ?? "").trim();
    const parsed = tryParseJSON(raw);
    const { problems } = sanitizeProblems(parsed, 1, sess.op, sess.level, locale);
    const prob = problems[0];
    sess.lastProblem = prob;
    return res.json({
      problem: prob,
      state: { op: sess.op, level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong }
    });
  } catch (_e) {
    const prob = problemFor(sess.op, sess.level, locale);
    sess.lastProblem = prob;
    return res.json({
      problem: prob,
      state: { op: sess.op, level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong }
    });
  }
});

// 3) Calificar respuesta y ajustar dificultad
app.post("/session/grade", (req, res) => {
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
      ? (locale === "es"
          ? "Suma unidades primero; si supera 9, lleva 1 a decenas."
          : "Add ones first; if ≥10, carry 1 to tens.")
      : op === "sub"
      ? (locale === "es"
          ? "Si no alcanzan las unidades, toma prestado de las decenas."
          : "If ones are smaller, borrow from tens.")
      : op === "mul"
      ? (locale === "es"
          ? "Multiplica por columnas y suma parciales."
          : "Multiply by columns and add partials.")
      : (locale === "es"
          ? "Divide y verifica si hay residuo; usa cociente entero."
          : "Divide and check remainder; use integer quotient."));

  res.json({
    correct,
    expected: solution,
    feedback: correct ? M.ok : M.bad,
    nextHint,
    state: { op: sess.op, level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong },
  });
});

// (Opcional) Generar lote no adaptativo
app.post("/generate", async (req, res) => {
  const op = isOp(req.body?.op) ? req.body.op : "add";
  const count = coerceInt(req.body?.count ?? 10, 10);
  const locale = String(req.body?.locale || "es");
  const level = coerceInt(req.body?.level ?? 1, 1);
  const { maxNum } = levelConfig(op, level);

  try {
    const out = await text2text(genBatchPrompt({ op, count, maxNum, locale }), {
      max_new_tokens: 256, temperature: 0.2
    });
    const raw = (out?.[0]?.generated_text ?? "").trim();
    const parsed = tryParseJSON(raw);
    const result = sanitizeProblems(parsed, count, op, level, locale);
    res.json(result);
  } catch {
    res.json(fallbackProblems(count, op, level, locale));
  }
});

// Alias para compatibilidad con cliente antiguo (POST /grade) — no adaptativo
app.post("/grade", (req, res) => {
  const { op: opIn, a, b, userAnswer, locale = 'es' } = req.body || {};
  const op = isOp(opIn) ? opIn : "add";
  let A = coerceInt(a), B = coerceInt(b), UA = coerceInt(userAnswer);
  if (op === "sub" && A < B) [A, B] = [B, A];
  if (op === "div") { B = Math.max(1, B || 1); } // sin divisor 0
  const solution = computeSolution(op, A, B, { integerDiv: true });
  const correct = UA === solution;
  const feedback = correct
    ? (locale === "es" ? "¡Excelente! Respuesta correcta." : "Great job! Correct answer.")
    : (locale === "es" ? `Casi. ${A} ${sym[op]} ${B} = ${solution}.` : `Almost. ${A} ${sym[op]} ${B} = ${solution}.`);
  res.json({ op, correct, expected: solution, feedback, nextHint: "" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🧠 Backend adaptativo (multi-op) en http://localhost:${PORT}`)
);