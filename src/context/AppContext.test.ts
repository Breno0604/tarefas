import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { appReducer, type AppState } from './AppContext';

const baseState: AppState = {
  tasks: [
    {
      id: 'TA-001',
      titulo: 'Login',
      descricao: '',
      responsavelId: 'joao',
      criadorId: 'carlos',
      prioridade: 'alta',
      prazo: '2026-08-10',
      status: 'NOVA',
      criadaEm: '2026-08-01T08:00:00',
      historico: [],
    },
    {
      id: 'TA-002',
      titulo: 'Campanha',
      descricao: '',
      responsavelId: 'maria',
      criadorId: 'carlos',
      prioridade: 'media',
      prazo: null,
      status: 'CONCLUIDA',
      criadaEm: '2026-08-01T09:00:00',
      historico: [],
    },
  ],
  currentUserId: 'carlos',
  section: 'tarefas',
  view: 'lista',
  sidebarCollapsed: false,
  filters: { search: '', status: [], prioridade: [], responsavel: [], prazo: 'todas', favoritas: false, categorias: [], sortBy: null },
  modal: { type: 'none' },
  past: [],
};

describe('appReducer — CHANGE_STATUS', () => {
  it('gestor aprova CONCLUIDA → FINALIZADA e grava histórico', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'FINALIZADA',
      usuario: 'Carlos Mendes',
      observacao: 'Aprovado',
    });
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('FINALIZADA');
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CONCLUIDA',
      novoStatus: 'FINALIZADA',
      usuario: 'Carlos Mendes',
      observacao: 'Aprovado',
    });
  });

  it('colaborador não consegue finalizar tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'FINALIZADA', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('CONCLUIDA');
  });

  it('colaborador recebe NOVA → RECEBIDA', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'RECEBIDA', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('RECEBIDA');
  });

  it('gestor devolve CONCLUIDA → DEVOLVIDA com observação', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'DEVOLVIDA',
      usuario: 'Carlos Mendes',
      observacao: 'Ajustar copy',
    });
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('DEVOLVIDA');
  });

  it('colaborador reabre CONCLUIDA → EM_EXECUCAO e grava histórico', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'João Silva' }
    );
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('EM_EXECUCAO');
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CONCLUIDA',
      novoStatus: 'EM_EXECUCAO',
      usuario: 'João Silva',
    });
  });

  it('gestor não consegue reabrir CONCLUIDA', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'EM_EXECUCAO',
      usuario: 'Carlos Mendes',
    });
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('CONCLUIDA');
  });
});

describe('appReducer — CREATE_TASK / REASSIGN', () => {
  it('adiciona nova tarefa', () => {
    const task: Task = {
      id: 'TA-003',
      titulo: 'Nova',
      descricao: '',
      responsavelId: 'ana',
      criadorId: 'carlos',
      prioridade: 'baixa',
      prazo: null,
      status: 'NOVA',
      criadaEm: '2026-08-03T10:00:00',
      historico: [],
    };
    const next = appReducer(baseState, { type: 'CREATE_TASK', task });
    expect(next.tasks).toHaveLength(baseState.tasks.length + 1);
  });

  it('reatribui responsável e registra entrada de histórico informativa', () => {
    const next = appReducer(baseState, {
      type: 'REASSIGN',
      taskId: 'TA-001',
      responsavelId: 'ana',
      usuario: 'Carlos Mendes',
      observacao: 'Responsável alterado para Ana Costa',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.responsavelId).toBe('ana');
    expect(task.historico[0].tipo).toBe('info');
  });

  it('duplica tarefa como NOVA com novo id, mantendo título e responsável', () => {
    const next = appReducer(baseState, {
      type: 'DUPLICATE_TASK',
      taskId: 'TA-001',
      usuario: 'Carlos Mendes',
    });
    expect(next.tasks).toHaveLength(baseState.tasks.length + 1);
    const original = next.tasks.find((t) => t.id === 'TA-001')!;
    const copy = next.tasks.find((t) => t.id !== 'TA-001' && t.id !== 'TA-002')!;
    expect(original.status).toBe('NOVA');
    expect(copy.titulo).toBe('Login');
    expect(copy.responsavelId).toBe('joao');
    expect(copy.status).toBe('NOVA');
    expect(copy.historico[0]).toMatchObject({ tipo: 'status', novoStatus: 'NOVA' });
  });

  it('exclui tarefa pelo id', () => {
    const next = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(next.tasks.some((t) => t.id === 'TA-001')).toBe(false);
    expect(next.tasks).toHaveLength(baseState.tasks.length - 1);
  });

  it('excluir tarefa inexistente não altera o estado', () => {
    const next = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-999' });
    expect(next).toBe(baseState);
  });

  it('alterna o favorito da tarefa', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_FAVORITE', taskId: 'TA-001' });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.favorita).toBe(true);
    const back = appReducer(next, { type: 'TOGGLE_FAVORITE', taskId: 'TA-001' });
    expect(back.tasks.find((t) => t.id === 'TA-001')!.favorita).toBe(false);
  });
});

