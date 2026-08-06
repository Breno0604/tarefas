import { describe, expect, it } from 'vitest';
import { availableTransitions, canTransition, podeReatribuir, proximoPasso } from './status';

describe('canTransition', () => {
  it('permite NOVA → RECEBIDA para colaborador', () => {
    expect(canTransition('NOVA', 'RECEBIDA', 'colaborador')).toBe(true);
  });

  it('bloqueia NOVA → RECEBIDA para gestor', () => {
    expect(canTransition('NOVA', 'RECEBIDA', 'gestor')).toBe(false);
  });

  it('permite CONCLUIDA → FINALIZADA apenas para gestor', () => {
    expect(canTransition('CONCLUIDA', 'FINALIZADA', 'gestor')).toBe(true);
    expect(canTransition('CONCLUIDA', 'FINALIZADA', 'colaborador')).toBe(false);
  });

  it('permite CONCLUIDA → DEVOLVIDA apenas para gestor', () => {
    expect(canTransition('CONCLUIDA', 'DEVOLVIDA', 'gestor')).toBe(true);
    expect(canTransition('CONCLUIDA', 'DEVOLVIDA', 'colaborador')).toBe(false);
  });

  it('permite DEVOLVIDA → EM_EXECUCAO para colaborador', () => {
    expect(canTransition('DEVOLVIDA', 'EM_EXECUCAO', 'colaborador')).toBe(true);
  });

  it('permite CONCLUIDA → EM_EXECUCAO (reabrir) para colaborador e gestor', () => {
    expect(canTransition('CONCLUIDA', 'EM_EXECUCAO', 'colaborador')).toBe(true);
    expect(canTransition('CONCLUIDA', 'EM_EXECUCAO', 'gestor')).toBe(true);
  });

  it('permite FINALIZADA → EM_EXECUCAO (reabrir aprovação) apenas para gestor', () => {
    expect(canTransition('FINALIZADA', 'EM_EXECUCAO', 'gestor')).toBe(true);
    expect(canTransition('FINALIZADA', 'EM_EXECUCAO', 'colaborador')).toBe(false);
  });

  it('bloqueia transições inválidas e reversas', () => {
    expect(canTransition('NOVA', 'FINALIZADA', 'gestor')).toBe(false);
    expect(canTransition('FINALIZADA', 'NOVA', 'gestor')).toBe(false);
    expect(canTransition('RECEBIDA', 'NOVA', 'colaborador')).toBe(false);
    expect(canTransition('FINALIZADA', 'DEVOLVIDA', 'gestor')).toBe(false);
  });

  it('permite CANCELADA apenas para gestor a partir de NOVA, RECEBIDA, EM_EXECUCAO e DEVOLVIDA', () => {
    for (const from of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'DEVOLVIDA'] as const) {
      expect(canTransition(from, 'CANCELADA', 'gestor')).toBe(true);
      expect(canTransition(from, 'CANCELADA', 'colaborador')).toBe(false);
    }
  });

  it('bloqueia cancelamento a partir de CONCLUIDA e FINALIZADA', () => {
    expect(canTransition('CONCLUIDA', 'CANCELADA', 'gestor')).toBe(false);
    expect(canTransition('FINALIZADA', 'CANCELADA', 'gestor')).toBe(false);
  });

  it('CANCELADA é terminal: nenhuma transição de saída', () => {
    const statuses = ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA', 'FINALIZADA', 'CANCELADA'] as const;
    for (const to of statuses) {
      expect(canTransition('CANCELADA', to, 'gestor')).toBe(false);
      expect(canTransition('CANCELADA', to, 'colaborador')).toBe(false);
    }
  });
});

describe('availableTransitions', () => {
  it('colaborador em EM_EXECUCAO só pode CONCLUIDA', () => {
    expect(availableTransitions('EM_EXECUCAO', 'colaborador')).toEqual(['CONCLUIDA']);
  });

  it('colaborador em CONCLUIDA só pode reabrir', () => {
    expect(availableTransitions('CONCLUIDA', 'colaborador')).toEqual(['EM_EXECUCAO']);
  });

  it('gestor em CONCLUIDA pode FINALIZADA, DEVOLVIDA e reabrir', () => {
    expect(availableTransitions('CONCLUIDA', 'gestor').sort()).toEqual(['DEVOLVIDA', 'EM_EXECUCAO', 'FINALIZADA']);
  });

  it('gestor em FINALIZADA pode reabrir aprovação', () => {
    expect(availableTransitions('FINALIZADA', 'gestor')).toEqual(['EM_EXECUCAO']);
  });

  it('colaborador em FINALIZADA não tem ações de ciclo', () => {
    expect(availableTransitions('FINALIZADA', 'colaborador')).toEqual([]);
  });

  it('gestor em NOVA só pode cancelar', () => {
    expect(availableTransitions('NOVA', 'gestor')).toEqual(['CANCELADA']);
  });

  it('gestor em CANCELADA não tem transições de saída', () => {
    expect(availableTransitions('CANCELADA', 'gestor')).toEqual([]);
    expect(availableTransitions('CANCELADA', 'colaborador')).toEqual([]);
  });
});

describe('podeReatribuir', () => {
  it('permite reatribuir em estados ativos e CONCLUIDA', () => {
    for (const status of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'CONCLUIDA', 'DEVOLVIDA'] as const) {
      expect(podeReatribuir(status)).toBe(true);
    }
  });

  it('bloqueia reatribuição de tarefas encerradas (FINALIZADA e CANCELADA)', () => {
    expect(podeReatribuir('FINALIZADA')).toBe(false);
    expect(podeReatribuir('CANCELADA')).toBe(false);
  });
});

describe('proximoPasso', () => {
  it('a vez é do colaborador em NOVA, RECEBIDA, EM_EXECUCAO e DEVOLVIDA', () => {
    for (const status of ['NOVA', 'RECEBIDA', 'EM_EXECUCAO', 'DEVOLVIDA'] as const) {
      expect(proximoPasso(status)).toBe('colaborador');
    }
  });

  it('a vez é do gestor em CONCLUIDA (aguardando aprovação)', () => {
    expect(proximoPasso('CONCLUIDA')).toBe('gestor');
  });

  it('ninguém é responsável em FINALIZADA e CANCELADA', () => {
    expect(proximoPasso('FINALIZADA')).toBe('nenhum');
    expect(proximoPasso('CANCELADA')).toBe('nenhum');
  });
});
