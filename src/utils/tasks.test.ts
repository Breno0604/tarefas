import { describe, expect, it } from 'vitest';
import { TAREFAS } from '../data/mockData';
import {
  computeIndicators,
  createTask,
  EMPTY_FILTERS,
  filterTasks,
  hasActiveFilters,
  nextTaskId,
} from './tasks';

const NOW = new Date('2026-08-03T12:00:00');

describe('filterTasks', () => {
  it('filtro vazio retorna todas', () => {
    expect(filterTasks(TAREFAS, EMPTY_FILTERS, NOW)).toHaveLength(TAREFAS.length);
  });

  it('filtra por busca no título', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, search: 'checkout' }, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.titulo.toLowerCase().includes('checkout'))).toBe(true);
  });

  it('filtra por status múltiplo', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, status: ['CAIXA_ENTRADA', 'A_FAZER'] }, NOW);
    expect(result.every((t) => t.status === 'CAIXA_ENTRADA' || t.status === 'A_FAZER')).toBe(true);
  });

  it('filtra por vencidas (exclui concluídas e canceladas)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, prazo: 'vencidas' }, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA')).toBe(true);
    expect(
      result.every((t) => t.prazo !== null && new Date(t.prazo) < new Date('2026-08-03T00:00:00'))
    ).toBe(true);
  });

  it('filtra apenas favoritas', () => {
    const favorita = { ...TAREFAS[0], id: 'TA-FAV', favorita: true };
    const result = filterTasks([TAREFAS[1], favorita], { ...EMPTY_FILTERS, favoritas: true }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-FAV');
  });

  it('filtra por categoria', () => {
    const comCategoria = { ...TAREFAS[0], id: 'TA-CAT', categoria: 'Desenvolvimento' };
    const result = filterTasks(
      [TAREFAS[1], comCategoria],
      { ...EMPTY_FILTERS, categorias: ['Desenvolvimento'] },
      NOW
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-CAT');
  });

  it('filtra por prazo vencendo hoje', () => {
    const hoje = { ...TAREFAS[0], id: 'TA-HOJE', prazo: '2026-08-03' };
    const result = filterTasks([TAREFAS[1], hoje], { ...EMPTY_FILTERS, prazo: 'hoje' }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-HOJE');
  });

  it('filtra por prazo sem data', () => {
    const semPrazo = { ...TAREFAS[0], id: 'TA-SEMPRAZO', prazo: null };
    const result = filterTasks([semPrazo, TAREFAS[1]], { ...EMPTY_FILTERS, prazo: 'semPrazo' }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-SEMPRAZO');
  });

  it('ordena por título', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, sortBy: 'titulo' }, NOW);
    const titulos = result.map((t) => t.titulo);
    expect([...titulos].sort((a, b) => a.localeCompare(b))).toEqual(titulos);
  });

  it('ordena por prioridade (crítica primeiro)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, sortBy: 'prioridade' }, NOW);
    expect(result[0].prioridade).toBe('critica');
  });
});

describe('hasActiveFilters', () => {
  it('retorna false para filtros vazios', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('detecta busca e filtros ativos', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x' })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: ['A_FAZER'] })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, favoritas: true })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, categorias: ['Marketing'] })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, prazo: 'hoje' })).toBe(true);
  });

  it('ordenação não conta como filtro', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sortBy: 'titulo' })).toBe(false);
  });
});

describe('computeIndicators', () => {
  it('soma dos status = total', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.total).toBe(TAREFAS.length);
    expect(
      ind.caixaEntrada +
        ind.aFazer +
        ind.emAndamento +
        ind.concluidas +
        ind.canceladas
    ).toBe(ind.total);
  });

  it('existe pelo menos uma atrasada no seed', () => {
    expect(computeIndicators(TAREFAS, NOW).atrasadas).toBeGreaterThan(0);
  });

  it('CONCLUIDA com prazo vencido não conta como atrasada', () => {
    const concluida = { ...TAREFAS[0], id: 'TA-CONCL', status: 'CONCLUIDA' as const, prazo: '2026-07-01' };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, concluida], NOW);
    expect(ind.concluidas).toBe(base.concluidas + 1);
    expect(ind.atrasadas).toBe(base.atrasadas);
  });

  it('conta CANCELADA e não a marca como atrasada', () => {
    const cancelada = { ...TAREFAS[0], id: 'TA-CANC', status: 'CANCELADA' as const, prazo: '2026-07-01' };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, cancelada], NOW);
    expect(ind.total).toBe(TAREFAS.length + 1);
    expect(ind.canceladas).toBe(base.canceladas + 1);
    expect(ind.atrasadas).toBe(base.atrasadas);
  });
});

describe('nextTaskId / createTask', () => {
  it('gera o próximo id sequencial a partir do seed', () => {
    const maxNum = TAREFAS.reduce(
      (max, t) => Math.max(max, Number(t.id.replace(/\D/g, ''))),
      0
    );
    expect(nextTaskId(TAREFAS)).toBe(`TA-${String(maxNum + 1).padStart(3, '0')}`);
  });

  it('considera ids não numéricos sem quebrar', () => {
    const lista = [{ ...TAREFAS[0], id: 'X' }, { ...TAREFAS[1], id: 'TA-099' }];
    expect(nextTaskId(lista)).toBe('TA-100');
  });

  it('gera id sequencial, status CAIXA_ENTRADA e entrada de histórico de criação', () => {
    const task = createTask(TAREFAS, {
      titulo: 'Nova tarefa',
      descricao: 'desc',
      prioridade: 'alta',
      prazo: '2026-08-10',
    });
    expect(task.status).toBe('CAIXA_ENTRADA');
    expect(task.criadaEm).toBeDefined();
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: null,
      novoStatus: 'CAIXA_ENTRADA',
    });
    expect('responsavelId' in task).toBe(false);
    expect('criadorId' in task).toBe(false);
  });

  it('omite categoria vazia e tags vazias', () => {
    const task = createTask(TAREFAS, {
      titulo: 'X',
      descricao: '',
      prioridade: 'media',
      prazo: null,
      categoria: '',
      tags: [],
    });
    expect(task.categoria).toBeUndefined();
    expect(task.tags).toBeUndefined();
  });

  it('preserva categoria e tags quando preenchidos', () => {
    const task = createTask(TAREFAS, {
      titulo: 'X',
      descricao: '',
      prioridade: 'media',
      prazo: null,
      categoria: 'Marketing',
      tags: ['email', 'urgente'],
    });
    expect(task.categoria).toBe('Marketing');
    expect(task.tags).toEqual(['email', 'urgente']);
  });
});
