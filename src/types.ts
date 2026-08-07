export type TaskStatus =
  | 'CAIXA_ENTRADA'
  | 'A_FAZER'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type TaskView = 'lista' | 'quadro';
export type PrazoFilter = 'todas' | 'hoje' | 'vencidas' | 'proximos7' | 'semPrazo';
export type TaskSort = 'criadaEm' | 'titulo' | 'prazo' | 'prioridade';

export interface HistoryEntry {
  id: string;
  dataHora: string; // ISO
  statusAnterior: TaskStatus | null;
  novoStatus: TaskStatus | null;
  tipo: 'status' | 'info';
  observacao?: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: Priority;
  prazo: string | null; // ISO date (yyyy-mm-dd)
  status: TaskStatus;
  favorita?: boolean; // padrão: false
  categoria?: string; // string livre; undefined = sem categoria
  tags?: string[]; // strings livres; padrão: []
  criadaEm: string; // ISO datetime
  atualizadaEm?: string; // ISO datetime
  concluidaEm?: string; // ISO datetime (última vez que entrou em CONCLUIDA)
  historico: HistoryEntry[];
}

export interface Filters {
  search: string;
  status: TaskStatus[];
  prioridade: Priority[];
  prazo: PrazoFilter;
  favoritas: boolean;
  categorias: string[];
  sortBy: TaskSort | null; // null = ordem original (do seed)
}

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; taskId: string }
  | { type: 'detail'; taskId: string }
  | { type: 'cancel'; taskId: string }
  | { type: 'history'; taskId: string };
