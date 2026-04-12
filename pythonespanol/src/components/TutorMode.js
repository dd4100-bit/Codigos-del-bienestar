import { useState, useRef, useEffect } from "react";
import { C, T, S, label, btnPrimary } from "../constants";
import { supabase } from "../lib/supabase";

// ── Code block with per-block Copiar + → Terminal buttons ────────────────────
function CodeBlock({ codeText, onSendToTerminal }) {
  const [blockCopied, setBlockCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(codeText).then(() => {
      setBlockCopied(true);
      setTimeout(() => setBlockCopied(false), 2000);
    });
  }

  return (
    <div style={{ position: "relative", margin: "6px 0" }}>
      <pre style={{
        background: "#1E1E1E", color: "#D4D4D4",
        padding: "12px", paddingRight: 100,
        borderRadius: 4, fontSize: T.sm, fontFamily: T.mono,
        overflowX: "auto", margin: 0,
        whiteSpace: "pre-wrap", wordBreak: "break-all",
      }}>
        {codeText}
      </pre>
      <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4 }}>
        <button
          onClick={handleCopy}
          style={{ background: blockCopied ? "#2d5a1b" : "#333", border: "none", color: blockCopied ? "#4EC994" : "#888", fontSize: 10, padding: "3px 7px", cursor: "pointer", fontFamily: T.mono, borderRadius: 3, transition: "all 0.15s" }}
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

// ── Render message — splits on ``` blocks, applies to any role ────────────────
function renderMessage(content, onSendToTerminal) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const codeText = part.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
      return <CodeBlock key={i} codeText={codeText} onSendToTerminal={onSendToTerminal} />;
    }
    return <span key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{part}</span>;
  });
}

