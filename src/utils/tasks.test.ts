import { describe, expect, it } from 'vitest';
import { COLABORADORES, TAREFAS } from '../data/mockData';
import {
  colaboradorMetrics,
  colaboradorResumo,
  computeIndicators,
  contarDevolucoes,
  createTask,
  diasAguardandoAprovacao,
  diasSemMovimentacao,
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

  it('filtra tarefas sem movimentação há N dias', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, paradas: 7 }, nomes, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => diasSemMovimentacao(t, NOW) >= 7)).toBe(true);
  });

  it('filtro de paradas exclui tarefas terminais (FINALIZADA/CANCELADA)', () => {
    const ta8 = TAREFAS.find((t) => t.id === 'TA-008')!;
    const finalizada = { ...ta8, id: 'TA-FIN', status: 'FINALIZADA' as const };
    const cancelada = { ...ta8, id: 'TA-CANC', status: 'CANCELADA' as const };
    const result = filterTasks(
      [...TAREFAS, finalizada, cancelada],
      { ...EMPTY_FILTERS, paradas: 7 },
      nomes,
      NOW
    );
    expect(result.some((t) => t.id === 'TA-FIN')).toBe(false);
    expect(result.some((t) => t.id === 'TA-CANC')).toBe(false);
    expect(result.some((t) => t.id === 'TA-008')).toBe(true);
  });

  it('filtra apenas tarefas devolvidas pelo menos uma vez', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, comRetrabalho: true }, nomes, NOW);
    expect(result.map((t) => t.id).sort()).toEqual(['TA-001', 'TA-007', 'TA-014']);
  });

  it('sem filtro de movimentação/retrabalho retorna todas', () => {
    const base = filterTasks(TAREFAS, EMPTY_FILTERS, nomes, NOW);
    expect(base).toHaveLength(TAREFAS.length);
  });

  it('ordena a fila de CONCLUIDA por tempo de espera e prioridade', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, status: ['CONCLUIDA'] }, nomes, NOW);
    // TA-003: 1 dia de espera (alta) primeiro; depois TA-009 (0 dias, média) e TA-015 (0 dias, baixa).
    expect(result.map((t) => t.id)).toEqual(['TA-003', 'TA-009', 'TA-015']);
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

  it('filtros de movimentação e retrabalho contam como filtros ativos', () => {
    expect(hasActiveFilters({ ...EMPTY_FILTERS, paradas: 7 })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, comRetrabalho: true })).toBe(true);
  });
});

describe('computeIndicators', () => {
  it('soma dos status = total', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.total).toBe(TAREFAS.length);
    expect(
      ind.novas +
        ind.recebidas +
        ind.emExecucao +
        ind.aguardandoAprovacao +
        ind.devolvidas +
        ind.finalizadas +
        ind.canceladas
    ).toBe(ind.total);
  });

  it('aguardandoAprovacao = count de CONCLUIDA', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.aguardandoAprovacao).toBe(3);
  });

  it('concluidas = CONCLUIDA + FINALIZADA (entregues, distintas de aguardandoAprovacao)', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.aguardandoAprovacao).toBe(3);
    expect(ind.finalizadas).toBe(4);
    expect(ind.concluidas).toBe(7);
  });

  it('devolucoes (eventos) e comRetrabalho (tarefas) derivados do histórico do seed', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.devolucoes).toBe(3);
    expect(ind.comRetrabalho).toBe(3);
  });

  it('existe pelo menos uma atrasada no seed', () => {
    expect(computeIndicators(TAREFAS, NOW).atrasadas).toBeGreaterThan(0);
  });

  it('CONCLUIDA com prazo vencido não conta como atrasada', () => {
    const concluida = { ...TAREFAS[0], id: 'TA-CONCL', status: 'CONCLUIDA' as const, prazo: '2026-07-01' };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, concluida], NOW);
    expect(ind.aguardandoAprovacao).toBe(base.aguardandoAprovacao + 1);
    expect(ind.atrasadas).toBe(base.atrasadas);
  });

  it('conta CANCELADA e não a marca como atrasada', () => {
    const cancelada = { ...TAREFAS[0], id: 'TA-CANC', status: 'CANCELADA' as const, prazo: '2026-07-01' };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, cancelada], NOW);
    expect(ind.total).toBe(TAREFAS.length + 1);
    expect(ind.canceladas).toBe(1);
    expect(ind.atrasadas).toBe(base.atrasadas);
  });

  it('conta tarefas paradas há 7+ dias (TA-008 no seed)', () => {
    const ind = computeIndicators(TAREFAS, NOW);
    expect(ind.paradas).toBe(1);
  });

  it('não conta FINALIZADA/CANCELADA como paradas, mesmo sem movimentação', () => {
    const ta8 = TAREFAS.find((t) => t.id === 'TA-008')!;
    const finalizada = { ...ta8, id: 'TA-FIN', status: 'FINALIZADA' as const };
    const cancelada = { ...ta8, id: 'TA-CANC', status: 'CANCELADA' as const };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, finalizada, cancelada], NOW);
    expect(ind.total).toBe(TAREFAS.length + 2);
    expect(ind.paradas).toBe(base.paradas);
  });
});

