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
  filters: { search: '', status: [], prioridade: [], responsavel: [], prazo: 'todas' },
  modal: { type: 'none' },
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
});
