import type { Filters, Priority, Task, TaskSort, TaskStatus } from '../types';
import { isDueToday, isOverdue, isWithinDays } from './date';
import { PRIORITY_RANK } from './status';
import { newHistoryEntry } from './history';

export const EMPTY_FILTERS: Filters = {
  search: '',
  status: [],
  prioridade: [],
  prazo: 'todas',
  favoritas: false,
  categorias: [],
  sortBy: null,
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status.length > 0 ||
    filters.prioridade.length > 0 ||
    filters.prazo !== 'todas' ||
    filters.favoritas ||
    filters.categorias.length > 0
  );
}

const SORTERS: Record<TaskSort, (a: Task, b: Task) => number> = {
  criadaEm: (a, b) => a.criadaEm.localeCompare(b.criadaEm),
  titulo: (a, b) => a.titulo.localeCompare(b.titulo),
  prazo: (a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''),
  prioridade: (a, b) => PRIORITY_RANK[a.prioridade] - PRIORITY_RANK[b.prioridade],
};

export function filterTasks(
  tasks: Task[],
  filters: Filters,
  now: Date = new Date()
): Task[] {
  const q = filters.search.trim().toLowerCase();
  const out = tasks.filter((t) => {
    if (q) {
      const hay = `${t.id} ${t.titulo} ${t.descricao}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
    if (filters.prioridade.length > 0 && !filters.prioridade.includes(t.prioridade))
      return false;
    if (filters.favoritas && !t.favorita) return false;
    if (
      filters.categorias.length > 0 &&
      (!t.categoria || !filters.categorias.includes(t.categoria))
    )
      return false;
    if (filters.prazo === 'hoje' && !isDueToday(t.prazo, now)) return false;
    if (filters.prazo === 'vencidas' && !isOverdue(t.prazo, t.status, now)) return false;
    if (filters.prazo === 'proximos7' && !isWithinDays(t.prazo, 7, now)) return false;
    if (filters.prazo === 'semPrazo' && t.prazo !== null) return false;
    return true;
  });
  if (filters.sortBy) return [...out].sort(SORTERS[filters.sortBy]);
  return out;
}

export interface Indicators {
  total: number;
  caixaEntrada: number;
  aFazer: number;
  emAndamento: number;
  concluidas: number;
  canceladas: number;
  atrasadas: number;
}

export function computeIndicators(tasks: Task[], now: Date = new Date()): Indicators {
  const counts: Record<TaskStatus, number> = {
    CAIXA_ENTRADA: 0,
    A_FAZER: 0,
    EM_ANDAMENTO: 0,
    CONCLUIDA: 0,
    CANCELADA: 0,
  };
  let atrasadas = 0;
  for (const t of tasks) {
    counts[t.status]++;
    if (isOverdue(t.prazo, t.status, now)) atrasadas++;
  }
  return {
    total: tasks.length,
    caixaEntrada: counts.CAIXA_ENTRADA,
    aFazer: counts.A_FAZER,
    emAndamento: counts.EM_ANDAMENTO,
    concluidas: counts.CONCLUIDA,
    canceladas: counts.CANCELADA,
    atrasadas,
  };
}

/** Gera o próximo id sequencial (TA-NNN) a partir das tarefas existentes. */
export function nextTaskId(tasks: Task[]): string {
  const maxNum = tasks.reduce((max, t) => {
    const n = Number(t.id.replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  return `TA-${String(maxNum + 1).padStart(3, '0')}`;
}

export interface NewTaskInput {
  titulo: string;
  descricao: string;
  prioridade: Priority;
  prazo: string | null;
  categoria?: string;
  tags?: string[];
}

/**
 * Monta uma tarefa CAIXA_ENTRADA pronta para CREATE_TASK: id sequencial, timestamps
 * e entrada de histórico de criação. Usado pelo TaskFormModal.
 */
export function createTask(tasks: Task[], input: NewTaskInput): Task {
  const agora = new Date().toISOString();
  return {
    id: nextTaskId(tasks),
    titulo: input.titulo,
    descricao: input.descricao,
    prioridade: input.prioridade,
    prazo: input.prazo,
    status: 'CAIXA_ENTRADA',
    ...(input.categoria ? { categoria: input.categoria } : {}),
    ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
    criadaEm: agora,
    historico: [newHistoryEntry(null, 'CAIXA_ENTRADA', 'status', 'Tarefa criada.')],
  };
}
