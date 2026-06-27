import { createBrowserClient } from "@supabase/ssr";

export function createClient(): ReturnType<typeof createBrowserClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Variáveis Supabase não configuradas.");
  }

  return createBrowserClient(url, key);
}
