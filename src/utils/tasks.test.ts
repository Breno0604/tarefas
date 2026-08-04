import { describe, expect, it } from 'vitest';
import { COLABORADORES, TAREFAS } from '../data/mockData';
import {
  colaboradorMetrics,
  colaboradorResumo,
  computeIndicators,
  createTask,
  EMPTY_FILTERS,
  filterTasks,
  hasActiveFilters,
  nextTaskId,
} from './tasks';

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

  it('filtra apenas favoritas', () => {
    const favorita = { ...TAREFAS[0], id: 'TA-FAV', favorita: true };
    const result = filterTasks([TAREFAS[1], favorita], { ...EMPTY_FILTERS, favoritas: true }, nomes, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-FAV');
  });

  it('filtra por categoria', () => {
    const comCategoria = { ...TAREFAS[0], id: 'TA-CAT', categoria: 'Desenvolvimento' };
    const result = filterTasks(
      [TAREFAS[1], comCategoria],
      { ...EMPTY_FILTERS, categorias: ['Desenvolvimento'] },
      nomes,
      NOW
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-CAT');
  });

  it('exclui tarefas sem a categoria filtrada', () => {
    const semCategoria = { ...TAREFAS[0], id: 'TA-SEM', categoria: undefined };
    const result = filterTasks(
      [semCategoria, { ...TAREFAS[1], id: 'TA-MKT', categoria: 'Marketing' }],
      { ...EMPTY_FILTERS, categorias: ['Marketing'] },
      nomes,
      NOW
    );
    expect(result.map((t) => t.id)).toEqual(['TA-MKT']);
  });

  it('filtra por prazo vencendo hoje', () => {
    const hoje = { ...TAREFAS[0], id: 'TA-HOJE', prazo: '2026-08-03' };
    const result = filterTasks([TAREFAS[1], hoje], { ...EMPTY_FILTERS, prazo: 'hoje' }, nomes, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-HOJE');
  });

  it('ordena por título', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, sortBy: 'titulo' }, nomes, NOW);
    const titulos = result.map((t) => t.titulo);
    expect([...titulos].sort((a, b) => a.localeCompare(b))).toEqual(titulos);
  });

  it('ordena por prazo (sem prazo por último)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, sortBy: 'prazo' }, nomes, NOW);
    const prazos = result.map((t) => t.prazo ?? '');
    expect([...prazos].sort()).toEqual(prazos);
  });

  it('ordena por prioridade (crítica primeiro)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, sortBy: 'prioridade' }, nomes, NOW);
    expect(result[0].prioridade).toBe('critica');
  });
});

describe('hasActiveFilters', () => {
  it('retorna false para filtros vazios', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('detecta busca e filtros ativos', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x' })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: ['NOVA'] })).toBe(true);
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

describe('nextTaskId / colaboradorResumo', () => {
  it('gera o próximo id sequencial a partir do seed', () => {
    expect(nextTaskId(TAREFAS)).toBe('TA-017');
  });

  it('considera ids não numéricos sem quebrar', () => {
    const lista = [{ ...TAREFAS[0], id: 'X' }, { ...TAREFAS[1], id: 'TA-099' }];
    expect(nextTaskId(lista)).toBe('TA-100');
  });

  it('iniciais de nome de uma palavra usam uma letra só', () => {
    const resumo = colaboradorResumo('Pedro');
    expect(resumo.iniciais).toBe('P');
  });
});

describe('createTask', () => {
  it('gera id sequencial, status NOVA e entrada de histórico de criação', () => {
    const task = createTask(
      TAREFAS,
      {
        titulo: 'Nova tarefa',
        descricao: 'desc',
        responsavelId: 'ana',
        criadorId: 'carlos',
        prioridade: 'alta',
        prazo: '2026-08-10',
      },
      'Carlos Mendes'
    );
    expect(task.id).toBe('TA-017');
    expect(task.status).toBe('NOVA');
    expect(task.criadaEm).toBeDefined();
    expect(task.historico).toHaveLength(1);
    expect(task.historico[0]).toMatchObject({
      tipo: 'status',
      statusAnterior: null,
      novoStatus: 'NOVA',
      usuario: 'Carlos Mendes',
    });
  });

  it('omite categoria vazia e tags vazias', () => {
    const task = createTask(
      TAREFAS,
      {
        titulo: 'X',
        descricao: '',
        responsavelId: 'ana',
        criadorId: 'carlos',
        prioridade: 'media',
        prazo: null,
        categoria: '',
        tags: [],
      },
      'Carlos Mendes'
    );
    expect(task.categoria).toBeUndefined();
    expect(task.tags).toBeUndefined();
  });

  it('preserva categoria e tags quando preenchidos', () => {
    const task = createTask(
      TAREFAS,
      {
        titulo: 'X',
        descricao: '',
        responsavelId: 'ana',
        criadorId: 'carlos',
        prioridade: 'media',
        prazo: null,
        categoria: 'Marketing',
        tags: ['email', 'urgente'],
      },
      'Carlos Mendes'
    );
    expect(task.categoria).toBe('Marketing');
    expect(task.tags).toEqual(['email', 'urgente']);
  });
});
