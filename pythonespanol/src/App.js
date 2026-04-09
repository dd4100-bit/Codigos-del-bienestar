import { useState, useRef, useEffect } from "react";

// ============================================
// DESIGN SYSTEM — single source of truth
// ============================================
const C = {
  burgundy:    "#6B1223",
  burgundyMid: "#8B1A2E",
  gold:        "#C8971F",
  olive:       "#3A5A2A",
  cream:       "#F5F0E8",
  creamDark:   "#EDE6D6",
  text:        "#1A1008",
  textMid:     "#4A3020",
  textLight:   "#8A7060",
  border:      "#C8A882",
  white:       "#FFFFFF",
};

// Typography — one system, used everywhere
const T = {
  // Font families
  sans:  '"Noto Sans", "Open Sans", "Helvetica Neue", Arial, sans-serif',
  serif: '"Montserrat", sans-serif',
  mono:  '"Courier New", monospace',
  // Font sizes
  xs:    9,
  sm:    11,
  base:  13,
  md:    15,
  lg:    17,
  // Font weights
  light:  300,
  normal: 400,
  bold:   700,
  black:  900,
  // Letter spacing
  tight:  0,
  normal_spacing: 1,
  wide:   2,
  wider:  3,
  widest: 4,
};

// Spacing — consistent scale
const S = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
};

// ============================================
// SHARED BUTTON STYLE — used everywhere
// ============================================
function btnPrimary(disabled) {
  return {
    padding: `${S.md}px ${S.lg}px`,
    border: `1px solid ${disabled ? C.border : C.burgundy}`,
    background: disabled ? C.creamDark : C.burgundy,
    color: disabled ? C.textLight : C.gold,
    fontSize: T.sm,
    fontWeight: T.bold,
    fontFamily: T.mono,
    letterSpacing: T.wider,
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
  };
}

function btnSecondary() {
  return {
    padding: `${S.sm}px ${S.lg}px`,
    border: `1px solid ${C.burgundy}`,
    background: C.white,
    color: C.burgundy,
    fontSize: T.sm,
    fontWeight: T.bold,
    fontFamily: T.sans,
    letterSpacing: T.normal_spacing,
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.15s",
  };
}

function btnGhost() {
  return {
    padding: `${S.sm}px ${S.lg}px`,
    border: `1px solid ${C.border}`,
    background: "transparent",
    color: C.textLight,
    fontSize: T.sm,
    fontFamily: T.sans,
    letterSpacing: T.normal_spacing,
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.15s",
  };
}

function label() {
  return {
    fontSize: T.xs,
    letterSpacing: T.widest,
    color: C.textLight,
    textTransform: "uppercase",
    fontFamily: T.sans,
    fontWeight: T.light,
  };
}

// ============================================
// SYSTEM PROMPT
// ============================================
const AMLO_SYSTEM_PROMPT = `Eres "El Profesor" — un debugger de código en español.

REGLA DE ORO:
- SOLO la primera línea tiene humor — inteligente, seco, universal. Que le dé risa al developer senior Y al estudiante de 15 años.
- El humor NO es infantil ni político. Es ingenioso. Seco. Como un chiste de adulto que también entiende un niño.
- TODO lo demás es técnico puro: directo, sin relleno, sin personalidad extra.
- Máximo 150 palabras total.
- Cualquier lenguaje: Python, JavaScript, Java, SQL, lo que sea.
- NUNCA recomendar arquitectura, organización de archivos, o mejores prácticas.

REGLAS CRÍTICAS:
- NUNCA repitas las listas, arrays, o datos del input en tu respuesta. Si el código tiene listas largas, en tu corrección escribe solo la lógica — no los datos.
- El código corregido siempre debe estar COMPLETO. Nunca lo dejes cortado o incompleto.
- Si el error es de lógica, muestra solo la parte corregida — no todo el archivo.

FRASES DE APERTURA — una línea, seca, inteligente, universal:
- SyntaxError: "Python intentó leerlo. No pudo. Nadie pudo."
- NameError/undefined: "Usaste algo que no existe. Como buscar WiFi en el metro."
- IndentationError: "Los espacios importan. Siempre importaron."
- IndexError/out of bounds: "Le pediste el elemento 99 a una lista de 3. Optimista."
- TypeError: "Sumaste un número con un texto. El resultado es confusión."
- Division by zero: "Entre cero no se divide. En matemáticas ni en la vida."
- KeyError: "Esa llave no está en el diccionario. Nunca estuvo."
- AttributeError: "Ese objeto no tiene ese método. Lo estás confundiendo con otro."
- ImportError: "Ese módulo no existe o no está instalado."
- Código de AI roto: "El código llegó de una AI. Llegó roto también."
- Error lógico sin excepción: "Corre. No falla. Tampoco hace lo que debería."
- Error general: "Algo está mal. Vamos a encontrarlo."

FORMATO — exactamente este, sin cambios:

[Una línea. Inteligente. Seca. Universal.]

El problema:
[2-3 líneas. Técnico. Por qué no funciona. Sin relleno.]

✅ Así se hace:
[Solo la lógica corregida. Sin repetir datos. Completo.]

► [Una línea. El insight clave.]

Español neutro. Sin "ya saben", "miren", "con todo respeto".`;



