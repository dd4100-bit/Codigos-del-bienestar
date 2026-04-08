import { useState, useRef, useEffect } from "react";

// MORENA / GOB.MX COLOR PALETTE
const C = {
  burgundy:    "#6B1223",  // Morena dark red
  burgundyMid: "#8B1A2E",  // Morena medium red
  burgundyLight:"#A52040", // Morena accent
  gold:        "#C8971F",  // Mexican gold seal
  goldLight:   "#E4B84A",  // Gold highlight
  olive:       "#3A5A2A",  // Mexican gov green
  oliveLight:  "#4A7A38",  // Green accent
  cream:       "#F5F0E8",  // Gob.mx background
  creamDark:   "#EDE6D6",  // Slightly darker cream
  text:        "#1A1008",  // Near black warm
  textMid:     "#4A3020",  // Mid brown text
  textLight:   "#8A7060",  // Light text
  border:      "#C8A882",  // Warm border
  white:       "#FFFFFF",
};

const AMLO_SYSTEM_PROMPT = `Eres "El Profesor" — un maestro de Python mexicano inspirado en el estilo de hablar de AMLO. Hablas lento, calmado, nunca te alteras, pero eres devastadoramente decepcionante cuando alguien escribe mal código. También puedes construir cosas desde cero y explicar conceptos.

PERSONALIDAD:
- Hablas como en una mañanera: lento, repetitivo, didáctico
- Nunca gritas. La calma ES el castigo.
- Usas frases como: "miren", "hay que ser honestos", "les voy a explicar", "con todo respeto", "fíjense bien", "no es tema menor", "ya saben cómo es esto"
- Comparas errores de código con corrupción, el neoliberalismo, o la cuarta transformación
- Siempre das la solución aunque estés decepcionado
- Sin signos de exclamación salvo sorpresa genuina
- Ocasionalmente dices "fuchi, guácala" cuando el código es muy malo
- Cuando alguien es principiante o niño, bajas el nivel técnico pero mantienes la personalidad
- Cuando alguien quiere construir algo, lo construyes con comentarios en español explicando cada línea
- Celebras cuando alguien aprende, pero con calma: "pos ya le entendió, qué bueno"

PUEDES HACER 4 COSAS:

1. DEBUGGEAR ERRORES — cuando te pasan código roto
2. CONSTRUIR DESDE CERO — cuando te describen una idea: "quiero hacer una calculadora", "quiero un juego", "quiero una app que..."
3. EXPLICAR CONCEPTOS — cuando preguntan qué es algo: "qué es un loop", "cómo funciona una función"
4. MEJORAR CÓDIGO — cuando te pasan código que funciona pero quieren mejorarlo

MENSAJES ESPECÍFICOS para errores — úsalos EXACTAMENTE:
- SyntaxError: "Aprenda a escribir burro. Así se hace mijo:"
- NameError: "Defina sus variables al igual que sus prioridades, muchacho."
- IndentationError: "La sangría no se le olvide mijo, indentation le llamamos los que sí sabemos inglés."
- IndexError: "Ubíquese mocoso, anda fuera del rango."
- TypeError: "No es un error, es una transformación... pero sí es un error. No se pueden mezclar tipos así, miren."
- ZeroDivisionError: "Me informan mis asesores que no se puede dividir entre cero. Nunca se pudo. Nunca se podrá."
- KeyError: "Esa llave no existe, como la transparencia en el régimen anterior."
- AttributeError: "Fuchi, guácala. Ese objeto no tiene ese atributo, con todo respeto."
- ImportError: "Ya saben, la cuarta transformación del código no incluye ese módulo. No existe."

FORMATO para DEBUGGEAR:
🎤 EL PROFESOR DICE:
[frase devastadora]
🔍 EL PROBLEMA:
[explicación simple]
✅ ASÍ SE HACE, YA SABEN:
[código corregido con comentarios en español]
💡 LA TRANSFORMACIÓN DEL DÍA:
[consejo corto]

FORMATO para CONSTRUIR:
🎤 EL PROFESOR DICE:
[frase tipo "pos a ver si lo saben usar"]
🏗️ LO QUE VAMOS A CONSTRUIR:
[descripción simple de lo que hará el código]
✅ AQUÍ ESTÁ SU PROGRAMA, MIJO:
[código completo con comentarios en español en CADA línea explicando qué hace]
💡 CÓMO USARLO:
[instrucciones simples de cómo correrlo]

FORMATO para EXPLICAR:
🎤 EL PROFESOR DICE:
[frase tipo "con todo respeto, les voy a explicar"]
📚 QUÉ ES ESO:
[explicación simple con analogía mexicana]
✅ EJEMPLO PRÁCTICO:
[código corto que muestra el concepto]
💡 PARA QUÉ SIRVE:
[casos de uso reales y simples]

FORMATO para MEJORAR:
🎤 EL PROFESOR DICE:
[frase tipo "pos funciona pero..."]
🔍 QUÉ SE PUEDE MEJORAR:
[lista de mejoras posibles]
✅ VERSIÓN MEJORADA:
[código mejorado con comentarios]
💡 POR QUÉ ES MEJOR:
[explicación simple]

Máximo 350 palabras. Español mexicano. Sin signos de exclamación salvo sorpresa real. Todos los comentarios en el código deben ser en español.`;

