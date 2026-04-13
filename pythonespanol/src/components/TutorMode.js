import { useState, useRef, useEffect } from "react";
import { C, T, S, label, btnPrimary } from "../constants";
import { supabase } from "../lib/supabase";

// ── Flow diagram ──────────────────────────────────────────────────────────────
function FlowDiagram({ nodes }) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: S.md }}>
      {nodes.map((n, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            background: n.active ? C.burgundy : C.creamDark,
            border: `1px solid ${n.active ? C.gold : C.border}`,
            borderRadius: 6,
            padding: "4px 10px",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <span style={{ fontSize: 9, color: n.active ? "rgba(200,151,31,0.7)" : C.textLight, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: 1 }}>{n.label}</span>
            <span style={{ fontSize: T.sm, fontFamily: T.mono, color: n.active ? C.gold : C.text, fontWeight: n.active ? T.bold : T.normal }}>{n.codigo}</span>
          </div>
          {i < nodes.length - 1 && (
            <span style={{ color: C.textLight, fontSize: 14 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Code with blanks renderer ─────────────────────────────────────────────────
function CodeWithBlanks({ codeLines, blanks, filled, wrongIdx, onBlankClick }) {
  // blanks: [{lineIdx, charIdx, length, blankId}]
  // filled: {blankId: string}
  return (
    <div style={{
      background: "#1E1E1E", borderRadius: 6, padding: S.md,
      fontFamily: T.mono, fontSize: T.sm, lineHeight: 1.85,
    }}>
      {codeLines.map((line, li) => {
        const lineBlank = blanks.find(b => b.lineIdx === li);
        if (!lineBlank) {
          return (
            <div key={li} style={{ display: "flex" }}>
              <span style={{ color: "#4A4A4A", minWidth: 24, paddingRight: 10, textAlign: "right", userSelect: "none", fontSize: T.xs }}>{li + 1}</span>
              <span style={{ color: "#D4D4D4", whiteSpace: "pre" }}>{line}</span>
            </div>
          );
        }
        const before = line.substring(0, lineBlank.charIdx);
        const after = line.substring(lineBlank.charIdx + lineBlank.length);
        const val = filled[lineBlank.blankId];
        const isWrong = wrongIdx === lineBlank.blankId;
        return (
          <div key={li} style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#4A4A4A", minWidth: 24, paddingRight: 10, textAlign: "right", userSelect: "none", fontSize: T.xs }}>{li + 1}</span>
            <span style={{ color: "#D4D4D4", whiteSpace: "pre" }}>{before}</span>
            <span
              onClick={() => !val && onBlankClick && onBlankClick(lineBlank.blankId)}
              style={{
                display: "inline-block",
                minWidth: Math.max(60, (lineBlank.length * 8) + 16),
                height: 22,
                borderRadius: 4,
                border: `2px dashed ${isWrong ? "#F44747" : val ? C.gold : "#555"}`,
                background: isWrong ? "rgba(244,71,71,0.12)" : val ? `${C.gold}22` : "rgba(255,255,255,0.04)",
                color: isWrong ? "#F44747" : val ? C.gold : "transparent",
                fontFamily: T.mono, fontSize: T.sm,
                padding: "0 8px",
                cursor: val ? "default" : "pointer",
                transition: "all 0.2s",
                verticalAlign: "middle",
                lineHeight: "20px",
                animation: isWrong ? "shake 0.4s ease" : "none",
              }}
            >
              {val || ""}
            </span>
            <span style={{ color: "#D4D4D4", whiteSpace: "pre" }}>{after}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Option chips ──────────────────────────────────────────────────────────────
function OptionChips({ options, onSelect, usedOptions, correctOptions }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: S.sm, marginTop: S.md }}>
      {options.map((opt, i) => {
        const used = usedOptions.includes(opt);
        const correct = correctOptions.includes(opt);
        return (
          <button
            key={i}
            onClick={() => !used && onSelect(opt)}
            disabled={used}
            style={{
              padding: "5px 14px",
              border: `1px solid ${used ? (correct ? C.border : C.border) : C.burgundy}`,
              borderRadius: 20,
              background: used ? (correct ? `${C.olive}22` : C.creamDark) : C.white,
              color: used ? (correct ? C.olive : C.textLight) : C.burgundy,
              fontSize: T.sm, fontFamily: T.mono,
              cursor: used ? "default" : "pointer",
              transition: "all 0.15s",
              textDecoration: used && !correct ? "line-through" : "none",
              opacity: used && !correct ? 0.5 : 1,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingStep() {
  return (
    <div style={{ padding: S.xl, display: "flex", flexDirection: "column", gap: S.lg }}>
      <div style={{ height: 14, width: "60%", background: C.border, borderRadius: 4, animation: "pulse 1.2s ease infinite" }} />
      <div style={{ height: 10, width: "85%", background: C.creamDark, borderRadius: 4, animation: "pulse 1.2s ease infinite 0.1s" }} />
      <div style={{ height: 80, background: "#1E1E1E", borderRadius: 6, animation: "pulse 1.2s ease infinite 0.2s" }} />
      <div style={{ display: "flex", gap: S.sm }}>
        {[60, 80, 55, 70].map((w, i) => (
          <div key={i} style={{ height: 28, width: w, borderRadius: 14, background: C.creamDark, animation: `pulse 1.2s ease infinite ${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── CodeBlock for messages ────────────────────────────────────────────────────
function CodeBlock({ codeText, onSendToTerminal }) {
  const [blockCopied, setBlockCopied] = useState(false);
  return (
    <div style={{ position: "relative", margin: "6px 0" }}>
      <pre style={{
        background: "#1E1E1E", color: "#D4D4D4",
        padding: "12px", paddingRight: 100,
        borderRadius: 4, fontSize: T.sm, fontFamily: T.mono,
        overflowX: "auto", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
      }}>
        {codeText}
      </pre>
      <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
        <button
          onClick={() => navigator.clipboard.writeText(codeText).then(() => { setBlockCopied(true); setTimeout(() => setBlockCopied(false), 2000); })}
          style={{ background: blockCopied ? "#2d5a1b" : "#333", border: "none", color: blockCopied ? "#4EC994" : "#888", fontSize: 10, padding: "3px 7px", cursor: "pointer", fontFamily: T.mono, borderRadius: 3 }}
        >
          {blockCopied ? "✓" : "Copiar"}
        </button>
        <button
          onClick={() => onSendToTerminal(codeText.trim())}
          style={{ background: C.olive, border: "none", color: "#fff", fontSize: 10, padding: "3px 7px", cursor: "pointer", fontFamily: T.mono, borderRadius: 3 }}
        >
          → Terminal
        </button>
      </div>
    </div>
  );
}

function renderMessage(content, onSendToTerminal) {
  if (!content) return null;
  return content.split(/(```[\s\S]*?```)/g).map((part, i) => {
    if (part.startsWith("```")) {
      const codeText = part.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
      return <CodeBlock key={i} codeText={codeText} onSendToTerminal={onSendToTerminal} />;
    }
    return <span key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{part}</span>;
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TutorMode({ code, setCode, onClose, runPython, pyodideReady, terminalOutput, setTerminalOutput, terminalLoading, user }) {
  const [tutorInstructions] = useState(code);

  // Scaffold state
  const [pasos, setPasos] = useState(null);          // array of step objects from API
  const [pasoIdx, setPasoIdx] = useState(0);
  const [filled, setFilled] = useState({});           // {blankId: value}
  const [wrongIdx, setWrongIdx] = useState(null);
  const [usedOptions, setUsedOptions] = useState([]);
  const [correctOptions, setCorrectOptions] = useState([]);
  const [stepDone, setStepDone] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [loadingPasos, setLoadingPasos] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Free-chat fallback (shown when allDone or user clicks "Hablar con el Profesor")
  const [chatMode, setChatMode] = useState(false);
  const [tutorHistory, setTutorHistory] = useState([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);

  // Terminal
  const [copied, setCopied] = useState(false);
  const tutorBottomRef = useRef(null);
  const tutorInputRef  = useRef(null);
  const lineNumbersRef = useRef(null);

  // ── Save & close ────────────────────────────────────────────────────────────
  async function handleClose() {
    if (user?.id && tutorHistory.length >= 2) {
      const fecha   = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const codSnip = tutorInstructions.substring(0, 80) + (tutorInstructions.length > 80 ? "..." : "");
      const last    = tutorHistory.filter(m => m.role === "assistant").pop()?.content ?? "";
      try {
        await supabase.from("conversations").insert({
          user_id: user.id, fecha,
          codigo:  codSnip,
          resumen: `[Tutor] ${last.substring(0, 120)}`,
          response: JSON.stringify(tutorHistory),
        });
      } catch {}
    }
    onClose();
  }

  useEffect(() => {
    if (tutorBottomRef.current) tutorBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [tutorHistory]);

  // ── Generate scaffold steps via API ────────────────────────────────────────
  useEffect(() => {
    setCode("");
    generatePasos();
  }, []); // eslint-disable-line

  async function generatePasos() {
    setLoadingPasos(true);
    setLoadError(null);
    const sys = `Eres un generador de pasos de andamiaje para aprender programación en español.
El estudiante tiene este problema/código: """${tutorInstructions}"""

Genera entre 3 y 6 pasos de andamiaje visual para que el estudiante lo resuelva completando blancos en el código.
Cada paso tiene UN solo blanco que el estudiante debe rellenar eligiendo entre 4 opciones.

Responde SOLO con JSON válido, sin markdown ni texto extra:
{
  "titulo_general": "título corto del problema",
  "pasos": [
    {
      "titulo": "¿Pregunta concreta sobre este paso?",
      "explicacion": "1-2 oraciones de contexto. Por qué este concepto importa aquí.",
      "diagrama": [
        {"label": "función", "codigo": "def nombre", "active": false},
        {"label": "guarda", "codigo": "variable", "active": true},
        {"label": "recorre", "codigo": "for loop", "active": false}
      ],
      "codigo_lineas": [
        "def list_max(lst):",
        "    if len(lst) == 0:",
        "        return False, []",
        "    ___ = lst[0]",
        "    ___ = [0]"
      ],
      "blancos": [
        {"lineIdx": 3, "charIdx": 4, "length": 8, "blankId": "b0", "correcta": "list_max"},
        {"lineIdx": 4, "charIdx": 4, "length": 9, "blankId": "b1", "correcta": "positions"}
      ],
      "opciones": ["list_max", "return", "positions", "len(lst)"]
    }
  ]
}

REGLAS:
- codigo_lineas: el código con "___" en los blancos (usa guiones bajos para indicar el blanco)
- blancos: cada blanco tiene lineIdx (0-based), charIdx (donde empieza el ___), length (largo del ___), blankId único, y correcta
- opciones: exactamente 4, incluyendo la correcta y 3 distractores plausibles
- diagrama: 3-4 nodos, el nodo "active" es el concepto de este paso
- Si hay múltiples blancos en un paso, todos deben llenarse para avanzar
- Asegúrate que charIdx coincida exactamente con la posición de ___ en la línea`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: sys,
          messages: [{ role: "user", content: "Genera los pasos de andamiaje." }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      const parsed = JSON.parse(match[0]);
      if (!parsed.pasos?.length) throw new Error("No pasos");
      setPasos(parsed);
      setPasoIdx(0);
      setFilled({});
      setUsedOptions([]);
      setCorrectOptions([]);
      setStepDone(false);
    } catch (err) {
      setLoadError("No pude generar los pasos. ¿Puedo guiarte con preguntas en cambio?");
      setChatMode(true);
      initChat();
    } finally {
      setLoadingPasos(false);
    }
  }

  // ── Scaffold interactions ───────────────────────────────────────────────────
  const currentPaso = pasos?.pasos?.[pasoIdx];

  function handleOptionSelect(opt) {
    if (!currentPaso || stepDone) return;

    // Find the first unfilled blank
    const nextBlank = currentPaso.blancos.find(b => !filled[b.blankId]);
    if (!nextBlank) return;

    const isCorrect = opt === nextBlank.correcta;

    if (isCorrect) {
      const newFilled = { ...filled, [nextBlank.blankId]: opt };
      setFilled(newFilled);
      setWrongIdx(null);
      setCorrectOptions(prev => [...prev, opt]);
      setUsedOptions(prev => [...prev, opt]);

      // Check if all blanks for this step are filled
      const allFilled = currentPaso.blancos.every(b => newFilled[b.blankId]);
      if (allFilled) {
        setTimeout(() => setStepDone(true), 300);
      }
    } else {
      setWrongIdx(nextBlank.blankId);
      setUsedOptions(prev => [...prev, opt]);
      setTimeout(() => {
        setWrongIdx(null);
        setUsedOptions(prev => prev.filter(o => o !== opt));
      }, 800);
    }
  }

  function handleNextStep() {
    const nextIdx = pasoIdx + 1;
    if (nextIdx >= pasos.pasos.length) {
      setAllDone(true);
      setChatMode(true);
      initChatFromSuccess();
    } else {
      setPasoIdx(nextIdx);
      setFilled({});
      setUsedOptions([]);
      setCorrectOptions([]);
      setStepDone(false);
      setWrongIdx(null);
    }
  }

  // ── Chat mode ───────────────────────────────────────────────────────────────
  async function initChat() {
    const sys = `Eres El Profesor — tutor socrático de programación en español.
El estudiante está resolviendo: """${tutorInstructions}"""
Guía con preguntas, no des la solución. Máximo 3 líneas. Una pregunta a la vez.
Empieza con una pregunta que evalúe qué entendió el estudiante del problema.`;
    setTutorLoading(true);
    const firstMsg = { role: "user", content: "Quiero resolver este problema. ¿Por dónde empezamos?" };
    setTutorHistory([firstMsg, { role: "assistant", content: "" }]);
    await streamAssistant(sys, [firstMsg], true);
  }

  async function initChatFromSuccess() {
    const sys = `Eres El Profesor — tutor de programación en español.
El estudiante acaba de completar todos los pasos del andamiaje para: """${tutorInstructions}"""
¡Felicítalo brevemente! Explica por qué la solución funciona en 2-3 líneas. Luego pregunta si tiene dudas.`;
    setTutorLoading(true);
    const firstMsg = { role: "user", content: "Terminé todos los pasos." };
    setTutorHistory([firstMsg, { role: "assistant", content: "" }]);
    await streamAssistant(sys, [firstMsg], true);
  }

  async function sendTutorMessage(explicitContent) {
    const content = typeof explicitContent === "string" ? explicitContent : tutorInput;
    if (!content.trim() || tutorLoading) return;
    const sys = `Eres El Profesor — tutor socrático de programación en español.
El estudiante está resolviendo: """${tutorInstructions}"""
Guía con preguntas, no des la solución. Máximo 3 líneas. Una pregunta a la vez.`;
    const userMsg = { role: "user", content };
    const newHistory = [...tutorHistory, userMsg];
    setTutorHistory([...newHistory, { role: "assistant", content: "" }]);
    if (typeof explicitContent !== "string") setTutorInput("");
    await streamAssistant(sys, newHistory, false);
  }

  async function streamAssistant(sys, messages, isFirst) {
    setTutorLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          stream: true,
          system: sys,
          messages,
        }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n").filter(l => l.startsWith("data: "))) {
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") break;
          try {
            const delta = JSON.parse(json).delta?.text;
            if (delta) {
              fullText += delta;
              setTutorHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setTutorHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Se cayó la conexión." };
        return updated;
      });
    }
    setTutorLoading(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: C.cream, zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        @keyframes shake { 0%,100% { transform:translateX(0); } 20% { transform:translateX(-6px); } 60% { transform:translateX(6px); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes popIn   { 0% { transform:scale(0.85); opacity:0; } 100% { transform:scale(1); opacity:1; } }
      `}</style>

      {/* HEADER */}
      <div style={{ background: C.burgundy, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: S.md }}>
          <span style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold }}>El Profesor</span>
          <span style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>modo tutor</span>
          {pasos && !chatMode && (
            <span style={{ ...label(), color: "rgba(200,151,31,0.4)", fontSize: 8 }}>
              paso {pasoIdx + 1} / {pasos.pasos.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: S.sm, alignItems: "center" }}>
          {pasos && !chatMode && (
            <button
              onClick={() => { setChatMode(true); initChat(); }}
              style={{ background: "none", border: `1px solid rgba(200,151,31,0.3)`, color: "rgba(200,151,31,0.6)", fontSize: T.xs, padding: `${S.xs}px ${S.md}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}
            >
              💬 Hablar
            </button>
          )}
          {chatMode && pasos && !allDone && (
            <button
              onClick={() => { setChatMode(false); setStepDone(false); }}
              style={{ background: "none", border: `1px solid rgba(200,151,31,0.3)`, color: "rgba(200,151,31,0.6)", fontSize: T.xs, padding: `${S.xs}px ${S.md}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}
            >
              ← Pasos
            </button>
          )}
          <button
            onClick={handleClose}
            style={{ background: "none", border: `1px solid rgba(200,151,31,0.4)`, color: C.gold, fontSize: T.xs, padding: `${S.xs}px ${S.md}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}
          >
            ✕ Salir
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — scaffold or chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* ── SCAFFOLD MODE ── */}
          {!chatMode && (
            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* Problem banner */}
              <div style={{ borderBottom: `1px solid ${C.border}`, padding: `${S.sm}px ${S.xl}px`, background: C.creamDark, display: "flex", alignItems: "flex-start", gap: S.sm }}>
                <span style={{ ...label(), color: C.gold, fontSize: T.xs, marginTop: 1, flexShrink: 0 }}>📌</span>
                <span style={{ fontSize: T.xs, fontFamily: T.mono, color: C.textMid, lineHeight: 1.6 }}>
                  {tutorInstructions.length > 180 ? tutorInstructions.substring(0, 180) + "…" : tutorInstructions}
                </span>
              </div>

              {/* Step progress pills */}
              {pasos && (
                <div style={{ display: "flex", gap: S.xs, padding: `${S.sm}px ${S.xl}px`, borderBottom: `1px solid ${C.border}` }}>
                  {pasos.pasos.map((_, i) => (
                    <div key={i} style={{
                      height: 4, flex: 1, borderRadius: 2,
                      background: i < pasoIdx ? C.olive : i === pasoIdx ? C.gold : C.border,
                      transition: "background 0.3s ease",
                    }} />
                  ))}
                </div>
              )}

              {loadingPasos ? (
                <LoadingStep />
              ) : loadError ? (
                <div style={{ padding: S.xl, textAlign: "center" }}>
                  <p style={{ color: C.textMid, fontFamily: T.sans, marginBottom: S.md }}>{loadError}</p>
                </div>
              ) : currentPaso ? (
                <div style={{ padding: `${S.xl}px ${S.xl}px`, animation: "slideUp 0.3s ease" }}>

                  {/* Step title */}
                  <div style={{ marginBottom: S.lg }}>
                    <div style={{ ...label(), color: C.gold, marginBottom: S.xs }}>
                      Paso {pasoIdx + 1} — <span style={{ color: C.burgundy, fontWeight: T.bold, fontSize: T.sm, textTransform: "none", letterSpacing: 0 }}>{currentPaso.titulo}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: T.sm, color: C.textMid, fontFamily: T.sans, lineHeight: 1.7 }}>
                      {currentPaso.explicacion}
                    </p>
                  </div>

                  {/* Flow diagram */}
                  <FlowDiagram nodes={currentPaso.diagrama} />

                  {/* Code with blanks */}
                  <CodeWithBlanks
                    codeLines={currentPaso.codigo_lineas}
                    blanks={currentPaso.blancos}
                    filled={filled}
                    wrongIdx={wrongIdx}
                    onBlankClick={() => {}}
                  />

                  {/* Option chips */}
                  {!stepDone ? (
                    <OptionChips
                      options={currentPaso.opciones}
                      onSelect={handleOptionSelect}
                      usedOptions={usedOptions}
                      correctOptions={correctOptions}
                    />
                  ) : (
                    <div style={{ marginTop: S.md, animation: "popIn 0.3s ease" }}>
                      <div style={{
                        background: `${C.olive}18`, border: `1px solid ${C.olive}`,
                        borderRadius: 8, padding: `${S.sm}px ${S.md}px`,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}>
                        <span style={{ color: C.olive, fontFamily: T.sans, fontSize: T.sm, fontWeight: T.bold }}>
                          ✓ {pasoIdx + 1 < pasos.pasos.length ? "¡Correcto! Siguiente paso →" : "¡Completaste todos los pasos!"}
                        </span>
                        <button
                          onClick={handleNextStep}
                          style={{ background: C.olive, border: "none", color: "#fff", padding: `${S.xs}px ${S.lg}px`, borderRadius: 20, cursor: "pointer", fontSize: T.sm, fontFamily: T.sans, fontWeight: T.bold }}
                        >
                          {pasoIdx + 1 < pasos.pasos.length ? "Continuar" : "Ver solución completa"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* ── CHAT MODE ── */}
          {chatMode && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {allDone && (
                <div style={{ background: `${C.olive}18`, borderBottom: `1px solid ${C.olive}`, padding: `${S.sm}px ${S.xl}px`, display: "flex", alignItems: "center", gap: S.sm }}>
                  <span style={{ fontSize: 16 }}>🎉</span>
                  <span style={{ fontSize: T.sm, color: C.olive, fontFamily: T.sans, fontWeight: T.bold }}>¡Completaste todos los pasos del andamiaje!</span>
                </div>
              )}

              <div style={{ flex: 1, overflowY: "auto", padding: `${S.xl}px ${S.xxl}px` }}>
                {/* Problem bubble */}
                <div style={{ marginBottom: S.xl }}>
                  <div style={{
                    background: C.creamDark, border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${C.gold}`, borderRadius: "4px 18px 18px 4px",
                    padding: `${S.md}px ${S.lg}px`, fontSize: T.sm, fontFamily: T.mono,
                    color: C.textMid, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    <span style={{ ...label(), color: C.gold, display: "block", marginBottom: S.xs, fontSize: T.xs }}>📌 Problema:</span>
                    {tutorInstructions}
                  </div>
                </div>

                {tutorHistory.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: S.lg }}>
                    {msg.role === "assistant" && (
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.burgundy, display: "flex", alignItems: "center", justifyContent: "center", marginRight: S.md, flexShrink: 0, alignSelf: "flex-end" }}>
                        <span style={{ color: C.gold, fontSize: 14 }}>P</span>
                      </div>
                    )}
                    <div style={{
                      maxWidth: "65%", padding: `${S.md}px ${S.lg}px`,
                      background: msg.role === "user" ? C.burgundy : C.white,
                      color: msg.role === "user" ? C.cream : C.text,
                      border: `1px solid ${msg.role === "user" ? C.burgundy : C.border}`,
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      fontSize: T.md, fontFamily: T.sans, fontWeight: T.light, lineHeight: 1.7, wordBreak: "break-word",
                      boxShadow: msg.role === "assistant" ? `1px 1px 0 ${C.border}` : "none",
                    }}>
                      {msg.role === "assistant"
                        ? (msg.content
                            ? renderMessage(msg.content, setCode)
                            : tutorLoading && i === tutorHistory.length - 1
                              ? <span style={{ color: C.textLight }}>...</span>
                              : null)
                        : renderMessage(msg.content, setCode)
                      }
                    </div>
                  </div>
                ))}
                <div ref={tutorBottomRef} />
              </div>

              {/* Chat input */}
              <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: `${S.md}px ${S.xxl}px`, background: C.white, display: "flex", gap: S.sm, alignItems: "flex-end" }}>
                <textarea
                  ref={tutorInputRef}
                  value={tutorInput}
                  onChange={e => {
                    setTutorInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTutorMessage(); }
                    else if (e.key === "Tab") { e.preventDefault(); const s = e.target.selectionStart; setTutorInput(v => v.substring(0, s) + "    " + v.substring(e.target.selectionEnd)); setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0); }
                  }}
                  placeholder="Escribe tu respuesta... (Enter para enviar)"
                  disabled={tutorLoading}
                  style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: `${S.sm}px ${S.md}px`, border: `1px solid ${C.border}`, background: C.cream, color: C.text, fontSize: T.md, fontFamily: T.sans, fontWeight: T.light, resize: "none", outline: "none", borderRadius: 22, lineHeight: 1.6, overflow: "hidden", boxSizing: "border-box" }}
                />
                <button
                  onClick={() => sendTutorMessage()}
                  disabled={tutorLoading || !tutorInput.trim()}
                  style={{ width: 44, height: 44, borderRadius: "50%", background: tutorLoading || !tutorInput.trim() ? C.border : C.burgundy, border: "none", color: C.gold, cursor: tutorLoading || !tutorInput.trim() ? "not-allowed" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  ↑
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Python terminal */}
        <div style={{ width: 340, background: "#1E1E1E", borderLeft: `2px solid ${C.gold}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Terminal header */}
          <div style={{ padding: `${S.sm}px ${S.md}px`, borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ color: C.gold, fontSize: T.xs, fontFamily: T.mono, letterSpacing: T.wide }}>
              {pyodideReady ? "🐍 Python listo" : "🐍 cargando..."}
            </span>
            {terminalOutput.length > 0 && (
              <button onClick={() => setTerminalOutput([])} style={{ background: "none", border: "none", color: "#666", fontSize: T.xs, cursor: "pointer", fontFamily: T.mono }}>
                limpiar
              </button>
            )}
          </div>

          {/* Output area */}
          <div style={{ flex: 1, overflowY: "auto", padding: S.md, fontFamily: T.mono, fontSize: T.sm, minHeight: 0 }}>
            {terminalOutput.length === 0
              ? <div style={{ color: "#555", fontSize: T.xs }}>El output aparecerá aquí. Usa → Terminal para enviar código desde el chat.</div>
              : terminalOutput.map((line, i) => (
                  <div key={i} style={{ marginBottom: S.xs }}>
                    {line.type === "output" && <div style={{ color: "#D4D4D4", whiteSpace: "pre-wrap" }}>{line.text}</div>}
                    {line.type === "error"  && <div style={{ color: "#F44747", whiteSpace: "pre-wrap" }}>{line.text}</div>}
                    {line.type === "silent" && <div style={{ color: "#555", fontStyle: "italic" }}>{line.text}</div>}
                  </div>
                ))
            }
          </div>

          {/* Code editor */}
          <div style={{ padding: S.sm, borderTop: "1px solid #333", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
              <button
                onClick={() => navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
                disabled={!code.trim()}
                style={{ background: "none", border: "1px solid #444", color: copied ? "#4EC994" : "#888", fontSize: 10, padding: "2px 8px", cursor: code.trim() ? "pointer" : "default", fontFamily: T.mono, transition: "color 0.15s" }}
              >
                {copied ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <div style={{ display: "flex", border: "1px solid #444", minHeight: 140 }}>
              <div
                ref={lineNumbersRef}
                style={{ width: 32, flexShrink: 0, background: "#1a1a1a", color: "#555", fontFamily: T.mono, fontSize: T.sm, lineHeight: 1.6, padding: `${S.sm}px 4px`, textAlign: "right", userSelect: "none", overflowY: "hidden" }}
              >
                {(code || " ").split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                onScroll={e => { if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.target.scrollTop; }}
                onKeyDown={e => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const s = e.target.selectionStart;
                    setCode(c => c.substring(0, s) + "    " + c.substring(e.target.selectionEnd));
                    setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const s = e.target.selectionStart;
                    const indent = code.substring(0, s).split("\n").pop().match(/^(\s*)/)[1];
                    setCode(c => c.substring(0, s) + "\n" + indent + c.substring(e.target.selectionEnd));
                    setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 1 + indent.length; }, 0);
                  }
                }}
                placeholder={"# Escribe o pega código aquí"}
                style={{ flex: 1, minHeight: 140, padding: S.sm, background: "#2D2D2D", border: "none", color: "#D4D4D4", fontSize: T.sm, fontFamily: T.mono, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, overflowY: "auto" }}
              />
            </div>
            <button
              onClick={() => sendTutorMessage(`\`\`\`python\n${code}\n\`\`\``)}
              disabled={tutorLoading || !code.trim()}
              style={{ ...btnPrimary(tutorLoading || !code.trim()), width: "100%", padding: `${S.sm}px`, marginTop: S.xs, fontSize: T.xs, letterSpacing: T.wide, background: (tutorLoading || !code.trim()) ? "#333" : C.burgundy, border: "none" }}
            >
              Enviar al Profesor
            </button>
            <button
              onClick={runPython}
              disabled={!pyodideReady || terminalLoading || !code.trim()}
              style={{ ...btnPrimary(!pyodideReady || terminalLoading || !code.trim()), width: "100%", padding: `${S.sm}px`, marginTop: S.xs, fontSize: T.xs, letterSpacing: T.wide, background: (!pyodideReady || terminalLoading || !code.trim()) ? "#333" : C.olive, border: "none" }}
            >
              {!pyodideReady ? "cargando pyodide..." : terminalLoading ? "corriendo..." : "▶ Correr"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
