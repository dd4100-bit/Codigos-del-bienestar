import { useState, useRef, useEffect } from "react";
import { C, T } from "./constants";
import Profesor from "./components/Profesor";
import TutorMode from "./components/TutorMode";
import Chat from "./components/Chat";
import Game from "./game";

export default function App() {
  const [code, setCode] = useState("");
  const [images, setImages] = useState([]);
  const [tutorMode, setTutorMode] = useState(false);
  const [gameMode, setGameMode] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef(null);

  // Load Pyodide once on mount
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

  function handleStartTutor() {
    if (!code.trim()) return;
    setTutorMode(true);
  }

  function handleCloseTutor() {
    setTutorMode(false);
  }

  return (
    <>
      {gameMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, overflow: "auto" }}>
          <Game onClose={() => setGameMode(false)} />
        </div>
      )}

      {tutorMode && (
        <TutorMode
          code={code}
          setCode={setCode}
          onClose={handleCloseTutor}
          runPython={runPython}
          pyodideReady={pyodideReady}
          terminalOutput={terminalOutput}
          setTerminalOutput={setTerminalOutput}
          terminalLoading={terminalLoading}
        />
      )}

      {!tutorMode && !gameMode && (
        /* Game launch button — fixed bottom-right */
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
