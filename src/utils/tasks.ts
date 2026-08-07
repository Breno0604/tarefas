import type {
  Filters,
  Priority,
  Recorrencia,
  Task,
  TaskSort,
  TaskStatus,
} from '../types';
import { isDueToday, isOverdue, isWithinDays } from './date';
import { PRIORITY_RANK } from './status';
import { newHistoryEntry } from './history';

/** Valor do filtro `projeto` que representa tarefas sem projeto. */
export const SEM_PROJETO = '__sem_projeto__';

export const EMPTY_FILTERS: Filters = {
  search: '',
  status: [],
  prioridade: [],
  prazo: 'todas',
  favoritas: false,
  categorias: [],
  projeto: null,
  sortBy: null,
};

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status.length > 0 ||
    filters.prioridade.length > 0 ||
    filters.prazo !== 'todas' ||
    filters.favoritas ||
    filters.categorias.length > 0 ||
    filters.projeto !== null
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
    if (filters.projeto === SEM_PROJETO) {
      if (t.projeto) return false;
    } else if (filters.projeto && t.projeto !== filters.projeto) {
      return false;
    }
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
  suspensas: number;
  concluidas: number;
  arquivadas: number;
  atrasadas: number;
}

export function computeIndicators(tasks: Task[], now: Date = new Date()): Indicators {
  const counts: Record<TaskStatus, number> = {
    CAIXA_ENTRADA: 0,
    A_FAZER: 0,
    EM_ANDAMENTO: 0,
    SUSPENSA: 0,
    CONCLUIDA: 0,
    ARQUIVADA: 0,
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
    suspensas: counts.SUSPENSA,
    concluidas: counts.CONCLUIDA,
    arquivadas: counts.ARQUIVADA,
    atrasadas,
  };
}

/** Contagem e progresso de subtarefas de uma tarefa. */
export function subtarefasProgresso(task: Task): {
  feitas: number;
  total: number;
  pct: number;
} {
  const lista = task.subtarefas ?? [];
  const feitas = lista.filter((s) => s.concluida).length;
  return { feitas, total: lista.length, pct: lista.length === 0 ? 0 : Math.round((feitas / lista.length) * 100) };
}

/** Pad 'YYYY-MM-DD'. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Próxima data de ocorrência a partir de um prazo ISO e da frequência. */
export function proximaOcorrencia(
  prazo: string | null,
  freq: Recorrencia
): string | null {
  if (!prazo) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(prazo);
  if (!m) return prazo;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (freq === 'diaria') {
    d.setDate(d.getDate() + 1);
  } else if (freq === 'semanal') {
    d.setDate(d.getDate() + 7);
  } else {
    // mensal: mantém o dia, clampeado ao último dia do mês quando necessário (ex.: 31/01 → 28/02).
    const dia = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dia, ultimo));
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Projetos presentes nas tarefas, únicos e ordenados. */
export function projetosDe(tasks: Task[]): string[] {
  return Array.from(new Set(tasks.map((t) => t.projeto).filter((p): p is string => Boolean(p)))).sort(
    (a, b) => a.localeCompare(b)
  );
}

/** Progresso de conclusão de um projeto (todas as tarefas, incluindo canceladas). */
export function progressoProjeto(tasks: Task[], projeto: string): {
  total: number;
  concluidas: number;
} {
  const doProjeto = tasks.filter((t) => t.projeto === projeto);
  return {
    total: doProjeto.length,
    concluidas: doProjeto.filter((t) => t.status === 'CONCLUIDA').length,
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
  projeto?: string;
  lembrete?: string | null;
  recorrencia?: Recorrencia | null;
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
    ...(input.projeto ? { projeto: input.projeto } : {}),
    ...(input.lembrete ? { lembrete: input.lembrete } : {}),
    ...(input.recorrencia ? { recorrencia: input.recorrencia } : {}),
    criadaEm: agora,
    historico: [newHistoryEntry(null, 'CAIXA_ENTRADA', 'status', 'Tarefa criada.')],
  };
}
