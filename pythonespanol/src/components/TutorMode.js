import { useState, useRef, useEffect, useCallback } from "react";
import { C, T, S, label, btnPrimary } from "../constants";
import { supabase } from "../lib/supabase";

const XP_SOLO   = 10;
const XP_HINT   = 7;
const XP_CHIPS  = 5;
const TIMER_SEC = 60;

const REACTIONS = {
  correct_solo:  ["¡Ajá! Eso es exactamente.", "Bien pensado. Sin ayuda.", "Correcto. Eso es programar.", "¡Exacto! Lo sabías."],
  correct_hint:  ["Con la pista llegaste. Cuenta.", "Bien, ya lo tienes.", "Con ayuda, pero correcto."],
  correct_chips: ["Era una de las opciones. La próxima, sin trampa.", "Correcto. Intenta la siguiente sin los chips.", "Ok, ¡siguiente!"],
  wrong:         ["No. Piénsalo de nuevo.", "Eso no funciona aquí. ¿Por qué?", "Mmm... no. Intenta otra vez."],
  timeout:       ["Se acabó el tiempo. Te doy una pista.", "Tiempo. No pasa nada — una pista:"],
  streak_3:      ["¡3 seguidas! Streeeeak 🔥", "¡Tres de tres! Sigue así."],
  streak_5:      ["¡5 seguidas! Eres una máquina 🔥🔥", "¡STREAK x5! Imparable."],
};
function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Flow diagram ──────────────────────────────────────────────────────────────
function FlowDiagram({ nodes }) {
  if (!nodes?.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: S.md }}>
      {nodes.map((n, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ background: n.active ? C.burgundy : C.creamDark, border: `1px solid ${n.active ? C.gold : C.border}`, borderRadius: 6, padding: "4px 10px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: n.active ? "rgba(200,151,31,0.7)" : C.textLight, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: 1 }}>{n.label}</span>
            <span style={{ fontSize: T.sm, fontFamily: T.mono, color: n.active ? C.gold : C.text, fontWeight: n.active ? T.bold : T.normal }}>{n.codigo}</span>
          </div>
          {i < nodes.length - 1 && <span style={{ color: C.textLight, fontSize: 14 }}>→</span>}
        </div>
      ))}
    </div>
  );
}

