import { useState } from "react";
import { C, T, S, label, btnPrimary } from "../constants";
import { supabase } from "../lib/supabase";

export default function Auth() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Intenta login; si las credenciales no existen, registra automáticamente.
  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!signInError) {
      setLoading(false);
      return; // sesión activa — App.js reacciona vía onAuthStateChange
    }

    // "Invalid login credentials" → el usuario no existe todavía → registrar
    if (signInError.message.toLowerCase().includes("invalid login credentials")) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) setError(signUpError.message);
    } else {
      setError(signInError.message);
    }

    setLoading(false);
  }

  const disabled = loading || !email.trim() || !password.trim();

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column", fontFamily: T.sans }}>

      {/* Top accent bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${C.burgundy}, ${C.burgundy} 40%, ${C.gold} 60%, ${C.olive})` }} />

      {/* Header */}
      <div style={{ background: C.burgundy, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold, letterSpacing: T.normal_spacing, lineHeight: 1.2 }}>Códigos del Bienestar</div>
          <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>El Profesor · Python en Español</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: S.xl }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Title */}
          <div style={{ marginBottom: S.xxxl, textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(2.4rem,7vw,3.8rem)", fontWeight: T.black, margin: `0 0 ${S.sm}px`, fontFamily: T.serif, color: C.burgundy, letterSpacing: -2, lineHeight: 0.95 }}>
              El Profesor
            </h1>
            <div style={{ width: 48, height: 3, background: `linear-gradient(90deg,${C.gold},${C.olive})`, borderRadius: 2, margin: "0 auto", marginBottom: S.md }} />
            <p style={{ color: C.textMid, fontSize: T.md, fontWeight: T.light, lineHeight: 1.6, margin: 0 }}>
              Tu tutor de Python en español.<br />Entra o crea tu cuenta para guardar tu progreso.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              required
              style={{
                width: "100%", padding: `${S.md}px ${S.lg}px`,
                border: `1px solid ${C.border}`, background: C.creamDark,
                color: C.text, fontSize: T.md, fontFamily: T.sans,
                outline: "none", boxSizing: "border-box",
                marginBottom: S.sm, letterSpacing: T.normal_spacing,
              }}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="contraseña"
              autoComplete="current-password"
              required
              style={{
                width: "100%", padding: `${S.md}px ${S.lg}px`,
                border: `1px solid ${C.border}`, background: C.creamDark,
                color: C.text, fontSize: T.md, fontFamily: T.sans,
                outline: "none", boxSizing: "border-box",
                marginBottom: S.lg, letterSpacing: T.normal_spacing,
              }}
            />
            <button
              type="submit"
              disabled={disabled}
              style={{
                ...btnPrimary(disabled),
                width: "100%", padding: `${S.lg}px`,
                letterSpacing: T.widest,
                boxShadow: disabled ? "none" : `2px 2px 0 ${C.text}`,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div style={{ marginTop: S.md, padding: `${S.sm}px ${S.md}px`, background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: T.sm, fontFamily: T.sans }}>
              {error}
            </div>
          )}

          <p style={{ marginTop: S.xxl, textAlign: "center", color: C.textLight, fontSize: T.xs, fontFamily: T.sans, fontWeight: T.light, letterSpacing: T.normal_spacing, lineHeight: 1.7 }}>
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
