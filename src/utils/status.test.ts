import { describe, expect, it } from 'vitest';
import { availableTransitions, canTransition } from './status';

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

  it('permite CONCLUIDA → EM_EXECUCAO (reabrir) apenas para colaborador', () => {
    expect(canTransition('CONCLUIDA', 'EM_EXECUCAO', 'colaborador')).toBe(true);
    expect(canTransition('CONCLUIDA', 'EM_EXECUCAO', 'gestor')).toBe(false);
  });

  it('bloqueia transições inválidas e reversas', () => {
    expect(canTransition('NOVA', 'FINALIZADA', 'gestor')).toBe(false);
    expect(canTransition('FINALIZADA', 'NOVA', 'gestor')).toBe(false);
    expect(canTransition('RECEBIDA', 'NOVA', 'colaborador')).toBe(false);
  });
});

describe('availableTransitions', () => {
  it('colaborador em EM_EXECUCAO só pode CONCLUIDA', () => {
    expect(availableTransitions('EM_EXECUCAO', 'colaborador')).toEqual(['CONCLUIDA']);
  });

  it('colaborador em CONCLUIDA só pode reabrir', () => {
    expect(availableTransitions('CONCLUIDA', 'colaborador')).toEqual(['EM_EXECUCAO']);
  });

  it('gestor em CONCLUIDA pode FINALIZADA e DEVOLVIDA', () => {
    expect(availableTransitions('CONCLUIDA', 'gestor').sort()).toEqual(['DEVOLVIDA', 'FINALIZADA']);
  });

  it('gestor em NOVA não tem ações de ciclo', () => {
    expect(availableTransitions('NOVA', 'gestor')).toEqual([]);
  });
});
