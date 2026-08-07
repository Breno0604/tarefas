import type { HistoryEntry, TaskStatus } from '../types';

/** Responsável pelas alterações (app pessoal, usuário único). */
export const USUARIO_PADRAO = 'Eu';

/** Cria uma entrada de histórico com id único, timestamp atual e usuário responsável. */
export function newHistoryEntry(
  statusAnterior: TaskStatus | null,
  novoStatus: TaskStatus | null,
  tipo: HistoryEntry['tipo'],
  observacao?: string
): HistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataHora: new Date().toISOString(),
    usuario: USUARIO_PADRAO,
    statusAnterior,
    novoStatus,
    tipo,
    observacao,
  };
}
