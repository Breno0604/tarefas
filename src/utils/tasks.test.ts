import { describe, expect, it } from 'vitest';
import { COLABORADORES, TAREFAS } from '../data/mockData';
import { colaboradorMetrics, computeIndicators, EMPTY_FILTERS, filterTasks } from './tasks';

const NOW = new Date('2026-08-03T12:00:00');
const nomes = Object.fromEntries(COLABORADORES.map((c) => [c.id, c.nome]));

describe('filterTasks', () => {
  it('filtro vazio retorna todas', () => {
    expect(filterTasks(TAREFAS, EMPTY_FILTERS, nomes, NOW)).toHaveLength(TAREFAS.length);
  });

  it('filtra por busca no título', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, search: 'login' }, nomes, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.titulo.toLowerCase().includes('login'))).toBe(true);
  });

  it('filtra por status múltiplo', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, status: ['NOVA', 'DEVOLVIDA'] }, nomes, NOW);
    expect(result.every((t) => t.status === 'NOVA' || t.status === 'DEVOLVIDA')).toBe(true);
  });

  it('filtra por responsável', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, responsavel: ['joao'] }, nomes, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.responsavelId === 'joao')).toBe(true);
  });

  it('filtra por vencidas (exclui finalizadas)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, prazo: 'vencidas' }, nomes, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.status !== 'FINALIZADA')).toBe(true);
    expect(
      result.every((t) => t.prazo !== null && new Date(t.prazo) < new Date('2026-08-03T00:00:00'))
    ).toBe(true);
  });
});

describe('computeIndicators', () => {
  it('soma dos status = total', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.total).toBe(TAREFAS.length);
    expect(
      ind.novas + ind.recebidas + ind.emExecucao + ind.concluidas + ind.devolvidas + ind.finalizadas
    ).toBe(ind.total);
  });

  it('existe pelo menos uma atrasada no seed', () => {
    expect(computeIndicators(TAREFAS, NOW).atrasadas).toBeGreaterThan(0);
  });
});

describe('colaboradorMetrics', () => {
  it('ativas + finalizadas = total de tarefas do colaborador', () => {
    const m = colaboradorMetrics('joao', TAREFAS, NOW);
    const doJoao = TAREFAS.filter((t) => t.responsavelId === 'joao');
    expect(m.ativas + m.concluidas).toBe(doJoao.length);
    expect(m.taxaConclusao).toBeGreaterThanOrEqual(0);
  });
});
