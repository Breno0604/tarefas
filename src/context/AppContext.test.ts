import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../types';
import { appReducer } from './appReducer';
import type { AppState } from './types';

vi.mock('../data/mockData', async (importOriginal) => {
  const original = await importOriginal<typeof import('../data/mockData')>();
  return {
    ...original,
    findUser: (id: string) => {
      const u = original.findUser(id);
      if (!u) return undefined;
      if (id === 'lucas') return { ...u, permissoes: ['alterar_status_outros'] };
      return u;
    },
  };
});

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
  sidebarOpen: false,
  filters: { search: '', status: [], prioridade: [], responsavel: [], prazo: 'todas', favoritas: false, categorias: [], sortBy: null, paradas: null, comRetrabalho: false },
  kpiCollapsed: false,
  filtersOpen: true,
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
      { ...baseState, currentUserId: 'maria' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'Maria Souza' }
    );
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('EM_EXECUCAO');
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CONCLUIDA',
      novoStatus: 'EM_EXECUCAO',
      usuario: 'Maria Souza',
    });
  });

  it('gestor pode reabrir CONCLUIDA', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'EM_EXECUCAO',
      usuario: 'Carlos Mendes',
    });
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('EM_EXECUCAO');
  });
});

describe('appReducer — reabrir restrito ao responsável', () => {
  it('colaborador com alterar_status_outros não reabre CONCLUIDA de outro', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'lucas' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'Lucas Pereira' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('CONCLUIDA');
    expect(next.past).toHaveLength(0);
  });

  it('alterar_status_outros continua valendo para transições fora do reabrir', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'lucas' },
      { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'RECEBIDA', usuario: 'Lucas Pereira' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('RECEBIDA');
  });

  it('responsável pode reabrir a própria CONCLUIDA', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'maria' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'Maria Souza' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('EM_EXECUCAO');
  });
});

describe('appReducer — reversão de FINALIZADA', () => {
  const estadoFinalizada: AppState = {
    ...baseState,
    tasks: baseState.tasks.map((t) =>
      t.id === 'TA-002' ? { ...t, status: 'FINALIZADA' as const, concluidaEm: '2026-08-03T10:00:00' } : t
    ),
  };

  it('gestor reverte FINALIZADA → EM_EXECUCAO e limpa concluidaEm', () => {
    const next = appReducer(estadoFinalizada, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'EM_EXECUCAO',
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-002')!;
    expect(task.status).toBe('EM_EXECUCAO');
    expect(task.concluidaEm).toBeUndefined();
    expect(task.atualizadaEm).toBeDefined();
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'FINALIZADA',
      novoStatus: 'EM_EXECUCAO',
      usuario: 'Carlos Mendes',
    });
  });

  it('colaborador (mesmo responsável) não reverte FINALIZADA', () => {
    const next = appReducer(
      { ...estadoFinalizada, currentUserId: 'maria' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'Maria Souza' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('FINALIZADA');
    expect(next.past).toHaveLength(0);
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
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título' },
      usuario: 'Carlos Mendes',
    });
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
      { ...baseState, currentUserId: 'maria' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'Maria Souza' }
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
      usuario: 'Carlos Mendes',
    });
    expect(next).toBe(baseState);
  });

  it('UPDATE_TASK sem alterações não altera o estado', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: {},
      usuario: 'Carlos Mendes',
    });
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

  it('TOGGLE_FAVORITE não empilha undo', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_FAVORITE', taskId: 'TA-001' });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.favorita).toBe(true);
    expect(next.past).toHaveLength(0);
  });

  it('REORDER_TASKS não empilha undo', () => {
    const next = appReducer(baseState, { type: 'REORDER_TASKS', taskId: 'TA-002', toTaskId: 'TA-001' });
    expect(next.tasks.map((t) => t.id)).toEqual(['TA-002', 'TA-001']);
    expect(next.past).toHaveLength(0);
  });

  it('DELETE_TASK empilha undo', () => {
    const next = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(next.tasks).toHaveLength(1);
    expect(next.past).toHaveLength(1);
  });
});

