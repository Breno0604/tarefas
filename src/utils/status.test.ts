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

  it('permite arquivar a partir de qualquer status não-terminal', () => {
    for (const from of ['CAIXA_ENTRADA', 'A_FAZER', 'EM_ANDAMENTO', 'SUSPENSA'] as const) {
      expect(canTransition(from, 'ARQUIVADA')).toBe(true);
    }
  });

  it('bloqueia arquivamento a partir de CONCLUIDA', () => {
    expect(canTransition('CONCLUIDA', 'ARQUIVADA')).toBe(false);
  });

  it('permite suspender a partir de A_FAZER e EM_ANDAMENTO (não da caixa de entrada)', () => {
    expect(canTransition('A_FAZER', 'SUSPENSA')).toBe(true);
    expect(canTransition('EM_ANDAMENTO', 'SUSPENSA')).toBe(true);
    expect(canTransition('CAIXA_ENTRADA', 'SUSPENSA')).toBe(false);
    expect(canTransition('CONCLUIDA', 'SUSPENSA')).toBe(false);
  });

  it('permite reativar SUSPENSA → A_FAZER', () => {
    expect(canTransition('SUSPENSA', 'A_FAZER')).toBe(true);
  });

  it('permite desarquivar ARQUIVADA → CAIXA_ENTRADA', () => {
    expect(canTransition('ARQUIVADA', 'CAIXA_ENTRADA')).toBe(true);
  });

  it('bloqueia transições inválidas e reversas', () => {
    expect(canTransition('A_FAZER', 'CAIXA_ENTRADA')).toBe(false);
    expect(canTransition('CAIXA_ENTRADA', 'CONCLUIDA')).toBe(false);
    expect(canTransition('EM_ANDAMENTO', 'A_FAZER')).toBe(false);
    expect(canTransition('CONCLUIDA', 'A_FAZER')).toBe(false);
    expect(canTransition('CONCLUIDA', 'CAIXA_ENTRADA')).toBe(false);
    expect(canTransition('SUSPENSA', 'EM_ANDAMENTO')).toBe(false);
  });
});

describe('transicoesDisponiveis', () => {
  it('CAIXA_ENTRADA oferece A_FAZER e ARQUIVADA', () => {
    expect(transicoesDisponiveis('CAIXA_ENTRADA').sort()).toEqual(['ARQUIVADA', 'A_FAZER']);
  });

  it('A_FAZER oferece EM_ANDAMENTO, SUSPENSA e ARQUIVADA', () => {
    expect(transicoesDisponiveis('A_FAZER').sort()).toEqual(['ARQUIVADA', 'EM_ANDAMENTO', 'SUSPENSA']);
  });

  it('EM_ANDAMENTO oferece CONCLUIDA, SUSPENSA e ARQUIVADA', () => {
    expect(transicoesDisponiveis('EM_ANDAMENTO').sort()).toEqual(['ARQUIVADA', 'CONCLUIDA', 'SUSPENSA']);
  });

  it('SUSPENSA oferece reativar (A_FAZER) e arquivar', () => {
    expect(transicoesDisponiveis('SUSPENSA').sort()).toEqual(['ARQUIVADA', 'A_FAZER']);
  });

  it('CONCLUIDA só oferece retomar', () => {
    expect(transicoesDisponiveis('CONCLUIDA')).toEqual(['EM_ANDAMENTO']);
  });

  it('ARQUIVADA só oferece desarquivar (CAIXA_ENTRADA)', () => {
    expect(transicoesDisponiveis('ARQUIVADA')).toEqual(['CAIXA_ENTRADA']);
  });
});