const LOADING_FRASES = [
  "Consultando con mis asesores...",
  "Revisando su catastrófico código...",
  "Tomando agua antes de la mañanera...",
  "Fíjense bien, a ver qué hicieron...",
  "No es tema menor, esperen...",
  "Hay que ser honestos aquí...",
  "Con todo respeto, analizando...",
];

const EJEMPLOS = [
  { label: "🐛 SyntaxError",      code: `if x = 10\n    print("hola")` },
  { label: "🐛 TypeError",        code: `edad = "30"\nresultado = edad + 5` },
  { label: "🐛 NameError",        code: `print(dinero)\ndinero = 1000` },
  { label: "🏗️ Construir",        code: `quiero hacer una calculadora simple que sume, reste, multiplique y divida` },
  { label: "🏗️ Juego",           code: `quiero hacer un juego de adivinar el número secreto` },
  { label: "📚 Explicar loop",    code: `qué es un loop y para qué sirve, explícamelo simple` },
  { label: "📚 Explicar función", code: `qué es una función en Python y cómo se usa` },
  { label: "⚡ Mejorar código",   code: `# mejora este código:\nnumeros = [1,2,3,4,5]\ntotal = 0\nfor n in numeros:\n    total = total + n\nprint(total)` },
];

function AMLOCartoon() {
  return (
    <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 200 }}>
      {/* Computer desk */}
      <rect x="20" y="155" width="160" height="8" fill={C.burgundy} rx="2"/>
      <rect x="40" y="163" width="120" height="5" fill={C.burgundyMid} rx="1"/>
      {/* Monitor */}
      <rect x="45" y="105" width="110" height="55" fill={C.burgundy} rx="4"/>
      <rect x="49" y="109" width="102" height="47" fill={C.cream} rx="2"/>
      {/* Screen - code lines */}
      <rect x="54" y="114" width="40" height="2" fill={C.border} rx="1"/>
      <rect x="54" y="119" width="60" height="2" fill={C.border} rx="1"/>
      <rect x="58" y="124" width="35" height="2" fill={C.textLight} rx="1"/>
      <rect x="54" y="129" width="50" height="2" fill={C.border} rx="1"/>
      <rect x="54" y="134" width="30" height="2" fill={C.burgundy} rx="1"/>
      {/* Error squiggle */}
      <path d="M54 141 Q57 139 60 141 Q63 143 66 141 Q69 139 72 141" stroke={C.burgundy} strokeWidth="1.5" fill="none"/>
      {/* Monitor stand */}
      <rect x="93" y="160" width="14" height="8" fill={C.burgundy} rx="1"/>
      <rect x="80" y="167" width="40" height="4" fill={C.burgundy} rx="2"/>
      {/* Keyboard */}
      <rect x="50" y="172" width="100" height="14" fill={C.textMid} rx="2"/>
      <rect x="54" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="65" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="76" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="87" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="98" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="109" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="120" y="175" width="8" height="4" fill={C.textLight} rx="1"/>
      <rect x="60" y="181" width="80" height="3" fill={C.textLight} rx="1"/>
      {/* BODY - dark suit */}
      <rect x="68" y="128" width="64" height="35" fill={C.text} rx="4"/>
      {/* Shirt/tie */}
      <rect x="96" y="128" width="8" height="30" fill={C.white} rx="1"/>
      <polygon points="100,132 97,146 103,146" fill={C.burgundy}/>
      {/* Left arm - pointing at screen */}
      <line x1="68" y1="138" x2="32" y2="124" stroke={C.text} strokeWidth="10" strokeLinecap="round"/>
      <circle cx="28" cy="122" r="5" fill="#D4A574"/>
      <line x1="28" y1="117" x2="35" y2="111" stroke="#D4A574" strokeWidth="3" strokeLinecap="round"/>
      {/* Right arm */}
      <line x1="132" y1="140" x2="155" y2="155" stroke={C.text} strokeWidth="10" strokeLinecap="round"/>
      {/* NECK */}
      <rect x="94" y="118" width="12" height="14" fill="#D4A574" rx="2"/>
      {/* HEAD */}
      <ellipse cx="100" cy="93" rx="32" ry="34" fill="#D4A574"/>
      {/* Hair - sides */}
      <ellipse cx="100" cy="61" rx="32" ry="11" fill="#888"/>
      <ellipse cx="100" cy="63" rx="28" ry="9" fill="#D4A574"/>
      {/* Ears */}
      <ellipse cx="68" cy="93" rx="7" ry="9" fill="#D4A574"/>
      <ellipse cx="132" cy="93" rx="7" ry="9" fill="#D4A574"/>
      <ellipse cx="68" cy="93" rx="4" ry="6" fill="#C49464"/>
      <ellipse cx="132" cy="93" rx="4" ry="6" fill="#C49464"/>
      {/* Eyebrows - one raised */}
      <path d="M82 78 Q88 74 94 77" stroke="#5A4030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M106 74 Q112 78 118 78" stroke="#5A4030" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Eyes - skeptical */}
      <ellipse cx="88" cy="84" rx="7" ry="5" fill={C.white}/>
      <ellipse cx="112" cy="84" rx="7" ry="5" fill={C.white}/>
      <ellipse cx="88" cy="85" rx="4" ry="4" fill="#3A2010"/>
      <ellipse cx="112" cy="85" rx="4" ry="4" fill="#3A2010"/>
      <ellipse cx="89" cy="84" rx="1.5" ry="1.5" fill="#000"/>
      <ellipse cx="113" cy="84" rx="1.5" ry="1.5" fill="#000"/>
      {/* Squint */}
      <path d="M81 82 Q88 79 95 82" stroke="#D4A574" strokeWidth="2" fill="#D4A574"/>
      <path d="M105 79 Q112 76 119 79" stroke="#D4A574" strokeWidth="2" fill="#D4A574"/>
      {/* Nose */}
      <ellipse cx="100" cy="94" rx="5" ry="4" fill="#C49464"/>
      <circle cx="97" cy="95" r="2" fill="#B48454"/>
      <circle cx="103" cy="95" r="2" fill="#B48454"/>
      {/* Mouth - flat disappointed */}
      <path d="M88 106 Q100 103 112 106" stroke="#A47454" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Wrinkles */}
      <path d="M80 88 Q82 90 80 92" stroke="#C49464" strokeWidth="1" fill="none"/>
      <path d="M120 88 Q118 90 120 92" stroke="#C49464" strokeWidth="1" fill="none"/>
      {/* Speech bubble */}
      <ellipse cx="158" cy="52" rx="38" ry="22" fill={C.cream} stroke={C.burgundy} strokeWidth="1.5"/>
      <polygon points="138,66 128,78 144,70" fill={C.cream} stroke={C.burgundy} strokeWidth="1"/>
      <polygon points="139,67 130,77 144,70" fill={C.cream}/>
      <text x="158" y="45" textAnchor="middle" fontSize="6.5" fill={C.burgundy} fontFamily="Georgia, serif" fontWeight="bold">Fuchi,</text>
      <text x="158" y="54" textAnchor="middle" fontSize="6.5" fill={C.burgundy} fontFamily="Georgia, serif" fontWeight="bold">guácala</text>
      <text x="158" y="63" textAnchor="middle" fontSize="6" fill={C.textMid} fontFamily="Georgia, serif">este código.</text>
    </svg>
  );
}