describe('appReducer — REORDER_TASKS / timestamps', () => {
  it('reordena movendo a tarefa para antes do alvo', () => {
    const next = appReducer(baseState, { type: 'REORDER_TASKS', taskId: 'TA-002', toTaskId: 'TA-001' });
    expect(next.tasks.map((t) => t.id)).toEqual(['TA-002', 'TA-001']);
  });

  it('reordena para baixo considerando o deslocamento da remoção', () => {
    const three = appReducer(baseState, {
      type: 'CREATE_TASK',
      task: { ...baseState.tasks[0], id: 'TA-003', titulo: 'Terceira' },
    });
    // ordem atual: TA-001, TA-002, TA-003; mover TA-001 para antes de TA-003
    const next = appReducer(three, { type: 'REORDER_TASKS', taskId: 'TA-001', toTaskId: 'TA-003' });
    expect(next.tasks.map((t) => t.id)).toEqual(['TA-002', 'TA-001', 'TA-003']);
  });

  it('reordenar para a mesma posição não altera o estado', () => {
    const next = appReducer(baseState, { type: 'REORDER_TASKS', taskId: 'TA-001', toTaskId: 'TA-001' });
    expect(next).toBe(baseState);
  });

  it('define atualizadaEm ao editar', () => {
    const next = appReducer(baseState, { type: 'UPDATE_TASK', taskId: 'TA-001', changes: { titulo: 'Novo título' } });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.titulo).toBe('Novo título');
    expect(task.atualizadaEm).toBeDefined();
  });

  it('define concluidaEm e atualizadaEm ao concluir', () => {
    let s: AppState = { ...baseState, currentUserId: 'joao' };
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'RECEBIDA', usuario: 'João Silva' });
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'EM_EXECUCAO', usuario: 'João Silva' });
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'CONCLUIDA', usuario: 'João Silva' });
    const task = s.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('CONCLUIDA');
    expect(task.concluidaEm).toBeDefined();
    expect(task.atualizadaEm).toBeDefined();
  });

  it('limpa concluidaEm ao reabrir', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.concluidaEm).toBeUndefined();
  });

  it('atualiza atualizadaEm ao finalizar', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'FINALIZADA',
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('FINALIZADA');
    expect(task.atualizadaEm).toBeDefined();
  });
});

describe('appReducer — UNDO', () => {
  it('desfaz a última mutação restaurando as tarefas anteriores', () => {
    const afterDelete = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(afterDelete.tasks.map((t) => t.id)).toEqual(['TA-002']);
    const undone = appReducer(afterDelete, { type: 'UNDO' });
    expect(undone.tasks.map((t) => t.id)).toEqual(['TA-001', 'TA-002']);
  });

  it('desfaz múltiplas mutações em LIFO', () => {
    let s = appReducer(baseState, {
      type: 'CREATE_TASK',
      task: { ...baseState.tasks[0], id: 'TA-003', titulo: 'Terceira' },
    });
    s = appReducer(s, { type: 'DELETE_TASK', taskId: 'TA-001' });
    s = appReducer(s, { type: 'UNDO' });
    expect(s.tasks.map((t) => t.id)).toEqual(['TA-001', 'TA-002', 'TA-003']);
    s = appReducer(s, { type: 'UNDO' });
    expect(s.tasks.map((t) => t.id)).toEqual(['TA-001', 'TA-002']);
  });

  it('undo com histórico vazio não altera o estado', () => {
    expect(appReducer(baseState, { type: 'UNDO' })).toBe(baseState);
  });
});

describe('appReducer — guards (sem mutação fantasma)', () => {
  it('UPDATE_TASK com id inexistente não altera o estado nem empilha undo', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-999',
      changes: { titulo: 'X' },
    });
    expect(next).toBe(baseState);
  });

  it('UPDATE_TASK sem alterações não altera o estado', () => {
    const next = appReducer(baseState, { type: 'UPDATE_TASK', taskId: 'TA-001', changes: {} });
    expect(next).toBe(baseState);
  });

  it('TOGGLE_FAVORITE com id inexistente não altera o estado', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_FAVORITE', taskId: 'TA-999' });
    expect(next).toBe(baseState);
  });

  it('RESET_FILTERS limpa filtros e preserva a ordenação', () => {
    const comFiltros: AppState = {
      ...baseState,
      filters: { ...baseState.filters, status: ['NOVA'], favoritas: true, sortBy: 'titulo' },
    };
    const next = appReducer(comFiltros, { type: 'RESET_FILTERS' });
    expect(next.filters.sortBy).toBe('titulo');
    expect(next.filters.status).toEqual([]);
    expect(next.filters.favoritas).toBe(false);
    expect(next.filters.search).toBe('');
  });
});
