import { describe, expect, it } from 'vitest';
import type { Task } from '../../types';
import { cycleActionFor } from './cycleActions';

const TASK: Task = {
  id: 'TA-001',
  titulo: 'Login',
  descricao: '',
  responsavelId: 'joao',
  criadorId: 'carlos',
  prioridade: 'media',
  prazo: null,
  status: 'NOVA',
  criadaEm: '2026-08-01T08:00:00',
  historico: [],
};

describe('cycleActionFor', () => {
  it('RECEBIDA → Receber', () => {
    const act = cycleActionFor(TASK, 'RECEBIDA');
    expect(act?.label).toBe('Receber');
  });

  it('EM_EXECUCAO em status RECEBIDA → Iniciar', () => {
    const act = cycleActionFor({ ...TASK, status: 'RECEBIDA' }, 'EM_EXECUCAO');
    expect(act?.label).toBe('Iniciar');
  });

  it('EM_EXECUCAO em status CONCLUIDA → Reabrir', () => {
    const act = cycleActionFor({ ...TASK, status: 'CONCLUIDA' }, 'EM_EXECUCAO');
    expect(act?.label).toBe('Reabrir');
  });

  it('EM_EXECUCAO em status FINALIZADA → Reabrir aprovação', () => {
    const act = cycleActionFor({ ...TASK, status: 'FINALIZADA' }, 'EM_EXECUCAO');
    expect(act?.label).toBe('Reabrir aprovação');
  });

  it('EM_EXECUCAO em status DEVOLVIDA → Retomar', () => {
    const act = cycleActionFor({ ...TASK, status: 'DEVOLVIDA' }, 'EM_EXECUCAO');
    expect(act?.label).toBe('Retomar');
  });

  it('CONCLUIDA → Concluir', () => {
    const act = cycleActionFor({ ...TASK, status: 'EM_EXECUCAO' }, 'CONCLUIDA');
    expect(act?.label).toBe('Concluir');
  });

  it('FINALIZADA não tem ação de ciclo', () => {
    expect(cycleActionFor({ ...TASK, status: 'CONCLUIDA' }, 'FINALIZADA')).toBeNull();
    expect(cycleActionFor(TASK, 'DEVOLVIDA')).toBeNull();
  });
});
