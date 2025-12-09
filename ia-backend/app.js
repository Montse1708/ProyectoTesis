// app.js (ESM) — Backend adaptativo (cola + prefetch) con LLM opcional
// Operaciones: enteras (add, sub, mul, div), fracciones (frac) y series de números (seq)
// 'frac' incluye: suma, resta, multiplicación y división de fracciones (aleatorio por problema)
// 'seq' incluye: series aritméticas/geométricas con tareas de "next" (siguiente término) o "sum" (S_n)
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ================== Config ==================
const envBool = (v) =>
  typeof v === "string" && /^(1|true|t|yes|y|on)$/i.test(v.trim());
const USE_LLM = envBool(process.env.USE_LLM); // Off por defecto (velocidad)
const QUEUE_TARGET = Number(process.env.QUEUE_TARGET ?? 3); // Problemas precargados por sesión

console.log(
  `[boot] Node ${process.version} | USE_LLM=${USE_LLM} (raw="${
    process.env.USE_LLM || ""
  }")`
);

// ================== Estado LLM (carga en background) ==================
let text2text = null;
let llmReady = false;

async function loadLLM() {
  if (!USE_LLM) {
    console.log("USE_LLM=false → omito carga de modelo (modo rápido).");
    return;
  }
  console.log(
    "USE_LLM=true → iniciando carga del modelo (t5-small) en background…"
  );
  try {
    const { pipeline } = await import("@xenova/transformers");
    text2text = await pipeline("text2text-generation", "Xenova/t5-small", {
      progress_callback: (d) => {
        const status = d?.status ?? "status";
        const file = d?.file ? ` ${d.file}` : "";
        const prog = (d?.progress ?? "") !== "" ? ` ${d.progress}%` : "";
        console.log(`[transformers] ${status}${file}${prog}`);
      },
    });
    await text2text("{}", { max_new_tokens: 1, do_sample: false });
    llmReady = true;
    console.log("✅ Modelo listo (t5-small)");
  } catch (e) {
    console.error(
      "❌ No se pudo cargar el LLM; sigo en modo rápido:",
      e?.message || e
    );
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
  op: "add"|"sub"|"mul"|"div"|"frac"|"seq",
  level: 1..5, streak: 0.., correct: 0, wrong: 0,
  lastProblem: {...} | null,
  nextPrefetchedProblem: {...} | null,
  problemQueue: Array<{...}>
}
*/
const sessions = new Map();

// ======= Fracciones: helpers =======
const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
const simplify = (n, d) => {
  if (d === 0) return { n: 0, d: 1 };
  const g = gcd(n, d);
  const s = d < 0 ? -1 : 1;
  return { n: (n / g) * s, d: Math.abs(d / g) };
};
const fracToString = ({ n, d }) => `${n}/${d}`;
const equalFrac = (a, b) => a.n * b.d === b.n * a.d;

function parseUserFraction(input) {
  if (typeof input === "number" && Number.isFinite(input)) {
    const d = 1000;
    return simplify(Math.round(input * d), d);
  }
  const txt = String(input ?? "").trim().replace(",", ".");
  if (/^-?\d+\/-?\d+$/.test(txt)) {
    const [nn, dd] = txt.split("/").map(Number);
    return simplify(nn, dd);
  }
  const asNum = Number(txt);
  if (Number.isFinite(asNum)) {
    const d = 1000;
    return simplify(Math.round(asNum * d), d);
  }
  return null;
}

function randomFraction(maxDen = 12) {
  const d = Math.max(2, Math.floor(2 + Math.random() * maxDen));
  const n = Math.floor(1 + Math.random() * (d - 1));
  return simplify(n, d);
}

// ======= Operaciones soportadas =======
// 'frac' = una sola operación que incluye fadd/fsub/fmul/fdiv de forma aleatoria
// 'seq'  = series (aritmética/geométrica), tareas: "next" o "sum"
const OPS = /** @type const */ (["add", "sub", "mul", "div", "frac", "seq"]);
const isOp = (x) => OPS.includes(String(x));
const sym = {
  add: "+",
  sub: "−",
  mul: "×",
  div: "÷",
  // para 'frac' y 'seq' el símbolo se elige/omite internamente
};

const coerceInt = (v, d = 0) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : d;
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const nowId = (p = "p") =>
  `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

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
    frac: [6, 8, 10, 12, 20], // máx denominador fracciones
    seq: [20, 40, 80, 120, 200], // magnitud de términos/params de series
  };
  const carries = {
    add: [0, 0.2, 0.4, 0.6, 0.8],
    sub: [0, 0.2, 0.4, 0.6, 0.8],
    mul: [0, 0.15, 0.3, 0.45, 0.6],
    div: [0, 0.15, 0.3, 0.45, 0.6],
    frac: [0, 0.15, 0.3, 0.45, 0.6],
    seq: [0, 0.1, 0.2, 0.35, 0.5], // más “trucos” conforme sube el nivel
  };
  return {
    level: L,
    maxNum: ranges[op][L - 1],
    carryBorrowBias: carries[op][L - 1],
  };
}

function computeSolution(op, a, b, { integerDiv = true } = {}) {
  switch (op) {
    case "add":
      return a + b;
    case "sub":
      return a - b;
    case "mul":
      return a * b;
    case "div":
      return integerDiv ? Math.floor(a / b) : a / b;
    // 'frac' y 'seq' se resuelven en problemFor
    default:
      return a + b;
  }
}

function makeOperands(op, { maxNum, wantCarryBorrow }) {
  if (op === "add") {
    if (!wantCarryBorrow)
      return [
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
    if (b % 10 < need) {
      b += need - (b % 10);
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
        if (u < 6) n += 6 - u;
        return clamp(n, 0, maxNum);
      };
      a = tweak(a);
      b = tweak(b);
    }
    return [a, b];
  }
  if (op === "div") {
    const divisor = Math.max(1, Math.floor(1 + Math.random() * maxNum));
    let quotient = Math.floor(1 + Math.random() * maxNum);
    if (wantCarryBorrow)
      quotient = Math.max(quotient, Math.floor(maxNum * 0.6));
    return [divisor * quotient, divisor];
  }
  // para 'frac' y 'seq' no usamos enteros aquí (se arma en problemFor)
  return [
    Math.floor(Math.random() * (maxNum + 1)),
    Math.floor(Math.random() * (maxNum + 1)),
  ];
}

function problemFor(op, L, locale = "es") {
  const { maxNum, carryBorrowBias } = levelConfig(op, L);
  const want = Math.random() < carryBorrowBias;

  // ----- Series/Secuencias (op: 'seq') -----
  if (op === "seq") {
    // Elegir tipo de secuencia y tarea
    const seqType = Math.random() < 0.5 ? "arith" : "geom"; // aritmética o geométrica
    // Niveles bajos evitan 'sum' para no sobrecargar
    const task = L >= 3 && Math.random() < 0.45 ? "sum" : "next";

    // Parámetros seguros (enteros)
    const a1 = clamp(
      Math.floor(1 + Math.random() * Math.min(9, Math.floor(maxNum / 5))),
      1,
      maxNum
    );
    let d = clamp(
      Math.floor(1 + Math.random() * Math.min(9, Math.floor(maxNum / 10))),
      1,
      maxNum
    );
    let r = clamp(Math.floor(2 + Math.random() * 4), 2, 6); // r >=2 para evitar triviales
    if (seqType === "arith" && d === 0) d = 1;

    // Longitud visible (siempre mostramos 4 o 5 términos)
    const visibleTerms = L >= 3 ? 5 : 4;

    // Construye secuencia para mostrar
    const terms = [];
    if (seqType === "arith") {
      for (let k = 0; k < visibleTerms; k++) terms.push(a1 + k * d);
    } else {
      for (let k = 0; k < visibleTerms; k++) terms.push(a1 * Math.pow(r, k));
    }

    // Definir solución según tarea
    let solution;
    let nForSum = clamp(visibleTerms + (L >= 4 ? 1 : 0), 4, 8); // S_n con n moderado

    if (task === "next") {
      // siguiente término
      solution =
        seqType === "arith"
          ? a1 + visibleTerms * d
          : a1 * Math.pow(r, visibleTerms);
    } else {
      // suma de los primeros n términos (entera por construcción)
      if (seqType === "arith") {
        // S_n = n/2 * [2a1 + (n-1)d]
        solution = (nForSum * (2 * a1 + (nForSum - 1) * d)) / 2;
      } else {
        // S_n = a1 * (r^n - 1) / (r - 1)  | con r entero >= 2
        solution = (a1 * (Math.pow(r, nForSum) - 1)) / (r - 1);
      }
    }

    // Texto de la pregunta
    const seqLabel = locale === "es" ? "Secuencia" : "Sequence";
    const joiner = ", ";
    const baseText = `${seqLabel}: ${terms.join(joiner)}`;
    const askNext =
      locale === "es"
        ? "¿Cuál es el siguiente término?"
        : "What is the next term?";
    const askSum =
      locale === "es"
        ? `Calcula S${nForSum} (suma de los primeros ${nForSum} términos).`
        : `Compute S${nForSum} (sum of first ${nForSum} terms).`;

    const questionText = `${baseText}. ${
      task === "next" ? askNext : askSum
    }`;
    const diffs = ["fácil", "medio", "difícil"];

    const steps =
      seqType === "arith"
        ? task === "next"
          ? [
              "Identifica la diferencia común d.",
              "Suma d al último término mostrado.",
              `Resultado: ${solution}.`,
            ]
          : [
              "Usa S_n = n/2 * [2a1 + (n−1)d].",
              "Sustituye valores y simplifica.",
              `Resultado: ${solution}.`,
            ]
        : task === "next"
        ? [
            "Identifica la razón r.",
            "Multiplica el último término por r.",
            `Resultado: ${solution}.`,
          ]
        : [
            "Usa S_n = a1 * (r^n − 1) / (r − 1).",
            "Sustituye valores y simplifica.",
            `Resultado: ${solution}.`,
          ];

    return {
      id: nowId("pr"),
      op,
      a: 0,
      b: 0, // placeholders para compatibilidad
      questionText,
      difficulty: pick(diffs),
      solution, // entero
      steps,
      // metadatos útiles por si el front los quiere mostrar:
      meta: { seqType, task, a1, d, r, n: nForSum, visibleTerms },
    };
  }

  // ----- Fracciones (op: 'frac') -----
  if (op === "frac") {
    // elige aleatoriamente qué operación practicar
    const realOp = pick(["fadd", "fsub", "fmul", "fdiv"]);
    const opsSym = { fadd: "+", fsub: "−", fmul: "×", fdiv: "÷" };

    const A = randomFraction(maxNum);
    let B = randomFraction(maxNum);
    if (realOp === "fdiv" && B.n === 0) B.n = 1;

    let sol;
    if (realOp === "fadd" || realOp === "fsub") {
      const s = realOp === "fadd" ? +1 : -1;
      sol = simplify(A.n * B.d + s * B.n * A.d, A.d * B.d);
    } else if (realOp === "fmul") {
      sol = simplify(A.n * B.n, A.d * B.d);
    } else {
      // fdiv
      sol = simplify(A.n * B.d, A.d * (B.n || 1));
    }

    const S = opsSym[realOp];
    const qText =
      locale === "es"
        ? `¿Cuánto es ${A.n}/${A.d} ${S} ${B.n}/${B.d}?`
        : `What is ${A.n}/${A.d} ${S} ${B.n}/${B.d}?`;

    return {
      id: nowId("pr"),
      op, // mantenemos 'frac' (no revelamos el subtipo)
      a: 0,
      b: 0, // placeholders para compatibilidad
      questionText: qText,
      difficulty: pick(["fácil", "medio", "difícil"]),
      solution: sol, // {n,d}
      steps: [
        realOp === "fmul"
          ? "Multiplica numeradores y denominadores."
          : realOp === "fdiv"
          ? "Multiplica por el inverso de la segunda fracción."
          : "Encuentra denominador común y suma/resta numeradores.",
        "Simplifica la fracción.",
        `Resultado: ${fracToString(sol)}.`,
      ],
    };
  }

  // ----- Operaciones enteras (original) -----
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
      ? want
        ? [
            `Suma unidades con llevada.`,
            `Suma decenas/centenas con llevada.`,
            `Resultado: ${solution}.`,
          ]
        : [
            `Suma unidades.`,
            `Suma decenas/centenas.`,
            `Resultado: ${solution}.`,
          ]
      : op === "sub"
      ? want
        ? [
            `Si no alcanzan unidades, pide prestado.`,
            `Resta unidades y decenas.`,
            `Resultado: ${solution}.`,
          ]
        : [
            `Resta unidades.`,
            `Resta decenas/centenas.`,
            `Resultado: ${solution}.`,
          ]
      : op === "mul"
      ? [
          `Multiplica por columnas.`,
          `Suma parciales.`,
          `Resultado: ${solution}.`,
        ]
      : op === "div"
      ? [
          `Divide ${a} entre ${b}.`,
          `Toma cociente entero.`,
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
    const s = text.indexOf("{"),
      e = text.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) return JSON.parse(text.slice(s, e + 1));
  } catch {}
  try {
    return JSON.parse(text.replace(/```json|```/g, ""));
  } catch {}
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
    const opx = isOp(p?.op) ? p.op : op;

    // Soporte 'seq' (si viniera de LLM o fuente externa)
    if (opx === "seq") {
      const qText =
        typeof p?.questionText === "string" && p.questionText.trim()
          ? p.questionText.trim()
          : locale === "es"
          ? `Completa la secuencia.`
          : `Complete the sequence.`;
      return {
        id: p?.id ?? nowId("p"),
        op: "seq",
        a: 0,
        b: 0,
        questionText: qText,
        difficulty: ["fácil", "medio", "difícil"].includes(p?.difficulty)
          ? p.difficulty
          : "fácil",
        solution: coerceInt(p?.solution, 0),
        steps: Array.isArray(p?.steps) ? p.steps.map(String) : [],
        meta: p?.meta ?? {},
      };
    }

    // Soporte fracciones (incluye 'frac' ya que espera {n,d})
    if (opx === "frac") {
      // Intentar entender 'solution' desde LLM o inputs externos
      let sol = p?.solution;
      if (typeof sol === "string") {
        const fr = parseUserFraction(sol);
        sol = fr ?? simplify(0, 1);
      } else if (
        sol &&
        typeof sol === "object" &&
        Number.isFinite(sol.n) &&
        Number.isFinite(sol.d)
      ) {
        sol = simplify(sol.n, sol.d);
      } else {
        sol = simplify(0, 1);
      }
      const qText =
        typeof p?.questionText === "string" && p.questionText.trim()
          ? p.questionText.trim()
          : locale === "es"
          ? `Resuelve operación con fracciones.`
          : `Solve fraction operation.`;
      return {
        id: p?.id ?? nowId("p"),
        op: "frac",
        a: 0,
        b: 0,
        questionText: qText,
        difficulty: ["fácil", "medio", "difícil"].includes(p?.difficulty)
          ? p.difficulty
          : "fácil",
        solution: sol,
        steps: Array.isArray(p?.steps) ? p.steps.map(String) : [],
      };
    }

    // Numéricas "normales"
    const a = coerceInt(p?.a, 0),
      b = coerceInt(p?.b, 0);
    let A = a,
      B = b;
    if (opx === "sub" && A < B) [A, B] = [B, A];
    if (opx === "div") {
      const divisor = Math.max(1, B || 1);
      const q = Math.max(
        1,
        Math.floor(Math.abs(A || 0) / Math.max(1, divisor)) || 1
      );
      A = divisor * q;
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
          : locale === "es"
          ? `¿Cuánto es ${A} ${sym[opx] ?? "?"} ${B}?`
          : `What is ${A} ${sym[opx] ?? "?"} ${B}?`,
      difficulty: ["fácil", "medio", "difícil"].includes(p?.difficulty)
        ? p.difficulty
        : "fácil",
      solution: coerceInt(
        p?.solution,
        computeSolution(opx, A, B, { integerDiv: true })
      ),
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
      console.log(
        `[nivel↓] ${session.level}→${session.level - 1} (errores=${session.wrong})`
      );
      session.level -= 1;
    }
  }
}

// ================== Generación (LLM si listo; si no, instantáneo) ==================
async function generateOneProblem(
  op,
  level,
  locale,
  preferLLM = USE_LLM && llmReady
) {
  // Para 'frac' y 'seq', siempre generamos local (más seguro/consistente)
  if (op === "frac" || op === "seq") return problemFor(op, level, locale);

  if (!preferLLM || !text2text) return problemFor(op, level, locale);
  const { maxNum, carryBorrowBias } = levelConfig(op, level);
  const want = Math.random() < carryBorrowBias;
  const [a, b] = makeOperands(op, { maxNum, wantCarryBorrow: want });
  try {
    const out = await text2text(
      `Return ONLY JSON for ONE problem.
{"problems":[{"id":"${nowId("p")}","op":"${op}","a":${a},"b":${b},"questionText":"${
        locale === "es" ? "¿Cuánto es" : "What is"
      } ${a} ${sym[op]} ${b}?","difficulty":"fácil","solution":${computeSolution(
        op,
        a,
        b,
        { integerDiv: true }
      )},"steps":[]}]}
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

