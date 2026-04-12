// src/game/index.js — Code Combat: RPG de Python

import { useState, useEffect } from "react";
import { C, T, S } from "../constants";
import { supabase } from "../lib/supabase";

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

const ENEMIES = [
  {
    id: "goblin", name: "SyntaxError Goblin", errorType: "SyntaxError",
    maxHP: 3, xpReward: 30, tint: "#2E7D32", darkTint: "#1B5E20",
    taunt: "¡Olvidaste los dos puntos, pedazo de código!",
    deathLine: "¡Mis errores de sintaxis… me vencieron…!",
    desc: "Un goblin verde que muerde el código mal escrito.",
  },
  {
    id: "ghost", name: "NameError Ghost", errorType: "NameError",
    maxHP: 3, xpReward: 50, tint: "#6A1B9A", darkTint: "#4A148C",
    taunt: "¡Esa variable no existe… igual que tu lógica!",
    deathLine: "¡El nombre… se fue con el viento…!",
    desc: "Un fantasma que surge cuando usas nombres que no definiste.",
  },
  {
    id: "dragon", name: "IndexError Dragon", errorType: "IndexError",
    maxHP: 4, xpReward: 80, tint: "#B71C1C", darkTint: "#7F0000",
    taunt: "¡Le pediste el índice 99 a mi lista de 3! ¡JA!",
    deathLine: "¡Mi lista… tenía solo 3 elementos…!",
    desc: "Un dragón guardián de listas que castiga los índices fuera de rango.",
  },
  {
    id: "witch", name: "TypeError Witch", errorType: "TypeError",
    maxHP: 3, xpReward: 60, tint: "#1565C0", darkTint: "#0D47A1",
    taunt: "¡No puedes sumar un string con un entero, aprendiz!",
    deathLine: "¡Los tipos… eran incompatibles…!",
    desc: "Una bruja que confunde los tipos de datos en sus conjuros.",
  },
  {
    id: "serpent", name: "IndentationError Serpent", errorType: "IndentationError",
    maxHP: 3, xpReward: 45, tint: "#E65100", darkTint: "#BF360C",
    taunt: "¡Los espacios SIEMPRE importaron! ¡Siempre!",
    deathLine: "¡Mi indentación… era perfecta…!",
    desc: "Una serpiente que se esconde en los espacios mal alineados.",
  },
  {
    id: "phantom", name: "KeyError Phantom", errorType: "KeyError",
    maxHP: 4, xpReward: 70, tint: "#37474F", darkTint: "#263238",
    taunt: "¡Esa llave no está en el diccionario. NUNCA ESTUVO.",
    deathLine: "¡El diccionario… tenía la llave todo el tiempo…!",
    desc: "Un espectro que protege los diccionarios de llaves inexistentes.",
  },
  {
    id: "ogre", name: "AttributeError Ogre", errorType: "AttributeError",
    maxHP: 4, xpReward: 90, tint: "#4E342E", darkTint: "#3E2723",
    taunt: "¡Ese objeto no tiene ese método! ¡LO ESTÁS CONFUNDIENDO!",
    deathLine: "¡El atributo… existía en otro objeto…!",
    desc: "Un ogro furioso que destroza los atributos equivocados.",
  },
  {
    id: "demon", name: "ImportError Demon", errorType: "ImportError",
    maxHP: 5, xpReward: 120, tint: "#880E4F", darkTint: "#560027",
    taunt: "¡Ese módulo no existe… como tus buenas prácticas!",
    deathLine: "¡Debí… haber sido instalado con pip…!",
    desc: "Un demonio que bloquea los imports incorrectos o mal escritos.",
  },
];

const XP_THRESHOLDS  = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 9999];
const LS_STATS       = "codecombat_stats";
const LS_HIST        = "elprofesor_historial";
const LS_OFFLINE_Q   = "offline_quizzes";
const API_KEY        = process.env.REACT_APP_ANTHROPIC_API_KEY;

