import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para Client Components en el navegador.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan variables de entorno públicas de Supabase.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
