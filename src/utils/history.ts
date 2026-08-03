import type { HistoryEntry, TaskStatus } from '../types';

/** Cria uma entrada de histórico com id único e timestamp atual. */
export function newHistoryEntry(
  usuario: string,
  statusAnterior: TaskStatus | null,
  novoStatus: TaskStatus | null,
  tipo: HistoryEntry['tipo'],
  observacao?: string
): HistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataHora: new Date().toISOString(),
    usuario,
    statusAnterior,
    novoStatus,
    tipo,
    observacao,
  };
}
