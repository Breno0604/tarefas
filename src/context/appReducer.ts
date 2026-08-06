import type { Task } from '../types';
import { canTransition, podeReatribuir, roleOf } from '../utils/status';
import { pode, podeAlterarStatusPara } from '../utils/permissions';
import { newHistoryEntry } from '../utils/history';
import { EMPTY_FILTERS, nextTaskId } from '../utils/tasks';
import type { AppAction, AppState } from './types';

const CAMPOS_EDITAVEIS = ['titulo', 'descricao', 'prazo', 'prioridade'] as const;

const CAMPOS_WHITELIST = ['titulo', 'descricao', 'prazo', 'prioridade', 'categoria', 'tags'] as const;

type CampoEdicao = (typeof CAMPOS_WHITELIST)[number];

const LABEL_CAMPO: Record<string, string> = {
  titulo: 'Título',
  descricao: 'Descrição',
  prazo: 'Prazo',
  prioridade: 'Prioridade',
};

const PARTICIPIO_CAMPO: Record<string, string> = {
  titulo: 'alterado',
  descricao: 'alterada',
  prazo: 'alterado',
  prioridade: 'alterada',
};

function exibirValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') {
    return campo === 'prazo' ? 'sem prazo' : 'vazio';
  }
  return String(valor);
}

/** Compara valor por valor: tags por conteúdo (ordem preservada), categoria normalizando vazio. */
function mudou(campo: CampoEdicao, task: Task, mudancas: Partial<Task>): boolean {
  const novo = mudancas[campo];
  if (campo === 'tags') {
    const atual = task.tags ?? [];
    const prox = novo ?? [];
    return atual.length !== prox.length || atual.some((t, i) => t !== prox[i]);
  }
  if (campo === 'categoria') {
    return (novo ?? '') !== (task.categoria ?? '');
  }
  if (novo === undefined) return false;
  return novo !== task[campo];
}

function montarObservacaoEdicao(
  diffs: readonly (typeof CAMPOS_EDITAVEIS)[number][],
  task: Task,
  changes: Partial<Task>
): string {
  return diffs
    .map(
      (campo) =>
        `${LABEL_CAMPO[campo]} ${PARTICIPIO_CAMPO[campo]} de ${exibirValor(campo, task[campo])} para ${exibirValor(campo, changes[campo])}`
    )
    .join('; ');
}

