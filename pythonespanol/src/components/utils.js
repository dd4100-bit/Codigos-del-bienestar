import { C, T, S } from "../constants";

export function AMLOCartoon() {
  return (
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 200 }}>
      <rect x="20" y="155" width="160" height="8" fill={C.burgundy} rx="2"/>
      <rect x="40" y="163" width="120" height="5" fill={C.burgundyMid} rx="1"/>
      <rect x="45" y="105" width="110" height="55" fill={C.burgundy} rx="4"/>
      <rect x="49" y="109" width="102" height="47" fill={C.cream} rx="2"/>
      <rect x="54" y="114" width="40" height="2" fill={C.border} rx="1"/>
      <rect x="54" y="119" width="60" height="2" fill={C.border} rx="1"/>
      <rect x="58" y="124" width="35" height="2" fill={C.textLight} rx="1"/>
      <rect x="54" y="129" width="50" height="2" fill={C.border} rx="1"/>
      <rect x="54" y="134" width="30" height="2" fill={C.burgundy} rx="1"/>
      <path d="M54 141 Q57 139 60 141 Q63 143 66 141 Q69 139 72 141" stroke={C.burgundy} strokeWidth="1.5" fill="none"/>
      <rect x="93" y="160" width="14" height="8" fill={C.burgundy} rx="1"/>
      <rect x="80" y="167" width="40" height="4" fill={C.burgundy} rx="2"/>
      <rect x="50" y="172" width="100" height="14" fill={C.textMid} rx="2"/>
      <rect x="54" y="175" width="8" height="4" fill={C.textLight} rx="1"/><rect x="65" y="175" width="8" height="4" fill={C.textLight} rx="1"/><rect x="76" y="175" width="8" height="4" fill={C.textLight} rx="1"/><rect x="87" y="175" width="8" height="4" fill={C.textLight} rx="1"/><rect x="98" y="175" width="8" height="4" fill={C.textLight} rx="1"/><rect x="109" y="175" width="8" height="4" fill={C.textLight} rx="1"/><rect x="120" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="60" y="181" width="80" height="3" fill={C.textLight} rx="1"/>
      <rect x="68" y="128" width="64" height="35" fill={C.text} rx="4"/>
      <rect x="96" y="128" width="8" height="30" fill={C.white} rx="1"/>
      <polygon points="100,132 97,146 103,146" fill={C.burgundy}/>
      <line x1="68" y1="138" x2="32" y2="124" stroke={C.text} strokeWidth="10" strokeLinecap="round"/>
      <circle cx="28" cy="122" r="5" fill="#D4A574"/>
      <line x1="28" y1="117" x2="35" y2="111" stroke="#D4A574" strokeWidth="3" strokeLinecap="round"/>
      <line x1="132" y1="140" x2="155" y2="155" stroke={C.text} strokeWidth="10" strokeLinecap="round"/>
      <rect x="94" y="118" width="12" height="14" fill="#D4A574" rx="2"/>
      <ellipse cx="100" cy="93" rx="32" ry="34" fill="#D4A574"/>
      <ellipse cx="100" cy="61" rx="32" ry="11" fill="#888"/>
      <ellipse cx="100" cy="63" rx="28" ry="9" fill="#D4A574"/>
      <ellipse cx="68" cy="93" rx="7" ry="9" fill="#D4A574"/><ellipse cx="132" cy="93" rx="7" ry="9" fill="#D4A574"/>
      <ellipse cx="68" cy="93" rx="4" ry="6" fill="#C49464"/><ellipse cx="132" cy="93" rx="4" ry="6" fill="#C49464"/>
      <path d="M82 78 Q88 74 94 77" stroke="#5A4030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M106 74 Q112 78 118 78" stroke="#5A4030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="88" cy="84" rx="7" ry="5" fill={C.white}/><ellipse cx="112" cy="84" rx="7" ry="5" fill={C.white}/>
      <ellipse cx="88" cy="85" rx="4" ry="4" fill="#3A2010"/><ellipse cx="112" cy="85" rx="4" ry="4" fill="#3A2010"/>
      <ellipse cx="89" cy="84" rx="1.5" ry="1.5" fill="#000"/><ellipse cx="113" cy="84" rx="1.5" ry="1.5" fill="#000"/>
      <path d="M81 82 Q88 79 95 82" stroke="#D4A574" strokeWidth="2" fill="#D4A574"/>
      <path d="M105 79 Q112 76 119 79" stroke="#D4A574" strokeWidth="2" fill="#D4A574"/>
      <ellipse cx="100" cy="94" rx="5" ry="4" fill="#C49464"/>
      <circle cx="97" cy="95" r="2" fill="#B48454"/><circle cx="103" cy="95" r="2" fill="#B48454"/>
      <path d="M88 106 Q100 103 112 106" stroke="#A47454" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="158" cy="52" rx="38" ry="22" fill={C.cream} stroke={C.burgundy} strokeWidth="1.5"/>
      <polygon points="138,66 128,78 144,70" fill={C.cream} stroke={C.burgundy} strokeWidth="1"/>
      <polygon points="139,67 130,77 144,70" fill={C.cream}/>
      <text x="158" y="45" textAnchor="middle" fontSize="6.5" fill={C.burgundy} fontFamily="Georgia, serif" fontWeight="bold">Fuchi,</text>
      <text x="158" y="54" textAnchor="middle" fontSize="6.5" fill={C.burgundy} fontFamily="Georgia, serif" fontWeight="bold">guácala</text>
      <text x="158" y="63" textAnchor="middle" fontSize="6" fill={C.textMid} fontFamily="Georgia, serif">este código.</text>
    </svg>
  );
}