// ================== Endpoint para Tutor.tsx ==================
app.post("/tutor", (req, res) => {
  try {
    console.log("[/tutor] body:", req.body);

    const { expression, locale = "es" } = req.body || {};

    if (!expression || typeof expression !== "string") {
      return res
        .status(400)
        .json({ error: "Falta el campo 'expression'." });
    }

    // Normalizar: aceptar 7+8, 7 + 8, 6x7, 6*7, 56/8, etc.
    let expr = expression
      .replace(/,/g, ".")
      .replace(/x/gi, "×")
      .replace(/\*/g, "×")
      .replace(/\//g, "÷")
      .trim();

    console.log("[/tutor] expr normalizada:", expr);

    const match = expr.match(
      /^(-?\d+(?:\.\d+)?)\s*([+\-×÷])\s*(-?\d+(?:\.\d+)?)$/
    );

    if (!match) {
      return res.status(400).json({
        error:
          "No pude entender la operación. Usa algo como: 7 + 8, 25 - 9, 6 x 7, 56 / 8.",
      });
    }

    const a = parseFloat(match[1]);
    const op = match[2];
    const b = parseFloat(match[3]);
    const isEs = locale === "es";

    let solution;
    let steps = [];
    let questionText;

    switch (op) {
      case "+":
        solution = a + b;
        questionText = isEs
          ? `¿Cuánto es ${a} + ${b}?`
          : `What is ${a} + ${b}?`;
        steps = isEs
          ? [
              `1) Escribe la operación: ${a} + ${b}.`,
              `2) Suma los números: ${a} + ${b} = ${solution}.`,
              `3) El resultado final es ${solution}.`,
            ]
          : [
              `1) Write the operation: ${a} + ${b}.`,
              `2) Add the numbers: ${a} + ${b} = ${solution}.`,
              `3) Final result is ${solution}.`,
            ];
        break;

      case "-":
      case "−":
        solution = a - b;
        questionText = isEs
          ? `¿Cuánto es ${a} − ${b}?`
          : `What is ${a} − ${b}?`;
        steps = isEs
          ? [
              `1) Escribe la operación: ${a} − ${b}.`,
              `2) Resta el segundo número al primero: ${a} − ${b} = ${solution}.`,
              `3) El resultado final es ${solution}.`,
            ]
          : [
              `1) Write the operation: ${a} − ${b}.`,
              `2) Subtract second from first: ${a} − ${b} = ${solution}.`,
              `3) Final result is ${solution}.`,
            ];
        break;

      case "×":
        solution = a * b;
        questionText = isEs
          ? `¿Cuánto es ${a} × ${b}?`
          : `What is ${a} × ${b}?`;
        steps = isEs
          ? [
              `1) Escribe la operación: ${a} × ${b}.`,
              `2) Multiplica los números: ${a} × ${b} = ${solution}.`,
              `3) El resultado final es ${solution}.`,
            ]
          : [
              `1) Write the operation: ${a} × ${b}.`,
              `2) Multiply the numbers: ${a} × ${b} = ${solution}.`,
              `3) Final result is ${solution}.`,
            ];
        break;

      case "÷":
        if (b === 0) {
          return res.status(400).json({
            error: isEs
              ? "No se puede dividir entre 0."
              : "Cannot divide by 0.",
          });
        }
        solution = a / b;
        questionText = isEs
          ? `¿Cuánto es ${a} ÷ ${b}?`
          : `What is ${a} ÷ ${b}?`;
        steps = isEs
          ? [
              `1) Escribe la operación: ${a} ÷ ${b}.`,
              `2) Divide el primer número entre el segundo: ${a} ÷ ${b} = ${solution}.`,
              `3) El resultado final es ${solution}.`,
            ]
          : [
              `1) Write the operation: ${a} ÷ ${b}.`,
              `2) Divide the first number by the second: ${a} ÷ ${b} = ${solution}.`,
              `3) Final result is ${solution}.`,
            ];
        break;

      default:
        return res.status(400).json({ error: "Operador no soportado." });
    }

    console.log("[/tutor] OK →", { questionText, solution });

    return res.json({ questionText, solution, steps });
  } catch (e) {
    console.error("Error en /tutor:", e?.message || e);
    return res
      .status(500)
      .json({ error: "Error interno en el servidor del tutor." });
  }
});

// ================== Endpoints ==================

// Crear sesión
app.post("/session/start", (req, res) => {
  const op = isOp(req.body?.op) ? req.body.op : "add";
  const id = nowId("sess");
  const state = newSession(op);
  sessions.set(id, state);

  const locale = String(req.body?.locale || "es");
  setImmediate(() =>
    fillQueue(state, locale, QUEUE_TARGET, /*preferLLM*/ false).catch(() => {})
  );

  res.json({ sessionId: id, state });
});

// Siguiente problema (instantáneo con prefetched/cola)
app.post("/session/next", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const locale = String(req.body?.locale || "es");
  const sess = sessions.get(sessionId);
  if (!sess) return res.status(400).json({ error: "Invalid sessionId" });

  if (isOp(req.body?.op)) sess.op = req.body.op;

  if (sess.nextPrefetchedProblem) {
    const prob = sess.nextPrefetchedProblem;
    sess.lastProblem = prob;
    sess.nextPrefetchedProblem = null;
    setImmediate(() =>
      fillQueue(sess, locale, QUEUE_TARGET, false).catch(() => {})
    );
    return res.json({
      problem: prob,
      state: {
        op: sess.op,
        level: sess.level,
        streak: sess.streak,
        correct: sess.correct,
        wrong: sess.wrong,
      },
    });
  }

  const prob = await takeFromQueueOrGenerate(sess, locale);
  sess.lastProblem = prob;
  setImmediate(() =>
    fillQueue(sess, locale, QUEUE_TARGET, false).catch(() => {})
  );

  res.json({
    problem: prob,
    state: {
      op: sess.op,
      level: sess.level,
      streak: sess.streak,
      correct: sess.correct,
      wrong: sess.wrong,
    },
  });
});