const FALLBACKS = {
  SyntaxError: {
    code: "if x > 10\n    print('mayor')\nelse\n    print('menor')",
    question: "¿Cuál es el error de sintaxis en este código?",
    options: ["Falta ':' al final de if y else", "La variable x no está definida", "print no es una función válida", "La indentación es incorrecta"],
    correct: 0,
    explanation: "En Python, if, else, for, while y def requieren ':' al final de la línea de declaración.",
  },
  NameError: {
    code: "nombre = 'Ana'\napellido = 'López'\nprint(nombre + ' ' + apelllido)",
    question: "¿Qué error produce este código al ejecutarse?",
    options: ["SyntaxError: falta paréntesis", "NameError: 'apelllido' no está definido", "TypeError: no se puede concatenar", "El código es correcto"],
    correct: 1,
    explanation: "'apelllido' tiene triple 'l'. La variable definida es 'apellido'. Un typo crea un NameError.",
  },
  IndexError: {
    code: "frutas = ['mango', 'pera', 'uva']\nfor i in range(5):\n    print(frutas[i])",
    question: "¿Por qué falla este código?",
    options: ["range(5) no es válido en Python", "La lista no puede tener strings", "El bucle accede índices 3 y 4 que no existen", "print no acepta strings"],
    correct: 2,
    explanation: "La lista tiene 3 elementos (índices 0, 1, 2). El bucle llega a índice 3 y 4, causando IndexError.",
  },
  TypeError: {
    code: "edad = 25\nmensaje = 'Tengo ' + edad + ' años'\nprint(mensaje)",
    question: "¿Qué está mal en este código?",
    options: ["edad debe declararse con let", "No puedes concatenar str con int directamente", "print necesita f-string", "El código es correcto"],
    correct: 1,
    explanation: "Python no convierte int a str automáticamente en concatenación. Usa str(edad) o f'Tengo {edad} años'.",
  },
  IndentationError: {
    code: "def saludar(nombre):\nprint('Hola', nombre)\nreturn True",
    question: "¿Cuál es el problema con este código?",
    options: ["def no es válido en Python 3", "Falta paréntesis en saludar", "print y return deben estar indentados dentro de la función", "True no es un valor de retorno válido"],
    correct: 2,
    explanation: "El cuerpo de una función debe estar indentado 4 espacios. Sin indentación, Python no sabe qué pertenece a la función.",
  },
  KeyError: {
    code: "usuario = {'nombre': 'Ana', 'edad': 30}\nprint(usuario['nombre'])\nprint(usuario['email'])",
    question: "¿Qué error se produce al ejecutar este código?",
    options: ["TypeError: usuario no es iterable", "IndexError: índice fuera de rango", "KeyError: 'email' no existe en el diccionario", "SyntaxError: falta coma"],
    correct: 2,
    explanation: "El diccionario no tiene clave 'email'. Para evitar el error, usa usuario.get('email', 'sin email').",
  },
  AttributeError: {
    code: "texto = 'Hola Mundo'\nprint(texto.upper())\nprint(texto.invertir())",
    question: "¿Qué línea causa un error?",
    options: ["Línea 1: texto no puede ser string", "Línea 2: upper() no existe en strings", "Línea 3: los strings no tienen método invertir()", "El código es correcto"],
    correct: 2,
    explanation: "Los strings tienen upper(), lower(), replace(), etc., pero no invertir(). Para invertir usa texto[::-1].",
  },
  ImportError: {
    code: "import pandas as pd\nimport numpay as np\nprint('Módulos cargados')",
    question: "¿Qué línea tiene el error?",
    options: ["Línea 1: pandas no existe en Python", "Línea 2: el módulo se llama numpy, no numpay", "Línea 3: print no puede ir después de imports", "Las dos primeras líneas tienen error"],
    correct: 1,
    explanation: "El módulo correcto es 'numpy', no 'numpay'. Un typo en el nombre del módulo causa ImportError.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function loadStats() {
  try {
    const s = localStorage.getItem(LS_STATS);
    if (s) return JSON.parse(s);
  } catch {}
  return { xp: 0, streak: 0, lastPlayed: null };
}

function saveStats(stats) {
  try { localStorage.setItem(LS_STATS, JSON.stringify(stats)); } catch {}
}

function loadHistorial() {
  try {
    const s = localStorage.getItem(LS_HIST);
    if (s) return JSON.parse(s);
  } catch {}
  return [];
}

function getLevelFromXP(xp) {
  for (let i = XP_THRESHOLDS.length - 2; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function getXPProgress(xp) {
  const lv = getLevelFromXP(xp);
  const start = XP_THRESHOLDS[lv - 1] ?? 0;
  const end   = XP_THRESHOLDS[lv]     ?? 9999;
  return { pct: (xp - start) / (end - start), toNext: end - xp, level: lv };
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function updateStreak(stats) {
  const today = todayStr();
  if (stats.lastPlayed === today) return stats;
  const diff = stats.lastPlayed
    ? (new Date(today) - new Date(stats.lastPlayed)) / 86400000
    : 99;
  const streak = diff <= 1 ? stats.streak + 1 : 1;
  return { ...stats, streak, lastPlayed: today };
}

// ═══════════════════════════════════════════════════════════════════════════
// OFFLINE QUIZ CACHE
// ═══════════════════════════════════════════════════════════════════════════

function getOfflineQuestion(errorType) {
  try {
    const data = JSON.parse(localStorage.getItem(LS_OFFLINE_Q));
    if (!data?.byErrorType) return null;
    // Try exact match first; fall back to any available question
    const pool =
      (data.byErrorType[errorType]?.length ? data.byErrorType[errorType] : null) ??
      Object.values(data.byErrorType).flat();
    if (!pool?.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  } catch { return null; }
}

function getOfflineQuizInfo() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_OFFLINE_Q));
    if (!data) return null;
    return { total: data.totalQuestions ?? 0, saved_at: data.saved_at };
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════════════════
// API — QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════

async function generateQuestion(errorType, historial) {
  // If offline, use the local quiz cache (prepared with Study Offline)
  if (!navigator.onLine) {
    const q = getOfflineQuestion(errorType);
    if (q) return q;
    throw new Error("offline_no_cache");
  }

  const ctx = historial.length
    ? `Historial del estudiante (últimas sesiones): ${historial.slice(0, 3).map(h => h.resumen).join(" | ")}`
    : "El estudiante está comenzando a aprender Python.";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: `Eres un generador de preguntas para "Code Combat", un juego educativo de Python en español. Creas preguntas de opción múltiple sobre errores de Python. Responde SOLO con JSON válido, sin texto adicional ni bloques de código markdown.`,
      messages: [{
        role: "user",
        content: `Genera UNA pregunta sobre ${errorType} en Python.
${ctx}

Responde con este JSON (sin nada más, sin markdown):
{
  "code": "código Python de 3-8 líneas con el error o la parte faltante (usa \\n para saltos)",
  "question": "pregunta breve en español sobre qué está mal o qué falta",
  "options": ["opción A", "opción B", "opción C", "opción D"],
  "correct": 0,
  "explanation": "1-2 oraciones explicando la respuesta correcta"
}
"correct" es el índice 0-3 de la opción correcta. Las incorrectas deben ser plausibles.`,
      }],
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  const q = JSON.parse(match[0]);
  if (!q.code || !q.question || !Array.isArray(q.options) || q.options.length < 4 || typeof q.correct !== "number") {
    throw new Error("Invalid question shape");
  }
  return q;
}

// ═══════════════════════════════════════════════════════════════════════════
// CODE BLOCK (dark theme, simple tokenizer)
// ═══════════════════════════════════════════════════════════════════════════

const PY_KEYWORDS = new Set([
  "def","return","if","elif","else","for","while","in","and","or","not","import",
  "from","class","try","except","finally","with","as","pass","break","continue",
  "lambda","yield","True","False","None","print","len","range","str","int","float",
  "list","dict","tuple","set","type","input","open","del","global","raise","assert",
]);

function tokenizeLine(line) {
  const tokens = [];
  const re = /(#[^\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\b\d+(?:\.\d+)?\b|\w+|[^\w\s]|\s+)/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    const t = m[0];
    let type = "default";
    if (/^#/.test(t))                         type = "comment";
    else if (/^["'`]|^"""/.test(t))           type = "string";
    else if (/^\d/.test(t))                   type = "number";
    else if (PY_KEYWORDS.has(t))              type = "keyword";
    else if (/^[(){}\[\],.:=+\-*/%<>!&|^~]/.test(t)) type = "op";
    tokens.push({ type, text: t });
  }
  return tokens;
}

const TOKEN_CLR = {
  keyword: "#569CD6", string: "#CE9178", number: "#B5CEA8",
  comment: "#6A9955", op: "#D4D4D4", default: "#D4D4D4",
};

function CodeBlock({ code }) {
  const lines = (code || "").replace(/\\n/g, "\n").split("\n");
  return (
    <div style={{
      background: "#1E1E1E", border: `1px solid ${C.gold}30`,
      borderRadius: 4, overflow: "auto", maxHeight: 260,
    }}>
      <pre style={{ margin: 0, padding: `${S.md}px ${S.lg}px`, fontSize: T.sm, fontFamily: T.mono, lineHeight: 1.85, whiteSpace: "pre" }}>
        {lines.map((line, li) => (
          <div key={li} style={{ display: "flex" }}>
            <span style={{ color: "#4A4A4A", minWidth: 28, userSelect: "none", paddingRight: 12, textAlign: "right", fontSize: T.xs }}>
              {li + 1}
            </span>
            <span>
              {tokenizeLine(line).map((tok, ti) => (
                <span key={ti} style={{ color: TOKEN_CLR[tok.type] }}>{tok.text}</span>
              ))}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ENEMY SPRITES (SVG)
// ═══════════════════════════════════════════════════════════════════════════

function EnemySprite({ enemy, anim }) {
  const animStyle = {
    idle:  { animation: "enemyFloat 3s ease-in-out infinite" },
    hit:   { animation: "enemyHit 0.45s ease forwards" },
    death: { animation: "enemyDeath 0.8s ease forwards" },
    taunt: { animation: "enemyTaunt 0.5s ease" },
  }[anim] || {};

  const w = 150, h = 150;
  const { tint, darkTint } = enemy;

  const sprites = {
    goblin: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <ellipse cx="50" cy="72" rx="22" ry="26" fill={tint}/>
        <circle cx="50" cy="38" r="24" fill={tint}/>
        <ellipse cx="26" cy="34" rx="9" ry="11" fill={tint}/>
        <ellipse cx="74" cy="34" rx="9" ry="11" fill={tint}/>
        <ellipse cx="26" cy="34" rx="5.5" ry="7" fill="#FF8A65" opacity=".45"/>
        <ellipse cx="74" cy="34" rx="5.5" ry="7" fill="#FF8A65" opacity=".45"/>
        <circle cx="42" cy="36" r="6" fill="#FFEB3B"/>
        <circle cx="58" cy="36" r="6" fill="#FFEB3B"/>
        <circle cx="43" cy="36" r="3" fill={darkTint}/>
        <circle cx="59" cy="36" r="3" fill={darkTint}/>
        <circle cx="43.5" cy="35" r="1.2" fill="white"/>
        <circle cx="59.5" cy="35" r="1.2" fill="white"/>
        <ellipse cx="50" cy="44" rx="5" ry="3.5" fill={darkTint} opacity=".5"/>
        <circle cx="47" cy="43" r="2" fill={darkTint}/>
        <circle cx="53" cy="43" r="2" fill={darkTint}/>
        <path d="M38 52 Q50 60 62 52" stroke={darkTint} strokeWidth="1.5" fill="none"/>
        <rect x="44" y="51" width="5" height="7" rx="1" fill="white"/>
        <rect x="51" y="51" width="5" height="7" rx="1" fill="white"/>
        <path d="M28 65 Q16 78 20 90" stroke={tint} strokeWidth="9" strokeLinecap="round" fill="none"/>
        <path d="M72 65 Q84 78 80 90" stroke={tint} strokeWidth="9" strokeLinecap="round" fill="none"/>
        <text x="50" y="78" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,.6)" fontFamily="monospace">{"<>"}</text>
        <rect x="39" y="93" width="9" height="14" rx="2" fill={tint}/>
        <rect x="52" y="93" width="9" height="14" rx="2" fill={tint}/>
      </svg>
    ),
    ghost: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <path d="M22 55 Q22 92 31 97 Q38 103 45 95 Q50 102 55 95 Q62 103 69 97 Q78 92 78 55 Q78 18 50 16 Q22 18 22 55Z" fill={tint} opacity=".92"/>
        <ellipse cx="38" cy="52" rx="8" ry="9" fill="white"/>
        <ellipse cx="62" cy="52" rx="8" ry="9" fill="white"/>
        <ellipse cx="39" cy="53" rx="5" ry="6" fill="#1A0050"/>
        <ellipse cx="63" cy="53" rx="5" ry="6" fill="#1A0050"/>
        <circle cx="40" cy="51" r="2" fill="white"/>
        <circle cx="64" cy="51" r="2" fill="white"/>
        <path d="M40 66 Q50 74 60 66" stroke="rgba(255,255,255,.7)" strokeWidth="2" fill="none"/>
        <text x="12" y="28" fontSize="14" fill={tint} fontFamily="monospace" opacity=".5">?</text>
        <text x="80" y="22" fontSize="11" fill={tint} fontFamily="monospace" opacity=".5">x</text>
        <text x="78" y="45" fontSize="9" fill="rgba(255,255,255,.4)" fontFamily="monospace">??</text>
      </svg>
    ),
    dragon: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <path d="M50 48 Q16 10 2 24 Q12 42 35 46Z" fill={tint} opacity=".65"/>
        <path d="M50 48 Q84 10 98 24 Q88 42 65 46Z" fill={tint} opacity=".65"/>
        <ellipse cx="50" cy="72" rx="26" ry="28" fill={tint}/>
        <rect x="41" y="42" width="18" height="22" rx="9" fill={tint}/>
        <ellipse cx="50" cy="34" rx="20" ry="17" fill={tint}/>
        <ellipse cx="50" cy="42" rx="11" ry="7" fill={tint}/>
        <circle cx="47" cy="40" r="2.5" fill={darkTint} opacity=".7"/>
        <circle cx="53" cy="40" r="2.5" fill={darkTint} opacity=".7"/>
        <ellipse cx="40" cy="28" rx="6" ry="7" fill="#FFEB3B"/>
        <ellipse cx="60" cy="28" rx="6" ry="7" fill="#FFEB3B"/>
        <ellipse cx="40" cy="29" rx="2.5" ry="5" fill="#3B0000"/>
        <ellipse cx="60" cy="29" rx="2.5" ry="5" fill="#3B0000"/>
        <path d="M36 20 L31 6 L38 16Z" fill="#D32F2F"/>
        <path d="M64 20 L69 6 L62 16Z" fill="#D32F2F"/>
        <path d="M61 41 Q74 30 86 36 Q76 44 67 46Z" fill="#FF6D00" opacity=".85"/>
        <path d="M63 41 Q78 28 92 33 Q80 42 70 46Z" fill="#FFCA28" opacity=".6"/>
        <path d="M62 95 Q88 97 93 82 Q82 74 72 83" stroke={tint} strokeWidth="11" fill="none" strokeLinecap="round"/>
        <text x="50" y="76" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.75)" fontFamily="monospace">[99]</text>
      </svg>
    ),
    witch: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <polygon points="50,4 28,38 72,38" fill="#1A237E"/>
        <ellipse cx="50" cy="37" rx="26" ry="7" fill="#283593"/>
        <path d="M36 64 Q26 96 22 110 L78 110 Q74 96 64 64Z" fill={tint}/>
        <rect x="36" y="55" width="28" height="14" rx="4" fill={tint}/>
        <circle cx="50" cy="56" r="20" fill="#FFCCBC"/>
        <path d="M30 50 Q26 40 34 36 Q30 54 33 60Z" fill="#4A148C"/>
        <path d="M70 50 Q74 40 66 36 Q70 54 67 60Z" fill="#4A148C"/>
        <circle cx="42" cy="53" r="5" fill="white"/>
        <circle cx="58" cy="53" r="5" fill="white"/>
        <circle cx="43" cy="53" r="3" fill={tint}/>
        <circle cx="59" cy="53" r="3" fill={tint}/>
        <circle cx="44" cy="52" r="1.2" fill="white"/>
        <circle cx="60" cy="52" r="1.2" fill="white"/>
        <path d="M46 59 L50 67 L54 59Z" fill="#FFAB91"/>
        <path d="M41 65 Q50 72 59 65" stroke="#4A148C" strokeWidth="1.5" fill="none"/>
        <line x1="68" y1="62" x2="94" y2="34" stroke="#795548" strokeWidth="3.5"/>
        <circle cx="94" cy="34" r="6" fill="#FFCA28"/>
        <text x="76" y="60" fontSize="8" fill="rgba(255,255,255,.85)" fontFamily="monospace">int+str</text>
      </svg>
    ),
    serpent: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <path d="M50 100 Q82 96 88 78 Q94 60 72 54 Q50 48 55 32 Q58 18 50 10" stroke={tint} strokeWidth="16" fill="none" strokeLinecap="round"/>
        <path d="M50 100 Q82 96 88 78 Q94 60 72 54 Q50 48 55 32 Q58 18 50 10" stroke={darkTint} strokeWidth="10" fill="none" strokeLinecap="round"/>
        <path d="M50 100 Q82 96 88 78 Q94 60 72 54 Q50 48 55 32 Q58 18 50 10" stroke="rgba(255,255,255,.15)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="9 14"/>
        <ellipse cx="50" cy="8" rx="13" ry="11" fill={tint}/>
        <circle cx="44" cy="6" r="4" fill="#FFEB3B"/>
        <circle cx="56" cy="6" r="4" fill="#FFEB3B"/>
        <ellipse cx="44" cy="6" rx="1.8" ry="3.5" fill="#1A237E"/>
        <ellipse cx="56" cy="6" rx="1.8" ry="3.5" fill="#1A237E"/>
        <path d="M50 17 L50 25 M48 25 L52 30 M52 25 L48 30" stroke="#F44336" strokeWidth="1.5" fill="none"/>
        <text x="62" y="72" fontSize="9" fill="rgba(255,255,255,.7)" fontFamily="monospace">····</text>
      </svg>
    ),
    phantom: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <path d="M18 44 Q14 90 20 108 L80 108 Q86 90 82 44 Q66 32 50 30 Q34 32 18 44Z" fill={tint} opacity=".9"/>
        <circle cx="50" cy="28" r="24" fill="#ECEFF1"/>
        <ellipse cx="40" cy="24" rx="7" ry="8" fill={tint}/>
        <ellipse cx="60" cy="24" rx="7" ry="8" fill={tint}/>
        <path d="M45 33 L50 38 L55 33Z" fill={tint} opacity=".5"/>
        <rect x="38" y="40" width="6" height="7" rx="1" fill="white"/>
        <rect x="46" y="40" width="6" height="7" rx="1" fill="white"/>
        <rect x="54" y="40" width="6" height="7" rx="1" fill="white"/>
        <circle cx="78" cy="18" r="7" fill="none" stroke="#90A4AE" strokeWidth="2.5"/>
        <line x1="85" y1="18" x2="95" y2="18" stroke="#90A4AE" strokeWidth="2.5"/>
        <line x1="91" y1="14" x2="91" y2="18" stroke="#90A4AE" strokeWidth="2.5"/>
        <line x1="95" y1="14" x2="95" y2="18" stroke="#90A4AE" strokeWidth="2.5"/>
        <text x="50" y="83" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.65)" fontFamily="monospace">KeyError</text>
      </svg>
    ),
    ogre: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <ellipse cx="50" cy="74" rx="30" ry="30" fill={tint}/>
        <rect x="38" y="46" width="24" height="22" fill={tint}/>
        <ellipse cx="50" cy="38" rx="28" ry="24" fill={tint}/>
        <path d="M22 30 Q50 19 78 30" stroke={darkTint} strokeWidth="6" fill="none" strokeLinecap="round"/>
        <circle cx="38" cy="36" r="8" fill="#F9A825"/>
        <circle cx="62" cy="36" r="8" fill="#F9A825"/>
        <circle cx="38" cy="36" r="5" fill="#1A1A1A"/>
        <circle cx="62" cy="36" r="5" fill="#1A1A1A"/>
        <circle cx="39" cy="34" r="2" fill="white"/>
        <circle cx="63" cy="34" r="2" fill="white"/>
        <ellipse cx="50" cy="45" rx="7" ry="5" fill={darkTint} opacity=".6"/>
        <circle cx="46" cy="44" r="2.5" fill={darkTint}/>
        <circle cx="54" cy="44" r="2.5" fill={darkTint}/>
        <path d="M34 54 Q50 63 66 54" stroke="#1A0000" strokeWidth="2" fill="none"/>
        <rect x="42" y="53" width="6" height="8" rx="1" fill="ivory"/>
        <rect x="52" y="53" width="6" height="8" rx="1" fill="ivory"/>
        <path d="M20 62 Q6 78 12 92" stroke={tint} strokeWidth="13" strokeLinecap="round" fill="none"/>
        <path d="M80 62 Q94 78 88 92" stroke={tint} strokeWidth="13" strokeLinecap="round" fill="none"/>
        <text x="50" y="80" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.65)" fontFamily="monospace">.attr</text>
      </svg>
    ),
    demon: (
      <svg viewBox="0 0 100 110" width={w} height={h} style={animStyle}>
        <path d="M50 54 Q8 18 0 6 Q14 26 30 42 Q42 52 50 54Z" fill="#4A0030" opacity=".85"/>
        <path d="M50 54 Q92 18 100 6 Q86 26 70 42 Q58 52 50 54Z" fill="#4A0030" opacity=".85"/>
        <ellipse cx="50" cy="74" rx="26" ry="28" fill={tint}/>
        <circle cx="50" cy="44" r="24" fill={tint}/>
        <path d="M34 24 L26 6 L36 20Z" fill="#C62828"/>
        <path d="M66 24 L74 6 L64 20Z" fill="#C62828"/>
        <path d="M42 22 L38 8 L44 18Z" fill="#B71C1C"/>
        <path d="M58 22 L62 8 L56 18Z" fill="#B71C1C"/>
        <circle cx="40" cy="42" r="7" fill="#FF1744"/>
        <circle cx="60" cy="42" r="7" fill="#FF1744"/>
        <circle cx="40" cy="42" r="4" fill="#FF6D00"/>
        <circle cx="60" cy="42" r="4" fill="#FF6D00"/>
        <circle cx="40" cy="41" r="2" fill="white"/>
        <circle cx="60" cy="41" r="2" fill="white"/>
        <path d="M36 54 Q50 63 64 54" stroke="#FF1744" strokeWidth="2.5" fill="none"/>
        <text x="50" y="78" textAnchor="middle" fontSize="9" fill="rgba(255,120,120,.85)" fontFamily="monospace">import ??</text>
      </svg>
    ),
  };

  return sprites[enemy.id] ?? sprites.goblin;
}

