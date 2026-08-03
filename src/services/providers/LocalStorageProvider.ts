import type { Task } from '../../types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/status';
import type { LoadedState, StorageProvider } from '../StorageProvider';

export const STORAGE_KEY = 'tarefas.app.v1';
const VERSION = 1;

interface PersistedState {
  version: number;
  tasks: Task[];
}

const TASK_STATUSES = Object.keys(STATUS_LABELS);
const PRIORITIES = Object.keys(PRIORITY_LABELS);

function isHistoryEntry(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const h = value as Record<string, unknown>;
  return (
    typeof h.id === 'string' &&
    typeof h.dataHora === 'string' &&
    typeof h.usuario === 'string' &&
    (h.statusAnterior === null || TASK_STATUSES.includes(String(h.statusAnterior))) &&
    (h.novoStatus === null || TASK_STATUSES.includes(String(h.novoStatus))) &&
    (h.tipo === 'status' || h.tipo === 'info') &&
    (h.observacao === undefined || typeof h.observacao === 'string')
  );
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
    TASK_STATUSES.includes(String(t.status)) &&
    PRIORITIES.includes(String(t.prioridade)) &&
    (t.prazo === null || (typeof t.prazo === 'string' && /^\d{4}-\d{2}-\d{2}/.test(t.prazo))) &&
    (t.favorita === undefined || typeof t.favorita === 'boolean') &&
    (t.categoria === undefined || typeof t.categoria === 'string') &&
    (t.tags === undefined || (Array.isArray(t.tags) && t.tags.every((x) => typeof x === 'string'))) &&
    (t.atualizadaEm === undefined || typeof t.atualizadaEm === 'string') &&
    (t.concluidaEm === undefined || typeof t.concluidaEm === 'string') &&
    typeof t.criadaEm === 'string' &&
    Array.isArray(t.historico) &&
    t.historico.every(isHistoryEntry)
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