describe('appReducer — TOGGLE_SIDEBAR', () => {
  it('alterna sidebarOpen entre true e false', () => {
    expect(baseState.sidebarOpen).toBe(false);
    const opened = appReducer(baseState, { type: 'TOGGLE_SIDEBAR' });
    expect(opened.sidebarOpen).toBe(true);
    const closed = appReducer(opened, { type: 'TOGGLE_SIDEBAR' });
    expect(closed.sidebarOpen).toBe(false);
  });

  it('não empilha undo', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_SIDEBAR' });
    expect(next.past).toHaveLength(0);
  });
});

describe('appReducer — controles de interface (topo)', () => {
  it('TOGGLE_KPI_COLLAPSED alterna kpiCollapsed', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_KPI_COLLAPSED' });
    expect(next.kpiCollapsed).toBe(true);
    const back = appReducer(next, { type: 'TOGGLE_KPI_COLLAPSED' });
    expect(back.kpiCollapsed).toBe(false);
  });

  it('TOGGLE_KPI_COLLAPSED não empilha undo', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_KPI_COLLAPSED' });
    expect(next.past).toHaveLength(0);
  });

  it('TOGGLE_FILTERS alterna filtersOpen', () => {
    expect(baseState.filtersOpen).toBe(true);
    const next = appReducer(baseState, { type: 'TOGGLE_FILTERS' });
    expect(next.filtersOpen).toBe(false);
    const back = appReducer(next, { type: 'TOGGLE_FILTERS' });
    expect(back.filtersOpen).toBe(true);
  });

  it('TOGGLE_FILTERS não empilha undo', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_FILTERS' });
    expect(next.past).toHaveLength(0);
  });
});

describe('appReducer — permissão de alteração de status', () => {
  it('colaborador não altera status de tarefa de outro usuário', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-002', novoStatus: 'EM_EXECUCAO', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('CONCLUIDA');
    expect(next.past).toHaveLength(0);
  });

  it('responsável pode alterar o status da própria tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'RECEBIDA', usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('RECEBIDA');
  });

  it('gestor continua podendo aprovar tarefa de qualquer usuário', () => {
    const next = appReducer(baseState, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-002',
      novoStatus: 'FINALIZADA',
      usuario: 'Carlos Mendes',
    });
    expect(next.tasks.find((t) => t.id === 'TA-002')!.status).toBe('FINALIZADA');
  });
});

describe('appReducer — permissão de gestão (gerenciar_tarefas)', () => {
  it('colaborador sem gerenciar_tarefas não edita tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'UPDATE_TASK', taskId: 'TA-001', changes: { titulo: 'Hackeado' }, usuario: 'João Silva' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.titulo).toBe('Login');
    expect(next.past).toHaveLength(0);
  });

  it('colaborador sem gerenciar_tarefas não exclui tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'DELETE_TASK', taskId: 'TA-001' }
    );
    expect(next.tasks.some((t) => t.id === 'TA-001')).toBe(true);
  });

  it('colaborador sem gerenciar_tarefas não duplica tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'DUPLICATE_TASK', taskId: 'TA-001', usuario: 'João Silva' }
    );
    expect(next.tasks).toHaveLength(baseState.tasks.length);
  });

  it('colaborador sem gerenciar_tarefas não reatribui tarefa', () => {
    const next = appReducer(
      { ...baseState, currentUserId: 'joao' },
      { type: 'REASSIGN', taskId: 'TA-001', responsavelId: 'ana', usuario: 'João Silva', observacao: 'x' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.responsavelId).toBe('joao');
  });

  it('gestor continua podendo editar, excluir, duplicar e reatribuir', () => {
    const editado = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo' },
      usuario: 'Carlos Mendes',
    });
    expect(editado.tasks.find((t) => t.id === 'TA-001')!.titulo).toBe('Novo');

    const excluido = appReducer(baseState, { type: 'DELETE_TASK', taskId: 'TA-001' });
    expect(excluido.tasks.some((t) => t.id === 'TA-001')).toBe(false);

    const duplicado = appReducer(baseState, { type: 'DUPLICATE_TASK', taskId: 'TA-001', usuario: 'Carlos Mendes' });
    expect(duplicado.tasks).toHaveLength(baseState.tasks.length + 1);

    const reatribuido = appReducer(baseState, { type: 'REASSIGN', taskId: 'TA-001', responsavelId: 'ana', usuario: 'Carlos Mendes', observacao: 'x' });
    expect(reatribuido.tasks.find((t) => t.id === 'TA-001')!.responsavelId).toBe('ana');
  });
});