// ═══════════════════════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════════════════════

function Hearts({ count, max = 3 }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: 22,
            lineHeight: 1,
            filter: i < count ? "none" : "grayscale(1) opacity(.25)",
            transition: "filter 0.4s ease",
          }}
        >❤️</span>
      ))}
    </div>
  );
}

function HPBar({ current, max, tint }) {
  const pct = Math.max(0, current / max);
  const barColor = pct > 0.5 ? tint : pct > 0.25 ? "#F9A825" : "#F44336";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: T.xs, fontFamily: T.mono, color: "#ccc", minWidth: 24 }}>HP</div>
      <div style={{ flex: 1, height: 10, background: "rgba(0,0,0,0.45)", borderRadius: 5, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: barColor, borderRadius: 5, transition: "width 0.4s ease" }}/>
      </div>
      <div style={{ fontSize: T.xs, fontFamily: T.mono, color: "#bbb", minWidth: 32, textAlign: "right" }}>
        {current}/{max}
      </div>
    </div>
  );
}

function XPBar({ xp }) {
  const { pct, level, toNext } = getXPProgress(xp);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: T.xs, fontFamily: T.mono, color: C.gold, minWidth: 38, textAlign: "right", fontWeight: T.bold }}>
        LV {level}
      </div>
      <div style={{ flex: 1, height: 7, background: `${C.gold}22`, borderRadius: 3, overflow: "hidden", border: `1px solid ${C.gold}33` }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: `linear-gradient(90deg, ${C.gold}, #FFD54F)`, borderRadius: 3, transition: "width 0.7s ease" }}/>
      </div>
      <div style={{ fontSize: T.xs, fontFamily: T.mono, color: C.textLight, minWidth: 56, textAlign: "left" }}>
        {xp} XP
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// START SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function StartScreen({ stats, enemyIndex, streak, isOffline, offlineInfo, onStart }) {
  const enemy   = ENEMIES[enemyIndex];
  const level   = getLevelFromXP(stats.xp);
  const { pct } = getXPProgress(stats.xp);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, #1A0408 0%, #2C0815 50%, #0D1A06 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: S.xl, position: "relative", overflow: "hidden" }}>

      {/* Stars bg */}
      {[...Array(24)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 4 === 0 ? 3 : 2,
          height: i % 4 === 0 ? 3 : 2,
          borderRadius: "50%",
          background: "white",
          opacity: 0.2 + (i % 5) * 0.08,
          top: `${(i * 37 + 11) % 97}%`,
          left: `${(i * 53 + 7) % 97}%`,
          animation: `starTwinkle ${2 + (i % 3)}s ease-in-out infinite`,
          animationDelay: `${(i * 0.3) % 2.5}s`,
        }}/>
      ))}

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: S.xl, animation: "slideUp 0.5s ease" }}>
        <div style={{ fontSize: T.xs, letterSpacing: 6, color: `${C.gold}88`, fontFamily: T.sans, textTransform: "uppercase", marginBottom: S.sm }}>
          El Juego de Python
        </div>
        <h1 style={{ fontSize: "clamp(2.8rem,10vw,5.5rem)", fontFamily: T.serif, fontWeight: T.black, color: C.gold, margin: 0, letterSpacing: -2, lineHeight: 1, textShadow: `0 0 40px ${C.gold}55, 2px 2px 0 ${C.burgundy}` }}>
          CODE COMBAT
        </h1>
        <div style={{ width: "100%", height: 3, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, marginTop: S.md }}/>
      </div>

      {/* Player stats */}
      <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${C.gold}33`, borderRadius: 8, padding: `${S.md}px ${S.xl}px`, marginBottom: S.xl, width: "100%", maxWidth: 420, animation: "slideUp 0.6s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: S.md }}>
          <div>
            <div style={{ fontSize: T.xs, color: `${C.gold}77`, fontFamily: T.sans, letterSpacing: 3, textTransform: "uppercase" }}>Jugador</div>
            <div style={{ fontSize: T.md, fontFamily: T.serif, color: C.gold, fontWeight: T.bold }}>Nivel {level}</div>
          </div>
          {streak > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>🔥</div>
              <div style={{ fontSize: T.xs, color: "#FF6D00", fontFamily: T.mono, fontWeight: T.bold }}>{streak} días</div>
            </div>
          )}
        </div>
        <XPBar xp={stats.xp} />
        <div style={{ marginTop: S.sm, height: 1, background: `${C.gold}22` }}/>
        <div style={{ display: "flex", justifyContent: "center", gap: S.lg, marginTop: S.md }}>
          {ENEMIES.map((e, i) => (
            <span key={e.id} title={e.name} style={{ fontSize: 18, filter: i < enemyIndex ? "none" : "grayscale(1) opacity(.3)", transition: "filter 0.3s" }}>
              {["👺","👻","🐉","🧙","🐍","💀","👹","👿"][i]}
            </span>
          ))}
        </div>
      </div>

      {/* Enemy card */}
      <div style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${enemy.tint}66`, borderRadius: 12, padding: S.xl, marginBottom: S.xl, width: "100%", maxWidth: 420, textAlign: "center", animation: "slideUp 0.7s ease", boxShadow: `0 0 30px ${enemy.tint}22` }}>
        <div style={{ fontSize: T.xs, letterSpacing: 4, color: `${enemy.tint}cc`, fontFamily: T.sans, textTransform: "uppercase", marginBottom: S.md }}>
          — Próximo Enemigo —
        </div>
        <EnemySprite enemy={enemy} anim="idle"/>
        <div style={{ fontSize: T.lg, fontFamily: T.serif, fontWeight: T.bold, color: "white", marginTop: S.md }}>{enemy.name}</div>
        <div style={{ fontSize: T.sm, color: "#aaa", fontFamily: T.sans, marginTop: S.sm, lineHeight: 1.6 }}>{enemy.desc}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: S.xl, marginTop: S.md }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: T.xs, color: "#888", fontFamily: T.mono }}>HP</div>
            <div style={{ fontSize: T.base, color: "#F44336", fontFamily: T.mono, fontWeight: T.bold }}>{"♥".repeat(enemy.maxHP)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: T.xs, color: "#888", fontFamily: T.mono }}>XP</div>
            <div style={{ fontSize: T.base, color: C.gold, fontFamily: T.mono, fontWeight: T.bold }}>+{enemy.xpReward}</div>
          </div>
        </div>
      </div>

      {/* Battle button */}
      <button
        onClick={onStart}
        style={{
          padding: `${S.lg}px ${S.xxxl * 2}px`,
          background: C.burgundy,
          border: `2px solid ${C.gold}`,
          color: C.gold,
          fontSize: T.lg,
          fontFamily: T.serif,
          fontWeight: T.black,
          letterSpacing: 4,
          textTransform: "uppercase",
          cursor: "pointer",
          borderRadius: 6,
          animation: "btnPulse 2s ease-in-out infinite",
          boxShadow: `0 0 20px ${C.burgundy}88, 3px 3px 0 ${C.gold}44`,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
        onMouseLeave={e => e.target.style.transform = "scale(1)"}
      >
        ⚔️ ¡Batallar!
      </button>

      {/* Offline / online indicator */}
      <div style={{ marginTop: S.xl, display: "flex", flexDirection: "column", alignItems: "center", gap: S.sm }}>
        {isOffline ? (
          <div style={{ display: "flex", alignItems: "center", gap: S.sm, background: "rgba(0,0,0,0.5)", border: "1px solid #FF6D00", borderRadius: 20, padding: `${S.xs}px ${S.md}px` }}>
            <span style={{ fontSize: 10, color: "#FF6D00" }}>●</span>
            <span style={{ fontSize: T.xs, color: "#FF8A50", fontFamily: T.mono, letterSpacing: 1 }}>
              SIN CONEXIÓN — {offlineInfo ? `${offlineInfo.total} preguntas offline disponibles` : "usando preguntas incorporadas"}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: S.sm }}>
            <span style={{ fontSize: 10, color: "#4CAF50" }}>●</span>
            <span style={{ fontSize: T.xs, color: "#555", fontFamily: T.mono, letterSpacing: 2, textTransform: "uppercase" }}>
              3 vidas · preguntas con IA · puro Python
            </span>
          </div>
        )}
        {!isOffline && offlineInfo && (
          <div style={{ fontSize: T.xs, color: "#444", fontFamily: T.mono }}>
            📥 {offlineInfo.total} preguntas offline guardadas
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function LoadingScreen({ enemy, isOffline }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0D0005", gap: S.xl }}>
      <EnemySprite enemy={enemy} anim="idle"/>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: T.md, color: C.gold, fontFamily: T.mono, letterSpacing: 2 }}>
          {isOffline ? "Cargando pregunta offline" : `Generando pregunta${dots}`}
        </div>
        <div style={{ fontSize: T.sm, color: "#666", fontFamily: T.sans, marginTop: S.sm }}>
          {isOffline ? "Usando quizzes guardados" : "Claude está preparando el desafío"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: enemy.tint, animation: "dotBounce 1s ease infinite", animationDelay: `${i * 0.18}s` }}/>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BATTLE SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function BattleScreen({ enemy, enemyHP, hearts, question, selectedOption, isCorrect, anim, taunt, stats, isOffline, onAnswer, onContinue }) {
  const showResult = selectedOption !== null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(180deg, #0D0005 0%, #160010 50%, #060D02 100%)` }}>

      {/* Offline banner */}
      {isOffline && (
        <div style={{ background: "#2C1600", borderBottom: "1px solid #FF6D00", padding: `3px ${S.lg}px`, display: "flex", alignItems: "center", gap: S.sm }}>
          <span style={{ fontSize: 9, color: "#FF6D00" }}>●</span>
          <span style={{ fontSize: T.xs, color: "#FF8A50", fontFamily: T.mono, letterSpacing: 1 }}>
            MODO OFFLINE — preguntas guardadas
          </span>
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${S.md}px ${S.xl}px`, background: "rgba(0,0,0,0.6)", borderBottom: `1px solid ${C.gold}22` }}>
        <Hearts count={hearts}/>
        <div style={{ flex: 1, margin: `0 ${S.xl}px` }}>
          <XPBar xp={stats.xp}/>
        </div>
        <div style={{ minWidth: 140 }}>
          <HPBar current={enemyHP} max={enemy.maxHP} tint={enemy.tint}/>
        </div>
      </div>

      {/* Enemy area */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: `${S.xl}px ${S.xl}px ${S.md}px`, position: "relative" }}>

        {/* Taunt bubble */}
        {taunt && (
          <div style={{
            position: "absolute", top: S.md, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)", border: `1px solid ${enemy.tint}88`,
            borderRadius: 8, padding: `${S.sm}px ${S.md}px`,
            fontSize: T.sm, fontFamily: T.mono, color: "#ddd",
            animation: "tauntIn 2.5s ease forwards",
            maxWidth: 280, textAlign: "center", zIndex: 10,
            boxShadow: `0 0 12px ${enemy.tint}44`,
          }}>
            "{taunt}"
          </div>
        )}

        <EnemySprite enemy={enemy} anim={anim}/>
        <div style={{ fontSize: T.sm, fontFamily: T.serif, color: enemy.tint === "#E65100" ? "#FF8A50" : enemy.tint, fontWeight: T.bold, letterSpacing: 2, marginTop: S.sm }}>
          {enemy.name}
        </div>
      </div>

      {/* Question card */}
      <div style={{ flex: 1, padding: `0 ${S.xl}px ${S.xl}px`, maxWidth: 620, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: S.md }}>

        <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${C.gold}33`, borderRadius: 8, padding: S.lg, animation: "slideUp 0.3s ease" }}>
          <CodeBlock code={question.code}/>
          <div style={{ marginTop: S.md, fontSize: T.base, color: "white", fontFamily: T.sans, fontWeight: T.bold, lineHeight: 1.5 }}>
            {question.question}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: S.sm }}>
          {question.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            const isRight    = i === question.correct;
            let bg = "rgba(0,0,0,0.45)";
            let borderColor = `${C.gold}33`;
            let color = "#ccc";
            let animation = "none";

            if (showResult) {
              if (isRight) { bg = "rgba(46,125,50,0.35)"; borderColor = "#4CAF50"; color = "#A5D6A7"; animation = "correctPulse 0.6s ease"; }
              else if (isSelected && !isRight) { bg = "rgba(183,28,28,0.35)"; borderColor = "#F44336"; color = "#EF9A9A"; animation = "wrongShake 0.4s ease"; }
            } else if (isSelected) {
              bg = `${enemy.tint}44`;
              borderColor = enemy.tint;
            }

            return (
              <button
                key={i}
                disabled={showResult}
                onClick={() => onAnswer(i)}
                style={{
                  display: "flex", alignItems: "center", gap: S.md,
                  padding: `${S.md}px ${S.lg}px`,
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  color, fontSize: T.sm, fontFamily: T.mono, textAlign: "left",
                  cursor: showResult ? "default" : "pointer",
                  transition: "all 0.2s", animation,
                  opacity: showResult && !isRight && !isSelected ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!showResult) e.currentTarget.style.background = `${enemy.tint}33`; }}
                onMouseLeave={e => { if (!showResult) e.currentTarget.style.background = bg; }}
              >
                <span style={{ minWidth: 22, height: 22, borderRadius: "50%", background: `${borderColor}44`, border: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: T.xs, fontWeight: T.bold, color: borderColor, flexShrink: 0 }}>
                  {showResult && isRight ? "✓" : showResult && isSelected && !isRight ? "✗" : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Result + explanation */}
        {showResult && (
          <div style={{ background: isCorrect ? "rgba(46,125,50,0.25)" : "rgba(183,28,28,0.25)", border: `1px solid ${isCorrect ? "#4CAF50" : "#F44336"}55`, borderRadius: 8, padding: S.lg, animation: "slideUp 0.3s ease" }}>
            <div style={{ fontSize: T.md, fontWeight: T.bold, color: isCorrect ? "#A5D6A7" : "#EF9A9A", marginBottom: S.sm, fontFamily: T.sans }}>
              {isCorrect ? "✅ ¡Correcto! El enemigo recibe daño." : "❌ Incorrecto. Pierdes una vida."}
            </div>
            <div style={{ fontSize: T.sm, color: "#bbb", fontFamily: T.mono, lineHeight: 1.7 }}>
              {question.explanation}
            </div>
            <button
              onClick={onContinue}
              style={{
                marginTop: S.md, padding: `${S.sm}px ${S.xl}px`,
                background: C.burgundy, border: `1px solid ${C.gold}`,
                color: C.gold, fontSize: T.sm, fontFamily: T.mono,
                fontWeight: T.bold, letterSpacing: 2, textTransform: "uppercase",
                cursor: "pointer", borderRadius: 4,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.target.style.opacity = "0.8"}
              onMouseLeave={e => e.target.style.opacity = "1"}
            >
              Continuar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VICTORY SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function VictoryScreen({ enemy, xpGain, prevXP, stats, isLast, onNext, onQuit }) {
  const prevLevel = getLevelFromXP(prevXP);
  const newLevel  = getLevelFromXP(stats.xp);
  const levelUp   = newLevel > prevLevel;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #0A1508 0%, #0D2010 100%)", padding: S.xl, textAlign: "center", gap: S.lg }}>

      <div style={{ animation: "slideUp 0.5s ease" }}>
        <div style={{ fontSize: T.xs, letterSpacing: 6, color: "#4CAF50", fontFamily: T.sans, textTransform: "uppercase" }}>¡Victoria!</div>
        <h2 style={{ fontSize: "clamp(2rem,8vw,4rem)", fontFamily: T.serif, fontWeight: T.black, color: C.gold, margin: `${S.sm}px 0`, textShadow: `0 0 30px ${C.gold}66` }}>
          {enemy.name}
        </h2>
        <div style={{ fontSize: T.base, color: "#888", fontFamily: T.mono, fontStyle: "italic" }}>"{enemy.deathLine}"</div>
      </div>

      <div style={{ animation: "enemyDeath 1s ease forwards", animationDelay: "0.3s" }}>
        <EnemySprite enemy={enemy} anim="idle"/>
      </div>

      <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${C.gold}44`, borderRadius: 10, padding: S.xl, minWidth: 280, animation: "slideUp 0.7s ease" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: S.xxxl, marginBottom: S.md }}>
          <div>
            <div style={{ fontSize: T.xs, color: "#888", fontFamily: T.mono }}>XP ganado</div>
            <div style={{ fontSize: "2rem", color: C.gold, fontFamily: T.mono, fontWeight: T.black, animation: "xpFloat 1.5s ease forwards", animationDelay: "0.5s" }}>+{xpGain}</div>
          </div>
          {levelUp && (
            <div>
              <div style={{ fontSize: T.xs, color: "#888", fontFamily: T.mono }}>Nivel</div>
              <div style={{ fontSize: "2rem", color: "#4CAF50", fontFamily: T.mono, fontWeight: T.black }}>▲ {newLevel}</div>
            </div>
          )}
        </div>
        <XPBar xp={stats.xp}/>
      </div>

      {levelUp && (
        <div style={{ background: "rgba(76,175,80,0.15)", border: "1px solid #4CAF50", borderRadius: 8, padding: S.lg, animation: "slideUp 0.8s ease" }}>
          <div style={{ fontSize: T.lg, color: "#81C784", fontFamily: T.serif, fontWeight: T.bold }}>
            ⭐ ¡Subiste al Nivel {newLevel}!
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: S.md, animation: "slideUp 0.9s ease" }}>
        <button
          onClick={onQuit}
          style={{ padding: `${S.md}px ${S.xl}px`, background: "transparent", border: `1px solid #555`, color: "#888", fontFamily: T.mono, fontSize: T.sm, letterSpacing: 2, cursor: "pointer", borderRadius: 4, textTransform: "uppercase" }}
        >
          Salir
        </button>
        <button
          onClick={onNext}
          style={{ padding: `${S.md}px ${S.xxl}px`, background: C.burgundy, border: `2px solid ${C.gold}`, color: C.gold, fontFamily: T.serif, fontWeight: T.black, fontSize: T.md, letterSpacing: 2, cursor: "pointer", borderRadius: 6, textTransform: "uppercase", boxShadow: `0 0 16px ${C.burgundy}88` }}
        >
          {isLast ? "🏆 Completado" : "Siguiente Enemigo ⚔️"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME OVER SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function GameOverScreen({ enemy, stats, enemyIndex, onRestart }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #1A0000 0%, #0A0000 100%)", padding: S.xl, textAlign: "center", gap: S.lg }}>

      <div style={{ animation: "slideUp 0.5s ease" }}>
        <div style={{ fontSize: T.xs, letterSpacing: 6, color: "#F44336", fontFamily: T.sans, textTransform: "uppercase" }}>Derrota</div>
        <h2 style={{ fontSize: "clamp(2rem,8vw,4rem)", fontFamily: T.serif, fontWeight: T.black, color: "#EF5350", margin: `${S.sm}px 0`, textShadow: "0 0 30px #F4433666" }}>
          Game Over
        </h2>
        <div style={{ fontSize: T.base, color: "#777", fontFamily: T.mono, fontStyle: "italic" }}>
          {enemy.name} te venció.
        </div>
      </div>

      <EnemySprite enemy={enemy} anim="idle"/>

      <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid #F4433633", borderRadius: 10, padding: S.xl, minWidth: 280, animation: "slideUp 0.7s ease" }}>
        <div style={{ marginBottom: S.md }}>
          <div style={{ fontSize: T.xs, color: "#666", fontFamily: T.mono, marginBottom: S.xs }}>Llegaste hasta</div>
          <div style={{ fontSize: T.lg, color: "#bbb", fontFamily: T.serif, fontWeight: T.bold }}>
            {enemy.name}
          </div>
        </div>
        <div style={{ height: 1, background: "#333", margin: `${S.md}px 0` }}/>
        <XPBar xp={stats.xp}/>
      </div>

      <button
        onClick={onRestart}
        style={{ padding: `${S.md}px ${S.xxl}px`, background: C.burgundy, border: `2px solid ${C.gold}`, color: C.gold, fontFamily: T.serif, fontWeight: T.black, fontSize: T.md, letterSpacing: 3, cursor: "pointer", borderRadius: 6, textTransform: "uppercase", boxShadow: `0 0 16px ${C.burgundy}88`, animation: "slideUp 0.9s ease" }}
      >
        🔄 Reintentar
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Game({ onClose, user }) {
  // ── Persistent ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState(() => loadStats());

  // ── Session ─────────────────────────────────────────────────────────────
  const [phase, setPhase]               = useState("start"); // start | loading | battle | victory | gameover
  const [enemyIndex, setEnemyIndex]     = useState(0);
  const [enemyHP, setEnemyHP]           = useState(0);
  const [hearts, setHearts]             = useState(3);
  const [question, setQuestion]         = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect]       = useState(null);
  const [anim, setAnim]                 = useState("idle");
  const [taunt, setTaunt]               = useState(null);
  const [prevXP, setPrevXP]             = useState(0);
  const [xpGain, setXpGain]             = useState(0);
  const [isOffline, setIsOffline]       = useState(!navigator.onLine);
  const [offlineInfo]                   = useState(() => getOfflineQuizInfo());

  const enemy = ENEMIES[enemyIndex];

  // ── Supabase sync helper (fire-and-forget) ─────────────────────────────
  function syncStatsToSupabase(s) {
    if (!user?.id) return;
    supabase.from("game_stats").upsert(
      { user_id: user.id, xp: s.xp, level: getLevelFromXP(s.xp), streak: s.streak ?? 0, last_played: s.lastPlayed },
      { onConflict: "user_id" }
    ).then(() => {}).catch(() => {});
  }

  // On mount: update streak, then merge with Supabase stats (highest XP wins)
  useEffect(() => {
    const local = updateStreak(stats);

    if (user?.id) {
      supabase.from("game_stats").select("xp, streak, last_played").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data) {
            const merged = {
              xp:         Math.max(local.xp, data.xp ?? 0),
              streak:     Math.max(local.streak ?? 0, data.streak ?? 0),
              lastPlayed: data.last_played ?? local.lastPlayed,
            };
            setStats(merged);
            saveStats(merged);
          } else {
            if (local !== stats) { setStats(local); saveStats(local); }
            syncStatsToSupabase(local);
          }
        })
        .catch(() => {
          if (local !== stats) { setStats(local); saveStats(local); }
        });
    } else if (local !== stats) {
      setStats(local);
      saveStats(local);
    }
  }, []); // eslint-disable-line

  // ── Actions ──────────────────────────────────────────────────────────────

  async function startBattle() {
    setPhase("loading");
    setEnemyHP(enemy.maxHP);
    setHearts(3);
    await fetchNextQuestion();
  }

  async function fetchNextQuestion() {
    setPhase("loading");
    setSelectedOption(null);
    setIsCorrect(null);
    setTaunt(null);
    setAnim("idle");
    setIsOffline(!navigator.onLine);

    try {
      const historial = loadHistorial();
      const q = await generateQuestion(enemy.errorType, historial);
      setQuestion(q);
    } catch (err) {
      // offline_no_cache: no internet AND no saved quizzes → hard fallback
      // For any other error: try offline cache before falling back
      const offlineQ = err.message !== "offline_no_cache"
        ? getOfflineQuestion(enemy.errorType)
        : null;
      setQuestion(offlineQ ?? FALLBACKS[enemy.errorType] ?? FALLBACKS.SyntaxError);
    }

    setPhase("battle");
    setTaunt(enemy.taunt);
    setTimeout(() => setTaunt(null), 2600);
  }

  function handleAnswer(optionIndex) {
    if (selectedOption !== null) return;
    const correct = optionIndex === question.correct;
    setSelectedOption(optionIndex);
    setIsCorrect(correct);

    if (correct) {
      setAnim("hit");
      const newEnemyHP = Math.max(0, enemyHP - 1);
      setEnemyHP(newEnemyHP);
      setTimeout(() => setAnim("idle"), 500);
    } else {
      setAnim("taunt");
      const newHearts = Math.max(0, hearts - 1);
      setHearts(newHearts);
      setTimeout(() => setAnim("idle"), 550);
    }
  }

  function handleContinue() {
    // Check outcomes using current state values
    const dead       = enemyHP <= 0;
    const playerDown = hearts <= 0;

    if (dead) {
      handleVictory();
    } else if (playerDown) {
      setPhase("gameover");
    } else {
      fetchNextQuestion();
    }
  }

  function handleVictory() {
    const gained   = enemy.xpReward;
    const newXP    = stats.xp + gained;
    const newStats = { ...stats, xp: newXP, lastPlayed: todayStr() };
    setPrevXP(stats.xp);
    setXpGain(gained);
    setStats(newStats);
    saveStats(newStats);
    syncStatsToSupabase(newStats);
    setPhase("victory");
  }

  function handleNextEnemy() {
    const next = enemyIndex + 1;
    if (next >= ENEMIES.length) {
      setEnemyIndex(0);
    } else {
      setEnemyIndex(next);
    }
    setPhase("start");
  }

  function handleRestart() {
    setEnemyIndex(0);
    setPhase("start");
  }

  const streak = stats.streak ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes enemyFloat  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes enemyHit    { 0% { transform: translateX(0) scale(1); filter: brightness(1); }
                                  20% { transform: translateX(-14px) scale(.93); filter: brightness(4) saturate(0); }
                                  45% { transform: translateX(10px) scale(1.06); filter: brightness(2) hue-rotate(170deg); }
                                  70% { transform: translateX(-5px); filter: brightness(1.2); }
                                  100% { transform: translateX(0) scale(1); filter: brightness(1); } }
        @keyframes enemyTaunt  { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-6deg) scale(1.05); } 60% { transform: rotate(5deg) scale(1.05); } }
        @keyframes enemyDeath  { 0% { transform: scale(1) rotate(0); opacity: 1; }
                                  35% { transform: scale(1.1) rotate(-6deg); }
                                  70% { transform: scale(.7) rotate(20deg) translateY(25px); opacity: .45; }
                                  100% { transform: scale(0) rotate(50deg) translateY(70px); opacity: 0; } }
        @keyframes slideUp     { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
        @keyframes correctPulse { 0% { box-shadow: 0 0 0 0 rgba(76,175,80,.7); }
                                   60% { box-shadow: 0 0 0 14px rgba(76,175,80,0); }
                                   100% { box-shadow: none; } }
        @keyframes wrongShake  { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        @keyframes xpFloat     { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-50px) scale(1.5); } }
        @keyframes btnPulse    { 0%,100% { box-shadow: 0 0 14px ${C.gold}44, 3px 3px 0 ${C.gold}33; } 50% { box-shadow: 0 0 28px ${C.gold}77, 3px 3px 0 ${C.gold}55; } }
        @keyframes dotBounce   { 0%,80%,100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-8px); opacity: 1; } }
        @keyframes tauntIn     { 0% { opacity: 0; transform: translateX(-50%) scale(.85); }
                                  15% { opacity: 1; transform: translateX(-50%) scale(1.03); }
                                  80% { opacity: 1; transform: translateX(-50%) scale(1); }
                                  100% { opacity: 0; transform: translateX(-50%) scale(.9); } }
        @keyframes starTwinkle { 0%,100% { opacity: .15; transform: scale(1); } 50% { opacity: .6; transform: scale(1.4); } }
      `}</style>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{ position: "fixed", top: S.lg, right: S.lg, zIndex: 999, background: "rgba(0,0,0,0.7)", border: `1px solid ${C.gold}55`, color: C.gold, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: T.base, display: "flex", alignItems: "center", justifyContent: "center" }}
        >✕</button>
      )}

      {phase === "start"   && <StartScreen   stats={stats} enemyIndex={enemyIndex} streak={streak} isOffline={isOffline} offlineInfo={offlineInfo} onStart={startBattle}/>}
      {phase === "loading" && <LoadingScreen  enemy={enemy} isOffline={isOffline}/>}
      {phase === "battle"  && question && (
        <BattleScreen
          enemy={enemy}
          enemyHP={enemyHP}
          hearts={hearts}
          question={question}
          selectedOption={selectedOption}
          isCorrect={isCorrect}
          anim={anim}
          taunt={taunt}
          stats={stats}
          isOffline={isOffline}
          onAnswer={handleAnswer}
          onContinue={handleContinue}
        />
      )}
      {phase === "victory"  && <VictoryScreen  enemy={enemy} xpGain={xpGain} prevXP={prevXP} stats={stats} isLast={enemyIndex >= ENEMIES.length - 1} onNext={handleNextEnemy} onQuit={handleRestart}/>}
      {phase === "gameover" && <GameOverScreen  enemy={enemy} stats={stats} enemyIndex={enemyIndex} onRestart={handleRestart}/>}
    </>
  );
}
