import { C, T, S, label } from "../constants";

export default function Terminal({ output, onClear }) {
  if (!output.length) return null;
  return (
    <div style={{ marginBottom: S.xxxl, border: `1px solid ${C.olive}`, boxShadow: `2px 2px 0 ${C.olive}` }}>
      <div style={{ background: C.olive, padding: `${S.sm}px ${S.lg}px`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...label(), color: C.gold, fontSize: T.xs, letterSpacing: T.wider }}>🐍 Output</span>
        <button
          onClick={onClear}
          style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontSize: T.xs, fontFamily: T.sans, textTransform: "uppercase", letterSpacing: T.wide }}
        >
          ✕ Limpiar
        </button>
      </div>
      <div style={{ padding: S.lg, background: "#1E1E1E", fontFamily: T.mono, fontSize: T.base }}>
        {output.map((line, i) => (
          <div key={i}>
            {line.type === "output" && <div style={{ color: "#D4D4D4", whiteSpace: "pre-wrap" }}>{line.text}</div>}
            {line.type === "error" && <div style={{ color: "#F44747", whiteSpace: "pre-wrap" }}>{line.text}</div>}
            {line.type === "silent" && <div style={{ color: "#666", fontStyle: "italic" }}>{line.text}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
