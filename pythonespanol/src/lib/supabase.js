import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "[supabase] Variables de entorno faltantes.\n" +
    "Crea .env con REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY y reinicia el servidor."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseKey ?? "placeholder",
  {
    auth: {
      persistSession:    true,   // guarda el token en localStorage
      autoRefreshToken:  true,   // renueva el token antes de que expire
      detectSessionInUrl: true,  // maneja tokens en el hash de URL (OAuth)
      storageKey: "elprofesor_session",
    },
  }
);
