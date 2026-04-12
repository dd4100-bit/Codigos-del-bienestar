import { useState } from "react";
import { C, T, S, label, btnPrimary } from "../constants";
import { supabase } from "../lib/supabase";

// ── Google OAuth requires setup in Supabase Dashboard: ─────────────────────────
//   Authentication → Providers → Google → Enable
//   Then add your Google OAuth Client ID + Secret from Google Cloud Console.
//   Also set Site URL + Redirect URLs in Supabase → Authentication → URL Configuration.

export default function Auth() {
  const [email, setEmail]       = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setEmailSent(true);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: C.cream,
      display: "flex",
      flexDirection: "column",
      fontFamily: T.sans,
    }}>
      {/* Top accent bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${C.burgundy}, ${C.burgundyMid ?? C.burgundy} 40%, ${C.gold} 60%, ${C.olive})` }} />

      {/* Header */}
      <div style={{ background: C.burgundy, padding: `${S.md}px ${S.xl}px`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: C.gold, fontSize: T.base, fontFamily: T.serif, fontWeight: T.bold, letterSpacing: T.normal_spacing, lineHeight: 1.2 }}>Códigos del Bienestar</div>
          <div style={{ ...label(), color: "rgba(200,151,31,0.5)", fontSize: 8 }}>El Profesor · Python en Español</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: S.xl }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Title */}
          <div style={{ marginBottom: S.xxxl, textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(2.4rem,7vw,3.8rem)", fontWeight: T.black, margin: `0 0 ${S.sm}px`, fontFamily: T.serif, color: C.burgundy, letterSpacing: -2, lineHeight: 0.95 }}>
              El Profesor
            </h1>
            <div style={{ width: 48, height: 3, background: `linear-gradient(90deg,${C.gold},${C.olive})`, borderRadius: 2, margin: "0 auto", marginBottom: S.md }} />
            <p style={{ color: C.textMid, fontSize: T.md, fontWeight: T.light, lineHeight: 1.6, margin: 0 }}>
              Tu tutor de Python en español.<br />Inicia sesión para guardar tu progreso.
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            style={{
              width: "100%",
              padding: `${S.lg}px`,
              marginBottom: S.md,
              background: C.white ?? "#fff",
              border: `2px solid ${C.burgundy}`,
              color: C.burgundy,
              fontSize: T.md,
              fontFamily: T.sans,
              fontWeight: T.bold,
              letterSpacing: T.wide,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: S.md,
              transition: "all 0.15s",
              boxShadow: `2px 2px 0 ${C.burgundy}`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: S.md, margin: `${S.lg}px 0` }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ ...label(), letterSpacing: T.widest, color: C.textLight }}>o</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Magic link form */}
          {emailSent ? (
            <div style={{ border: `1px solid ${C.olive}`, background: "#f0f7f0", padding: S.xl, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: S.md }}>📬</div>
              <div style={{ color: C.olive, fontWeight: T.bold, fontSize: T.md, marginBottom: S.sm }}>Revisa tu correo</div>
              <div style={{ color: C.textMid, fontSize: T.sm, fontWeight: T.light, lineHeight: 1.6 }}>
                Enviamos un link de acceso a <strong>{email}</strong>.<br />
                Haz click en el link para entrar.
              </div>
              <button
                onClick={() => { setEmailSent(false); setEmail(""); }}
                style={{ marginTop: S.lg, background: "none", border: "none", color: C.textMid, fontSize: T.sm, cursor: "pointer", textDecoration: "underline", fontFamily: T.sans }}
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                style={{
                  width: "100%",
                  padding: `${S.md}px ${S.lg}px`,
                  border: `1px solid ${C.border}`,
                  background: C.creamDark,
                  color: C.text,
                  fontSize: T.md,
                  fontFamily: T.sans,
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: S.sm,
                  letterSpacing: T.normal_spacing,
                }}
              />
              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  ...btnPrimary(loading || !email.trim()),
                  width: "100%",
                  padding: `${S.lg}px`,
                  letterSpacing: T.widest,
                  boxShadow: loading || !email.trim() ? "none" : `2px 2px 0 ${C.text}`,
                }}
              >
                {loading ? "Enviando..." : "Continuar con email"}
              </button>
            </form>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: S.md, padding: `${S.sm}px ${S.md}px`, background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: T.sm, fontFamily: T.sans }}>
              {error}
            </div>
          )}

          <p style={{ marginTop: S.xxl, textAlign: "center", color: C.textLight, fontSize: T.xs, fontFamily: T.sans, fontWeight: T.light, letterSpacing: T.normal_spacing, lineHeight: 1.7 }}>
            Al continuar aceptas que tus sesiones de debug<br />se guarden de forma segura para mejorar tu aprendizaje.
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