describe('colaboradorMetrics', () => {
  it('ativas + finalizadas = total de tarefas do colaborador', () => {
    const m = colaboradorMetrics('joao', TAREFAS, NOW);
    const doJoao = TAREFAS.filter((t) => t.responsavelId === 'joao');
    expect(m.ativas + m.concluidas).toBe(doJoao.length);
    expect(m.taxaConclusao).toBeGreaterThanOrEqual(0);
  });

  it('tarefa cancelada do colaborador não entra nas atrasadas', () => {
    const cancelada = { ...TAREFAS[0], id: 'TA-CANC', status: 'CANCELADA' as const, prazo: '2026-07-01' };
    const base = colaboradorMetrics('joao', TAREFAS, NOW);
    const m = colaboradorMetrics('joao', [...TAREFAS, cancelada], NOW);
    expect(m.atrasadas).toBe(base.atrasadas);
  });

  it('tarefa CONCLUIDA do colaborador com prazo vencido não conta como atrasada dele', () => {
    const concluida = {
      ...TAREFAS[0],
      id: 'TA-CONCL',
      responsavelId: 'joao',
      status: 'CONCLUIDA' as const,
      prazo: '2026-07-01',
    };
    const base = colaboradorMetrics('joao', TAREFAS, NOW);
    const m = colaboradorMetrics('joao', [...TAREFAS, concluida], NOW);
    expect(m.atrasadas).toBe(base.atrasadas);
  });
});

describe('contarDevolucoes', () => {
  it('TA-001 do seed retornou 1 vez', () => {
    const ta1 = TAREFAS.find((t) => t.id === 'TA-001')!;
    expect(contarDevolucoes(ta1)).toBe(1);
  });

  it('TA-007 e TA-014 do seed retornaram 1 vez cada', () => {
    expect(contarDevolucoes(TAREFAS.find((t) => t.id === 'TA-007')!)).toBe(1);
    expect(contarDevolucoes(TAREFAS.find((t) => t.id === 'TA-014')!)).toBe(1);
  });

  it('tarefa sem devolução no histórico retorna 0', () => {
    expect(contarDevolucoes(TAREFAS.find((t) => t.id === 'TA-003')!)).toBe(0);
  });
});

describe('diasAguardandoAprovacao / diasSemMovimentacao', () => {
  it('dias de espera usam a entrega (concluidaEm ou histórico) da tarefa CONCLUIDA', () => {
    const ta3 = TAREFAS.find((t) => t.id === 'TA-003')!;
    expect(diasAguardandoAprovacao(ta3, NOW)).toBe(1); // entregue em 02/08
    const ta9 = TAREFAS.find((t) => t.id === 'TA-009')!;
    expect(diasAguardandoAprovacao(ta9, NOW)).toBe(0); // entregue hoje
  });

  it('concluidaEm tem precedência sobre o histórico', () => {
    const ta3 = { ...TAREFAS.find((t) => t.id === 'TA-003')!, concluidaEm: '2026-08-01T09:00:00' };
    expect(diasAguardandoAprovacao(ta3, NOW)).toBe(2);
  });

  it('dias parado usa atualizadaEm (ou última movimentação do histórico)', () => {
    const ta8 = TAREFAS.find((t) => t.id === 'TA-008')!;
    expect(diasSemMovimentacao(ta8, NOW)).toBe(9); // última movimentação em 25/07
    const atualizada = { ...ta8, atualizadaEm: '2026-08-01T10:00:00' };
    expect(diasSemMovimentacao(atualizada, NOW)).toBe(2);
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
