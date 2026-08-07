import { describe, expect, it } from 'vitest';
import { canTransition, transicoesDisponiveis } from './status';

describe('canTransition', () => {
  it('permite o fluxo linear GTD', () => {
    expect(canTransition('CAIXA_ENTRADA', 'A_FAZER')).toBe(true);
    expect(canTransition('A_FAZER', 'EM_ANDAMENTO')).toBe(true);
    expect(canTransition('EM_ANDAMENTO', 'CONCLUIDA')).toBe(true);
  });

  it('permite retomar CONCLUIDA → EM_ANDAMENTO', () => {
    expect(canTransition('CONCLUIDA', 'EM_ANDAMENTO')).toBe(true);
  });

  it('permite cancelar a partir de qualquer status não-terminal', () => {
    for (const from of ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO'] as const) {
      expect(canTransition(from, 'CANCELADA')).toBe(true);
    }
  });

  it('bloqueia cancelamento a partir de CONCLUIDA', () => {
    expect(canTransition('CONCLUIDA', 'CANCELADA')).toBe(false);
  });

  it('bloqueia transições inválidas e reversas', () => {
    expect(canTransition('A_FAZER', 'CAIXA_ENTRADA')).toBe(false);
    expect(canTransition('CAIXA_ENTRADA', 'CONCLUIDA')).toBe(false);
    expect(canTransition('EM_ANDAMENTO', 'A_FAZER')).toBe(false);
    expect(canTransition('CONCLUIDA', 'A_FAZER')).toBe(false);
    expect(canTransition('CONCLUIDA', 'CAIXA_ENTRADA')).toBe(false);
  });

  it('CANCELADA é terminal: nenhuma transição de saída', () => {
    const statuses = ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'] as const;
    for (const to of statuses) {
      expect(canTransition('CANCELADA', to)).toBe(false);
    }
  });
});

describe('transicoesDisponiveis', () => {
  it('CAIXA_ENTRADA oferece A_FAZER e CANCELADA', () => {
    expect(transicoesDisponiveis('CAIXA_ENTRADA').sort()).toEqual(['A_FAZER', 'CANCELADA']);
  });

  it('A_FAZER oferece EM_ANDAMENTO e CANCELADA', () => {
    expect(transicoesDisponiveis('A_FAZER').sort()).toEqual(['CANCELADA', 'EM_ANDAMENTO']);
  });

  it('EM_ANDAMENTO oferece CONCLUIDA e CANCELADA', () => {
    expect(transicoesDisponiveis('EM_ANDAMENTO').sort()).toEqual(['CANCELADA', 'CONCLUIDA']);
  });

  it('CONCLUIDA só oferece retomar', () => {
    expect(transicoesDisponiveis('CONCLUIDA')).toEqual(['EM_ANDAMENTO']);
  });

  it('CANCELADA não tem transições de saída', () => {
    expect(transicoesDisponiveis('CANCELADA')).toEqual([]);
  });
});