const LOADING_FRASES = [
  "Consultando con mis asesores...",
  "Revisando su catastrófico código...",
  "Analizando el desastre...",
  "Fíjense bien, a ver qué hicieron...",
  "No es tema menor, esperen...",
  "Hay que ser honestos aquí...",
  "Con todo respeto, analizando...",
];

const EJEMPLOS = [
  { label: "AI — ChatGPT Python",     code: `# Generated by ChatGPT\ndef calcular_promedio(numeros):\n    total = sum(numeros)\n    promedio = total / len(numeros)\n    return promedio\n\nresultado = calcular_promedio([])\nprint(resultado)` },
  { label: "AI — Copilot JS",         code: `// GitHub Copilot suggestion\nfunction buscarUsuario(usuarios, nombre) {\n  for (let i = 0; i <= usuarios.length; i++) {\n    if (usuarios[i].nombre === nombre) {\n      return usuarios[i].edad;\n    }\n  }\n}\nconsole.log(buscarUsuario([], "Diego") + 5);` },
  { label: "Bug — Python",       code: `if x = 10\n    print("hola")` },
  { label: "Bug — JavaScript",   code: `const nombre = "Diego"\nconsole.log(nombre.toUppercase())` },
  { label: "Bug — SQL",          code: `SELECT nombre, edad FROM usuarios WHERE edad > 18 AND\nORDER BY nombre` },
  { label: "Construir",          code: `quiero hacer una calculadora en JavaScript que sume, reste, multiplique y divida` },
  { label: "Explicar loop",       code: `qué es un loop y para qué sirve, explícamelo simple` },
  { label: "Mejorar código",      code: `# mejora este código:\nnumeros = [1,2,3,4,5]\ntotal = 0\nfor n in numeros:\n    total = total + n\nprint(total)` },
];

// ============================================
// AMLO CARTOON
// ============================================
function AMLOCartoon() {
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
      <rect x="54" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="65" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="76" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="87" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="98" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="109" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="120" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
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
      <ellipse cx="68" cy="93" rx="7" ry="9" fill="#D4A574"/>
      <ellipse cx="132" cy="93" rx="7" ry="9" fill="#D4A574"/>
      <ellipse cx="68" cy="93" rx="4" ry="6" fill="#C49464"/>
      <ellipse cx="132" cy="93" rx="4" ry="6" fill="#C49464"/>
      <path d="M82 78 Q88 74 94 77" stroke="#5A4030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M106 74 Q112 78 118 78" stroke="#5A4030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="88" cy="84" rx="7" ry="5" fill={C.white}/>
      <ellipse cx="112" cy="84" rx="7" ry="5" fill={C.white}/>
      <ellipse cx="88" cy="85" rx="4" ry="4" fill="#3A2010"/>
      <ellipse cx="112" cy="85" rx="4" ry="4" fill="#3A2010"/>
      <ellipse cx="89" cy="84" rx="1.5" ry="1.5" fill="#000"/>
      <ellipse cx="113" cy="84" rx="1.5" ry="1.5" fill="#000"/>
      <path d="M81 82 Q88 79 95 82" stroke="#D4A574" strokeWidth="2" fill="#D4A574"/>
      <path d="M105 79 Q112 76 119 79" stroke="#D4A574" strokeWidth="2" fill="#D4A574"/>
      <ellipse cx="100" cy="94" rx="5" ry="4" fill="#C49464"/>
      <circle cx="97" cy="95" r="2" fill="#B48454"/>
      <circle cx="103" cy="95" r="2" fill="#B48454"/>
      <path d="M88 106 Q100 103 112 106" stroke="#A47454" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M80 88 Q82 90 80 92" stroke="#C49464" strokeWidth="1" fill="none"/>
      <path d="M120 88 Q118 90 120 92" stroke="#C49464" strokeWidth="1" fill="none"/>
      <ellipse cx="158" cy="52" rx="38" ry="22" fill={C.cream} stroke={C.burgundy} strokeWidth="1.5"/>
      <polygon points="138,66 128,78 144,70" fill={C.cream} stroke={C.burgundy} strokeWidth="1"/>
      <polygon points="139,67 130,77 144,70" fill={C.cream}/>
      <text x="158" y="45" textAnchor="middle" fontSize="6.5" fill={C.burgundy} fontFamily="Georgia, serif" fontWeight="bold">Fuchi,</text>
      <text x="158" y="54" textAnchor="middle" fontSize="6.5" fill={C.burgundy} fontFamily="Georgia, serif" fontWeight="bold">guácala</text>
      <text x="158" y="63" textAnchor="middle" fontSize="6" fill={C.textMid} fontFamily="Georgia, serif">este código.</text>
    </svg>
  );
}

