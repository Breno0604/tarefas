import { SupabaseProvider } from './providers/SupabaseProvider';
import type { StorageProvider } from './StorageProvider';

/**
 * Ponto único do provider de persistência.
 * Em produção o destino é sempre o Supabase (fonte oficial dos dados).
 * Em testes, `src/test/setup.ts` substitui este módulo por um provider em memória.
 */
export const storageProvider: StorageProvider = new SupabaseProvider();
