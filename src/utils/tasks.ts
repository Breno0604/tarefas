import type { Colaborador, Filters, Task, TaskStatus } from '../types';
import { isOverdue, isWithinDays } from './date';

export const EMPTY_FILTERS: Filters = {
  search: '',
  status: [],
  prioridade: [],
  responsavel: [],
  prazo: 'todas',
};

export function filterTasks(
  tasks: Task[],
  filters: Filters,
  nomePorId: Record<string, string>,
  now: Date = new Date()
): Task[] {
  const q = filters.search.trim().toLowerCase();
  return tasks.filter((t) => {
    if (q) {
      const responsavel = nomePorId[t.responsavelId] ?? '';
      const hay = `${t.id} ${t.titulo} ${t.descricao} ${responsavel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
    if (filters.prioridade.length > 0 && !filters.prioridade.includes(t.prioridade)) return false;
    if (filters.responsavel.length > 0 && !filters.responsavel.includes(t.responsavelId)) return false;
    if (filters.prazo === 'vencidas' && !isOverdue(t.prazo, t.status, now)) return false;
    if (filters.prazo === 'proximos7' && !isWithinDays(t.prazo, 7, now)) return false;
    if (filters.prazo === 'semPrazo' && t.prazo !== null) return false;
    return true;
  });
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
  const count = (s: TaskStatus) => tasks.filter((t) => t.status === s).length;
  return {
    total: tasks.length,
    novas: count('NOVA'),
    recebidas: count('RECEBIDA'),
    emExecucao: count('EM_EXECUCAO'),
    concluidas: count('CONCLUIDA'),
    devolvidas: count('DEVOLVIDA'),
    finalizadas: count('FINALIZADA'),
    atrasadas: tasks.filter((t) => isOverdue(t.prazo, t.status, now)).length,
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

export function colaboradorResumo(colaborador: Colaborador): { iniciais: string } {
  const partes = colaborador.nome.trim().split(/\s+/);
  const iniciais = (partes[0]?.[0] ?? '') + (partes[partes.length - 1]?.[0] ?? '');
  return { iniciais: iniciais.toUpperCase() };
}
