import type { Task } from '../types';

export const STORAGE_KEY = 'tarefas.app.v1';
const VERSION = 1;

export interface PersistedState {
  version: number;
  tasks: Task[];
}

export interface LoadedState {
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

/**
 * Retorna as tarefas persistidas ou null quando não há dados, a versão não bate
 * ou o JSON está corrompido. Tarefas individuais com shape inválido são
 * descartadas (não derrubam o estado inteiro).
 */
export function loadState(): LoadedState | null {
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

export function saveState(state: LoadedState): void {
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

export function clearState(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
