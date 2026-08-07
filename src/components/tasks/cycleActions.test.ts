import { describe, expect, it } from 'vitest';
import type { Task } from '../../types';
import { cycleActionFor } from './cycleActions';

const TASK: Task = {
  id: 'TA-001',
  titulo: 'Login',
  descricao: '',
  prioridade: 'media',
  prazo: null,
  status: 'CAIXA_ENTRADA',
  criadaEm: '2026-08-01T08:00:00',
  historico: [],
};

describe('cycleActionFor', () => {
  it('A_FAZER → Planejar', () => {
    const act = cycleActionFor(TASK, 'A_FAZER');
    expect(act?.label).toBe('Planejar');
  });

  it('EM_ANDAMENTO em status A_FAZER → Iniciar', () => {
    const act = cycleActionFor({ ...TASK, status: 'A_FAZER' }, 'EM_ANDAMENTO');
    expect(act?.label).toBe('Iniciar');
  });

  it('EM_ANDAMENTO em status CONCLUIDA → Retomar', () => {
    const act = cycleActionFor({ ...TASK, status: 'CONCLUIDA' }, 'EM_ANDAMENTO');
    expect(act?.label).toBe('Retomar');
  });

  it('CONCLUIDA → Concluir', () => {
    const act = cycleActionFor({ ...TASK, status: 'EM_ANDAMENTO' }, 'CONCLUIDA');
    expect(act?.label).toBe('Concluir');
  });

  it('CANCELADA → Cancelar', () => {
    const act = cycleActionFor({ ...TASK, status: 'EM_ANDAMENTO' }, 'CANCELADA');
    expect(act?.label).toBe('Cancelar');
  });
});
