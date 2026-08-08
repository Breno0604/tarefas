import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cliente: SupabaseClient | null = null;

/** Cria o cliente Supabase uma única vez, lendo as variáveis do `.env.local`. */
export function getSupabaseClient(): SupabaseClient {
  if (!cliente) {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    if (!url || !publishableKey) {
      throw new Error(
        'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local.'
      );
    }
    cliente = createClient(url, publishableKey);
  }
  return cliente;
}
