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

  it('ARQUIVADA → Arquivar', () => {
    const act = cycleActionFor({ ...TASK, status: 'EM_ANDAMENTO' }, 'ARQUIVADA');
    expect(act?.label).toBe('Arquivar');
  });

  it('SUSPENSA → Suspender', () => {
    const act = cycleActionFor({ ...TASK, status: 'EM_ANDAMENTO' }, 'SUSPENSA');
    expect(act?.label).toBe('Suspender');
  });

  it('SUSPENSA em status SUSPENSA → Reativar', () => {
    const act = cycleActionFor({ ...TASK, status: 'SUSPENSA' }, 'A_FAZER');
    expect(act?.label).toBe('Reativar');
  });

  it('ARQUIVADA → CAIXA_ENTRADA → Desarquivar', () => {
    const act = cycleActionFor({ ...TASK, status: 'ARQUIVADA' }, 'CAIXA_ENTRADA');
    expect(act?.label).toBe('Desarquivar');
  });

  it('CAIXA_ENTRADA não oferece ação de Desarquivar', () => {
    const act = cycleActionFor(TASK, 'CAIXA_ENTRADA');
    expect(act).toBeNull();
  });
});