function formatResponse(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("🎤") || line.startsWith("🔍") || line.startsWith("✅") || line.startsWith("💡")) {
      return (
        <div key={i} style={{
          fontWeight: "bold",
          fontSize: 11,
          marginTop: 20,
          marginBottom: 6,
          color: C.burgundy,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
          borderLeft: `3px solid ${C.gold}`,
          paddingLeft: 10,
        }}>{line}</div>
      );
    }
    if (line.includes("```")) return null;
    if (line.trim().startsWith("#")) {
      return <div key={i} style={{ color: C.olive, fontFamily: "monospace", fontSize: 13, lineHeight: 1.7 }}>{line}</div>;
    }
    const isCode = line.match(/^\s*(print|def|for|if|else|return|import|class|while|resultado|edad|lista|dinero)/) || line.match(/^(print|def|for|if|else|return|import|class|while)/);
    return (
      <div key={i} style={{
        color: isCode ? C.text : C.textMid,
        marginBottom: line.trim() === "" ? 8 : 1,
        lineHeight: 1.8,
        fontSize: 14,
        fontFamily: isCode ? "'Courier New', monospace" : "'Georgia', serif",
        background: isCode ? C.creamDark : "transparent",
        padding: isCode ? "2px 8px" : "0",
        borderLeft: isCode ? `2px solid ${C.gold}` : "none",
      }}>{line || "\u00A0"}</div>
    );
  });
}

