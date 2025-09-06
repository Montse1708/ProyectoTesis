// app.js (ESM) — Backend adaptativo con Transformer + fallback
import express from "express";
import cors from "cors";
import { pipeline } from "@xenova/transformers";

const app = express();
app.use(cors());
app.use(express.json());

// =============== Sesiones en memoria ===============
/*
  sessions[sessionId] = {
    level: 1..5,
    streak: 0..,
    correct: 0,
    wrong: 0,
    lastProblem: { id,a,b,solution,... }
  }
*/
const sessions = new Map();
const newSession = () => ({
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
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const nowId = (p = "p") => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

function levelConfig(level) {
  // Configuración por nivel (puedes tunear)
  // L1: 0..9 sin llevadas; L2: 0..20; L3: 0..50; L4: 0..99 con/ sin llevadas; L5: 0..999 con llevadas
  const L = Math.max(1, Math.min(5, level | 0));
  const cfg = [
    { maxNum: 9, carryBias: 0 },   // (no usado)
    { maxNum: 9, carryBias: 0 },   // L1
    { maxNum: 20, carryBias: 0.2 },// L2
    { maxNum: 50, carryBias: 0.4 },// L3
    { maxNum: 99, carryBias: 0.6 },// L4
    { maxNum: 999, carryBias: 0.8 } // L5
  ][L];
  return { level: L, ...cfg };
}

function makeAddends({ maxNum, wantCarry }) {
  // Genera (a,b) y si wantCarry=true intenta forzar llevada en unidades
  if (!wantCarry) {
    const a = Math.floor(Math.random() * (maxNum + 1));
    const b = Math.floor(Math.random() * (maxNum + 1));
    return [a, b];
  }
  // Forzar llevada en unidades si es posible
  if (maxNum < 10) {
    // poco rango: intento combinación que sume >=10
    const a1 = Math.floor(1 + Math.random() * Math.min(9, maxNum));
    const b1 = Math.max(10 - a1, 1);
    return [a1, Math.min(b1, maxNum)];
  }
  // rango mayor: asegurar (a%10 + b%10) >= 10
  const a = Math.floor(Math.random() * (maxNum + 1));
  const u1 = a % 10;
  const need = 10 - u1;
  let b = Math.floor(Math.random() * (maxNum + 1));
  const u2 = b % 10;
  if (u2 < need) {
    b += (need - u2);
    if (b > maxNum) b = Math.max(0, a - need); // fallback
  }
  return [a, b];
}

function fallbackProblemForLevel(L, locale = "es") {
  const { maxNum, carryBias } = levelConfig(L);
  const wantCarry = Math.random() < carryBias;
  const [a, b] = makeAddends({ maxNum, wantCarry });
  const diffs = ["fácil", "medio", "difícil"];
  const textEs = [
    (x, y) => `¿Cuánto es ${x} + ${y}?`,
    (x, y) => `Resuelve: ${x} + ${y}`,
    (x, y) => `Completa la suma: ${x} + ${y} = ?`,
  ];
  return {
    id: nowId("fb"),
    a, b,
    questionText: (locale === "es" ? pick(textEs) : (x, y) => `What is ${x} + ${y}?`)(a, b),
    difficulty: pick(diffs),
    solution: a + b,
    steps: wantCarry
      ? [
          `Suma las unidades: ${a % 10} + ${b % 10} (si es ≥10, lleva 1 a las decenas).`,
          `Suma las decenas (y centenas si aplica) incluyendo la llevada.`,
          `Resultado: ${a + b}.`,
        ]
      : [
          `Suma las unidades: ${a % 10} + ${b % 10}.`,
          `Suma las decenas (y centenas si aplica).`,
          `Resultado: ${a + b}.`,
        ],
  };
}

function fallbackProblems(count, L, locale) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(fallbackProblemForLevel(L, locale));
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

function sanitizeProblems(obj, count, L, locale) {
  if (!obj || !Array.isArray(obj.problems) || obj.problems.length === 0)
    return fallbackProblems(count, L, locale);
  const out = obj.problems.map((p, i) => {
    const a = coerceInt(p?.a, 0), b = coerceInt(p?.b, 0);
    return {
      id: p?.id ?? nowId("p"),
      a, b,
      questionText: typeof p?.questionText === "string" && p.questionText.trim()
        ? p.questionText.trim()
        : (locale === "es" ? `¿Cuánto es ${a} + ${b}?` : `What is ${a} + ${b}?`),
      difficulty: ["fácil","medio","difícil"].includes(p?.difficulty) ? p.difficulty : "fácil",
      solution: coerceInt(p?.solution, a + b),
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
const genOnePrompt = ({ a, b, locale }) => `
Eres un generador de problemas de suma para niños.
Crea UN problema de suma para ${a} + ${b}.
Devuelve SOLO JSON:
{
  "problems": [
    {
      "id": "string",
      "a": ${a},
      "b": ${b},
      "questionText": "string",
      "difficulty": "fácil"|"medio"|"difícil",
      "solution": ${a + b},
      "steps": ["string", "string"]
    }
  ]
}
Idioma: ${locale}. Solo JSON, nada más.
`;

const genBatchPrompt = ({ count, maxNum, locale }) => `
You are a math exercise generator for kids.
Create ${count} addition problems with numbers 0..${maxNum}.
Return ONLY valid JSON:
{ "problems": [ { "id": "string", "a": number, "b": number, "questionText": "string", "difficulty": "fácil"|"medio"|"difícil", "solution": number, "steps": ["string"] } ] }
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

// 1) Crear sesión
app.post("/session/start", (req, res) => {
  const id = nowId("sess");
  const state = newSession();
  sessions.set(id, state);
  res.json({ sessionId: id, state });
});

// 2) Siguiente problema (adaptativo)
app.post("/session/next", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const locale = String(req.body?.locale || "es");
  const sess = sessions.get(sessionId);
  if (!sess) return res.status(400).json({ error: "Invalid sessionId" });

  const { level, maxNum, carryBias } = { ...levelConfig(sess.level) };
  const wantCarry = Math.random() < carryBias;
  const [a, b] = makeAddends({ maxNum, wantCarry });

  // Intento generativo (1 problema) y si falla uso fallback
  try {
    const out = await text2text(genOnePrompt({ a, b, locale }), {
      max_new_tokens: 200, temperature: 0.2, top_p: 0.9, repetition_penalty: 1.05,
    });
    const raw = (out?.[0]?.generated_text ?? "").trim();
    const parsed = tryParseJSON(raw);
    const { problems } = sanitizeProblems(parsed, 1, sess.level, locale);
    const prob = problems[0];
    sess.lastProblem = prob;
    return res.json({ problem: prob, state: { level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong } });
  } catch (e) {
    const prob = fallbackProblemForLevel(sess.level, locale);
    sess.lastProblem = prob;
    return res.json({ problem: prob, state: { level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong } });
  }
});

// 3) Calificar respuesta y ajustar dificultad
app.post("/session/grade", async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  const userAnswer = coerceInt(req.body?.userAnswer);
  const locale = String(req.body?.locale || "es");
  const sess = sessions.get(sessionId);
  if (!sess || !sess.lastProblem) return res.status(400).json({ error: "Invalid session or no last problem" });

  const { a, b, solution } = sess.lastProblem;
  const correct = userAnswer === solution;

  // Feedback simple; si quieres, llama a LLM para explicación
  const feedback = correct
    ? (locale === "es" ? "¡Excelente! Respuesta correcta." : "Great job! Correct answer.")
    : (locale === "es" ? `Casi. ${a} + ${b} = ${solution}.` : `Almost. ${a} + ${b} = ${solution}.`);

  // Actualiza nivel/racha
  updateLevel(sess, correct);

  // Devuelve estado + sugerencia breve
  const nextHint = correct
    ? (locale === "es" ? "Subiremos un poco la dificultad." : "We will increase the difficulty a bit.")
    : (locale === "es" ? "Practica sumas con llevada: suma unidades y luego decenas." : "Practice carrying: add ones, then tens.");

  res.json({
    correct,
    expected: solution,
    feedback,
    nextHint,
    state: { level: sess.level, streak: sess.streak, correct: sess.correct, wrong: sess.wrong },
  });
});

// (Opcional) Generar lote no adaptativo
app.post("/generate", async (req, res) => {
  const count = coerceInt(req.body?.count ?? 10, 10);
  const locale = String(req.body?.locale || "es");
  const level = coerceInt(req.body?.level ?? 1, 1);
  const { maxNum } = levelConfig(level);

  try {
    const out = await text2text(genBatchPrompt({ count, maxNum, locale }), { max_new_tokens: 256, temperature: 0.2 });
    const raw = (out?.[0]?.generated_text ?? "").trim();
    const parsed = tryParseJSON(raw);
    const result = sanitizeProblems(parsed, count, level, locale);
    res.json(result);
  } catch {
    res.json(fallbackProblems(count, level, locale));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🧠 Backend adaptativo en http://localhost:${PORT}`));