// Calificar + prefetch inmediato del siguiente
app.post("/session/grade", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const userAnswerRaw = req.body?.userAnswer;
  const locale = String(req.body?.locale || "es");
  const sess = sessions.get(sessionId);
  if (!sess || !sess.lastProblem)
    return res
      .status(400)
      .json({ error: "Invalid session or no last problem" });

  const { op, a, b, solution } = sess.lastProblem;

  // ¿Es fracción? (op frac o solution con {n,d})
  const isFraction =
    op === "frac" ||
    (solution &&
      typeof solution === "object" &&
      Number.isFinite(solution.n) &&
      Number.isFinite(solution.d));

  let correct = false;
  if (isFraction) {
    const expected = solution; // {n,d}
    const got = parseUserFraction(userAnswerRaw);
    correct = !!(expected && got && equalFrac(expected, got));
  } else {
    const userAnswer = coerceInt(userAnswerRaw);
    correct = userAnswer === solution;
  }

  const messages = {
    es: {
      ok: "¡Excelente! Respuesta correcta.",
      badNum: `Casi. ${a} ${sym[op]} ${b} = ${solution}.`,
      badFrac: `Casi. La respuesta es ${fracToString(solution)}.`,
      up: "Subiremos un poco la dificultad.",
      down: "Practica: trabaja paso a paso y revisa tus operaciones.",
    },
    en: {
      ok: "Great job! Correct answer.",
      badNum: `Almost. ${a} ${sym[op]} ${b} = ${solution}.`,
      badFrac: `Almost. The answer is ${fracToString(solution)}.`,
      up: "We will increase the difficulty a bit.",
      down: "Practice step by step and check your operations.",
    },
  };
  const M = locale === "es" ? messages.es : messages.en;

  updateLevel(sess, correct);

  const nextHint = correct
    ? M.up
    : op === "add"
    ? locale === "es"
      ? "Suma unidades; si ≥10, lleva 1."
      : "Add ones; if ≥10, carry 1."
    : op === "sub"
    ? locale === "es"
      ? "Si no alcanzan unidades, pide prestado."
      : "If ones too small, borrow."
    : op === "mul"
    ? locale === "es"
      ? "Multiplica por columnas y suma parciales."
      : "Multiply columns; add partials."
    : op === "div"
    ? locale === "es"
      ? "Divide y toma cociente entero."
      : "Divide and take integer quotient."
    : op === "frac"
    ? locale === "es"
      ? "Usa m.c.m. o extremos y medios; simplifica."
      : "Find common denominator or multiply across; simplify."
    : // seq
      locale === "es"
    ? "Identifica diferencia o razón; aplica la fórmula correspondiente."
    : "Identify common difference or ratio; apply the right formula.";

  const nextProblem = await takeFromQueueOrGenerate(sess, locale);
  sess.nextPrefetchedProblem = nextProblem;
  setImmediate(() =>
    fillQueue(sess, locale, QUEUE_TARGET, false).catch(() => {})
  );

  res.json({
    correct,
    expected: isFraction ? fracToString(solution) : solution,
    feedback: correct ? M.ok : isFraction ? M.badFrac : M.badNum,
    nextHint,
    nextProblemPreview: nextProblem,
    state: {
      op: sess.op,
      level: sess.level,
      streak: sess.streak,
      correct: sess.correct,
      wrong: sess.wrong,
    },
  });
});