// ============================================
// SYNTAX HIGHLIGHTER
// ============================================
function highlightCode(line) {
  const keywords = /\b(def|return|if|elif|else|for|while|in|and|or|not|import|from|class|try|except|finally|with|as|pass|break|continue|lambda|yield|True|False|None|const|let|var|function|=>|async|await|SELECT|FROM|WHERE|ORDER|BY|GROUP|INSERT|UPDATE|DELETE|JOIN)\b/g;
  const strings = /(["'`])(?:(?=(\\?))\2.)*?\1/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const comments = /^(\s*)(#.*|\/\/.*)$/;

  if (comments.test(line)) {
    return <span style={{ color: "#6A9955" }}>{line}</span>;
  }

  // Simple token colorizer
  const parts = [];
  let remaining = line;
  let key = 0;

  // Split by spaces and color tokens
  const tokens = line.split(/(\s+)/);
  return (
    <span>
      {tokens.map((token, idx) => {
        if (/^\s+$/.test(token)) return <span key={idx}>{token}</span>;
        if (keywords.test(token)) return <span key={idx} style={{ color: "#569CD6" }}>{token}</span>;
        if (/^["'`].*["'`]$/.test(token)) return <span key={idx} style={{ color: "#CE9178" }}>{token}</span>;
        if (/^\d+\.?\d*$/.test(token)) return <span key={idx} style={{ color: "#B5CEA8" }}>{token}</span>;
        if (/^#.*/.test(token)) return <span key={idx} style={{ color: "#6A9955" }}>{token}</span>;
        if (/^\/\/.*/.test(token)) return <span key={idx} style={{ color: "#6A9955" }}>{token}</span>;
        return <span key={idx} style={{ color: C.text }}>{token}</span>;
      })}
    </span>
  );
}

// SVG Icons
const IconBug = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="3" stroke={C.burgundy} strokeWidth="1.5"/>
    <path d="M8 1v4M8 11v4M1 8h4M11 8h4M3 3l2.5 2.5M10.5 10.5L13 13M13 3l-2.5 2.5M5.5 10.5L3 13" stroke={C.burgundy} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="7" stroke={C.olive} strokeWidth="1.5"/>
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke={C.olive} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTip = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
    <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.6l-3.7 2 .7-4.1-3-2.9 4.2-.8z" stroke={C.gold} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

// ============================================
// FORMAT RESPONSE
// ============================================
function formatResponse(text) {
  const lines = text.split("\n");
  let inCodeBlock = false;
  let openingLineDone = false;

  return lines.map((line, i) => {
    // Toggle code block
    if (line.includes("```")) {
      inCodeBlock = !inCodeBlock;
      return null;
    }

    // Inside code block — syntax highlighted
    if (inCodeBlock) {
      return (
        <div key={i} style={{
          fontFamily: T.mono,
          fontSize: T.base,
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          background: C.creamDark,
          padding: `1px ${S.sm}px`,
        }}>{highlightCode(line)}</div>
      );
    }

    // First non-empty line — opening phrase, bold burgundy
    if (!openingLineDone && line.trim() !== "" &&
        !line.startsWith("El problema:") &&
        !line.startsWith("✅") &&
        !line.startsWith("►") &&
        !line.startsWith("💡")) {
      openingLineDone = true;
      return (
        <div key={i} style={{
          fontSize: T.lg,
          fontWeight: T.bold,
          color: C.burgundy,
          fontFamily: T.sans,
          lineHeight: 1.4,
          marginBottom: S.lg,
          paddingBottom: S.lg,
          borderBottom: `1px solid ${C.border}`,
        }}>{line.replace("🎤", "").trim()}</div>
      );
    }

    // Section labels with icons
    if (line.startsWith("El problema:")) {
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", fontSize: T.xs, fontWeight: T.bold, color: C.burgundy, fontFamily: T.mono, letterSpacing: T.widest, textTransform: "uppercase", marginTop: S.lg, marginBottom: S.xs }}>
          <IconBug />EL PROBLEMA
        </div>
      );
    }

    if (line.startsWith("✅ Así se hace:") || line.startsWith("Así se hace:")) {
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", fontSize: T.xs, fontWeight: T.bold, color: C.olive, fontFamily: T.mono, letterSpacing: T.widest, textTransform: "uppercase", marginTop: S.lg, marginBottom: S.xs }}>
          <IconCheck />ASÍ SE HACE
        </div>
      );
    }

    if (line.startsWith("💡") || line.startsWith("►")) {
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", fontSize: T.sm, color: C.gold, fontFamily: T.mono, marginTop: S.lg, paddingTop: S.lg, borderTop: `1px solid ${C.border}` }}>
          <IconTip />{line.replace("💡", "").replace("►", "").trim()}
        </div>
      );
    }

    // Empty line
    if (line.trim() === "") return <div key={i} style={{ height: S.sm }} />;

    // Regular explanation text
    return (
      <div key={i} style={{
        color: C.textMid,
        fontFamily: T.mono,
        fontSize: T.base,
        lineHeight: 1.8,
        fontWeight: T.light,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>{line}</div>
    );
  });
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function App() {
  const [code, setCode] = useState("");
  const [intention, setIntention] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const responseRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("elprofesor_historial");
      if (saved) setHistorial(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("elprofesor_historial", JSON.stringify(historial));
    } catch {}
  }, [historial]);

  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => setFraseIdx(i => (i + 1) % LOADING_FRASES.length), 1400);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [response]);

  function saveToHistorial(codigo, respuesta) {
    const entry = {
      id: Date.now(),
      fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      codigo: codigo.substring(0, 80) + (codigo.length > 80 ? "..." : ""),
      resumen: respuesta.substring(0, 120) + "...",
    };
    setHistorial(prev => [entry, ...prev].slice(0, 10));
  }

  async function askProfe() {
    if (!code.trim()) return;
    setLoading(true);
    setResponse("");
    setFraseIdx(0);
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
          max_tokens: 1000,
          system: AMLO_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Analiza este código:\n\`\`\`\n${code}\n\`\`\`${intention.trim() ? `\n\nResultado esperado: ${intention.trim()}` : ""}` }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Pos no pude analizarlo. Inténtele de nuevo.";
      setResponse(text);
      saveToHistorial(code, text);
    } catch {
      setResponse("Se cayó la conexión. Como el sistema de salud en el régimen anterior.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, color: C.text, fontFamily: T.sans, fontWeight: T.light, padding: "0 0 80px 0" }}>

      {/* TOP STRIPE */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${C.burgundy}, ${C.burgundyMid} 40%, ${C.gold} 60%, ${C.olive})` }} />

      {/* GOB HEADER */}
      <div style={{ background: C.burgundy, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <span style={{ ...label(), color: "rgba(200,151,31,0.4)" }}>gob.mx</span>

        <div style={{ display: "flex", alignItems: "center", gap: S.md, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          <svg viewBox="0 0 60 60" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="28" fill="none" stroke={C.gold} strokeWidth="1"/>
            <ellipse cx="30" cy="34" rx="10" ry="8" fill={C.gold}/>
            <path d="M20 30 Q10 22 6 28 Q10 34 20 32 Z" fill={C.gold}/>
            <path d="M40 30 Q50 22 54 28 Q50 34 40 32 Z" fill={C.gold}/>
            <circle cx="30" cy="22" r="6" fill={C.gold}/>
            <path d="M33 23 L37 25 L33 26 Z" fill={C.burgundy}/>
            <circle cx="31" cy="21" r="1.5" fill={C.burgundy}/>
            <path d="M25 42 Q30 48 35 42" stroke={C.gold} strokeWidth="1.5" fill="none"/>
            <line x1="26" y1="42" x2="23" y2="47" stroke={C.gold} strokeWidth="1.2"/>
            <line x1="34" y1="42" x2="37" y2="47" stroke={C.gold} strokeWidth="1.2"/>
            <path d="M33 28 Q38 32 36 38 Q34 42 37 46" stroke="#2d5a1b" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <rect x="27" y="38" width="3" height="8" fill="#2d5a1b" rx="1"/>
            <rect x="24" y="41" width="6" height="2" fill="#2d5a1b" rx="1"/>
          </svg>
          <div>
            <div style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold, letterSpacing: T.normal_spacing, lineHeight: 1.2 }}>
              Códigos del Bienestar
            </div>
            <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>
              El Profesor · Python en Español
            </div>
          </div>
        </div>

        <span style={{ ...label(), color: "rgba(200,151,31,0.4)" }}>Servicio Gratuito</span>
      </div>

      {/* MAIN HEADER */}
      <div style={{ borderBottom: `3px solid ${C.burgundy}`, padding: `${S.xxxl}px ${S.xxl}px ${S.xxl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: S.xl, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ ...label(), color: C.gold, marginBottom: S.md, letterSpacing: T.widest }}>
            La Cuarta Transformación del Código
          </div>
          <h1 style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)", fontWeight: T.black, margin: `0 0 ${S.sm}px 0`, fontFamily: T.serif, color: C.burgundy, letterSpacing: -3, lineHeight: 0.95 }}>
            El<br/>Profesor
          </h1>
          <div style={{ width: 60, height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.olive})`, marginBottom: S.lg, borderRadius: 2 }} />
          <div style={{ fontSize: T.md, color: C.textMid, fontFamily: T.sans, fontWeight: T.light, lineHeight: 1.7, marginBottom: S.xl, maxWidth: 340 }}>
            AI te dio código que no funciona.<br/><br/>
            Pega tu código — Python, JavaScript, Java, SQL, lo que sea. El Profesor te dice qué está mal.<br/><br/>
            <strong style={{ fontWeight: T.bold, color: C.burgundy }}>En español. Gratis.</strong>
          </div>
        </div>
        <div style={{ width: 190, flexShrink: 0 }}>
          <AMLOCartoon />
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: `${S.xxxl}px ${S.lg}px 0` }}>

        {/* MODAL */}
        {modal && (
          <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,16,8,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: S.xl }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.cream, border: `2px solid ${C.burgundy}`, boxShadow: `4px 4px 0 ${C.burgundy}`, maxWidth: 480, width: "100%", animation: "fadeIn 0.2s ease" }}>
              <div style={{ background: C.burgundy, padding: `${S.md}px ${S.xl}px`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: C.gold, fontSize: T.sm, letterSpacing: T.wider, textTransform: "uppercase", fontFamily: T.sans, fontWeight: T.bold }}>
                  {modal === "sirve" && "¿Para Qué Sirve?"}
                  {modal === "usar" && "¿Cómo Usar Al Profesor?"}
                  {modal === "ideas" && "Ideas Para Mejorar Al Profesor"}
                </span>
                <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: C.gold, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ padding: S.xxl, fontFamily: T.sans, fontWeight: T.light, lineHeight: 1.8, color: C.textMid, fontSize: T.base }}>
                {modal === "sirve" && (
                  <div>
                    <p style={{ marginTop: 0 }}>Muchos hispanohablantes quieren aprender a programar pero los errores siempre salen en inglés. No es tema menor.</p>
                    <p><strong style={{ color: C.burgundy, fontWeight: T.bold }}>El Profesor sirve para:</strong></p>
                    <ul style={{ paddingLeft: S.xl, color: C.textMid }}>
                      <li style={{ marginBottom: S.sm }}>Entender tus errores de código en español</li>
                      <li style={{ marginBottom: S.sm }}>Recibir el código corregido con explicación</li>
                      <li style={{ marginBottom: S.sm }}>Aprender programación sin la barrera del inglés</li>
                      <li style={{ marginBottom: S.sm }}>Arreglar el código que te dio una AI</li>
                    </ul>
                    <p style={{ color: C.textLight, fontSize: T.sm, fontStyle: "italic", marginBottom: 0 }}>Sin registro. Sin costo.</p>
                  </div>
                )}
                {modal === "usar" && (
                  <div>
                    <p style={{ marginTop: 0 }}>Fíjense bien, les voy a explicar paso a paso. No es complicado.</p>
                    <ol style={{ paddingLeft: S.xl, color: C.textMid }}>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Escribe o pega tu código</strong> en el cuadro de abajo.</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Presiona el botón</strong> "Iniciar Debug".</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Espera</strong> mientras El Profesor consulta con sus asesores.</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Lee la respuesta</strong> — El Profesor te explica y da el código correcto.</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Comparte</strong> con tus compas. No cuesta nada.</li>
                    </ol>
                    <p style={{ color: C.textLight, fontSize: T.sm, fontStyle: "italic", marginBottom: 0 }}>También puedes usar los ejemplos de arriba para ver cómo funciona.</p>
                  </div>
                )}
                {modal === "ideas" && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ marginTop: 0, fontSize: T.md }}>Nos da mucho gusto que quieras mejorar al Profesor.</p>
                    <p>Envíanos tus ideas, sugerencias, o errores encontrados:</p>
                    <a href="mailto:dd4100@nyu.edu" style={{ display: "inline-block", marginTop: S.sm, padding: `${S.md}px ${S.xxl}px`, background: C.burgundy, color: C.gold, fontFamily: T.sans, fontWeight: T.bold, fontSize: T.base, letterSpacing: T.wide, textDecoration: "none", border: `1px solid ${C.gold}`, boxShadow: `2px 2px 0 ${C.text}` }}>
                      dd4100@nyu.edu
                    </a>
                    <p style={{ color: C.textLight, fontSize: T.sm, fontStyle: "italic", marginTop: S.lg, marginBottom: 0 }}>Se los agradecemos de antemano.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", gap: S.md, marginBottom: S.xxl, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setModal("sirve")} style={btnSecondary()}>¿Para qué sirve?</button>
          <button onClick={() => setModal("usar")} style={btnSecondary()}>¿Cómo usar al Profesor?</button>
          <button onClick={() => setModal("ideas")} style={btnGhost()}>Ideas para El Profesor</button>
        </div>

        {/* DIVIDER LABEL */}
        <div style={{ display: "flex", alignItems: "center", gap: S.md, marginBottom: S.lg }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ ...label(), letterSpacing: T.widest }}>Ejemplos rápidos</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* EJEMPLOS */}
        <div style={{ marginBottom: S.xxl, display: "flex", gap: S.sm, flexWrap: "wrap" }}>
          {EJEMPLOS.map(ej => (
            <button key={ej.label} onClick={() => setCode(ej.code)} style={{
              padding: `${S.xs}px ${S.md}px`,
              border: `1px solid ${code === ej.code ? C.burgundy : C.border}`,
              background: code === ej.code ? C.burgundy : C.creamDark,
              color: code === ej.code ? C.gold : C.textMid,
              fontSize: T.sm,
              fontFamily: T.sans,
              fontWeight: T.light,
              cursor: "pointer",
              letterSpacing: T.normal_spacing,
              textTransform: "uppercase",
              transition: "all 0.15s",
            }}>{ej.label}</button>
          ))}
        </div>

        {/* INTENTION INPUT */}
        <div style={{ marginBottom: S.md }}>
          <input
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="¿Qué resultado esperas? (opcional) — ej: quiero que imprima solo los números pares · quiero crear un programa para mi negocio"
            style={{
              width: "100%",
              padding: `${S.sm}px ${S.md}px`,
              border: `1px solid ${C.border}`,
              background: C.creamDark,
              color: C.textMid,
              fontSize: T.sm,
              fontFamily: T.sans,
              outline: "none",
              boxSizing: "border-box",
              letterSpacing: T.normal_spacing,
            }}
          />
        </div>

        {/* CODE INPUT */}
        <div style={{ border: `1px solid ${C.burgundy}`, marginBottom: S.md, boxShadow: `2px 2px 0 ${C.burgundy}` }}>
          <div style={{ borderBottom: `1px solid ${C.burgundy}`, padding: `${S.sm}px ${S.lg}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.burgundy }}>
            <span style={{ ...label(), color: C.gold, fontSize: T.xs, letterSpacing: T.wider }}>codigo_sospechoso.py</span>
            <span style={{ ...label(), color: "rgba(200,151,31,0.4)", fontSize: T.xs }}>{code.length > 0 ? `${code.length} chars` : "vacío"}</span>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={"# Pega tu código aquí — tuyo o de ChatGPT/Copilot\n# El Profesor lo arregla sin juzgarte (mucho)"}
            onKeyDown={e => {
              if (e.key === "Tab") {
                e.preventDefault();
                const s = e.target.selectionStart;
                setCode(c => c.substring(0, s) + "    " + c.substring(e.target.selectionEnd));
                setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
              }
            }}
            style={{ width: "100%", minHeight: 200, padding: S.lg, background: C.white, border: "none", outline: "none", color: C.text, fontSize: T.base, lineHeight: 1.8, fontFamily: T.mono, resize: "vertical", boxSizing: "border-box" }}
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button
          onClick={askProfe}
          disabled={loading || !code.trim()}
          style={{ ...btnPrimary(loading || !code.trim()), width: "100%", padding: `${S.lg}px`, marginBottom: S.xxxl, boxShadow: loading || !code.trim() ? "none" : `2px 2px 0 ${C.text}`, letterSpacing: T.widest }}
        >
          {loading ? `... ${LOADING_FRASES[fraseIdx]}` : "Iniciar Debug"}
        </button>

        {/* RESPONSE */}
        {response && (
          <div ref={responseRef} style={{ border: `1px solid ${C.burgundy}`, animation: "fadeIn 0.4s ease", boxShadow: `3px 3px 0 ${C.burgundy}` }}>
            <div style={{ borderBottom: `1px solid ${C.burgundy}`, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.burgundy }}>
              <div>
                <div style={{ fontWeight: T.bold, fontSize: T.sm, color: C.gold, letterSpacing: T.wide, textTransform: "uppercase", fontFamily: T.sans }}>El Profesor</div>
                <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 9 }}>DEBUG · EN ESPAÑOL · CON IA</div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ padding: `${S.xs}px ${S.md}px`, border: `1px solid ${C.gold}`, background: copied ? C.gold : "transparent", color: copied ? C.burgundy : C.gold, fontSize: T.xs, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase", transition: "all 0.2s" }}
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <div style={{ padding: S.xxl, background: C.white, fontFamily: T.mono }}>
              {formatResponse(response)}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, padding: `${S.md}px ${S.xl}px`, background: C.creamDark }}>
              <span style={{ ...label(), letterSpacing: T.wide }}>Comparte con tus compas — no cuesta nada</span>
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        {historial.length > 0 && (
          <div style={{ marginTop: S.xxxl }}>
            <div onClick={() => setShowHistorial(!showHistorial)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: `${S.md}px 0`, borderTop: `1px solid ${C.border}` }}>
              <span style={{ ...label(), letterSpacing: T.widest }}>Tu historial con El Profesor ({historial.length})</span>
              <span style={{ color: C.textLight, fontSize: T.sm }}>{showHistorial ? "▲" : "▼"}</span>
            </div>
            {showHistorial && (
              <div style={{ marginTop: S.sm }}>
                {historial.map(entry => (
                  <div key={entry.id} onClick={() => setCode(entry.codigo.replace("...", ""))} style={{ border: `1px solid ${C.border}`, background: C.white, padding: `${S.md}px ${S.lg}px`, marginBottom: S.sm, cursor: "pointer" }}>
                    <div style={{ ...label(), marginBottom: S.xs }}>{entry.fecha}</div>
                    <div style={{ fontSize: T.sm, color: C.text, fontFamily: T.mono, marginBottom: S.xs }}>{entry.codigo}</div>
                    <div style={{ fontSize: T.sm, color: C.burgundy, fontStyle: "italic" }}>{entry.resumen}</div>
                  </div>
                ))}
                <button onClick={() => { setHistorial([]); setShowHistorial(false); }} style={{ ...btnGhost(), marginTop: S.xs }}>
                  Borrar historial
                </button>
              </div>
            )}
          </div>
        )}

        {/* FOOTER TEXT */}
        <div style={{ textAlign: "center", marginTop: S.xxxl, ...label(), color: C.border, letterSpacing: T.widest }}>
          Python en español · Sin registro · Sin costo
        </div>
      </div>

      {/* BOTTOM STRIPE */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${C.olive}, ${C.gold} 40%, ${C.burgundy})`, marginTop: S.xxxl }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Noto+Sans:wght@300;400;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        textarea::placeholder { color: ${C.border}; font-family: ${T.mono}; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>
    </div>
  );
}
