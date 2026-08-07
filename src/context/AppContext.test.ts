import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { appReducer } from './appReducer';
import type { AppState } from './types';

const baseState: AppState = {
  tasks: [
    {
      id: 'TA-001',
      titulo: 'Login',
      descricao: '',
      prioridade: 'alta',
      prazo: '2026-08-10',
      status: 'CAIXA_ENTRADA',
      criadaEm: '2026-08-01T08:00:00',
      historico: [],
    },
    {
      id: 'TA-002',
      titulo: 'Campanha',
      descricao: '',
      prioridade: 'media',
      prazo: null,
      status: 'CONCLUIDA',
      criadaEm: '2026-08-01T09:00:00',
      historico: [],
    },
  ],
  view: 'lista',
  sidebarOpen: false,
  filters: { search: '', status: [], prioridade: [], prazo: 'todas', favoritas: false, categorias: [], sortBy: null },
  kpiCollapsed: false,
  filtersOpen: true,
  modal: { type: 'none' },
  past: [],
};

describe('appReducer — CHANGE_STATUS', () => {
  it('avança CAIXA_ENTRADA → A_FAZER e grava histórico', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'A_FAZER',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('A_FAZER');
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CAIXA_ENTRADA',
      novoStatus: 'A_FAZER',
    });
  });

  it('avança A_FAZER → EM_ANDAMENTO → CONCLUIDA e define concluidaEm', () => {
    let s = appReducer(baseState, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'A_FAZER' });
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'EM_ANDAMENTO' });
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'CONCLUIDA' });
    const task = s.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('CONCLUIDA');
    expect(task.concluidaEm).toBeDefined();
    expect(task.atualizadaEm).toBeDefined();
  });

  it('retoma CONCLUIDA → EM_ANDAMENTO e limpa concluidaEm', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'EM_ANDAMENTO',
    });
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('EM_ANDAMENTO');
    expect(task.concluidaEm).toBeUndefined();
  });

  it('transição inválida (CAIXA_ENTRADA → CONCLUIDA) é no-op sem undo', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CONCLUIDA',
    });
    expect(next).toBe(baseState);
    expect(next.past).toHaveLength(0);
  });
});

