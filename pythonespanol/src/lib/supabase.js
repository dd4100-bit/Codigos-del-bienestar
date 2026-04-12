import { createClient } from "@supabase/supabase-js";

// Add these to your .env file:
//   REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co
//   REACT_APP_SUPABASE_ANON_KEY=eyJ...
//
// Then restart the dev server.

const supabaseUrl  = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey  = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