export default function TutorMode({ code, setCode, onClose, runPython, pyodideReady, terminalOutput, setTerminalOutput, terminalLoading, user }) {
  const [tutorInstructions] = useState(code);
  const [tutorHistory, setTutorHistory] = useState([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tutorBottomRef  = useRef(null);
  const tutorInputRef   = useRef(null);
  const lineNumbersRef  = useRef(null);

  // Save tutor session to Supabase then close
  async function handleClose() {
    if (user?.id && tutorHistory.length >= 2) {
      const fecha     = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const codSnip   = tutorInstructions.substring(0, 80) + (tutorInstructions.length > 80 ? "..." : "");
      const lastReply = tutorHistory.filter(m => m.role === "assistant").pop()?.content ?? "";
      const resSnip   = lastReply.substring(0, 120) + (lastReply.length > 120 ? "..." : "");

      try {
        await supabase.from("conversations").insert({
          user_id:  user.id,
          fecha,
          codigo:   codSnip,
          resumen:  `[Tutor] ${resSnip}`,
          response: JSON.stringify(tutorHistory),
        });
      } catch (err) {
        console.error("[tutor] save on exit:", err);
      }
    }
    onClose();
  }

  useEffect(() => {
    if (tutorBottomRef.current) tutorBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [tutorHistory]);

  useEffect(() => {
    setCode("");                          // terminal inicia vacía
    setTimeout(() => tutorInputRef.current?.focus(), 100);
    initTutor();
  }, []); // eslint-disable-line

  async function initTutor() {
    const sys = `Eres El Profesor — tutor socrático de programación en español.
El estudiante te pegó estas instrucciones de un problema: """${tutorInstructions}"""

TU MISIÓN: Guiar al estudiante a resolver el problema SOLO, sin darle la solución.
- Haz UNA pregunta a la vez — corta, clara, directa
- Si el estudiante está en el camino correcto, valídalo con una línea y haz la siguiente pregunta
- Si el estudiante está equivocado, no lo corrijas directamente — hazle una pregunta que lo lleve a descubrir el error
- Cuando el estudiante llegue a la solución completa, celébralo brevemente y explica por qué funciona
- Máximo 3 líneas por respuesta
- Empieza con una pregunta que evalúe qué entendió el estudiante del problema`;

    setTutorLoading(true);
    const firstMsg = { role: "user", content: "Quiero resolver este problema. ¿Por dónde empezamos?" };
    setTutorHistory([firstMsg, { role: "assistant", content: "" }]);
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
          max_tokens: 200,
          stream: true,
          system: sys,
          messages: [firstMsg],
        }),
      });
      setTutorLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.delta?.text;
            if (delta) {
              fullText += delta;
              setTutorHistory([firstMsg, { role: "assistant", content: fullText }]);
            }
          } catch {}
        }
      }
    } catch {
      setTutorLoading(false);
      setTutorHistory([firstMsg, { role: "assistant", content: "Se cayó la conexión. Inténtalo de nuevo." }]);
    }
    setTutorLoading(false);
  }

  async function sendTutorMessage(explicitContent) {
    const content = typeof explicitContent === "string" ? explicitContent : tutorInput;
    if (!content.trim() || tutorLoading) return;
    const sys = `Eres El Profesor — tutor socrático de programación en español.
El estudiante está resolviendo: """${tutorInstructions}"""
TU MISIÓN: Guiar con preguntas, no dar la solución. Máximo 3 líneas. Una pregunta a la vez.`;

    const userMsg = { role: "user", content };
    const newHistory = [...tutorHistory, userMsg];
    setTutorHistory([...newHistory, { role: "assistant", content: "" }]);
    if (typeof explicitContent !== "string") setTutorInput(""); // solo limpia si viene del input
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
          max_tokens: 200,
          stream: true,
          system: sys,
          messages: newHistory,
        }),
      });
      setTutorLoading(false);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.delta?.text;
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
      setTutorLoading(false);
      setTutorHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Se cayó la conexión." };
        return updated;
      });
    }
    setTutorLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: C.cream, zIndex: 1000, display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ background: C.burgundy, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: S.md }}>
          <span style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold, letterSpacing: T.normal_spacing }}>El Profesor</span>
          <span style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>modo tutor</span>
        </div>
        <button
          onClick={handleClose}
          style={{ background: "none", border: `1px solid rgba(200,151,31,0.4)`, color: C.gold, fontSize: T.xs, padding: `${S.xs}px ${S.md}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}
        >
          ✕ Salir
        </button>
      </div>

      {/* ── MAIN AREA — conversation (left) + terminal (right, always visible) ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — conversation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Message list */}
          <div style={{ flex: 1, overflowY: "auto", padding: `${S.xl}px ${S.xxl}px` }}>

            {/* Problem bubble — always first */}
            <div style={{ marginBottom: S.xl }}>
              <div style={{
                background: C.creamDark,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.gold}`,
                borderRadius: "4px 18px 18px 4px",
                padding: `${S.md}px ${S.lg}px`,
                fontSize: T.sm,
                fontFamily: T.mono,
                fontWeight: T.light,
                color: C.textMid,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                <span style={{ ...label(), color: C.gold, display: "block", marginBottom: S.xs, fontSize: T.xs, letterSpacing: T.wider }}>📌 Problema:</span>
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
                  maxWidth: "65%",
                  padding: `${S.md}px ${S.lg}px`,
                  background: msg.role === "user" ? C.burgundy : C.white,
                  color: msg.role === "user" ? C.cream : C.text,
                  border: `1px solid ${msg.role === "user" ? C.burgundy : C.border}`,
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize: T.md,
                  fontFamily: T.sans,
                  fontWeight: T.light,
                  lineHeight: 1.7,
                  wordBreak: "break-word",
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

          {/* Input bar */}
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
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendTutorMessage();
                } else if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  const s = e.target.selectionStart;
                  const indent = tutorInput.substring(0, s).split("\n").pop().match(/^(\s*)/)[1];
                  const next = tutorInput.substring(0, s) + "\n" + indent + tutorInput.substring(e.target.selectionEnd);
                  setTutorInput(next);
                  setTimeout(() => {
                    e.target.selectionStart = e.target.selectionEnd = s + 1 + indent.length;
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }, 0);
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  const s = e.target.selectionStart;
                  const next = tutorInput.substring(0, s) + "    " + tutorInput.substring(e.target.selectionEnd);
                  setTutorInput(next);
                  setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
                }
              }}
              placeholder="Escribe tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)"
              disabled={tutorLoading}
              style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: `${S.sm}px ${S.md}px`, border: `1px solid ${C.border}`, background: C.cream, color: C.text, fontSize: T.md, fontFamily: T.sans, fontWeight: T.light, resize: "none", outline: "none", borderRadius: 22, lineHeight: 1.6, overflow: "hidden", boxSizing: "border-box" }}
            />
            <button
              onClick={sendTutorMessage}
              disabled={tutorLoading || !tutorInput.trim()}
              style={{ width: 44, height: 44, borderRadius: "50%", background: tutorLoading || !tutorInput.trim() ? C.border : C.burgundy, border: "none", color: C.gold, cursor: tutorLoading || !tutorInput.trim() ? "not-allowed" : "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
            >
              ↑
            </button>
          </div>
        </div>

        {/* RIGHT — Python terminal, always visible */}
        <div style={{ width: 340, background: "#1E1E1E", borderLeft: `2px solid ${C.gold}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>

          {/* Terminal header */}
          <div style={{ padding: `${S.sm}px ${S.md}px`, borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ color: C.gold, fontSize: T.xs, fontFamily: T.mono, letterSpacing: T.wide }}>
              {pyodideReady ? "🐍 Python listo" : "🐍 cargando..."}
            </span>
            {terminalOutput.length > 0 && (
              <button
                onClick={() => setTerminalOutput([])}
                style={{ background: "none", border: "none", color: "#666", fontSize: T.xs, cursor: "pointer", fontFamily: T.mono }}
              >
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

          {/* Code editor + run button */}
          <div style={{ padding: S.sm, borderTop: "1px solid #333", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                disabled={!code.trim()}
                style={{ background: "none", border: "1px solid #444", color: copied ? "#4EC994" : "#888", fontSize: 10, padding: "2px 8px", cursor: code.trim() ? "pointer" : "default", fontFamily: T.mono, letterSpacing: T.wide, transition: "color 0.15s" }}
              >
                {copied ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            {/* Line numbers + textarea — scroll in sync */}
            <div style={{ display: "flex", border: "1px solid #444", minHeight: 140 }}>
              <div
                ref={lineNumbersRef}
                style={{
                  width: 32, flexShrink: 0,
                  background: "#1a1a1a", color: "#555",
                  fontFamily: T.mono, fontSize: T.sm, lineHeight: 1.6,
                  padding: `${S.sm}px 4px`,
                  textAlign: "right", userSelect: "none",
                  overflowY: "hidden",
                }}
              >
                {(code || " ").split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
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