describe('appReducer — cancelamento (CANCELADA)', () => {
  const comStatus = (status: Task['status']): AppState => ({
    ...baseState,
    tasks: baseState.tasks.map((t) => (t.id === 'TA-001' ? { ...t, status } : t)),
  });

  it('cancela CAIXA_ENTRADA com observação e grava histórico', () => {
    const next = appReducer(comStatus('CAIXA_ENTRADA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
      observacao: 'Tarefa perdeu o sentido.',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('CANCELADA');
    expect(task.concluidaEm).toBeUndefined();
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CAIXA_ENTRADA',
      novoStatus: 'CANCELADA',
      observacao: 'Tarefa perdeu o sentido.',
    });
  });

  it('cancela a partir de A_FAZER e EM_ANDAMENTO', () => {
    for (const status of ['A_FAZER', 'EM_ANDAMENTO'] as const) {
      const next = appReducer(comStatus(status), {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus: 'CANCELADA',
        observacao: 'x',
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CANCELADA');
    }
  });

  it('não cancela a partir de CONCLUIDA', () => {
    const next = appReducer(comStatus('CONCLUIDA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
      observacao: 'x',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CONCLUIDA');
    expect(next.past).toHaveLength(0);
  });

  it('cancelamento sem observação é no-op (guarda anti-bypass)', () => {
    const next = appReducer(comStatus('CAIXA_ENTRADA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CAIXA_ENTRADA');
    expect(next.past).toHaveLength(0);
  });

  it('CANCELADA é terminal: nenhuma transição de saída', () => {
    const cancelada = comStatus('CANCELADA');
    for (const novoStatus of ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA'] as const) {
      const next = appReducer(cancelada, {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus,
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CANCELADA');
      expect(next.past).toHaveLength(0);
    }
  });
});

describe('appReducer — CREATE_TASK / DUPLICATE_TASK / DELETE_TASK', () => {
  it('adiciona nova tarefa', () => {
    const task: Task = {
      id: 'TA-003',
      titulo: 'Nova',
      descricao: '',
      prioridade: 'baixa',
      prazo: null,
      status: 'CAIXA_ENTRADA',
      criadaEm: '2026-08-03T10:00:00',
      historico: [],
    };
    const next = appReducer(baseState, { type: 'CREATE_TASK', task });
    expect(next.tasks).toHaveLength(baseState.tasks.length + 1);
  });

  it('duplica tarefa como CAIXA_ENTRADA com novo id', () => {
    const next = appReducer(baseState, { type: 'DUPLICATE_TASK', taskId: 'TA-001' });
    expect(next.tasks).toHaveLength(baseState.tasks.length + 1);
    const copy = next.tasks.find((t) => t.id !== 'TA-001' && t.id !== 'TA-002')!;
    expect(copy.titulo).toBe('Login');
    expect(copy.status).toBe('CAIXA_ENTRADA');
    expect(copy.historico[0]).toMatchObject({ tipo: 'status', novoStatus: 'CAIXA_ENTRADA' });
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

describe('appReducer — REORDER_TASKS / auditoria de edição', () => {
  it('reordena movendo a tarefa para antes do alvo', () => {
    const next = appReducer(baseState, { type: 'REORDER_TASKS', taskId: 'TA-002', toTaskId: 'TA-001' });
    expect(next.tasks.map((t) => t.id)).toEqual(['TA-002', 'TA-001']);
  });

  it('define atualizadaEm ao editar', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título' },
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.titulo).toBe('Novo título');
    expect(task.atualizadaEm).toBeDefined();
  });

  it('mudar prazo e prioridade grava histórico com diff', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { prazo: '2026-08-15', prioridade: 'baixa' },
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.prazo).toBe('2026-08-15');
    expect(task.prioridade).toBe('baixa');
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'info',
      statusAnterior: 'CAIXA_ENTRADA',
      novoStatus: 'CAIXA_ENTRADA',
      observacao: 'Prazo alterado de 2026-08-10 para 2026-08-15; Prioridade alterada de alta para baixa',
    });
  });

  it('UPDATE_TASK com campo fora da whitelist (ex.: status) é no-op', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título', status: 'CONCLUIDA' },
    });
    expect(next).toBe(baseState);
  });

  it('edição sem mudança efetiva retorna estado inalterado', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: {
        titulo: 'Login',
        descricao: '',
        prioridade: 'alta',
        prazo: '2026-08-10',
        categoria: undefined,
        tags: [],
      },
    });
    expect(next).toBe(baseState);
  });
});

describe('appReducer — UNDO', () => {
  it('desfaz a última mutação restaurando as tarefas anteriores', () => {
    const afterDelete = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(afterDelete.tasks.map((t) => t.id)).toEqual(['TA-002']);
    const undone = appReducer(afterDelete, { type: 'UNDO' });
    expect(undone.tasks.map((t) => t.id)).toEqual(['TA-001', 'TA-002']);
  });

  it('undo com histórico vazio não altera o estado', () => {
    expect(appReducer(baseState, { type: 'UNDO' })).toBe(baseState);
  });

  it('TOGGLE_FAVORITE e REORDER_TASKS não empilham undo', () => {
    expect(appReducer(baseState, { type: 'TOGGLE_FAVORITE', taskId: 'TA-001' }).past).toHaveLength(0);
    expect(appReducer(baseState, { type: 'REORDER_TASKS', taskId: 'TA-002', toTaskId: 'TA-001' }).past).toHaveLength(0);
  });

  it('DELETE_TASK empilha undo', () => {
    const next = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(next.past).toHaveLength(1);
  });
});

describe('appReducer — controles de interface', () => {
  it('TOGGLE_SIDEBAR alterna sidebarOpen', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_SIDEBAR' });
    expect(next.sidebarOpen).toBe(true);
  });

  it('SET_VIEW alterna a visualização', () => {
    const next = appReducer(baseState, { type: 'SET_VIEW', view: 'quadro' });
    expect(next.view).toBe('quadro');
  });

  it('RESET_FILTERS limpa filtros e preserva a ordenação', () => {
    const comFiltros: AppState = {
      ...baseState,
      filters: { ...baseState.filters, status: ['A_FAZER'], favoritas: true, sortBy: 'titulo' },
    };
    const next = appReducer(comFiltros, { type: 'RESET_FILTERS' });
    expect(next.filters.sortBy).toBe('titulo');
    expect(next.filters.status).toEqual([]);
    expect(next.filters.favoritas).toBe(false);
  });
});