describe('appReducer — cancelamento (CANCELADA)', () => {
  const comStatus = (status: Task['status']): AppState => ({
    ...baseState,
    tasks: baseState.tasks.map((t) => (t.id === 'TA-001' ? { ...t, status } : t)),
  });

  it('gestor cancela NOVA com observação e grava histórico', () => {
    const next = appReducer(comStatus('NOVA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
      usuario: 'Carlos Mendes',
      observacao: 'Tarefa perdeu o sentido.',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('CANCELADA');
    expect(task.concluidaEm).toBeUndefined();
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'NOVA',
      novoStatus: 'CANCELADA',
      usuario: 'Carlos Mendes',
      observacao: 'Tarefa perdeu o sentido.',
    });
  });

  it('gestor cancela a partir de RECEBIDA, EM_EXECUCAO e DEVOLVIDA', () => {
    for (const status of ['RECEBIDA', 'EM_EXECUCAO', 'DEVOLVIDA'] as const) {
      const next = appReducer(comStatus(status), {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus: 'CANCELADA',
        usuario: 'Carlos Mendes',
        observacao: 'x',
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CANCELADA');
    }
  });

  it('colaborador (mesmo responsável) não cancela', () => {
    const next = appReducer(
      { ...comStatus('NOVA'), currentUserId: 'joao' },
      { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'CANCELADA', usuario: 'João Silva', observacao: 'x' }
    );
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('NOVA');
    expect(next.past).toHaveLength(0);
  });

  it('gestor não cancela a partir de CONCLUIDA nem FINALIZADA', () => {
    for (const status of ['CONCLUIDA', 'FINALIZADA'] as const) {
      const next = appReducer(comStatus(status), {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus: 'CANCELADA',
        usuario: 'Carlos Mendes',
        observacao: 'x',
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe(status);
      expect(next.past).toHaveLength(0);
    }
  });

  it('cancelamento sem observação é no-op (guarda anti-bypass)', () => {
    const next = appReducer(comStatus('NOVA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CANCELADA',
      usuario: 'Carlos Mendes',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('NOVA');
    expect(next.past).toHaveLength(0);
  });

  it('CANCELADA é terminal: nenhuma transição de saída', () => {
    const cancelada = comStatus('CANCELADA');
    for (const novoStatus of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA', 'FINALIZADA'] as const) {
      const next = appReducer(cancelada, {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus,
        usuario: 'Carlos Mendes',
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CANCELADA');
      expect(next.past).toHaveLength(0);
    }
  });
});

describe('appReducer — auditoria de edição (UPDATE_TASK)', () => {
  it('mudar prazo e prioridade grava histórico com diff', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { prazo: '2026-08-15', prioridade: 'baixa' },
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.prazo).toBe('2026-08-15');
    expect(task.prioridade).toBe('baixa');
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'info',
      statusAnterior: 'NOVA',
      novoStatus: 'NOVA',
      usuario: 'Carlos Mendes',
      observacao: 'Prazo alterado de 2026-08-10 para 2026-08-15; Prioridade alterada de alta para baixa',
    });
  });

  it('mudar título e descrição grava histórico com diff', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título', descricao: 'Nova descrição' },
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0].observacao).toBe(
      'Título alterado de Login para Novo título; Descrição alterada de vazio para Nova descrição'
    );
  });

  it('mudar prazo para sem prazo (null) grava diff legível', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { prazo: null },
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.historico[0].observacao).toBe('Prazo alterado de 2026-08-10 para sem prazo');
  });

  it('mudar prazo para o mesmo valor não grava histórico', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { prazo: '2026-08-10' },
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.historico).toHaveLength(0);
  });

  it('edição sem campo relevante (ex.: categoria) aplica a mudança sem gravar histórico', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { categoria: 'Novo' },
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.categoria).toBe('Novo');
    expect(task.atualizadaEm).toBeDefined();
    expect(task.historico).toHaveLength(0);
  });
});

