export type TaskStatus =
  | 'CAIXA_ENTRADA'
  | 'A_FAZER'
  | 'EM_ANDAMENTO'
  | 'SUSPENSA'
  | 'CONCLUIDA'
  | 'ARQUIVADA';

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type TaskView = 'lista' | 'quadro';
export type PrazoFilter = 'todas' | 'hoje' | 'vencidas' | 'proximos7' | 'semPrazo';
export type Recorrencia = 'diaria' | 'semanal' | 'mensal';
export type Tema = 'claro' | 'escuro';

export interface HistoryEntry {
  id: string;
  dataHora: string; // ISO
  usuario?: string; // responsável pela alteração (app pessoal: 'Eu')
  statusAnterior: TaskStatus | null;
  novoStatus: TaskStatus | null;
  tipo: 'status' | 'info';
  observacao?: string;
}

export interface Subtarefa {
  id: string;
  titulo: string;
  concluida: boolean;
}

export interface Anotacao {
  id: string;
  texto: string;
  criadaEm: string; // ISO
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
  subtarefas?: Subtarefa[]; // padrão: []
  anotacoes?: Anotacao[]; // padrão: []
  projeto?: string; // string livre; undefined = sem projeto
  lembrete?: string | null; // ISO datetime | null; padrão: null
  lembreteNotificado?: boolean; // flag interna do hook de notificação
  recorrencia?: Recorrencia | null; // padrão: null
  retornoEm?: string | null; // data 'YYYY-MM-DD' de retorno da SUSPENSA | null = sem prazo definido
}

export interface Filters {
  search: string;
  status: TaskStatus[];
  prioridade: Priority[];
  prazo: PrazoFilter;
  favoritas: boolean;
  categorias: string[];
  tags: string[]; // tags selecionadas (qualquer correspondência)
}

export type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; taskId: string }
  | { type: 'detail'; taskId: string }
  | { type: 'archive'; taskId: string }
  | { type: 'suspend'; taskId: string }
  | { type: 'history'; taskId: string }
  | { type: 'shortcuts' };
