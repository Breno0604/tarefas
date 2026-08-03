export type TaskStatus =
  | 'NOVA'
  | 'RECEBIDA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'DEVOLVIDA'
  | 'FINALIZADA';

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type Role = 'gestor' | 'colaborador';
export type Section = 'visaoGeral' | 'tarefas' | 'colaboradores';
export type TaskView = 'lista' | 'quadro';
export type PrazoFilter = 'todas' | 'hoje' | 'vencidas' | 'proximos7' | 'semPrazo';
export type TaskSort = 'criadaEm' | 'titulo' | 'prazo' | 'prioridade';

export interface HistoryEntry {
  id: string;
  dataHora: string; // ISO
  usuario: string; // nome do usuário
  statusAnterior: TaskStatus | null;
  novoStatus: TaskStatus | null;
  tipo: 'status' | 'info';
  observacao?: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  responsavelId: string;
  criadorId: string;
  prioridade: Priority;
  prazo: string | null; // ISO date (yyyy-mm-dd)
  status: TaskStatus;
  favorita?: boolean; // padrão: false
  criadaEm: string; // ISO datetime
  historico: HistoryEntry[];
}

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  cor: string; // hex para avatar
}

export interface Filters {
  search: string;
  status: TaskStatus[];
  prioridade: Priority[];
  responsavel: string[]; // ids de colaboradores
  prazo: PrazoFilter;
  favoritas: boolean;
  sortBy: TaskSort | null; // null = ordem original (do seed)
}

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; taskId: string }
  | { type: 'detail'; taskId: string }
  | { type: 'reassign'; taskId: string }
  | { type: 'approve'; taskId: string }
  | { type: 'return'; taskId: string }
  | { type: 'history'; taskId: string }
  | { type: 'colaborador'; colaboradorId: string };