// Generar lote (rápido; usa LLM solo si está listo y activado)
app.post("/generate", async (req, res) => {
  const op = isOp(req.body?.op) ? req.body.op : "add";
  const count = clamp(coerceInt(req.body?.count ?? 10, 10), 1, 200);
  const locale = String(req.body?.locale || "es");
  const level = clamp(coerceInt(req.body?.level ?? 1, 1), 1, 5);

  // Para 'frac' y 'seq', generamos local sí o sí:
  if (op === "frac" || op === "seq") {
    const out = [];
    for (let i = 0; i < count; i++) out.push(problemFor(op, level, locale));
    return res.json({ problems: out });
  }

  if (!USE_LLM || !llmReady || !text2text) {
    return res.json(fallbackProblems(count, op, level, locale));
  }

  const out = [];
  for (let i = 0; i < count; i++)
    out.push(await generateOneProblem(op, level, locale, true));
  res.json({ problems: out });
});

// Alias compatibilidad (no adaptativo)
app.post("/grade", (req, res) => {
  const { op: opIn, a, b, userAnswer, locale = "es" } = req.body || {};
  const op = isOp(opIn) ? opIn : "add";

  if (op === "frac") {
    // Alias no conoce el problema real; solo ilustra validación de una respuesta tipo
    const example = problemFor("frac", 1, locale);
    const got = parseUserFraction(userAnswer);
    const correct = example && got && equalFrac(example.solution, got);
    const feedback = correct
      ? locale === "es"
        ? "¡Excelente! Respuesta correcta."
        : "Great job! Correct answer."
      : locale === "es"
      ? `Casi. Ejemplo de respuesta: ${fracToString(example.solution)}.`
      : `Almost. Example answer: ${fracToString(example.solution)}.`;
    return res.json({
      op,
      correct,
      expected: fracToString(example.solution),
      feedback,
      nextHint: "",
    });
  }

  if (op === "seq") {
    // Alias simple: genera un ejemplo y evalúa contra él (no adaptativo)
    const ex = problemFor("seq", 1, locale);
    const UA = coerceInt(userAnswer);
    const correct = UA === ex.solution;
    const feedback = correct
      ? locale === "es"
        ? "¡Excelente! Respuesta correcta."
        : "Great job! Correct answer."
      : locale === "es"
      ? `Casi. La respuesta era ${ex.solution}.`
      : `Almost. The answer was ${ex.solution}.`;
    return res.json({
      op,
      correct,
      expected: ex.solution,
      feedback,
      nextHint: "",
    });
  }

  let A = coerceInt(a),
    B = coerceInt(b),
    UA = coerceInt(userAnswer);
  if (op === "sub" && A < B) [A, B] = [B, A];
  if (op === "div") B = Math.max(1, B || 1);
  const solution = computeSolution(op, A, B, { integerDiv: true });
  const correct = UA === solution;
  const feedback = correct
    ? locale === "es"
      ? "¡Excelente! Respuesta correcta."
      : "Great job! Correct answer."
    : locale === "es"
    ? `Casi. ${A} ${sym[op]} ${B} = ${solution}.`
    : `Almost. ${A} ${sym[op]} ${B} = ${solution}.`;
  res.json({ op, correct, expected: solution, feedback, nextHint: "" });
});

// ================== Server ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `🧠 Backend en http://localhost:${PORT} | useLLM=${USE_LLM} | llmReady=${llmReady} | QUEUE_TARGET=${QUEUE_TARGET}`
  );
  setImmediate(loadLLM);
});