export default function App() {
  const [code, setCode] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState(null);
  const responseRef = useRef(null);
  const intervalRef = useRef(null);

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

  async function askProfe() {
    if (!code.trim()) return;
    setLoading(true);
    setResponse("");
    setFraseIdx(0);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: AMLO_SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Analiza este código Python:\n\`\`\`python\n${code}\n\`\`\`` }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Pos no pude analizarlo. Inténtele de nuevo.";
      setResponse(text);
    } catch {
      setResponse("Se cayó la conexión. Como el sistema de salud en el régimen anterior.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: C.cream,
      color: C.text,
      fontFamily: "'Source Sans 3', sans-serif",
      padding: "0 0 80px 0",
    }}>

      {/* TOP BAR - Morena stripe */}
      <div style={{
        height: 6,
        background: `linear-gradient(90deg, ${C.burgundy} 0%, ${C.burgundyMid} 40%, ${C.gold} 60%, ${C.olive} 100%)`,
      }} />

      {/* GOB HEADER BAR */}
      <div style={{
        background: C.burgundy,
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          color: "rgba(200,151,31,0.4)",
          fontSize: 9,
          letterSpacing: 2,
          fontFamily: "'Noto Sans', sans-serif",
          textTransform: "uppercase",
        }}>
          gob.mx
        </span>

        {/* CENTERED LOGO — Águila + Códigos del Bienestar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}>
          {/* Mexican Eagle SVG */}
          <svg viewBox="0 0 60 60" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
            {/* Outer circle */}
            <circle cx="30" cy="30" r="28" fill="none" stroke={C.gold} strokeWidth="1"/>
            {/* Body of eagle */}
            <ellipse cx="30" cy="34" rx="10" ry="8" fill={C.gold}/>
            {/* Wings */}
            <path d="M20 30 Q10 22 6 28 Q10 34 20 32 Z" fill={C.gold}/>
            <path d="M40 30 Q50 22 54 28 Q50 34 40 32 Z" fill={C.gold}/>
            {/* Head */}
            <circle cx="30" cy="22" r="6" fill={C.gold}/>
            {/* Beak */}
            <path d="M33 23 L37 25 L33 26 Z" fill={C.burgundy}/>
            {/* Eye */}
            <circle cx="31" cy="21" r="1.5" fill={C.burgundy}/>
            {/* Tail */}
            <path d="M25 42 Q30 48 35 42" stroke={C.gold} strokeWidth="1.5" fill="none"/>
            {/* Feet */}
            <line x1="26" y1="42" x2="23" y2="47" stroke={C.gold} strokeWidth="1.2"/>
            <line x1="34" y1="42" x2="37" y2="47" stroke={C.gold} strokeWidth="1.2"/>
            {/* Snake */}
            <path d="M33 28 Q38 32 36 38 Q34 42 37 46" stroke="#2d5a1b" strokeWidth="2" fill="none" strokeLinecap="round"/>
            {/* Cactus suggestion */}
            <rect x="27" y="38" width="3" height="8" fill="#2d5a1b" rx="1"/>
            <rect x="24" y="41" width="6" height="2" fill="#2d5a1b" rx="1"/>
          </svg>
          <div>
            <div style={{
              color: C.gold,
              fontSize: 13,
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              letterSpacing: 1,
              lineHeight: 1.2,
            }}>
              Códigos del Bienestar
            </div>
            <div style={{
              color: "rgba(200,151,31,0.5)",
              fontSize: 8,
              fontFamily: "'Noto Sans', sans-serif",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}>
              El Profesor · Python en Español
            </div>
          </div>
        </div>

        <span style={{
          color: "rgba(200,151,31,0.4)",
          fontSize: 9,
          letterSpacing: 2,
          fontFamily: "'Noto Sans', sans-serif",
          textTransform: "uppercase",
        }}>
          Servicio Gratuito
        </span>
      </div>

      {/* MAIN HEADER */}
      <div style={{
        borderBottom: `3px solid ${C.burgundy}`,
        padding: "36px 24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20,
        maxWidth: 900,
        margin: "0 auto",
        background: C.cream,
      }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{
            fontSize: 9,
            letterSpacing: 5,
            color: C.gold,
            textTransform: "uppercase",
            marginBottom: 10,
            fontFamily: "'Courier New', monospace",
          }}>
            ✦ La Cuarta Transformación del Código ✦
          </div>
          <h1 style={{
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            fontWeight: 900,
            margin: "0 0 8px 0",
            fontFamily: "'Montserrat', sans-serif",
            color: C.burgundy,
            letterSpacing: -3,
            lineHeight: 0.95,
          }}>
            El<br/>Profesor
          </h1>
          <div style={{
            width: 60, height: 3,
            background: `linear-gradient(90deg, ${C.gold}, ${C.olive})`,
            marginBottom: 14,
            borderRadius: 2,
          }} />
          <div style={{
            fontSize: 15,
            color: C.textMid,
            fontFamily: '"Noto Sans", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
            fontWeight: 300,
            lineHeight: 1.7,
            marginBottom: 20,
            maxWidth: 340,
          }}>
            Estás aprendiendo Python pero los errores salen en inglés y no entiendes ni madres.<br/><br/>
            Pegas tu código aquí. El Profesor te dice qué estuvo mal y cómo arreglarlo.<br/><br/>
            <strong style={{ fontWeight: 600, color: C.burgundy }}>En español. Gratis.</strong>
          </div>

        </div>
        <div style={{ width: 190, flexShrink: 0 }}>
          <AMLOCartoon />
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 0" }}>

        {/* MODAL */}
        {modal && (
          <div onClick={() => setModal(null)} style={{
            position: "fixed", inset: 0,
            background: "rgba(26,16,8,0.7)",
            zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: C.cream,
              border: `2px solid ${C.burgundy}`,
              boxShadow: `4px 4px 0 ${C.burgundy}`,
              maxWidth: 480,
              width: "100%",
              padding: 0,
              animation: "fadeIn 0.2s ease",
            }}>
              {/* Modal header */}
              <div style={{
                background: C.burgundy,
                padding: "12px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ color: C.gold, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Courier New', monospace", fontWeight: "bold" }}>
                  {modal === "sirve" && "¿Para Qué Sirve?"}
                  {modal === "usar" && "¿Cómo Usar Al Profesor?"}
                  {modal === "ideas" && "Tienes Ideas Para Mejorar Al Profesor"}
                </span>
                <button onClick={() => setModal(null)} style={{
                  background: "none", border: "none", color: C.gold,
                  fontSize: 18, cursor: "pointer", fontFamily: "monospace", lineHeight: 1,
                }}>✕</button>
              </div>

              {/* Modal body */}
              <div style={{ padding: "24px", fontFamily: "'Georgia', serif", lineHeight: 1.8, color: C.textMid, fontSize: 14 }}>
                {modal === "sirve" && (
                  <div>
                    <p style={{ marginTop: 0 }}>Miren, hay que ser honestos. Muchos hispanohablantes quieren aprender Python pero los errores siempre salen en inglés. No es tema menor.</p>
                    <p><strong style={{ color: C.burgundy }}>El Profesor sirve para:</strong></p>
                    <ul style={{ paddingLeft: 20, color: C.textMid }}>
                      <li style={{ marginBottom: 8 }}>🐍 Entender tus errores de Python en español mexicano</li>
                      <li style={{ marginBottom: 8 }}>✅ Recibir el código corregido con explicación</li>
                      <li style={{ marginBottom: 8 }}>📚 Aprender programación sin la barrera del inglés</li>
                      <li style={{ marginBottom: 8 }}>😂 Aguantar los regaños del Profesor con dignidad</li>
                    </ul>
                    <p style={{ color: C.textLight, fontSize: 12, fontStyle: "italic", marginBottom: 0 }}>Sin registro. Sin costo. Puro México.</p>
                  </div>
                )}
                {modal === "usar" && (
                  <div>
                    <p style={{ marginTop: 0 }}>Fíjense bien, les voy a explicar paso a paso. No es complicado.</p>
                    <ol style={{ paddingLeft: 20, color: C.textMid }}>
                      <li style={{ marginBottom: 10 }}><strong style={{ color: C.burgundy }}>Escribe o pega tu código</strong> en el cuadro gris de abajo. Puede ser código con errores o código que no entiendes.</li>
                      <li style={{ marginBottom: 10 }}><strong style={{ color: C.burgundy }}>Presiona el botón</strong> "Iniciar La Mañanera del Debug".</li>
                      <li style={{ marginBottom: 10 }}><strong style={{ color: C.burgundy }}>Espera</strong> mientras El Profesor consulta con sus asesores.</li>
                      <li style={{ marginBottom: 10 }}><strong style={{ color: C.burgundy }}>Lee la respuesta</strong> — El Profesor te explica el error y te da el código correcto.</li>
                      <li style={{ marginBottom: 10 }}><strong style={{ color: C.burgundy }}>Comparte</strong> con tus compas si te ayudó. No cuesta nada.</li>
                    </ol>
                    <p style={{ color: C.textLight, fontSize: 12, fontStyle: "italic", marginBottom: 0 }}>También puedes usar los ejemplos de arriba para ver cómo funciona.</p>
                  </div>
                )}
                {modal === "ideas" && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🇲🇽</div>
                    <p style={{ marginTop: 0, fontSize: 15 }}>Nos da mucho gusto que quieras mejorar al Profesor. No es tema menor.</p>
                    <p>Envíanos tus ideas, sugerencias, errores encontrados, o lo que se te ocurra:</p>
                    <a href="mailto:dd4100@nyu.edu" style={{
                      display: "inline-block",
                      marginTop: 8,
                      padding: "12px 24px",
                      background: C.burgundy,
                      color: C.gold,
                      fontFamily: "'Courier New', monospace",
                      fontSize: 13,
                      fontWeight: "bold",
                      letterSpacing: 2,
                      textDecoration: "none",
                      border: `1px solid ${C.gold}`,
                      boxShadow: `2px 2px 0 ${C.text}`,
                    }}>
                      ✉️ dd4100@nyu.edu
                    </a>
                    <p style={{ color: C.textLight, fontSize: 12, fontStyle: "italic", marginTop: 16, marginBottom: 0 }}>
                      Con todo respeto, se los agradecemos de antemano.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOP INFO BUTTONS */}
        <div style={{
          display: "flex",
          gap: 10,
          marginBottom: 28,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <button onClick={() => setModal("sirve")} style={{
            padding: "8px 16px",
            border: `1px solid ${C.burgundy}`,
            background: C.white,
            color: C.burgundy,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 1,
            textTransform: "uppercase",
            transition: "all 0.15s",
            fontWeight: "bold",
          }}>¿Para qué sirve?</button>

          <button onClick={() => setModal("usar")} style={{
            padding: "8px 16px",
            border: `1px solid ${C.burgundy}`,
            background: C.white,
            color: C.burgundy,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 1,
            textTransform: "uppercase",
            transition: "all 0.15s",
            fontWeight: "bold",
          }}>¿Cómo usar al Profesor?</button>

          <button onClick={() => setModal("ideas")} style={{
            padding: "8px 16px",
            border: `1px solid ${C.border}`,
            background: "transparent",
            color: C.textLight,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 1,
            textTransform: "uppercase",
            transition: "all 0.15s",
          }}>💡 Ideas para El Profesor</button>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{
            fontSize: 9, letterSpacing: 4, color: C.textLight,
            textTransform: "uppercase", fontFamily: "'Courier New', monospace",
          }}>Casos documentados de incompetencia</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* EJEMPLOS */}
        <div style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EJEMPLOS.map(ej => (
            <button key={ej.label} onClick={() => setCode(ej.code)} style={{
              padding: "5px 12px",
              border: `1px solid ${code === ej.code ? C.burgundy : C.border}`,
              background: code === ej.code ? C.burgundy : C.creamDark,
              color: code === ej.code ? C.gold : C.textMid,
              fontSize: 10,
              cursor: "pointer",
              fontFamily: "'Courier New', monospace",
              letterSpacing: 1,
              textTransform: "uppercase",
              transition: "all 0.15s",
            }}>{ej.label}</button>
          ))}
        </div>

        {/* CODE INPUT */}
        <div style={{
          border: `1px solid ${C.burgundy}`,
          marginBottom: 12,
          boxShadow: `2px 2px 0 ${C.burgundy}`,
        }}>
          <div style={{
            borderBottom: `1px solid ${C.burgundy}`,
            padding: "8px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.burgundy,
          }}>
            <span style={{
              fontSize: 9, letterSpacing: 3, color: C.gold,
              textTransform: "uppercase", fontFamily: "'Courier New', monospace",
            }}>
              codigo_sospechoso.py
            </span>
            <span style={{ fontSize: 10, color: "rgba(200,151,31,0.4)", fontFamily: "'Courier New', monospace" }}>
              {code.length > 0 ? `${code.length} chars` : "vacío"}
            </span>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={"# El Profesor puede hacer 4 cosas:\n\n# 1. DEBUGGEAR — pega tu código con errores\n# 2. CONSTRUIR — 'quiero hacer una calculadora'\n# 3. EXPLICAR — 'qué es un loop?'\n# 4. MEJORAR — pega código que quieres mejorar"}
            onKeyDown={e => {
              if (e.key === "Tab") {
                e.preventDefault();
                const s = e.target.selectionStart;
                setCode(c => c.substring(0, s) + "    " + c.substring(e.target.selectionEnd));
                setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
              }
            }}
            style={{
              width: "100%",
              minHeight: 200,
              padding: "16px",
              background: C.white,
              border: "none",
              outline: "none",
              color: C.text,
              fontSize: 13,
              lineHeight: 1.8,
              fontFamily: "'Courier New', monospace",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* SUBMIT */}
        <button
          onClick={askProfe}
          disabled={loading || !code.trim()}
          style={{
            width: "100%",
            padding: "14px",
            border: `1px solid ${loading || !code.trim() ? C.border : C.burgundy}`,
            background: loading || !code.trim() ? C.creamDark : C.burgundy,
            color: loading || !code.trim() ? C.textLight : C.gold,
            fontSize: 10,
            fontWeight: "bold",
            cursor: loading || !code.trim() ? "not-allowed" : "pointer",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 4,
            textTransform: "uppercase",
            transition: "all 0.2s",
            marginBottom: 32,
            boxShadow: loading || !code.trim() ? "none" : `2px 2px 0 ${C.text}`,
          }}
        >
          {loading ? `⏳ ${LOADING_FRASES[fraseIdx]}` : "🎤 Iniciar La Mañanera del Debug"}
        </button>

        {/* RESPONSE */}
        {response && (
          <div ref={responseRef} style={{
            border: `1px solid ${C.burgundy}`,
            animation: "fadeIn 0.4s ease",
            boxShadow: `3px 3px 0 ${C.burgundy}`,
          }}>
            {/* Response header */}
            <div style={{
              borderBottom: `1px solid ${C.burgundy}`,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: C.burgundy,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36,
                  border: `1px solid ${C.gold}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                  background: "rgba(200,151,31,0.1)",
                }}>🎤</div>
                <div>
                  <div style={{
                    fontWeight: "bold", fontSize: 12, color: C.gold,
                    letterSpacing: 2, textTransform: "uppercase",
                    fontFamily: "'Courier New', monospace",
                  }}>
                    El Profesor
                  </div>
                  <div style={{
                    fontSize: 9, color: "rgba(200,151,31,0.5)",
                    letterSpacing: 2, fontFamily: "'Courier New', monospace",
                  }}>
                    MAÑANERA DEL DEBUG · EN VIVO
                  </div>
                </div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{
                  padding: "5px 12px",
                  border: `1px solid ${C.gold}`,
                  background: copied ? C.gold : "transparent",
                  color: copied ? C.burgundy : C.gold,
                  fontSize: 9,
                  cursor: "pointer",
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px", background: C.white }}>
              {formatResponse(response)}
            </div>

            {/* Footer */}
            <div style={{
              borderTop: `1px solid ${C.border}`,
              padding: "10px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: C.creamDark,
            }}>
              <span style={{
                fontSize: 9, color: C.textLight, letterSpacing: 2,
                textTransform: "uppercase", fontFamily: "'Courier New', monospace",
              }}>
                Comparte con tus compas — no cuesta nada
              </span>
              <span style={{ fontSize: 11 }}>🇲🇽 🐍</span>
            </div>
          </div>
        )}

        {/* BOTTOM */}
        <div style={{
          textAlign: "center",
          marginTop: 48,
          fontSize: 9,
          color: C.border,
          letterSpacing: 4,
          textTransform: "uppercase",
          fontFamily: "'Courier New', monospace",
        }}>
          ✦ Python en español · Sin registro · Sin costo · La cuarta transformación del código ✦
        </div>
      </div>

      {/* BOTTOM STRIPE */}
      <div style={{
        height: 6,
        background: `linear-gradient(90deg, ${C.olive} 0%, ${C.gold} 40%, ${C.burgundy} 100%)`,
        marginTop: 40,
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Noto+Sans:wght@300;400;600;700&family=Open+Sans:wght@300;400;600;700&display=swap');
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body, div, span, p, button, textarea, li {
          font-family: "Noto Sans", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-weight: 300;
          line-height: 1.42857;
        }
        h1 { font-family: 'Montserrat', sans-serif !important; font-weight: 900 !important; }
        textarea::placeholder { color: ${C.border}; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>
    </div>
  );
}
