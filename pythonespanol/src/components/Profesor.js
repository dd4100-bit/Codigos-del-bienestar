import { useState, useRef, useEffect } from "react";
import { C, T, S, label, btnPrimary, btnSecondary, btnGhost, AMLO_SYSTEM_PROMPT, LOADING_FRASES, EJEMPLOS } from "../constants";
import { AMLOCartoon, formatResponse } from "./utils";
import Terminal from "./Terminal";
import { supabase } from "../lib/supabase";

// ── File attachment helpers ────────────────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function getPdfJs() {
  if (!window.pdfjsLib) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  return window.pdfjsLib;
}

async function getJSZip() {
  if (!window.JSZip) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  }
  return window.JSZip;
}

const TEXT_EXTS = new Set([
  "py","js","ts","jsx","tsx","java","c","cpp","cs","go","rb","php","swift",
  "kt","rs","sh","bash","zsh","sql","html","css","scss","less","json","xml",
  "yaml","yml","toml","ini","cfg","conf","env","txt","md","csv","r","m","pl",
]);

async function extractTextFromFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  // Plain text / code
  if (TEXT_EXTS.has(ext)) return await file.text();

  // PDF
  if (ext === "pdf") {
    const pdfjsLib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map(it => it.str).join(" "));
    }
    return pages.join("\n\n");
  }

  // DOCX / PAGES (both are ZIP archives)
  if (ext === "docx" || ext === "pages") {
    const JSZip = await getJSZip();
    const zip = await JSZip.loadAsync(file);
    const xmlFile = ext === "docx"
      ? zip.files["word/document.xml"]
      : zip.files["index.xml"] ?? zip.files["QuickLook/Preview.pdf"];

    if (ext === "pages" && xmlFile?.name?.endsWith(".pdf")) {
      // Fallback: extract the PDF preview inside .pages
      const pdfData = await xmlFile.async("arraybuffer");
      const pdfjsLib = await getPdfJs();
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(it => it.str).join(" "));
      }
      return pages.join("\n\n");
    }

    if (!xmlFile) throw new Error(`No se encontró contenido en el archivo ${ext}`);
    const xml = await xmlFile.async("string");
    // Strip XML tags, collapse whitespace
    return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  // DOC (binary) — extract printable ASCII strings
  if (ext === "doc") {
    const ab = await file.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      const c = bytes[i];
      if ((c >= 32 && c < 127) || c === 10 || c === 13) result += String.fromCharCode(c);
    }
    // Keep runs of printable chars ≥ 4 long (filter binary noise)
    return result.match(/[\x20-\x7E\n\r]{4,}/g)?.join("\n") ?? "";
  }

  // Unknown — try as text anyway
  return await file.text();
}

