import type { Filters, Priority, Task, TaskSort, TaskStatus } from '../types';
import { isDueToday, isOverdue, isWithinDays } from './date';
import { PRIORITY_RANK } from './status';
import { newHistoryEntry } from './history';

export const EMPTY_FILTERS: Filters = {
  search: '',
  status: [],
  prioridade: [],
  responsavel: [],
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
    filters.responsavel.length > 0 ||
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
  nomePorId: Record<string, string>,
  now: Date = new Date()
): Task[] {
  const q = filters.search.trim().toLowerCase();
  const out = tasks.filter((t) => {
    if (q) {
      const responsavel = nomePorId[t.responsavelId] ?? '';
      const hay = `${t.id} ${t.titulo} ${t.descricao} ${responsavel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
    if (filters.prioridade.length > 0 && !filters.prioridade.includes(t.prioridade)) return false;
    if (filters.responsavel.length > 0 && !filters.responsavel.includes(t.responsavelId)) return false;
    if (filters.favoritas && !t.favorita) return false;
    if (filters.categorias.length > 0 && (!t.categoria || !filters.categorias.includes(t.categoria)))
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
  novas: number;
  recebidas: number;
  emExecucao: number;
  concluidas: number;
  devolvidas: number;
  finalizadas: number;
  atrasadas: number;
}

export function computeIndicators(tasks: Task[], now: Date = new Date()): Indicators {
  const counts: Record<TaskStatus, number> = {
    NOVA: 0,
    RECEBIDA: 0,
    EM_EXECUCAO: 0,
    CONCLUIDA: 0,
    DEVOLVIDA: 0,
    FINALIZADA: 0,
  };
  let atrasadas = 0;
  for (const t of tasks) {
    counts[t.status]++;
    if (isOverdue(t.prazo, t.status, now)) atrasadas++;
  }
  const finalizadas = counts.FINALIZADA;
  return {
    total: tasks.length,
    novas: counts.NOVA,
    recebidas: counts.RECEBIDA,
    emExecucao: counts.EM_EXECUCAO,
    concluidas: counts.CONCLUIDA,
    devolvidas: counts.DEVOLVIDA,
    finalizadas,
    atrasadas,
  };
}

export interface ColaboradorMetrics {
  ativas: number;
  concluidas: number;
  atrasadas: number;
  taxaConclusao: number; // 0–100
}

export function colaboradorMetrics(
  colaboradorId: string,
  tasks: Task[],
  now: Date = new Date()
): ColaboradorMetrics {
  const doUsuario = tasks.filter((t) => t.responsavelId === colaboradorId);
  const finalizadas = doUsuario.filter((t) => t.status === 'FINALIZADA').length;
  return {
    ativas: doUsuario.length - finalizadas,
    concluidas: finalizadas,
    atrasadas: doUsuario.filter((t) => isOverdue(t.prazo, t.status, now)).length,
    taxaConclusao: doUsuario.length === 0 ? 0 : Math.round((finalizadas / doUsuario.length) * 100),
  };
}

export function colaboradorResumo(nome: string): { iniciais: string } {
  const partes = nome.trim().split(/\s+/);
  const primeiro = partes[0]?.[0] ?? '';
  const ultimo = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return { iniciais: (primeiro + ultimo).toUpperCase() };
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
  responsavelId: string;
  criadorId: string;
  prioridade: Priority;
  prazo: string | null;
  categoria?: string;
  tags?: string[];
}

/**
 * Monta uma tarefa NOVA pronta para CREATE_TASK: id sequencial, timestamps
 * e entrada de histórico de criação. Usado pelo TaskFormModal.
 */
export function createTask(tasks: Task[], input: NewTaskInput, usuario: string): Task {
  const agora = new Date().toISOString();
  return {
    id: nextTaskId(tasks),
    titulo: input.titulo,
    descricao: input.descricao,
    responsavelId: input.responsavelId,
    criadorId: input.criadorId,
    prioridade: input.prioridade,
    prazo: input.prazo,
    status: 'NOVA',
    ...(input.categoria ? { categoria: input.categoria } : {}),
    ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
    criadaEm: agora,
    historico: [newHistoryEntry(usuario, null, 'NOVA', 'status', 'Tarefa criada.')],
  };
}
