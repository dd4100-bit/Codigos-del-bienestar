import { useState, useRef, useEffect } from "react";
import { C, T, S, label, btnPrimary } from "../constants";

export default function Chat() {
  const [sideQuestion, setSideQuestion] = useState("");
  const [sideLoading, setSideLoading] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function askSidePanel() {
    if (!sideQuestion.trim()) return;
    const userMsg = { role: "user", content: sideQuestion };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setSideQuestion("");
    setSideLoading(true);
    const assistantPlaceholder = { role: "assistant", content: "" };
    setChatHistory([...newHistory, assistantPlaceholder]);
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
          max_tokens: 500,
          stream: true,
          system: "Eres El Profesor — tutor de programación en español. Recuerdas el contexto de la conversación. Directo, técnico, sin relleno. Sin saludos.",
          messages: newHistory,
        }),
      });
      setSideLoading(false);
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
              setChatHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setSideLoading(false);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Se cayó la conexión. Inténtalo de nuevo." };
        return updated;
      });
    }
    setSideLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <div style={{ position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 500 }}>
        <button
          onClick={() => setShowSidePanel(p => !p)}
          style={{
            background: showSidePanel ? C.gold : C.burgundy,
            border: `1px solid ${C.gold}`,
            borderLeft: "none",
            color: showSidePanel ? C.burgundy : C.gold,
            padding: `${S.xl}px ${S.md}px`,
            cursor: "pointer",
            fontFamily: T.sans,
            fontSize: T.sm,
            fontWeight: T.bold,
            letterSpacing: T.wide,
            textTransform: "uppercase",
            writingMode: "vertical-rl",
            borderRadius: "0 6px 6px 0",
            boxShadow: `2px 2px 0 ${C.text}`,
            transition: "all 0.15s",
          }}
        >
          💬 Chat
        </button>
      </div>

      {/* Side panel */}
      {showSidePanel && (
        <div style={{ position: "fixed", left: 0, top: 0, height: "100vh", width: 300, background: C.cream, border: `1px solid ${C.burgundy}`, boxShadow: `3px 0 12px rgba(0,0,0,0.15)`, zIndex: 400, display: "flex", flexDirection: "column" }}>
          <div style={{ background: C.burgundy, padding: `${S.md}px ${S.lg}px`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <div style={{ color: C.gold, fontSize: T.sm, fontFamily: T.sans, fontWeight: T.bold, letterSpacing: T.wide, textTransform: "uppercase" }}>El Profesor</div>
              <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>Chat · Pregúntame lo que quieras</div>
            </div>
            <div style={{ display: "flex", gap: S.sm, alignItems: "center" }}>
              {chatHistory.length > 0 && (
                <button
                  onClick={() => setChatHistory([])}
                  style={{ background: "none", border: `1px solid rgba(200,151,31,0.3)`, color: "rgba(200,151,31,0.6)", fontSize: T.xs, padding: `2px ${S.sm}px`, cursor: "pointer", fontFamily: T.sans, textTransform: "uppercase" }}
                >
                  Limpiar
                </button>
              )}
              <button onClick={() => setShowSidePanel(false)} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: S.md, display: "flex", flexDirection: "column", gap: S.sm }}>
            {chatHistory.length === 0 && (
              <div style={{ color: C.textLight, fontSize: T.sm, fontFamily: T.mono, textAlign: "center", marginTop: S.xxxl, lineHeight: 1.8 }}>
                Pregúntame sobre código,<br />conceptos, errores,<br />lo que sea.
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%",
                  padding: `${S.sm}px ${S.md}px`,
                  background: msg.role === "user" ? C.burgundy : C.white,
                  color: msg.role === "user" ? C.gold : C.textMid,
                  border: `1px solid ${msg.role === "user" ? C.burgundy : C.border}`,
                  fontSize: T.sm,
                  fontFamily: T.mono,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {msg.content || (sideLoading && i === chatHistory.length - 1 ? "..." : "")}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <div style={{ padding: S.md, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <textarea
              value={sideQuestion}
              onChange={e => setSideQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askSidePanel(); } }}
              placeholder="Escribe tu pregunta... (Enter para enviar)"
              style={{ width: "100%", minHeight: 60, padding: S.sm, border: `1px solid ${C.border}`, background: C.white, color: C.text, fontSize: T.sm, fontFamily: T.mono, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
            />
            <button
              onClick={askSidePanel}
              disabled={sideLoading || !sideQuestion.trim()}
              style={{ ...btnPrimary(sideLoading || !sideQuestion.trim()), width: "100%", padding: `${S.sm}px`, marginTop: S.xs, fontSize: T.xs, letterSpacing: T.wide }}
            >
              {sideLoading ? "pensando..." : "Enviar ↗"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