export default function Profesor({ code, setCode, images, setImages, runPython, onStartTutor, pyodideReady, terminalOutput, setTerminalOutput, terminalLoading, user, onSignOut }) {
  const [intention, setIntention] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);

  // ── Offline quiz state ──────────────────────────────────────────────────
  const [offlineModal, setOfflineModal]       = useState(false);
  const [selectedIds, setSelectedIds]         = useState([]);
  const [offlineProgress, setOfflineProgress] = useState(null); // { current, total, label }
  const [offlineDone, setOfflineDone]         = useState(false);
  const [offlineCount, setOfflineCount]       = useState(0);

  const [attachedFile, setAttachedFile]   = useState(null); // { name } | null
  const [attachLoading, setAttachLoading] = useState(false);

  const fileInputRef   = useRef(null);
  const attachInputRef = useRef(null);
  const responseRef    = useRef(null);
  const intervalRef    = useRef(null);

  // Load historial — Supabase when authenticated, localStorage as fallback
  useEffect(() => {
    async function loadHistorial() {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("conversations")
            .select("id, fecha, codigo, resumen")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);
          if (!error && data?.length) {
            setHistorial(data);
            return;
          }
        } catch {}
      }
      // Fallback: localStorage (also used when not logged in)
      try {
        const s = localStorage.getItem("elprofesor_historial");
        if (s) setHistorial(JSON.parse(s));
      } catch {}
    }
    loadHistorial();
  }, [user?.id]); // eslint-disable-line

  // Keep localStorage in sync as offline backup
  useEffect(() => {
    try { localStorage.setItem("elprofesor_historial", JSON.stringify(historial)); } catch {}
  }, [historial]);

  useEffect(() => {
    if (loading) { intervalRef.current = setInterval(() => setFraseIdx(i => (i + 1) % LOADING_FRASES.length), 1400); }
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [loading]);

  useEffect(() => {
    if (response && responseRef.current) responseRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [response]);

  async function saveToHistorial(codigo, respuesta) {
    const fecha   = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const codSnip = codigo.substring(0, 80)  + (codigo.length > 80  ? "..." : "");
    const resSnip = respuesta.substring(0, 120) + "...";

    if (user?.id) {
      // Save to Supabase — use the returned id as the local entry id
      try {
        const { data } = await supabase.from("conversations").insert({
          user_id: user.id,
          fecha,
          codigo:  codSnip,
          resumen: resSnip,
        }).select("id").single();

        const entry = { id: data?.id ?? Date.now(), fecha, codigo: codSnip, resumen: resSnip };
        setHistorial(prev => [entry, ...prev].slice(0, 10));
        return;
      } catch {}
    }

    // Fallback: localStorage-only entry
    const entry = { id: Date.now(), fecha, codigo: codSnip, resumen: resSnip };
    setHistorial(prev => [entry, ...prev].slice(0, 10));
  }

  // ── Offline quiz generation ─────────────────────────────────────────────

  function closeOfflineModal() {
    if (offlineProgress) return;      // don't close while generating
    setOfflineModal(false);
    setSelectedIds([]);
    setOfflineDone(false);
    setOfflineProgress(null);
  }

  function toggleEntry(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function generateOfflineQuestionsForEntry(entry) {
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
        max_tokens: 2200,
        system: `Eres un generador de preguntas de quiz para Code Combat, un juego educativo de Python en español. Generas preguntas de opción múltiple personalizadas al código del estudiante. Responde SOLO con un array JSON válido, sin texto adicional ni markdown.`,
        messages: [{
          role: "user",
          content: `El estudiante tuvo esta sesión con El Profesor:
Código: ${entry.codigo}
Análisis: ${entry.resumen}

Genera exactamente 5 preguntas de quiz Python relacionadas con los errores que aparecen en esta sesión.
Para cada pregunta elige el errorType más adecuado de: SyntaxError, NameError, IndexError, TypeError, IndentationError, KeyError, AttributeError, ImportError.

Responde SOLO con este JSON array (sin markdown, sin texto adicional):
[
  {
    "errorType": "SyntaxError",
    "code": "código Python de 3-7 líneas (usa \\n para saltos)",
    "question": "pregunta breve en español",
    "options": ["opción A", "opción B", "opción C", "opción D"],
    "correct": 0,
    "explanation": "1-2 oraciones explicando la respuesta"
  }
]
"correct" es el índice 0-3 de la opción correcta.`,
        }],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array");
    const questions = JSON.parse(match[0]);
    // Validate shape
    if (!Array.isArray(questions) || !questions.length) throw new Error("Empty array");
    return questions.filter(q =>
      q.errorType && q.code && q.question &&
      Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correct === "number"
    );
  }

  async function prepareOfflineQuizzes() {
    const entries = historial.filter(e => selectedIds.includes(e.id));
    if (!entries.length) return;

    const byErrorType = {};

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      setOfflineProgress({
        current: i + 1,
        total:   entries.length,
        label:   entry.codigo.substring(0, 45) + (entry.codigo.length > 45 ? "…" : ""),
      });

      try {
        const questions = await generateOfflineQuestionsForEntry(entry);
        questions.forEach(q => {
          if (!byErrorType[q.errorType]) byErrorType[q.errorType] = [];
          byErrorType[q.errorType].push(q);
        });
      } catch {
        // Skip failed entries — keep going
      }
    }

    const total = Object.values(byErrorType).flat().length;
    const payload = { saved_at: new Date().toISOString(), byErrorType, totalQuestions: total };

    // Save to localStorage (always)
    try { localStorage.setItem("offline_quizzes", JSON.stringify(payload)); } catch {}

    // Sync to Supabase (when authenticated)
    if (user?.id) {
      try {
        await supabase.from("offline_quizzes").upsert(
          { user_id: user.id, content: payload },
          { onConflict: "user_id" }
        );
      } catch {}
    }

    setOfflineCount(total);
    setOfflineProgress(null);
    setOfflineDone(true);
  }

  function readImageFile(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result.split(",")[1], mediaType: file.type, preview: reader.result });
      reader.readAsDataURL(file);
    });
  }

  async function addImages(files) {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    const newImgs = await Promise.all(valid.map(readImageFile));
    setImages(prev => [...prev, ...newImgs].slice(0, 20));
  }

  function handleImageUpload(e) {
    addImages(e.target.files);
  }

  async function handleFileAttach(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAttachLoading(true);
    try {
      const text = await extractTextFromFile(file);
      setCode(text);
      setImages([]);
      setAttachedFile({ name: file.name });
    } catch (err) {
      setCode(`# Error al leer el archivo: ${err.message}`);
      setAttachedFile({ name: file.name });
    }
    setAttachLoading(false);
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function askProfe() {
    if (!code.trim() && !images.length) return;
    setLoading(true);
    setResponse("");
    setFraseIdx(0);
    try {
      const userContent = images.length
        ? [
            ...images.map(img => ({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.base64 } })),
            { type: "text", text: `Analiza el código que aparece en ${images.length > 1 ? "estas imágenes" : "esta imagen"}.${code.trim() ? `\n\nContexto adicional: ${code.trim()}` : ""}${intention.trim() ? `\n\nResultado esperado: ${intention.trim()}` : ""}` },
          ]
        : [
            { type: "text", text: `Analiza este código:\n\`\`\`\n${code}\n\`\`\`${intention.trim() ? `\n\nResultado esperado: ${intention.trim()}` : ""}` },
          ];

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
          stream: true,
          system: AMLO_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      setLoading(false);

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
              setResponse(fullText);
            }
          } catch {}
        }
      }

      saveToHistorial(images.length ? `[${images.length} imagen(es) subida(s)]` : code, fullText);
    } catch {
      setLoading(false);
      setResponse("Se cayó la conexión. Como el sistema de salud en el régimen anterior.");
    }
    setLoading(false);
  }

  const isDisabled = loading || (!code.trim() && !images.length);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, color: C.text, fontFamily: T.sans, fontWeight: T.light, padding: "0 0 80px 0" }}>

      <div style={{ height: 6, background: `linear-gradient(90deg, ${C.burgundy}, ${C.burgundyMid} 40%, ${C.gold} 60%, ${C.olive})` }} />

      {/* HEADER */}
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
            <div style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold, letterSpacing: T.normal_spacing, lineHeight: 1.2 }}>Códigos del Bienestar</div>
            <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>El Profesor · Python en Español</div>
          </div>
        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: S.sm }}>
            <span style={{ ...label(), color: "rgba(200,151,31,0.35)", fontSize: 9 }}>
              {user.email?.split("@")[0]}
            </span>
            <button
              onClick={onSignOut}
              style={{ background: "none", border: `1px solid rgba(200,151,31,0.3)`, color: "rgba(200,151,31,0.5)", fontSize: 9, padding: "2px 6px", cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}
            >
              salir
            </button>
          </div>
        ) : (
          <span style={{ ...label(), color: "rgba(200,151,31,0.4)" }}>Servicio Gratuito</span>
        )}
      </div>

      {/* HERO */}
      <div style={{ borderBottom: `3px solid ${C.burgundy}`, padding: `${S.xxxl}px ${S.xxl}px ${S.xxl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: S.xl, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ ...label(), color: C.gold, marginBottom: S.md, letterSpacing: T.widest }}>La Cuarta Transformación del Código</div>
          <h1 style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)", fontWeight: T.black, margin: `0 0 ${S.sm}px 0`, fontFamily: T.serif, color: C.burgundy, letterSpacing: -3, lineHeight: 0.95 }}>El<br />Profesor</h1>
          <div style={{ width: 60, height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.olive})`, marginBottom: S.lg, borderRadius: 2 }} />
          <div style={{ fontSize: T.md, color: C.textMid, fontFamily: T.sans, fontWeight: T.light, lineHeight: 1.7, marginBottom: S.xl, maxWidth: 340 }}>
            AI te dio código que no funciona.<br /><br />
            Pega tu código o sube una foto — Python, JavaScript, Java, SQL, lo que sea. El Profesor te dice qué está mal.<br /><br />
            <strong style={{ fontWeight: T.bold, color: C.burgundy }}>En español. Gratis.</strong>
          </div>
        </div>
        <div style={{ width: 190, flexShrink: 0 }}><AMLOCartoon /></div>
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
                      <li style={{ marginBottom: S.sm }}>Subir una foto de tu código y analizarla</li>
                    </ul>
                    <p style={{ color: C.textLight, fontSize: T.sm, fontStyle: "italic", marginBottom: 0 }}>Sin registro. Sin costo.</p>
                  </div>
                )}
                {modal === "usar" && (
                  <div>
                    <p style={{ marginTop: 0 }}>Fíjense bien, les voy a explicar paso a paso.</p>
                    <ol style={{ paddingLeft: S.xl, color: C.textMid }}>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Escribe o pega tu código</strong>, o sube una foto con el botón 📷.</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Presiona</strong> "Iniciar Debug".</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Espera</strong> mientras El Profesor consulta con sus asesores.</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Lee la respuesta</strong> — te explica y da el código correcto.</li>
                      <li style={{ marginBottom: S.md }}><strong style={{ color: C.burgundy, fontWeight: T.bold }}>Comparte</strong> con tus compas. No cuesta nada.</li>
                    </ol>
                  </div>
                )}
                {modal === "ideas" && (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ marginTop: 0, fontSize: T.md }}>Nos da mucho gusto que quieras mejorar al Profesor.</p>
                    <a href="mailto:dd4100@nyu.edu" style={{ display: "inline-block", marginTop: S.sm, padding: `${S.md}px ${S.xxl}px`, background: C.burgundy, color: C.gold, fontFamily: T.sans, fontWeight: T.bold, fontSize: T.base, letterSpacing: T.wide, textDecoration: "none", border: `1px solid ${C.gold}`, boxShadow: `2px 2px 0 ${C.text}` }}>dd4100@nyu.edu</a>
                    <p style={{ color: C.textLight, fontSize: T.sm, fontStyle: "italic", marginTop: S.lg, marginBottom: 0 }}>Se los agradecemos de antemano.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OFFLINE MODAL */}
        {offlineModal && (
          <div
            onClick={closeOfflineModal}
            style={{ position: "fixed", inset: 0, background: "rgba(26,16,8,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: S.xl }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: C.cream, border: `2px solid ${C.olive}`, boxShadow: `4px 4px 0 ${C.olive}`, maxWidth: 520, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}
            >
              {/* Header */}
              <div style={{ background: C.olive, padding: `${S.md}px ${S.xl}px`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <div style={{ color: C.cream, fontSize: T.sm, fontFamily: T.sans, fontWeight: T.bold, letterSpacing: T.wide, textTransform: "uppercase" }}>📥 Study Offline</div>
                  <div style={{ fontSize: T.xs, color: "rgba(245,240,232,0.6)", letterSpacing: T.wide, fontFamily: T.sans, textTransform: "uppercase" }}>Quizzes para Code Combat sin internet</div>
                </div>
                {!offlineProgress && (
                  <button onClick={closeOfflineModal} style={{ background: "none", border: "none", color: C.cream, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
                )}
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: S.xl }}>

                {/* — Generating progress — */}
                {offlineProgress && (
                  <div style={{ textAlign: "center", padding: `${S.xl}px 0` }}>
                    <div style={{ fontSize: T.md, fontFamily: T.sans, fontWeight: T.bold, color: C.olive, marginBottom: S.lg }}>
                      Generando quizzes…
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 10, background: C.creamDark, borderRadius: 5, overflow: "hidden", marginBottom: S.md, border: `1px solid ${C.border}` }}>
                      <div style={{ height: "100%", width: `${(offlineProgress.current / offlineProgress.total) * 100}%`, background: `linear-gradient(90deg, ${C.olive}, #6A9A50)`, borderRadius: 5, transition: "width 0.5s ease" }}/>
                    </div>
                    <div style={{ fontSize: T.sm, color: C.textMid, fontFamily: T.mono, marginBottom: S.sm }}>
                      {offlineProgress.current} / {offlineProgress.total} sesiones
                    </div>
                    <div style={{ fontSize: T.sm, color: C.textLight, fontFamily: T.mono, fontStyle: "italic" }}>
                      "{offlineProgress.label}"
                    </div>
                    <div style={{ marginTop: S.lg, fontSize: T.xs, color: C.textLight, fontFamily: T.sans }}>
                      No cierres esta ventana…
                    </div>
                  </div>
                )}

                {/* — Done — */}
                {offlineDone && !offlineProgress && (
                  <div style={{ textAlign: "center", padding: `${S.xl}px 0` }}>
                    <div style={{ fontSize: 48, marginBottom: S.md }}>✅</div>
                    <div style={{ fontSize: T.lg, fontFamily: T.serif, fontWeight: T.bold, color: C.olive, marginBottom: S.sm }}>
                      ¡Quizzes listos!
                    </div>
                    <div style={{ fontSize: T.base, color: C.textMid, fontFamily: T.sans, lineHeight: 1.7, marginBottom: S.xl }}>
                      <strong style={{ color: C.burgundy }}>{offlineCount} preguntas</strong> guardadas en tu dispositivo.<br/>
                      Puedes jugar Code Combat sin internet.
                    </div>
                    <button
                      onClick={closeOfflineModal}
                      style={{ ...btnPrimary(false), padding: `${S.md}px ${S.xxl}px`, boxShadow: `2px 2px 0 ${C.text}` }}
                    >
                      Cerrar
                    </button>
                  </div>
                )}

                {/* — Selection — */}
                {!offlineProgress && !offlineDone && (
                  <>
                    <p style={{ marginTop: 0, fontSize: T.base, color: C.textMid, fontFamily: T.sans, lineHeight: 1.7 }}>
                      Selecciona las sesiones para las que quieres generar 5 preguntas de quiz. Solo necesitas internet <em>ahora</em>; después juegas Code Combat sin conexión.
                    </p>

                    {historial.length === 0 ? (
                      <div style={{ textAlign: "center", padding: `${S.xl}px 0`, color: C.textLight, fontFamily: T.mono, fontSize: T.base, lineHeight: 1.8 }}>
                        No tienes historial aún.<br/>
                        Usa El Profesor para debuggear código<br/>y vuelve aquí.
                      </div>
                    ) : (
                      <>
                        {/* Select all / none */}
                        <div style={{ display: "flex", gap: S.sm, marginBottom: S.md }}>
                          <button
                            onClick={() => setSelectedIds(historial.map(e => e.id))}
                            style={{ ...btnGhost(), fontSize: T.xs, padding: `${S.xs}px ${S.md}px` }}
                          >
                            Seleccionar todo
                          </button>
                          <button
                            onClick={() => setSelectedIds([])}
                            style={{ ...btnGhost(), fontSize: T.xs, padding: `${S.xs}px ${S.md}px` }}
                          >
                            Limpiar
                          </button>
                          <span style={{ marginLeft: "auto", fontSize: T.xs, color: C.textLight, fontFamily: T.mono, alignSelf: "center" }}>
                            {selectedIds.length} seleccionadas
                          </span>
                        </div>

                        {/* Checkboxes */}
                        <div style={{ display: "flex", flexDirection: "column", gap: S.sm, marginBottom: S.xl }}>
                          {historial.map(entry => {
                            const checked = selectedIds.includes(entry.id);
                            return (
                              <label
                                key={entry.id}
                                style={{ display: "flex", gap: S.md, alignItems: "flex-start", cursor: "pointer", padding: S.md, border: `1px solid ${checked ? C.olive : C.border}`, background: checked ? `${C.olive}11` : C.white, transition: "all 0.15s" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleEntry(entry.id)}
                                  style={{ marginTop: 2, accentColor: C.olive, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: T.xs, color: C.textLight, fontFamily: T.sans, marginBottom: 2 }}>{entry.fecha}</div>
                                  <div style={{ fontSize: T.sm, color: C.text, fontFamily: T.mono, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.codigo}</div>
                                  <div style={{ fontSize: T.xs, color: C.burgundy, fontStyle: "italic", lineHeight: 1.4 }}>{entry.resumen}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        {/* Confirm */}
                        <button
                          onClick={prepareOfflineQuizzes}
                          disabled={!selectedIds.length}
                          style={{ ...btnPrimary(!selectedIds.length), width: "100%", padding: `${S.lg}px`, boxShadow: selectedIds.length ? `2px 2px 0 ${C.text}` : "none", background: selectedIds.length ? C.olive : C.creamDark, borderColor: selectedIds.length ? C.olive : C.border, letterSpacing: T.wider }}
                        >
                          {selectedIds.length
                            ? `Preparar ${selectedIds.length} sesión${selectedIds.length > 1 ? "es" : ""} →`
                            : "Selecciona al menos una sesión"}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QUICK ACTION BUTTONS */}
        <div style={{ display: "flex", gap: S.md, marginBottom: S.xxl, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setModal("sirve")} style={btnSecondary()}>¿Para qué sirve?</button>
          <button onClick={() => setModal("usar")} style={btnSecondary()}>¿Cómo usar al Profesor?</button>
          <button onClick={() => setModal("ideas")} style={btnGhost()}>Ideas para El Profesor</button>
          <button
            onClick={() => { setOfflineDone(false); setSelectedIds([]); setOfflineProgress(null); setOfflineModal(true); }}
            style={{ ...btnGhost(), borderColor: C.olive, color: C.olive }}
          >
            📥 Study Offline
          </button>
        </div>

        {/* EXAMPLES */}
        <div style={{ display: "flex", alignItems: "center", gap: S.md, marginBottom: S.lg }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ ...label(), letterSpacing: T.widest }}>Ejemplos rápidos</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <div style={{ marginBottom: S.xxl, display: "flex", gap: S.sm, flexWrap: "wrap" }}>
          {EJEMPLOS.map(ej => (
            <button key={ej.label} onClick={() => { setCode(ej.code); setImages([]); setAttachedFile(null); }} style={{
              padding: `${S.xs}px ${S.md}px`,
              border: `1px solid ${code === ej.code ? C.burgundy : C.border}`,
              background: code === ej.code ? C.burgundy : C.creamDark,
              color: code === ej.code ? C.gold : C.textMid,
              fontSize: T.sm, fontFamily: T.sans, fontWeight: T.light,
              cursor: "pointer", letterSpacing: T.normal_spacing, textTransform: "uppercase", transition: "all 0.15s",
            }}>{ej.label}</button>
          ))}
        </div>

        {/* INTENTION INPUT */}
        <div style={{ marginBottom: S.md }}>
          <input
            value={intention}
            onChange={e => setIntention(e.target.value)}
            placeholder="¿Qué resultado esperas? (opcional) — ej: quiero que imprima solo los números pares"
            style={{ width: "100%", padding: `${S.sm}px ${S.md}px`, border: `1px solid ${C.border}`, background: C.creamDark, color: C.textMid, fontSize: T.sm, fontFamily: T.sans, outline: "none", boxSizing: "border-box", letterSpacing: T.normal_spacing }}
          />
        </div>

        {/* CODE / IMAGE INPUT BOX */}
        <div style={{ border: `1px solid ${C.burgundy}`, marginBottom: S.md, boxShadow: `2px 2px 0 ${C.burgundy}` }}>

          {/* Header bar */}
          <div style={{ borderBottom: `1px solid ${C.burgundy}`, padding: `${S.sm}px ${S.lg}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: C.burgundy }}>
            <span style={{ ...label(), color: C.gold, fontSize: T.xs, letterSpacing: T.wider }}>
              {images.length
                ? `${images.length} foto(s) cargada(s)`
                : attachedFile
                  ? attachedFile.name
                  : "codigo_sospechoso.py"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: S.sm }}>
              {(images.length > 0 || attachedFile) && (
                <button
                  onClick={() => { setImages([]); setAttachedFile(null); setCode(""); }}
                  style={{ background: "none", border: `1px solid rgba(200,151,31,0.5)`, color: C.gold, fontSize: T.xs, padding: `2px ${S.sm}px`, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase" }}
                >
                  ✕ Quitar todo
                </button>
              )}
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  background: images.length ? C.gold : "none",
                  border: `1px solid ${images.length ? C.gold : "rgba(200,151,31,0.5)"}`,
                  color: images.length ? C.burgundy : C.gold,
                  fontSize: T.xs, padding: `2px ${S.sm}px`, cursor: "pointer",
                  fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase",
                  fontWeight: images.length ? T.bold : T.normal,
                }}
              >
                📷 Foto
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <button
                onClick={() => attachInputRef.current.click()}
                disabled={attachLoading}
                style={{
                  background: attachedFile ? C.gold : "none",
                  border: `1px solid ${attachedFile ? C.gold : "rgba(200,151,31,0.5)"}`,
                  color: attachedFile ? C.burgundy : C.gold,
                  fontSize: T.xs, padding: `2px ${S.sm}px`, cursor: attachLoading ? "wait" : "pointer",
                  fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase",
                  fontWeight: attachedFile ? T.bold : T.normal,
                  opacity: attachLoading ? 0.6 : 1,
                }}
              >
                {attachLoading ? "⏳" : "📎 Archivo"}
              </button>
              <input
                ref={attachInputRef}
                type="file"
                accept=".py,.js,.ts,.jsx,.tsx,.java,.c,.cpp,.cs,.go,.rb,.php,.swift,.kt,.rs,.sh,.sql,.html,.css,.json,.xml,.yaml,.yml,.toml,.ini,.cfg,.conf,.env,.txt,.md,.csv,.r,.m,.pl,.pdf,.docx,.doc,.pages"
                onChange={handleFileAttach}
                style={{ display: "none" }}
              />
              <span style={{ ...label(), color: "rgba(200,151,31,0.4)", fontSize: T.xs }}>
                {images.length ? `${images.length}/20 fotos` : attachedFile ? `${code.length} chars` : code.length > 0 ? `${code.length} chars` : "vacío"}
              </span>
            </div>
          </div>

          {/* Body: image grid OR textarea */}
          {images.length > 0 ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}
              style={{ background: C.white }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: S.sm, padding: S.lg }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: "relative", display: "inline-block" }}>
                    <img src={img.preview} alt={`foto ${idx + 1}`} style={{ maxHeight: 160, maxWidth: 200, border: `1px solid ${C.border}`, display: "block" }} />
                    <button
                      onClick={() => removeImage(idx)}
                      style={{ position: "absolute", top: 4, right: 4, background: C.burgundy, border: "none", color: C.gold, width: 20, height: 20, cursor: "pointer", fontSize: 11, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✕</button>
                  </div>
                ))}
                {images.length < 20 && (
                  <div
                    onClick={() => fileInputRef.current.click()}
                    style={{ width: 80, height: 80, border: `1px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.textLight, fontSize: T.lg }}
                  >+</div>
                )}
              </div>
              <textarea
                autoFocus
                value={code}
                onChange={e => {
                  setCode(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                placeholder="Escribe contexto adicional aquí (opcional) — ej: línea 42 da error..."
                onKeyDown={e => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const s = e.target.selectionStart;
                    setCode(c => c.substring(0, s) + "    " + c.substring(e.target.selectionEnd));
                    setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
                  }
                }}
                style={{ width: "100%", minHeight: 48, padding: `${S.md}px ${S.lg}px`, background: C.creamDark, border: "none", borderTop: `1px solid ${C.border}`, outline: "none", color: C.textMid, fontSize: T.base, lineHeight: 1.8, fontFamily: T.mono, resize: "none", boxSizing: "border-box", overflow: "hidden" }}
              />
            </div>
          ) : (
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={"# Pega tu código aquí — tuyo o de ChatGPT/Copilot\n# El Profesor lo arregla sin juzgarte (mucho)\n# O arrastra una foto de tu código aquí 📷"}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addImages(e.dataTransfer.files); }}
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
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", gap: S.sm, marginBottom: S.xxxl, flexWrap: "wrap" }}>
          <button
            onClick={askProfe}
            disabled={isDisabled}
            style={{ ...btnPrimary(isDisabled), flex: 3, minWidth: 160, padding: `${S.lg}px`, boxShadow: isDisabled ? "none" : `2px 2px 0 ${C.text}`, letterSpacing: T.widest }}
          >
            {loading ? `... ${LOADING_FRASES[fraseIdx]}` : "Iniciar Debug"}
          </button>
          <button
            onClick={runPython}
            disabled={!pyodideReady || terminalLoading || (!code.trim() && !images.length)}
            style={{ ...btnPrimary(!pyodideReady || terminalLoading || (!code.trim() && !images.length)), flex: 1, minWidth: 80, padding: `${S.lg}px`, boxShadow: (!pyodideReady || terminalLoading || (!code.trim() && !images.length)) ? "none" : `2px 2px 0 ${C.text}`, letterSpacing: T.widest, background: (!pyodideReady || terminalLoading || (!code.trim() && !images.length)) ? C.creamDark : C.olive }}
          >
            {!pyodideReady ? "..." : terminalLoading ? "▶" : "▶ Correr"}
          </button>
          <button
            onClick={onStartTutor}
            disabled={!code.trim()}
            style={{ ...btnPrimary(!code.trim()), flex: 2, minWidth: 140, padding: `${S.lg}px`, boxShadow: !code.trim() ? "none" : `2px 2px 0 ${C.text}`, letterSpacing: T.widest, background: !code.trim() ? C.creamDark : C.gold, color: !code.trim() ? C.textLight : C.burgundy, border: `1px solid ${!code.trim() ? C.border : C.gold}` }}
          >
            Hagamos esto juntos
          </button>
        </div>

        {/* PYTHON OUTPUT */}
        <Terminal output={terminalOutput} onClear={() => setTerminalOutput([])} />

        {/* RESPONSE */}
        {response && (
          <div ref={responseRef} style={{ border: `1px solid ${C.burgundy}`, animation: "fadeIn 0.4s ease", boxShadow: `3px 3px 0 ${C.burgundy}`, position: "relative" }}>
            <div style={{ borderBottom: `1px solid ${C.burgundy}`, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.burgundy }}>
              <div>
                <div style={{ fontWeight: T.bold, fontSize: T.sm, color: C.gold, letterSpacing: T.wide, textTransform: "uppercase", fontFamily: T.sans }}>El Profesor</div>
                <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 9 }}>DEBUG · EN ESPAÑOL · CON IA</div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ padding: `${S.xs}px ${S.md}px`, border: `1px solid ${C.gold}`, background: copied ? C.gold : "transparent", color: copied ? C.burgundy : C.gold, fontSize: T.xs, cursor: "pointer", fontFamily: T.sans, letterSpacing: T.wide, textTransform: "uppercase", transition: "all 0.2s" }}
              >
                {copied ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <div style={{ padding: S.xxl, background: C.white, fontFamily: T.mono }}>{formatResponse(response)}</div>
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
                <button onClick={() => { setHistorial([]); setShowHistorial(false); }} style={{ ...btnGhost(), marginTop: S.xs }}>Borrar historial</button>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: S.xxxl, ...label(), color: C.border, letterSpacing: T.widest }}>
          Python en español · Sin registro · Sin costo
        </div>
      </div>

      <div style={{ height: 6, background: `linear-gradient(90deg, ${C.olive}, ${C.gold} 40%, ${C.burgundy})`, marginTop: S.xxxl }} />
    </div>
  );
}
