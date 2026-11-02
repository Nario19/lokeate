import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para Client Components en el navegador.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