describe('appReducer — guard de reatribuição (REASSIGN)', () => {
  const comStatus = (status: Task['status']): AppState => ({
    ...baseState,
    tasks: baseState.tasks.map((t) => (t.id === 'TA-001' ? { ...t, status } : t)),
  });

  it('não reatribui FINALIZADA (estado inalterado, sem undo)', () => {
    const estado = comStatus('FINALIZADA');
    const next = appReducer(estado, {
      type: 'REASSIGN',
      taskId: 'TA-001',
      responsavelId: 'ana',
      usuario: 'Carlos Mendes',
      observacao: 'x',
    });
    expect(next).toBe(estado);
    expect(next.tasks.find((t) => t.id === 'TA-001')!.responsavelId).toBe('joao');
    expect(next.tasks.find((t) => t.id === 'TA-001')!.historico).toHaveLength(0);
  });

  it('não reatribui CANCELADA (estado inalterado, sem undo)', () => {
    const estado = comStatus('CANCELADA');
    const next = appReducer(estado, {
      type: 'REASSIGN',
      taskId: 'TA-001',
      responsavelId: 'ana',
      usuario: 'Carlos Mendes',
      observacao: 'x',
    });
    expect(next).toBe(estado);
    expect(next.tasks.find((t) => t.id === 'TA-001')!.responsavelId).toBe('joao');
  });

  it('reatribuir CONCLUIDA continua permitido', () => {
    const next = appReducer(comStatus('CONCLUIDA'), {
      type: 'REASSIGN',
      taskId: 'TA-001',
      responsavelId: 'ana',
      usuario: 'Carlos Mendes',
      observacao: 'x',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.responsavelId).toBe('ana');
    expect(task.historico[0].tipo).toBe('info');
  });
});

describe('appReducer — robustez do reducer (fixup: whitelist, no-op, obs REASSIGN)', () => {
  it('UPDATE_TASK com responsavelId em changes não reatribui nem grava histórico', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título', responsavelId: 'ana' },
      usuario: 'Carlos Mendes',
    });
    expect(next).toBe(baseState);
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.responsavelId).toBe('joao');
    expect(task.titulo).toBe('Login');
    expect(task.historico).toHaveLength(0);
  });

  it('UPDATE_TASK descarta campos fora da whitelist (ex.: status)', () => {
    const next = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Novo título', status: 'FINALIZADA' },
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.titulo).toBe('Novo título');
    expect(task.status).toBe('NOVA');
  });

  it('edição sem mudança efetiva retorna estado inalterado (sem bump de atualizadaEm, sem undo)', () => {
    const comCategoria: AppState = {
      ...baseState,
      tasks: baseState.tasks.map((t) =>
        t.id === 'TA-001' ? { ...t, categoria: 'Desenvolvimento', tags: ['bug'] } : t
      ),
    };
    const next = appReducer(comCategoria, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: {
        titulo: 'Login',
        descricao: '',
        prioridade: 'alta',
        prazo: '2026-08-10',
        categoria: 'Desenvolvimento',
        tags: ['bug'],
      },
      usuario: 'Carlos Mendes',
    });
    expect(next).toBe(comCategoria);
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.atualizadaEm).toBeUndefined();
    expect(task.historico).toHaveLength(0);
    expect(next.past).toHaveLength(0);
  });

  it('edição no-op com o formato do modal (categoria undefined, tags []) retorna estado', () => {
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
      usuario: 'Carlos Mendes',
    });
    expect(next).toBe(baseState);
    expect(next.tasks.find((t) => t.id === 'TA-001')!.atualizadaEm).toBeUndefined();
  });

  it('limpar categoria existente é mudança efetiva (não é no-op)', () => {
    const comCategoria: AppState = {
      ...baseState,
      tasks: baseState.tasks.map((t) => (t.id === 'TA-001' ? { ...t, categoria: 'Desenvolvimento' } : t)),
    };
    const next = appReducer(comCategoria, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { titulo: 'Login', categoria: undefined },
      usuario: 'Carlos Mendes',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.categoria).toBeUndefined();
    expect(task.atualizadaEm).toBeDefined();
    expect(task.historico).toHaveLength(0);
  });

  it('REASSIGN sem observação retorna estado inalterado (sem reatribuir, sem undo)', () => {
    const next = appReducer(baseState, {
      type: 'REASSIGN',
      taskId: 'TA-001',
      responsavelId: 'ana',
      usuario: 'Carlos Mendes',
      observacao: '   ',
    });
    expect(next).toBe(baseState);
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.responsavelId).toBe('joao');
    expect(task.historico).toHaveLength(0);
    expect(next.past).toHaveLength(0);
  });
});