function appReducerCore(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'SET_SECTION':
      return { ...state, section: action.section };
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'TOGGLE_KPI_COLLAPSED':
      return { ...state, kpiCollapsed: !state.kpiCollapsed };
    case 'TOGGLE_FILTERS':
      return { ...state, filtersOpen: !state.filtersOpen };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'RESET_FILTERS':
      // Limpa apenas os filtros; a ordenação escolhida é preservada (reset via seletor "Ordem original").
      return { ...state, filters: { ...EMPTY_FILTERS, sortBy: state.filters.sortBy } };
    case 'OPEN_MODAL':
      return { ...state, modal: action.modal };
    case 'CLOSE_MODAL':
      return { ...state, modal: { type: 'none' } };
    case 'CREATE_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          { ...action.task, atualizadaEm: action.task.criadaEm },
        ],
      };
    case 'UPDATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      if (Object.keys(action.changes).length === 0) return state;
      const camposForaDaWhitelist = Object.keys(action.changes).filter(
        (campo) => !(CAMPOS_WHITELIST as readonly string[]).includes(campo)
      );
      if (camposForaDaWhitelist.includes('responsavelId')) return state;
      const mudancasEfetivas = CAMPOS_WHITELIST.filter((campo) => mudou(campo, task, action.changes));
      if (mudancasEfetivas.length === 0) return state;
      const diffs = mudancasEfetivas.filter(
        (campo) => (CAMPOS_EDITAVEIS as readonly string[]).includes(campo)
      ) as typeof CAMPOS_EDITAVEIS[number][];
      const historico =
        diffs.length > 0
          ? [
              ...task.historico,
              newHistoryEntry(
                action.usuario,
                task.status,
                task.status,
                'info',
                montarObservacaoEdicao(diffs, task, action.changes)
              ),
            ]
          : task.historico;
      const mudancasAplicadas: Partial<Task> = {};
      for (const campo of mudancasEfetivas) {
        switch (campo) {
          case 'titulo':
            mudancasAplicadas.titulo = action.changes.titulo;
            break;
          case 'descricao':
            mudancasAplicadas.descricao = action.changes.descricao;
            break;
          case 'prazo':
            mudancasAplicadas.prazo = action.changes.prazo;
            break;
          case 'prioridade':
            mudancasAplicadas.prioridade = action.changes.prioridade;
            break;
          case 'categoria':
            mudancasAplicadas.categoria = action.changes.categoria;
            break;
          case 'tags':
            mudancasAplicadas.tags = action.changes.tags ?? [];
            break;
        }
      }
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, ...mudancasAplicadas, atualizadaEm: new Date().toISOString(), historico }
            : t
        ),
      };
    }
    case 'CHANGE_STATUS': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!podeAlterarStatusPara(state.currentUserId, task, action.novoStatus)) return state;
      if (!canTransition(task.status, action.novoStatus, roleOf(state.currentUserId))) return state;
      if (action.novoStatus === 'CANCELADA' && !action.observacao?.trim()) return state;
      const entry = newHistoryEntry(
        action.usuario,
        task.status,
        action.novoStatus,
        'status',
        action.observacao
      );
      const agora = new Date().toISOString();
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                status: action.novoStatus,
                atualizadaEm: agora,
                concluidaEm:
                  action.novoStatus === 'CONCLUIDA'
                    ? agora
                    : action.novoStatus === 'FINALIZADA'
                      ? t.concluidaEm
                      : undefined,
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'REASSIGN': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      if (!podeReatribuir(task.status)) return state;
      if (!action.observacao?.trim()) return state;
      const entry = newHistoryEntry(
        action.usuario,
        task.status,
        task.status,
        'info',
        action.observacao
      );
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                responsavelId: action.responsavelId,
                atualizadaEm: new Date().toISOString(),
                historico: [...t.historico, entry],
              }
            : t
        ),
      };
    }
    case 'DUPLICATE_TASK': {
      const task = state.tasks.find((t) => t.id === action.taskId);
      if (!task) return state;
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      const agora = new Date().toISOString();
      const copy: Task = {
        ...task,
        id: nextTaskId(state.tasks),
        status: 'NOVA',
        favorita: false,
        criadaEm: agora,
        atualizadaEm: agora,
        concluidaEm: undefined,
        criadorId: state.currentUserId,
        historico: [newHistoryEntry(action.usuario, null, 'NOVA', 'status', `Tarefa duplicada de ${task.id}.`)],
      };
      return { ...state, tasks: [...state.tasks, copy] };
    }
    case 'DELETE_TASK': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      if (!pode(state.currentUserId, 'gerenciar_tarefas')) return state;
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.taskId) };
    }
    case 'TOGGLE_FAVORITE': {
      if (!state.tasks.some((t) => t.id === action.taskId)) return state;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, favorita: !t.favorita, atualizadaEm: new Date().toISOString() }
            : t
        ),
      };
    }
    case 'REORDER_TASKS': {
      const from = state.tasks.findIndex((t) => t.id === action.taskId);
      const to = state.tasks.findIndex((t) => t.id === action.toTaskId);
      if (from < 0 || to < 0 || from === to) return state;
      const tasks = [...state.tasks];
      const [moved] = tasks.splice(from, 1);
      // Ao mover para baixo, a remoção desloca o alvo em -1; insere "antes" do alvo.
      const target = from < to ? to - 1 : to;
      tasks.splice(target, 0, moved);
      return { ...state, tasks };
    }
    default:
      return state;
  }
}

const UNDO_LIMIT = 50;

/** Ações que mudam tarefas mas NÃO entram na pilha de undo (sem toast; undo seria confuso). */
const NO_UNDO: ReadonlySet<AppAction['type']> = new Set(['TOGGLE_FAVORITE', 'REORDER_TASKS']);

/**
 * Reducer público: aplica a ação e empilha o estado anterior em `past` sempre que
 * as tarefas mudam (base para o Desfazer). UNDO é tratado aqui, fora da pilha.
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state;
    const tasks = state.past[state.past.length - 1];
    return { ...state, tasks, past: state.past.slice(0, -1) };
  }
  const next = appReducerCore(state, action);
  if (next.tasks === state.tasks) return next;
  if (NO_UNDO.has(action.type)) return next;
  return { ...next, past: [...state.past, state.tasks].slice(-UNDO_LIMIT) };
}
