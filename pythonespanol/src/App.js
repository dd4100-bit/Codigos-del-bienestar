import { useState, useRef, useEffect } from "react";
import { C, T } from "./constants";
import Profesor from "./components/Profesor";
import TutorMode from "./components/TutorMode";
import Chat from "./components/Chat";
import Game from "./game";
import Auth from "./components/Auth";
import { supabase } from "./lib/supabase";

export default function App() {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const [session, setSession]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Recupera la sesión persistida — fuente de verdad al cargar la app.
    // authLoading se apaga SOLO aquí para evitar race conditions con
    // onAuthStateChange, que puede disparar antes de que el token se refresque.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Escucha cambios posteriores (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── App state ────────────────────────────────────────────────────────────
  const [code, setCode]                   = useState("");
  const [images, setImages]               = useState([]);
  const [tutorMode, setTutorMode]         = useState(false);
  const [gameMode, setGameMode]           = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [pyodideReady, setPyodideReady]   = useState(false);
  const pyodideRef = useRef(null);

  // ── Pyodide ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
    script.onload = async () => {
      try {
        const py = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
        pyodideRef.current = py;
        setPyodideReady(true);
      } catch {}
    };
    document.head.appendChild(script);
  }, []);

  async function runPython() {
    if (!code.trim() || !pyodideReady) return;
    setTerminalLoading(true);
    setTerminalOutput([]);
    try {
      let output = "";
      pyodideRef.current.setStdout({ batched: (text) => { output += text + "\n"; } });
      pyodideRef.current.setStderr({ batched: (text) => { output += text + "\n"; } });
      await pyodideRef.current.runPythonAsync(code);
      setTerminalOutput(output.trim() ? [{ type: "output", text: output.trim() }] : [{ type: "silent", text: "(sin output)" }]);
    } catch (err) {
      setTerminalOutput([{ type: "error", text: err.message }]);
    }
    setTerminalLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleStartTutor() {
    if (!code.trim()) return;
    setTutorMode(true);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textLight, fontFamily: T.sans, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>cargando...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const user = session.user;

  return (
    <>
      {gameMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, overflow: "auto" }}>
          <Game onClose={() => setGameMode(false)} user={user} />
        </div>
      )}

      {tutorMode && (
        <TutorMode
          code={code}
          setCode={setCode}
          onClose={() => setTutorMode(false)}
          runPython={runPython}
          pyodideReady={pyodideReady}
          terminalOutput={terminalOutput}
          setTerminalOutput={setTerminalOutput}
          terminalLoading={terminalLoading}
        />
      )}

      {!tutorMode && !gameMode && (
        <button
          onClick={() => setGameMode(true)}
          style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 500,
            background: C.burgundy, border: `2px solid ${C.gold}`,
            color: C.gold, padding: "10px 18px",
            fontFamily: T.serif, fontWeight: 900, fontSize: 13,
            letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", borderRadius: 6,
            boxShadow: `0 0 18px ${C.burgundy}99, 2px 2px 0 ${C.gold}44`,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => e.target.style.opacity = "0.85"}
          onMouseLeave={e => e.target.style.opacity = "1"}
        >
          ⚔️ Code Combat
        </button>
      )}

      {!tutorMode && (
        <>
          <Profesor
            code={code}
            setCode={setCode}
            images={images}
            setImages={setImages}
            runPython={runPython}
            onStartTutor={handleStartTutor}
            pyodideReady={pyodideReady}
            terminalOutput={terminalOutput}
            setTerminalOutput={setTerminalOutput}
            terminalLoading={terminalLoading}
            user={user}
            onSignOut={handleSignOut}
          />
          <Chat />
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Noto+Sans:wght@300;400;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        textarea::placeholder { color: ${C.border}; font-family: ${T.mono}; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>
    </>
  );
}
