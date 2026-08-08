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
  filters: { search: '', status: [], prioridade: [], prazo: 'todas', favoritas: false, categorias: [], tags: [] },
  kpiCollapsed: false,
  filtersOpen: true,
  modal: { type: 'none' },
  past: [],
  tema: 'claro',
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

describe('appReducer — arquivamento (ARQUIVADA)', () => {
  const comStatus = (status: Task['status']): AppState => ({
    ...baseState,
    tasks: baseState.tasks.map((t) => (t.id === 'TA-001' ? { ...t, status } : t)),
  });

  it('arquiva CAIXA_ENTRADA com motivo e grava histórico', () => {
    const next = appReducer(comStatus('CAIXA_ENTRADA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'ARQUIVADA',
      observacao: 'Tarefa perdeu o sentido.',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('ARQUIVADA');
    expect(task.concluidaEm).toBeUndefined();
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'CAIXA_ENTRADA',
      novoStatus: 'ARQUIVADA',
      observacao: 'Arquivada: Tarefa perdeu o sentido.',
    });
  });

  it('arquiva a partir de A_FAZER, EM_ANDAMENTO e SUSPENSA', () => {
    for (const status of ['A_FAZER', 'EM_ANDAMENTO', 'SUSPENSA'] as const) {
      const next = appReducer(comStatus(status), {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus: 'ARQUIVADA',
        observacao: 'x',
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('ARQUIVADA');
    }
  });

  it('não arquiva a partir de CONCLUIDA', () => {
    const next = appReducer(comStatus('CONCLUIDA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'ARQUIVADA',
      observacao: 'x',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CONCLUIDA');
    expect(next.past).toHaveLength(0);
  });

  it('arquivamento sem motivo é no-op (guarda anti-bypass)', () => {
    const next = appReducer(comStatus('CAIXA_ENTRADA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'ARQUIVADA',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CAIXA_ENTRADA');
    expect(next.past).toHaveLength(0);
  });

  it('desarquiva ARQUIVADA → CAIXA_ENTRADA registrando no histórico', () => {
    const arquivada = comStatus('ARQUIVADA');
    const next = appReducer(arquivada, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CAIXA_ENTRADA',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('CAIXA_ENTRADA');
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'ARQUIVADA',
      novoStatus: 'CAIXA_ENTRADA',
      observacao: 'Tarefa desarquivada.',
    });
  });

  it('ARQUIVADA só permite desarquivar', () => {
    const arquivada = comStatus('ARQUIVADA');
    for (const novoStatus of ['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'SUSPENSA'] as const) {
      const next = appReducer(arquivada, {
        type: 'CHANGE_STATUS',
        taskId: 'TA-001',
        novoStatus,
      });
      expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('ARQUIVADA');
      expect(next.past).toHaveLength(0);
    }
  });
});

describe('appReducer — suspensão (SUSPENSA)', () => {
  const comStatus = (status: Task['status']): AppState => ({
    ...baseState,
    tasks: baseState.tasks.map((t) => (t.id === 'TA-001' ? { ...t, status } : t)),
  });

  it('suspende EM_ANDAMENTO com data de retorno e grava no histórico', () => {
    const next = appReducer(comStatus('EM_ANDAMENTO'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'SUSPENSA',
      retornoEm: '2026-08-20',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('SUSPENSA');
    expect(task.retornoEm).toBe('2026-08-20');
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: 'EM_ANDAMENTO',
      novoStatus: 'SUSPENSA',
      observacao: 'Suspensa; retorno previsto em 20/08/2026.',
    });
  });

  it('suspende sem prazo definido (retornoEm null)', () => {
    const next = appReducer(comStatus('A_FAZER'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'SUSPENSA',
      retornoEm: null,
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('SUSPENSA');
    expect(task.retornoEm).toBeNull();
    expect(task.historico[0].observacao).toBe('Suspensa sem prazo definido de retorno.');
  });

  it('reativar SUSPENSA → A_FAZER limpa retornoEm', () => {
    const suspensa = {
      ...comStatus('SUSPENSA'),
      tasks: comStatus('SUSPENSA').tasks.map((t) =>
        t.id === 'TA-001' ? { ...t, retornoEm: '2026-08-20' } : t
      ),
    };
    const next = appReducer(suspensa, {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'A_FAZER',
    });
    const task = next.tasks.find((t) => t.id === 'TA-001')!;
    expect(task.status).toBe('A_FAZER');
    expect(task.retornoEm).toBeNull();
  });

  it('não suspende a partir da caixa de entrada', () => {
    const next = appReducer(comStatus('CAIXA_ENTRADA'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'SUSPENSA',
    });
    expect(next.tasks.find((t) => t.id === 'TA-001')!.status).toBe('CAIXA_ENTRADA');
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

  it('RESET_FILTERS limpa os filtros', () => {
    const comFiltros: AppState = {
      ...baseState,
      filters: { ...baseState.filters, status: ['A_FAZER'], favoritas: true },
    };
    const next = appReducer(comFiltros, { type: 'RESET_FILTERS' });
    expect(next.filters.status).toEqual([]);
    expect(next.filters.favoritas).toBe(false);
  });
});

describe('appReducer — subtarefas (checklist)', () => {
  it('adiciona, alterna e remove subtarefa', () => {
    let s = appReducer(baseState, { type: 'ADD_SUBTAREFA', taskId: 'TA-001', titulo: '  Etapa 1  ' });
    const item = s.tasks.find((t) => t.id === 'TA-001')!.subtarefas![0];
    expect(item).toMatchObject({ titulo: 'Etapa 1', concluida: false });
    s = appReducer(s, { type: 'TOGGLE_SUBTAREFA', taskId: 'TA-001', subtarefaId: item.id });
    expect(s.tasks.find((t) => t.id === 'TA-001')!.subtarefas![0].concluida).toBe(true);
    s = appReducer(s, { type: 'REMOVE_SUBTAREFA', taskId: 'TA-001', subtarefaId: item.id });
    expect(s.tasks.find((t) => t.id === 'TA-001')!.subtarefas).toHaveLength(0);
  });

  it('adicionar/remover empilham undo; alternar não', () => {
    let s = appReducer(baseState, { type: 'ADD_SUBTAREFA', taskId: 'TA-001', titulo: 'x' });
    expect(s.past).toHaveLength(1);
    const id = s.tasks.find((t) => t.id === 'TA-001')!.subtarefas![0].id;
    s = appReducer(s, { type: 'TOGGLE_SUBTAREFA', taskId: 'TA-001', subtarefaId: id });
    expect(s.past).toHaveLength(1); // TOGGLE não empilha
    s = appReducer(s, { type: 'REMOVE_SUBTAREFA', taskId: 'TA-001', subtarefaId: id });
    expect(s.past).toHaveLength(2);
  });

  it('subtarefa sem título é no-op', () => {
    expect(appReducer(baseState, { type: 'ADD_SUBTAREFA', taskId: 'TA-001', titulo: '  ' })).toBe(baseState);
  });
});

describe('appReducer — anotações', () => {
  it('adiciona e remove anotação com timestamp', () => {
    let s = appReducer(baseState, { type: 'ADD_ANOTACAO', taskId: 'TA-001', texto: '  Ideia importante  ' });
    const nota = s.tasks.find((t) => t.id === 'TA-001')!.anotacoes![0];
    expect(nota.texto).toBe('Ideia importante');
    expect(nota.criadaEm).toBeDefined();
    s = appReducer(s, { type: 'REMOVE_ANOTACAO', taskId: 'TA-001', anotacaoId: nota.id });
    expect(s.tasks.find((t) => t.id === 'TA-001')!.anotacoes).toHaveLength(0);
  });

  it('anotação em branco é no-op', () => {
    expect(appReducer(baseState, { type: 'ADD_ANOTACAO', taskId: 'TA-001', texto: ' ' })).toBe(baseState);
  });
});

describe('appReducer — recorrência', () => {
  const comRecorrencia = (recorrencia: 'diaria' | 'semanal' | 'mensal', prazo: string | null): AppState => ({
    ...baseState,
    tasks: [
      {
        ...baseState.tasks[0],
        status: 'EM_ANDAMENTO' as const,
        recorrencia,
        prazo,
        subtarefas: [
          { id: 'st1', titulo: 'A', concluida: true },
          { id: 'st2', titulo: 'B', concluida: false },
        ],
        anotacoes: [{ id: 'an1', texto: 'nota', criadaEm: '2026-08-01T08:00:00' }],
      },
      baseState.tasks[1],
    ],
  });

  it('concluir tarefa diária cria a próxima ocorrência (prazo +1 dia)', () => {
    const next = appReducer(comRecorrencia('diaria', '2026-08-10'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CONCLUIDA',
    });
    expect(next.tasks).toHaveLength(3);
    const ocorrencia = next.tasks.find((t) => t.id !== 'TA-001' && t.id !== 'TA-002')!;
    expect(ocorrencia.status).toBe('CAIXA_ENTRADA');
    expect(ocorrencia.prazo).toBe('2026-08-11');
    expect(ocorrencia.titulo).toBe('Login');
    expect(ocorrencia.concluidaEm).toBeUndefined();
    expect(ocorrencia.historico[0]).toMatchObject({
      tipo: 'status',
      observacao: 'Próxima ocorrência (diaria) de "Login".',
    });
    // subtarefas preservadas mas desmarcadas; anotações zeradas
    expect(ocorrencia.subtarefas!.map((s) => s.concluida)).toEqual([false, false]);
    expect(ocorrencia.anotacoes).toEqual([]);
  });

  it('semanal soma 7 dias; mensal clampeia 31/01 → 28/02', () => {
    const sem = appReducer(comRecorrencia('semanal', '2026-08-10'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CONCLUIDA',
    });
    expect(sem.tasks[sem.tasks.length - 1]!.prazo).toBe('2026-08-17');
    const mensal = appReducer(comRecorrencia('mensal', '2026-01-31'), {
      type: 'CHANGE_STATUS',
      taskId: 'TA-001',
      novoStatus: 'CONCLUIDA',
    });
    expect(mensal.tasks[mensal.tasks.length - 1]!.prazo).toBe('2026-02-28');
  });

  it('tarefa sem recorrência não gera ocorrência', () => {
    const next = appReducer(baseState, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'CONCLUIDA' });
    expect(next.tasks).toHaveLength(2);
  });
});

describe('appReducer — lembrete e tema', () => {
  it('UPDATE_TASK aceita projeto/lembrete/recorrencia e reseta lembreteNotificado', () => {
    let s = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { projeto: 'Lançamento', lembrete: '2026-08-10T09:00', recorrencia: 'semanal' },
    });
    let t = s.tasks.find((t) => t.id === 'TA-001')!;
    expect(t).toMatchObject({ projeto: 'Lançamento', lembrete: '2026-08-10T09:00', recorrencia: 'semanal', lembreteNotificado: false });
    s = appReducer(s, { type: 'MARK_LEMBRETE_NOTIFICADO', taskId: 'TA-001' });
    t = s.tasks.find((t) => t.id === 'TA-001')!;
    expect(t.lembreteNotificado).toBe(true);
    // Alterar o lembrete novamente volta a permitir notificar
    s = appReducer(s, { type: 'UPDATE_TASK', taskId: 'TA-001', changes: { lembrete: '2026-08-11T09:00' } });
    t = s.tasks.find((t) => t.id === 'TA-001')!;
    expect(t.lembreteNotificado).toBe(false);
  });

  it('MARK_LEMBRETE_NOTIFICADO não empilha undo', () => {
    const s = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { lembrete: '2026-08-10T09:00' },
    });
    const next = appReducer(s, { type: 'MARK_LEMBRETE_NOTIFICADO', taskId: 'TA-001' });
    expect(next.past).toHaveLength(1); // apenas o UPDATE empilhou
  });

  it('TOGGLE_TEMA alterna claro/escuro', () => {
    const next = appReducer(baseState, { type: 'TOGGLE_TEMA' });
    expect(next.tema).toBe('escuro');
    expect(appReducer(next, { type: 'TOGGLE_TEMA' }).tema).toBe('claro');
  });

  it('reabrir a tarefa (EM_ANDAMENTO) volta a permitir notificar o lembrete', () => {
    let s = appReducer(baseState, {
      type: 'UPDATE_TASK',
      taskId: 'TA-001',
      changes: { lembrete: '2026-08-10T09:00' },
    });
    s = appReducer(s, { type: 'MARK_LEMBRETE_NOTIFICADO', taskId: 'TA-001' });
    expect(s.tasks.find((t) => t.id === 'TA-001')!.lembreteNotificado).toBe(true);
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'A_FAZER' });
    s = appReducer(s, { type: 'CHANGE_STATUS', taskId: 'TA-001', novoStatus: 'EM_ANDAMENTO' });
    expect(s.tasks.find((t) => t.id === 'TA-001')!.lembreteNotificado).toBe(false);
  });
});
