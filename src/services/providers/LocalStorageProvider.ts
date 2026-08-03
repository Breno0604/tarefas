import type { Task } from '../../types';
import type { LoadedState, StorageProvider } from '../StorageProvider';

export const STORAGE_KEY = 'tarefas.app.v1';
const VERSION = 1;

interface PersistedState {
  version: number;
  tasks: Task[];
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.titulo === 'string' &&
    typeof t.descricao === 'string' &&
    typeof t.responsavelId === 'string' &&
    typeof t.criadorId === 'string' &&
    typeof t.status === 'string' &&
    typeof t.criadaEm === 'string' &&
    Array.isArray(t.historico)
  );
}

/** Persistência em localStorage. Tarefas individuais com shape inválido são descartadas. */
export class LocalStorageProvider implements StorageProvider {
  load(): LoadedState | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.version !== VERSION) return null;
      if (!Array.isArray(parsed.tasks)) return null;
      return { tasks: parsed.tasks.filter(isTask) };
    } catch {
      return null; // JSON corrompido → cai no seed
    }
  }

  save(state: LoadedState): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: VERSION, ...state } satisfies PersistedState)
      );
    } catch (error) {
      // Quota excedida ou falha de serialização: não derruba a aplicação.
      console.warn('Falha ao persistir estado local:', error);
    }
  }

  clear(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}