// ── Code with blanks ──────────────────────────────────────────────────────────
function CodeWithBlanks({ codeLines, blanks, filled, shakeId }) {
  return (
    <div style={{ background: "#1E1E1E", borderRadius: 6, padding: S.md, fontFamily: T.mono, fontSize: T.sm, lineHeight: 1.85 }}>
      {codeLines.map((line, li) => {
        const b = blanks.find(b => b.lineIdx === li);
        if (!b) return (
          <div key={li} style={{ display: "flex" }}>
            <span style={{ color: "#4A4A4A", minWidth: 24, paddingRight: 10, textAlign: "right", userSelect: "none", fontSize: T.xs }}>{li + 1}</span>
            <span style={{ color: "#D4D4D4", whiteSpace: "pre" }}>{line}</span>
          </div>
        );
        const before = line.substring(0, b.charIdx);
        const after  = line.substring(b.charIdx + b.length);
        const val    = filled[b.blankId];
        const isWrong = shakeId === b.blankId;
        return (
          <div key={li} style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#4A4A4A", minWidth: 24, paddingRight: 10, textAlign: "right", userSelect: "none", fontSize: T.xs }}>{li + 1}</span>
            <span style={{ color: "#D4D4D4", whiteSpace: "pre" }}>{before}</span>
            <span style={{
              display: "inline-block", minWidth: Math.max(60, b.length * 8 + 16), height: 22, borderRadius: 4,
              border: `2px dashed ${isWrong ? "#F44747" : val ? C.gold : "#555"}`,
              background: isWrong ? "rgba(244,71,71,0.12)" : val ? `${C.gold}22` : "rgba(255,255,255,0.04)",
              color: isWrong ? "#F44747" : val ? C.gold : "transparent",
              fontFamily: T.mono, fontSize: T.sm, padding: "0 8px",
              verticalAlign: "middle", lineHeight: "20px",
              animation: isWrong ? "shake 0.4s ease" : val ? "popIn 0.25s ease" : "none",
            }}>{val || ""}</span>
            <span style={{ color: "#D4D4D4", whiteSpace: "pre" }}>{after}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Chips lifeline ────────────────────────────────────────────────────────────
function OptionChips({ options, onSelect, usedWrong, correct }) {
  return (
    <div style={{ marginTop: S.md }}>
      <span style={{ display: "block", fontSize: T.xs, color: "rgba(200,151,31,0.7)", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase", marginBottom: S.sm }}>🆘 Salvavidas — elige la correcta:</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: S.sm }}>
        {options.map((opt, i) => {
          const wrong = usedWrong.includes(opt);
          const done  = correct === opt;
          return (
            <button key={i} onClick={() => !wrong && !done && onSelect(opt)} disabled={wrong || done}
              style={{ padding: "6px 16px", borderRadius: 20, fontFamily: T.mono, fontSize: T.sm, cursor: wrong || done ? "default" : "pointer", transition: "all 0.15s", border: `1px solid ${done ? C.olive : wrong ? C.border : C.burgundy}`, background: done ? `${C.olive}22` : wrong ? C.creamDark : C.white, color: done ? C.olive : wrong ? C.textLight : C.burgundy, textDecoration: wrong ? "line-through" : "none", opacity: wrong ? 0.4 : 1 }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── XP floating pop ───────────────────────────────────────────────────────────
function XPPop({ xp, visible }) {
  return (
    <span style={{ position: "absolute", top: -8, right: 0, color: xp >= XP_SOLO ? C.gold : xp >= XP_HINT ? "#88CCFF" : "#AAAAAA", fontFamily: T.sans, fontWeight: T.bold, fontSize: T.lg, opacity: visible ? 1 : 0, transform: visible ? "translateY(-12px)" : "translateY(0)", transition: "all 0.6s ease", pointerEvents: "none" }}>
      +{xp} XP
    </span>
  );
}

// ── El Profesor bubble ────────────────────────────────────────────────────────
function ProfesorBubble({ text, mood }) {
  if (!text) return null;
  const colors = { correct: C.olive, wrong: C.burgundy, hint: "#1a6b8a", neutral: C.textMid };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: S.md, marginTop: S.lg, animation: "slideUp 0.3s ease" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.burgundy, border: `2px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>👨‍🏫</div>
      <div style={{ background: C.white, border: `1px solid ${colors[mood] || C.border}`, borderLeft: `3px solid ${colors[mood] || C.border}`, borderRadius: "4px 14px 14px 14px", padding: `${S.sm}px ${S.md}px`, fontSize: T.sm, fontFamily: T.sans, color: C.text, lineHeight: 1.6, maxWidth: "80%" }}>
        {text}
      </div>
    </div>
  );
}

// ── Timer ring ────────────────────────────────────────────────────────────────
function TimerRing({ seconds, total }) {
  const r = 16, circ = 2 * Math.PI * r, pct = seconds / total;
  const color = pct > 0.5 ? C.olive : pct > 0.25 ? C.gold : "#F44747";
  return (
    <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
      <svg width="40" height="40" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="20" cy="20" r={r} fill="none" stroke={`${color}33`} strokeWidth="3" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: T.mono, color, fontWeight: T.bold }}>{seconds}</span>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingStep() {
  return (
    <div style={{ padding: S.xl, display: "flex", flexDirection: "column", gap: S.lg }}>
      {[["60%", 14], ["85%", 10], ["100%", 80]].map(([w, h], i) => (
        <div key={i} style={{ height: h, width: w, background: i === 2 ? "#1E1E1E" : C.creamDark, borderRadius: 4, animation: `pulse 1.2s ease infinite ${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ── CodeBlock for chat ────────────────────────────────────────────────────────
function CodeBlock({ codeText, onSendToTerminal }) {
  const [cp, setCp] = useState(false);
  return (
    <div style={{ position: "relative", margin: "6px 0" }}>
      <pre style={{ background: "#1E1E1E", color: "#D4D4D4", padding: "12px", paddingRight: 100, borderRadius: 4, fontSize: T.sm, fontFamily: T.mono, overflowX: "auto", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{codeText}</pre>
      <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
        <button onClick={() => navigator.clipboard.writeText(codeText).then(() => { setCp(true); setTimeout(() => setCp(false), 2000); })} style={{ background: cp ? "#2d5a1b" : "#333", border: "none", color: cp ? "#4EC994" : "#888", fontSize: 10, padding: "3px 7px", cursor: "pointer", fontFamily: T.mono, borderRadius: 3 }}>{cp ? "✓" : "Copiar"}</button>
        <button onClick={() => onSendToTerminal(codeText.trim())} style={{ background: C.olive, border: "none", color: "#fff", fontSize: 10, padding: "3px 7px", cursor: "pointer", fontFamily: T.mono, borderRadius: 3 }}>→ Terminal</button>
      </div>
    </div>
  );
}

function renderMsg(content, onSend) {
  if (!content) return null;
  return content.split(/(```[\s\S]*?```)/g).map((p, i) =>
    p.startsWith("```")
      ? <CodeBlock key={i} codeText={p.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")} onSendToTerminal={onSend} />
      : <span key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{p}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function TutorMode({ code, setCode, onClose, runPython, pyodideReady, terminalOutput, setTerminalOutput, terminalLoading, user }) {
  const [tutorInstructions] = useState(code);

  // Scaffold
  const [pasos, setPasos]             = useState(null);
  const [pasoIdx, setPasoIdx]         = useState(0);
  const [filled, setFilled]           = useState({});
  const [shakeId, setShakeId]         = useState(null);
  const [stepDone, setStepDone]       = useState(false);
  const [allDone, setAllDone]         = useState(false);
  const [loadingPasos, setLoadingPasos] = useState(true);
  const [loadError, setLoadError]     = useState(null);

  // TDAH flow
  const [userInput, setUserInput]     = useState("");
  const [attempts, setAttempts]       = useState(0);
  const [showHint, setShowHint]       = useState(false);
  const [hint, setHint]               = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [showChips, setShowChips]     = useState(false);
  const [chipsWrong, setChipsWrong]   = useState([]);
  const [chipsCorrect, setChipsCorrect] = useState(null);
  const [solvedAs, setSolvedAs]       = useState(0); // 0=solo,1=hint,2=chips

  // XP + streak
  const [totalXP, setTotalXP]         = useState(0);
  const [streak, setStreak]           = useState(0);
  const [xpPop, setXpPop]             = useState({ v: false, xp: 0 });

  // Timer
  const [timer, setTimer]             = useState(TIMER_SEC);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef                      = useRef(null);

  // Profesor
  const [profe, setProfe]             = useState({ text: "", mood: "neutral" });

  // Chat
  const [chatMode, setChatMode]       = useState(false);
  const [tutorHistory, setTutorHistory] = useState([]);
  const [tutorInput, setTutorInput]   = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);

  // Terminal
  const [termCopied, setTermCopied]   = useState(false);
  const tutorBottomRef = useRef(null);
  const tutorInputRef  = useRef(null);
  const lineNumbersRef = useRef(null);
  const inputRef       = useRef(null);

  // ── Timer ────────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimer(TIMER_SEC);
    setTimerActive(true);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); setTimerActive(false); handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []); // eslint-disable-line

  function stopTimer() { clearInterval(timerRef.current); setTimerActive(false); }
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Close ────────────────────────────────────────────────────────────────────
  async function handleClose() {
    stopTimer();
    if (user?.id && tutorHistory.length >= 2) {
      const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const last  = tutorHistory.filter(m => m.role === "assistant").pop()?.content ?? "";
      try { await supabase.from("conversations").insert({ user_id: user.id, fecha, codigo: tutorInstructions.substring(0, 80), resumen: `[Tutor] ${last.substring(0, 120)}`, response: JSON.stringify(tutorHistory) }); } catch {}
    }
    onClose();
  }

  useEffect(() => { if (tutorBottomRef.current) tutorBottomRef.current.scrollIntoView({ behavior: "smooth" }); }, [tutorHistory]);

  // ── Generate pasos ────────────────────────────────────────────────────────────
  useEffect(() => { setCode(""); generatePasos(); }, []); // eslint-disable-line

  async function generatePasos() {
    setLoadingPasos(true); setLoadError(null);
    const sys = `Eres un generador de pasos de andamiaje para aprender programación en español.
El estudiante tiene este problema/código: """${tutorInstructions}"""
Genera entre 3 y 6 pasos. Cada paso tiene exactamente UN blanco.
Responde SOLO con JSON válido, sin markdown:
{"titulo_general":"título","pasos":[{"titulo":"¿Pregunta?","explicacion":"1-2 oraciones.","diagrama":[{"label":"fn","codigo":"def f","active":false},{"label":"retorna","codigo":"return","active":true}],"codigo_lineas":["def f(x):","    return x+1"],"blancos":[{"lineIdx":1,"charIdx":11,"length":3,"blankId":"b0","correcta":"x+1"}],"opciones":["x+1","x","return","None"]}]}
IMPORTANTE: codigo_lineas debe contener el código COMPLETO y REAL sin placeholders. NO uses ___ en codigo_lineas. El blanco se genera visualmente usando charIdx y length.
EJEMPLO CRÍTICO: para la línea "except FileNotFoundError:" el blanco es "FileNotFoundError:" (CON los dos puntos), charIdx=7, length=19. La correcta SIEMPRE debe ser exactamente el substring de la línea: line.substring(charIdx, charIdx+length).
REGLAS CRÍTICAS: exactamente 4 opciones, 1 blanco por paso. El blanco debe ser siempre un TOKEN COMPLETO: un operador completo (+=, /, *, ==, etc.), una variable completa (num_tests, student_total, etc.), o un método completo con sus paréntesis (split(','), append(x), etc.). NUNCA pongas el blanco dentro de paréntesis — si el blanco es un argumento, incluye el método completo con paréntesis. NUNCA cortes una palabra a la mitad. Si el token termina con : (como 'FileNotFoundError:' o 'else:'), inclúyelo. charIdx = posición exacta donde empieza el token en la línea. length = longitud exacta del token completo incluyendo puntuación final si es parte de la sintaxis.`;
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: sys, messages: [{ role: "user", content: "Genera los pasos." }] }) });
      const data = await res.json();
      const match = (data.content?.[0]?.text ?? "").match(/\{[\s\S]*\}/);
      if (!match) throw new Error("no json");
      const parsed = JSON.parse(match[0]);
      if (!parsed.pasos?.length) throw new Error("no pasos");
      // Force correcta to always match exactly what's in the line
      for (const paso of parsed.pasos) {
        for (const b of paso.blancos) {
          const line = paso.codigo_lineas[b.lineIdx] || "";
          // Fix token: close open parens/brackets and include trailing :
          let endIdx = b.charIdx + b.length;
          const token = line.substring(b.charIdx, endIdx);
          let openParens = (token.match(/\(/g)||[]).length - (token.match(/\)/g)||[]).length;
          let openBrackets = (token.match(/\[/g)||[]).length - (token.match(/\]/g)||[]).length;
          while (openParens > 0 && endIdx < line.length) { if (line[endIdx] === ')') openParens--; endIdx++; }
          while (openBrackets > 0 && endIdx < line.length) { if (line[endIdx] === ']') openBrackets--; endIdx++; }
          if (endIdx < line.length && line[endIdx] === ':') endIdx++;
          b.length = endIdx - b.charIdx;
          b.correcta = line.substring(b.charIdx, endIdx);
          console.log('[blank]', b.blankId, 'correcta:', JSON.stringify(b.correcta));
        }
      }
      setPasos(parsed);
      resetStep();
    } catch { setLoadError("No pude generar los pasos."); setChatMode(true); initChat(); }
    finally { setLoadingPasos(false); }
  }

  function resetStep() {
    setFilled({}); setShakeId(null); setStepDone(false);
    setUserInput(""); setAttempts(0); setShowHint(false); setHint("");
    setShowChips(false); setChipsWrong([]); setChipsCorrect(null); setSolvedAs(0);
    setProfe({ text: "", mood: "neutral" });
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 120);
  }

  // ── Timeout ───────────────────────────────────────────────────────────────────
  async function handleTimeout() {
    if (stepDone) return;
    const msg = getRandom(REACTIONS.timeout);
    if (!showHint) {
      setShowHint(true); setSolvedAs(s => Math.max(s, 1));
      setProfe({ text: msg + " cargando pista...", mood: "hint" });
      const h = await fetchHint();
      setHint(h); setProfe({ text: msg + " " + h, mood: "hint" });
      startTimer();
    } else {
      setShowChips(true); setSolvedAs(2);
      setProfe({ text: msg, mood: "hint" });
      startTimer();
    }
  }

  // ── Fetch hint ────────────────────────────────────────────────────────────────
  async function fetchHint() {
    if (!currentPaso) return "";
    setHintLoading(true);
    try {
      const b = currentPaso.blancos[0];
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 80, system: "Eres El Profesor. Da UNA pista de máximo 12 palabras en español. No des la respuesta directamente. Solo la pista.", messages: [{ role: "user", content: `Línea: "${currentPaso.codigo_lineas[b.lineIdx]}". Respuesta correcta: "${b.correcta}". Pista sin revelarla.` }] }) });
      return (await res.json()).content?.[0]?.text?.trim() ?? "Piensa qué valor necesitas aquí.";
    } catch { return "Piensa qué valor necesitas aquí."; }
    finally { setHintLoading(false); }
  }

  // ── Submit typed answer ────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!currentPaso || stepDone || !userInput.trim()) return;
    stopTimer();
    const b       = currentPaso.blancos[0];
    const correct = b.correcta.trim().toLowerCase();
    const typed   = userInput.trim().toLowerCase();

    if (typed === correct) {
      setFilled({ [b.blankId]: b.correcta });
      const xp       = solvedAs === 0 ? XP_SOLO : solvedAs === 1 ? XP_HINT : XP_CHIPS;
      const newStreak = streak + 1;
      setStreak(newStreak); setTotalXP(p => p + xp); showXP(xp);
      const rk = solvedAs === 0 ? "correct_solo" : solvedAs === 1 ? "correct_hint" : "correct_chips";
      let msg = getRandom(REACTIONS[rk]);
      if (newStreak === 3) msg = getRandom(REACTIONS.streak_3);
      if (newStreak === 5) msg = getRandom(REACTIONS.streak_5);
      setProfe({ text: msg, mood: "correct" });
      setTimeout(() => setStepDone(true), 400);
    } else {
      setShakeId(b.blankId); setTimeout(() => setShakeId(null), 500);
      setUserInput("");
      const na = attempts + 1; setAttempts(na); setStreak(0);
      setProfe({ text: getRandom(REACTIONS.wrong), mood: "wrong" });
      if (na === 1 && !showHint) {
        setSolvedAs(1); setShowHint(true);
        const h = await fetchHint(); setHint(h);
        setProfe({ text: `${getRandom(REACTIONS.wrong)} Pista: ${h}`, mood: "hint" });
        startTimer();
      } else if (na >= 2 && !showChips) {
        setSolvedAs(2); setShowChips(true);
        setProfe({ text: "Dos intentos. Aquí van las opciones.", mood: "hint" });
        startTimer();
      } else { startTimer(); }
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ── Chip select ───────────────────────────────────────────────────────────────
  function handleChip(opt) {
    if (!currentPaso || stepDone) return;
    const b = currentPaso.blancos[0];
    if (opt === b.correcta) {
      stopTimer(); setChipsCorrect(opt); setFilled({ [b.blankId]: opt });
      setTotalXP(p => p + XP_CHIPS); showXP(XP_CHIPS); setStreak(0);
      setProfe({ text: getRandom(REACTIONS.correct_chips), mood: "correct" });
      setTimeout(() => setStepDone(true), 400);
    } else {
      setChipsWrong(p => [...p, opt]);
      setProfe({ text: getRandom(REACTIONS.wrong), mood: "wrong" });
    }
  }

  function showXP(xp) { setXpPop({ v: true, xp }); setTimeout(() => setXpPop({ v: false, xp }), 1200); }

  // ── Next step ─────────────────────────────────────────────────────────────────
  function handleNext() {
    const ni = pasoIdx + 1;
    if (ni >= pasos.pasos.length) { setAllDone(true); setChatMode(true); initChatFromSuccess(); }
    else { setPasoIdx(ni); resetStep(); }
  }

  const currentPaso = pasos?.pasos?.[pasoIdx];

  // ── Chat ──────────────────────────────────────────────────────────────────────
  async function initChat() {
    const sys = `Eres El Profesor — tutor socrático en español. Estudiante resolviendo: """${tutorInstructions}""" Guía con preguntas, sin dar la solución. Máximo 3 líneas.`;
    const fm = { role: "user", content: tutorInstructions };
    setTutorHistory([fm, { role: "assistant", content: "" }]);
    await stream(sys, [fm]);
  }

  async function initChatFromSuccess() {
    const sys = `Eres El Profesor. Estudiante completó andamiaje de: """${tutorInstructions}""" Felicítalo con energía, explica brevemente por qué funciona. 3 líneas.`;
    const fm = { role: "user", content: "¡Terminé todos los pasos!" };
    setTutorHistory([fm, { role: "assistant", content: "" }]);
    await stream(sys, [fm]);
  }

  async function sendChat(explicit) {
    const content = typeof explicit === "string" ? explicit : tutorInput;
    if (!content.trim() || tutorLoading) return;
    const sys = `Eres El Profesor — tutor socrático en español. Estudiante resolviendo: """${tutorInstructions}""" Máximo 3 líneas.`;
    const um = { role: "user", content };
    const nh = [...tutorHistory, um];
    setTutorHistory([...nh, { role: "assistant", content: "" }]);
    if (typeof explicit !== "string") setTutorInput("");
    await stream(sys, nh);
  }

  async function stream(sys, messages) {
    setTutorLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 300, stream: true, system: sys, messages }) });
      const reader = res.body.getReader(); const dec = new TextDecoder(); let full = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n").filter(l => l.startsWith("data: "))) {
          const j = line.replace("data: ", "").trim(); if (j === "[DONE]") break;
          try { const d = JSON.parse(j).delta?.text; if (d) { full += d; setTutorHistory(p => { const u = [...p]; u[u.length - 1] = { role: "assistant", content: full }; return u; }); } } catch {}
        }
      }
    } catch { setTutorHistory(p => { const u = [...p]; u[u.length - 1] = { role: "assistant", content: "Se cayó la conexión." }; return u; }); }
    setTutorLoading(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: C.cream, zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:.5}50%{opacity:1} }
        @keyframes shake  { 0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}60%{transform:translateX(6px)} }
        @keyframes slideUp{ from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes popIn  { 0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 0 0 rgba(200,151,31,0)}50%{box-shadow:0 0 0 6px rgba(200,151,31,0.25)} }
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.burgundy, padding: `${S.sm}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: S.md }}>
          <span style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold }}>El Profesor</span>
          <span style={{ ...label(), color: "rgba(200,151,31,0.4)", fontSize: 8 }}>modo tutor</span>
          {pasos && !chatMode && <span style={{ ...label(), color: "rgba(200,151,31,0.4)", fontSize: 8 }}>paso {pasoIdx + 1}/{pasos.pasos.length}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: S.md }}>
          {streak >= 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(200,151,31,0.15)", border: `1px solid rgba(200,151,31,0.3)`, borderRadius: 12, padding: "2px 10px" }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ color: C.gold, fontFamily: T.mono, fontSize: T.xs, fontWeight: T.bold }}>{streak}</span>
            </div>
          )}
          <div style={{ position: "relative" }}>
            <div style={{ background: "rgba(200,151,31,0.1)", border: `1px solid rgba(200,151,31,0.25)`, borderRadius: 12, padding: "2px 12px" }}>
              <span style={{ color: C.gold, fontFamily: T.mono, fontSize: T.xs, fontWeight: T.bold }}>{totalXP} XP</span>
            </div>
            <XPPop xp={xpPop.xp} visible={xpPop.v} />
          </div>
          {pasos && !chatMode && timerActive && <TimerRing seconds={timer} total={TIMER_SEC} />}
          {pasos && !chatMode && <button onClick={() => { setChatMode(true); initChat(); }} style={{ background: "none", border: `1px solid rgba(200,151,31,0.3)`, color: "rgba(200,151,31,0.6)", fontSize: T.xs, padding: `2px ${S.md}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}>💬 Hablar</button>}
          {chatMode && pasos && !allDone && <button onClick={() => { setChatMode(false); resetStep(); }} style={{ background: "none", border: `1px solid rgba(200,151,31,0.3)`, color: "rgba(200,151,31,0.6)", fontSize: T.xs, padding: `2px ${S.md}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}>← Pasos</button>}
          <button onClick={handleClose} style={{ background: "none", border: `1px solid rgba(200,151,31,0.4)`, color: C.gold, fontSize: T.xs, padding: `2px ${S.md}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}>✕ Salir</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ── SCAFFOLD ── */}
          {!chatMode && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {/* Progress */}
              {pasos && (
                <div style={{ display: "flex", gap: 3, padding: `${S.xs}px ${S.xl}px`, borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                  {pasos.pasos.map((_, i) => (
                    <div key={i} style={{ height: 5, flex: 1, borderRadius: 3, background: i < pasoIdx ? C.olive : i === pasoIdx ? C.gold : C.border, transition: "background 0.3s ease", animation: i === pasoIdx ? "glow 2s ease infinite" : "none" }} />
                  ))}
                </div>
              )}

              {loadingPasos ? <LoadingStep /> : loadError ? (
                <div style={{ padding: S.xl, textAlign: "center", color: C.textMid, fontFamily: T.sans }}>{loadError}</div>
              ) : currentPaso ? (
                <div style={{ padding: `${S.lg}px ${S.xl}px`, animation: "slideUp 0.3s ease" }}>

                  {/* Title */}
                  <div style={{ marginBottom: S.md }}>
                    <div style={{ ...label(), color: C.gold, marginBottom: S.xs }}>
                      Paso {pasoIdx + 1} — <span style={{ color: C.burgundy, fontWeight: T.bold, fontSize: T.sm, textTransform: "none", letterSpacing: 0 }}>{currentPaso.titulo}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: T.sm, color: C.textMid, fontFamily: T.sans, lineHeight: 1.7 }}>{currentPaso.explicacion}</p>
                  </div>

                  <FlowDiagram nodes={currentPaso.diagrama} />
                  <CodeWithBlanks codeLines={currentPaso.codigo_lineas} blanks={currentPaso.blancos} filled={filled} shakeId={shakeId} />

                  {/* INPUT ZONE */}
                  {!stepDone && (
                    <div style={{ marginTop: S.lg }}>
                      <div style={{ fontSize: T.xs, color: C.textLight, fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase", marginBottom: S.xs }}>
                        ✏️ Escribe tu respuesta:
                        {attempts > 0 && <span style={{ color: attempts >= 2 ? "#F44747" : C.gold, marginLeft: 8 }}>intento {attempts + 1}</span>}
                      </div>
                      <div style={{ display: "flex", gap: S.sm }}>
                        <input
                          ref={inputRef}
                          value={userInput}
                          onChange={e => setUserInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                          placeholder="¿Qué va en el blanco?"
                          disabled={hintLoading}
                          style={{ flex: 1, padding: `${S.sm}px ${S.md}px`, border: `2px solid ${attempts >= 2 ? "rgba(244,71,71,0.4)" : C.burgundy}`, borderRadius: 8, background: C.white, color: C.text, fontSize: T.md, fontFamily: T.mono, outline: "none", animation: attempts === 0 && !showChips ? "glow 2s ease infinite" : "none" }}
                        />
                        <button onClick={handleSubmit} disabled={!userInput.trim() || hintLoading} style={{ padding: `${S.sm}px ${S.lg}px`, background: !userInput.trim() || hintLoading ? C.creamDark : C.burgundy, border: "none", color: !userInput.trim() || hintLoading ? C.textLight : C.gold, borderRadius: 8, cursor: !userInput.trim() || hintLoading ? "not-allowed" : "pointer", fontFamily: T.sans, fontWeight: T.bold, fontSize: T.sm }}>
                          {hintLoading ? "..." : "Enviar →"}
                        </button>
                      </div>
                      {showChips && <OptionChips options={currentPaso.opciones} onSelect={handleChip} usedWrong={chipsWrong} correct={chipsCorrect} />}
                    </div>
                  )}

                  <ProfesorBubble text={profe.text} mood={profe.mood} />

                  {stepDone && (
                    <div style={{ marginTop: S.lg, animation: "popIn 0.3s ease" }}>
                      <div style={{ background: `${C.olive}18`, border: `1px solid ${C.olive}`, borderRadius: 8, padding: `${S.sm}px ${S.lg}px`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ color: C.olive, fontFamily: T.sans, fontSize: T.sm, fontWeight: T.bold }}>✓ {pasoIdx + 1 < pasos.pasos.length ? "Paso completado" : "¡Problema completo!"}</div>
                          <div style={{ fontSize: T.xs, color: C.textLight, fontFamily: T.mono, marginTop: 2 }}>{solvedAs === 0 ? "✦ Solo — +10 XP" : solvedAs === 1 ? "✦ Con pista — +7 XP" : "✦ Con opciones — +5 XP"}</div>
                        </div>
                        <button onClick={handleNext} style={{ background: C.olive, border: "none", color: "#fff", padding: `${S.xs}px ${S.xl}px`, borderRadius: 20, cursor: "pointer", fontSize: T.sm, fontFamily: T.sans, fontWeight: T.bold }}>
                          {pasoIdx + 1 < pasos.pasos.length ? "Siguiente →" : "Ver solución ✓"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* ── CHAT ── */}
          {chatMode && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {allDone && (
                <div style={{ background: `${C.olive}18`, borderBottom: `1px solid ${C.olive}`, padding: `${S.sm}px ${S.xl}px`, display: "flex", gap: S.sm, alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>🎉</span>
                  <span style={{ fontSize: T.sm, color: C.olive, fontFamily: T.sans, fontWeight: T.bold }}>¡Terminaste! {totalXP} XP ganados</span>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: `${S.xl}px ${S.xxl}px` }}>
                {tutorHistory.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: S.lg }}>
                    {msg.role === "assistant" && <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burgundy, display: "flex", alignItems: "center", justifyContent: "center", marginRight: S.md, flexShrink: 0, alignSelf: "flex-end", fontSize: 16 }}>👨‍🏫</div>}
                    <div style={{ maxWidth: "65%", padding: `${S.md}px ${S.lg}px`, background: msg.role === "user" ? C.burgundy : C.white, color: msg.role === "user" ? C.cream : C.text, border: `1px solid ${msg.role === "user" ? C.burgundy : C.border}`, borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: T.md, fontFamily: T.sans, fontWeight: T.light, lineHeight: 1.7, wordBreak: "break-word" }}>
                      {msg.role === "assistant" ? (msg.content ? renderMsg(msg.content, setCode) : tutorLoading && i === tutorHistory.length - 1 ? <span style={{ color: C.textLight }}>...</span> : null) : renderMsg(msg.content, setCode)}
                    </div>
                  </div>
                ))}
                <div ref={tutorBottomRef} />
              </div>
              <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: `${S.md}px ${S.xxl}px`, background: C.white, display: "flex", gap: S.sm, alignItems: "flex-end" }}>
                <textarea ref={tutorInputRef} value={tutorInput} onChange={e => { setTutorInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="Escribe tu respuesta..." disabled={tutorLoading} style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: `${S.sm}px ${S.md}px`, border: `1px solid ${C.border}`, background: C.cream, color: C.text, fontSize: T.md, fontFamily: T.sans, fontWeight: T.light, resize: "none", outline: "none", borderRadius: 22, lineHeight: 1.6, overflow: "hidden", boxSizing: "border-box" }} />
                <button onClick={() => sendChat()} disabled={tutorLoading || !tutorInput.trim()} style={{ width: 44, height: 44, borderRadius: "50%", background: tutorLoading || !tutorInput.trim() ? C.border : C.burgundy, border: "none", color: C.gold, cursor: tutorLoading || !tutorInput.trim() ? "not-allowed" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
              </div>
            </div>
          )}
        </div>

        {/* TERMINAL */}
        <div style={{ width: 340, background: "#1E1E1E", borderLeft: `2px solid ${C.gold}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: `${S.sm}px ${S.md}px`, borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ color: C.gold, fontSize: T.xs, fontFamily: T.mono }}>{pyodideReady ? "🐍 Python listo" : "🐍 cargando..."}</span>
            {terminalOutput.length > 0 && <button onClick={() => setTerminalOutput([])} style={{ background: "none", border: "none", color: "#666", fontSize: T.xs, cursor: "pointer", fontFamily: T.mono }}>limpiar</button>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: S.md, fontFamily: T.mono, fontSize: T.sm, minHeight: 0 }}>
            {terminalOutput.length === 0 ? <div style={{ color: "#555", fontSize: T.xs }}>Output aquí.</div> : terminalOutput.map((line, i) => (
              <div key={i} style={{ marginBottom: S.xs }}>
                {line.type === "output" && <div style={{ color: "#D4D4D4", whiteSpace: "pre-wrap" }}>{line.text}</div>}
                {line.type === "error"  && <div style={{ color: "#F44747", whiteSpace: "pre-wrap" }}>{line.text}</div>}
                {line.type === "silent" && <div style={{ color: "#555", fontStyle: "italic" }}>{line.text}</div>}
              </div>
            ))}
          </div>
          <div style={{ padding: S.sm, borderTop: "1px solid #333", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
              <button onClick={() => navigator.clipboard.writeText(code).then(() => { setTermCopied(true); setTimeout(() => setTermCopied(false), 2000); })} disabled={!code.trim()} style={{ background: "none", border: "1px solid #444", color: termCopied ? "#4EC994" : "#888", fontSize: 10, padding: "2px 8px", cursor: code.trim() ? "pointer" : "default", fontFamily: T.mono }}>{termCopied ? "Copiado ✓" : "Copiar"}</button>
            </div>
            <div style={{ display: "flex", border: "1px solid #444", minHeight: 140 }}>
              <div ref={lineNumbersRef} style={{ width: 32, flexShrink: 0, background: "#1a1a1a", color: "#555", fontFamily: T.mono, fontSize: T.sm, lineHeight: 1.6, padding: `${S.sm}px 4px`, textAlign: "right", userSelect: "none", overflowY: "hidden" }}>
                {(code || " ").split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea value={code} onChange={e => setCode(e.target.value)} onScroll={e => { if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.target.scrollTop; }} onKeyDown={e => { if (e.key === "Tab") { e.preventDefault(); const s = e.target.selectionStart; setCode(c => c.substring(0, s) + "    " + c.substring(e.target.selectionEnd)); setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0); } else if (e.key === "Enter") { e.preventDefault(); const s = e.target.selectionStart; const ind = code.substring(0, s).split("\n").pop().match(/^(\s*)/)[1]; setCode(c => c.substring(0, s) + "\n" + ind + c.substring(e.target.selectionEnd)); setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 1 + ind.length; }, 0); } }} placeholder="# Escribe o pega código aquí" style={{ flex: 1, minHeight: 140, padding: S.sm, background: "#2D2D2D", border: "none", color: "#D4D4D4", fontSize: T.sm, fontFamily: T.mono, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, overflowY: "auto" }} />
            </div>
            <button onClick={() => sendChat(`\`\`\`python\n${code}\n\`\`\``)} disabled={tutorLoading || !code.trim()} style={{ ...btnPrimary(tutorLoading || !code.trim()), width: "100%", padding: `${S.sm}px`, marginTop: S.xs, fontSize: T.xs, letterSpacing: T.wide, background: tutorLoading || !code.trim() ? "#333" : C.burgundy, border: "none" }}>Enviar al Profesor</button>
            <button onClick={runPython} disabled={!pyodideReady || terminalLoading || !code.trim()} style={{ ...btnPrimary(!pyodideReady || terminalLoading || !code.trim()), width: "100%", padding: `${S.sm}px`, marginTop: S.xs, fontSize: T.xs, letterSpacing: T.wide, background: !pyodideReady || terminalLoading || !code.trim() ? "#333" : C.olive, border: "none" }}>
              {!pyodideReady ? "cargando pyodide..." : terminalLoading ? "corriendo..." : "▶ Correr"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