export const IconBug = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="3" stroke={C.burgundy} strokeWidth="1.5"/>
    <path d="M8 1v4M8 11v4M1 8h4M11 8h4M3 3l2.5 2.5M10.5 10.5L13 13M13 3l-2.5 2.5M5.5 10.5L3 13" stroke={C.burgundy} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="7" stroke={C.olive} strokeWidth="1.5"/>
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke={C.olive} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconTip = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
    <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.6l-3.7 2 .7-4.1-3-2.9 4.2-.8z" stroke={C.gold} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

export function highlightCode(line) {
  const keywords = /\b(def|return|if|elif|else|for|while|in|and|or|not|import|from|class|try|except|finally|with|as|pass|break|continue|lambda|yield|True|False|None|const|let|var|function|=>|async|await|SELECT|FROM|WHERE|ORDER|BY|GROUP|INSERT|UPDATE|DELETE|JOIN)\b/g;
  if (/^(\s*)(#.*|\/\/.*)$/.test(line)) return <span style={{ color: "#6A9955" }}>{line}</span>;
  const tokens = line.split(/(\s+)/);
  return (
    <span>
      {tokens.map((token, idx) => {
        if (/^\s+$/.test(token)) return <span key={idx}>{token}</span>;
        if (keywords.test(token)) return <span key={idx} style={{ color: "#569CD6" }}>{token}</span>;
        if (/^["'`].*["'`]$/.test(token)) return <span key={idx} style={{ color: "#CE9178" }}>{token}</span>;
        if (/^\d+\.?\d*$/.test(token)) return <span key={idx} style={{ color: "#B5CEA8" }}>{token}</span>;
        if (/^[#\/\/].*/.test(token)) return <span key={idx} style={{ color: "#6A9955" }}>{token}</span>;
        return <span key={idx} style={{ color: C.text }}>{token}</span>;
      })}
    </span>
  );
}

export function formatResponse(text) {
  const lines = text.split("\n");
  let inCodeBlock = false;
  let openingLineDone = false;
  return lines.map((line, i) => {
    if (line.includes("```")) { inCodeBlock = !inCodeBlock; return null; }
    if (inCodeBlock) return (
      <div key={i} style={{ fontFamily: T.mono, fontSize: T.base, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-all", background: C.creamDark, padding: `1px ${S.sm}px` }}>{highlightCode(line)}</div>
    );
    if (!openingLineDone && line.trim() !== "" && !line.startsWith("El problema:") && !line.startsWith("✅") && !line.startsWith("►") && !line.startsWith("💡")) {
      openingLineDone = true;
      return <div key={i} style={{ fontSize: T.lg, fontWeight: T.bold, color: C.burgundy, fontFamily: T.sans, lineHeight: 1.4, marginBottom: S.lg, paddingBottom: S.lg, borderBottom: `1px solid ${C.border}` }}>{line.replace("🎤", "").trim()}</div>;
    }
    if (line.startsWith("El problema:")) return <div key={i} style={{ display: "flex", alignItems: "center", fontSize: T.xs, fontWeight: T.bold, color: C.burgundy, fontFamily: T.mono, letterSpacing: T.widest, textTransform: "uppercase", marginTop: S.lg, marginBottom: S.xs }}><IconBug />EL PROBLEMA</div>;
    if (line.startsWith("✅ Así se hace:") || line.startsWith("Así se hace:")) return <div key={i} style={{ display: "flex", alignItems: "center", fontSize: T.xs, fontWeight: T.bold, color: C.olive, fontFamily: T.mono, letterSpacing: T.widest, textTransform: "uppercase", marginTop: S.lg, marginBottom: S.xs }}><IconCheck />ASÍ SE HACE</div>;
    if (line.startsWith("💡") || line.startsWith("►")) return <div key={i} style={{ display: "flex", alignItems: "center", fontSize: T.sm, color: C.gold, fontFamily: T.mono, marginTop: S.lg, paddingTop: S.lg, borderTop: `1px solid ${C.border}` }}><IconTip />{line.replace("💡", "").replace("►", "").trim()}</div>;
    if (line.trim() === "") return <div key={i} style={{ height: S.sm }} />;
    return <div key={i} style={{ color: C.textMid, fontFamily: T.mono, fontSize: T.base, lineHeight: 1.8, fontWeight: T.light, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{line}</div>;
  });
}
