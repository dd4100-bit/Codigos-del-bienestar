import { useState } from "react";
import { C, T, S, label, btnPrimary } from "../constants";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleEntrar() {
    const emailVal = email.trim();
    const passVal  = password;

    if (!emailVal || !passVal) { setError("Completa email y contraseña."); return; }
    if (passVal.length < 6)    { setError("La contraseña debe tener al menos 6 caracteres."); return; }

    setError(null);
    setLoading(true);

    // ── 1. Intentar login ─────────────────────────────────────────────────
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: emailVal, password: passVal });

    if (!signInErr) {
      // Sesión activa — App.js reacciona vía onAuthStateChange
      setLoading(false);
      return;
    }

    // ── 2. Si no existe, registrar ────────────────────────────────────────
    const notFound =
      signInErr.message.toLowerCase().includes("invalid login credentials") ||
      signInErr.message.toLowerCase().includes("invalid credentials");

    if (notFound) {
      const { error: signUpErr } = await supabase.auth.signUp({ email: emailVal, password: passVal });
      if (signUpErr) {
        const alreadyExists =
          signUpErr.message.toLowerCase().includes("user already registered") ||
          signUpErr.message.toLowerCase().includes("already registered");
        if (alreadyExists) {
          // El usuario existe pero signIn falló → contraseña incorrecta
          const { error: retryErr } = await supabase.auth.signInWithPassword({ email: emailVal, password: passVal });
          if (retryErr) setError("Contraseña incorrecta para esta cuenta.");
          // Si ok → onAuthStateChange dispara solo
        } else {
          setError(signUpErr.message);
        }
      }
      // Si signUp OK y email confirm está OFF → onAuthStateChange dispara solo
    } else {
      setError(signInErr.message);
    }

    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column", fontFamily: T.sans }}>

      <div style={{ height: 6, background: `linear-gradient(90deg, ${C.burgundy}, ${C.burgundy} 40%, ${C.gold} 60%, ${C.olive})` }} />

      <div style={{ background: C.burgundy, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold, letterSpacing: T.normal_spacing }}>Códigos del Bienestar</div>
          <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>El Profesor · Python en Español</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: S.xl }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          <div style={{ marginBottom: S.xxxl, textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(2.4rem,7vw,3.8rem)", fontWeight: T.black, margin: `0 0 ${S.sm}px`, fontFamily: T.serif, color: C.burgundy, letterSpacing: -2, lineHeight: 0.95 }}>
              El Profesor
            </h1>
            <div style={{ width: 48, height: 3, background: `linear-gradient(90deg,${C.gold},${C.olive})`, borderRadius: 2, margin: "0 auto", marginBottom: S.md }} />
            <p style={{ color: C.textMid, fontSize: T.md, fontWeight: T.light, lineHeight: 1.6, margin: 0 }}>
              Entra o crea tu cuenta.<br />El botón hace las dos cosas.
            </p>
          </div>

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEntrar()}
            placeholder="tu@correo.com"
            autoComplete="email"
            style={{ width: "100%", padding: `${S.md}px ${S.lg}px`, border: `1px solid ${C.border}`, background: C.creamDark, color: C.text, fontSize: T.md, fontFamily: T.sans, outline: "none", boxSizing: "border-box", marginBottom: S.sm }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEntrar()}
            placeholder="contraseña (mín. 6 caracteres)"
            autoComplete="current-password"
            style={{ width: "100%", padding: `${S.md}px ${S.lg}px`, border: `1px solid ${C.border}`, background: C.creamDark, color: C.text, fontSize: T.md, fontFamily: T.sans, outline: "none", boxSizing: "border-box", marginBottom: S.lg }}
          />

          <button
            onClick={handleEntrar}
            disabled={loading}
            style={{ ...btnPrimary(loading), width: "100%", padding: `${S.lg}px`, letterSpacing: T.widest, boxShadow: loading ? "none" : `2px 2px 0 ${C.text}` }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {error && (
            <div style={{ marginTop: S.md, padding: `${S.sm}px ${S.md}px`, background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: T.sm, fontFamily: T.sans }}>
              {error}
            </div>
          )}

          <p style={{ marginTop: S.xxl, textAlign: "center", color: C.textLight, fontSize: T.xs, fontFamily: T.sans, fontWeight: T.light, lineHeight: 1.7 }}>
            Si no tienes cuenta, se crea automáticamente.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Noto+Sans:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>
    </div>
  );
}
