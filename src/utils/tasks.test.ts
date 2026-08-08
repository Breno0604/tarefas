import { describe, expect, it } from 'vitest';
import { TAREFAS } from '../data/mockData';
import {
  computeIndicators,
  createTask,
  EMPTY_FILTERS,
  filterTasks,
  hasActiveFilters,
  novoId,
  projetosDe,
  proximaOcorrencia,
  SEM_CATEGORIA,
  subtarefasProgresso,
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

  it('filtra por vencidas (exclui concluídas, arquivadas e suspensas)', () => {
    const result = filterTasks(TAREFAS, { ...EMPTY_FILTERS, prazo: 'vencidas' }, NOW);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.status !== 'CONCLUIDA' && t.status !== 'ARQUIVADA' && t.status !== 'SUSPENSA')).toBe(true);
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

  it('filtra por tags (qualquer correspondência)', () => {
    const comTag = { ...TAREFAS[0], id: 'TA-TAG', tags: ['urgente', 'bug'] };
    const semTag = { ...TAREFAS[1], id: 'TA-SEMTAG', tags: ['docs'] };
    const result = filterTasks(
      [comTag, semTag, TAREFAS[2]],
      { ...EMPTY_FILTERS, tags: ['urgente', 'docs'] },
      NOW
    );
    expect(result.map((t) => t.id).sort()).toEqual(['TA-SEMTAG', 'TA-TAG']);
  });

  it('filtra por categoria "Sem categoria"', () => {
    const comCategoria = { ...TAREFAS[0], id: 'TA-CAT', categoria: 'Dev' };
    const semCategoria = { ...TAREFAS[1], id: 'TA-SEMCAT' };
    const result = filterTasks(
      [comCategoria, semCategoria],
      { ...EMPTY_FILTERS, categorias: [SEM_CATEGORIA] },
      NOW
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-SEMCAT');
  });

  it('combina "Sem categoria" com categorias específicas', () => {
    const dev = { ...TAREFAS[0], id: 'TA-DEV', categoria: 'Dev' };
    const semCategoria = { ...TAREFAS[1], id: 'TA-SEMCAT' };
    const marketing = { ...TAREFAS[2], id: 'TA-MKT', categoria: 'Marketing' };
    const result = filterTasks(
      [dev, semCategoria, marketing],
      { ...EMPTY_FILTERS, categorias: ['Dev', SEM_CATEGORIA] },
      NOW
    );
    expect(result.map((t) => t.id).sort()).toEqual(['TA-DEV', 'TA-SEMCAT']);
  });

  it('busca por tag via termo livre encontra tarefas com a tag', () => {
    const comTag = { ...TAREFAS[0], id: 'TA-TAG', tags: ['urgente'] };
    const result = filterTasks([comTag, TAREFAS[1]], { ...EMPTY_FILTERS, search: 'urgente' }, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-TAG');
  });

  it('busca "#tag" corresponde apenas à tag, não ao título', () => {
    const porTitulo = { ...TAREFAS[0], id: 'TA-TITULO', titulo: 'urgente hoje', tags: [] };
    const porTag = { ...TAREFAS[1], id: 'TA-TAG', tags: ['urgente'] };
    const result = filterTasks(
      [porTitulo, porTag],
      { ...EMPTY_FILTERS, search: '#urgente' },
      NOW
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-TAG');
  });

  it('busca com múltiplos termos exige todos (E)', () => {
    const completa = { ...TAREFAS[0], id: 'TA-OK', titulo: 'alpha beta' };
    const parcial = { ...TAREFAS[1], id: 'TA-PAR', titulo: 'alpha' };
    const result = filterTasks(
      [completa, parcial],
      { ...EMPTY_FILTERS, search: 'alpha beta' },
      NOW
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('TA-OK');
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
    expect(hasActiveFilters({ ...EMPTY_FILTERS, tags: ['bug'] })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, prazo: 'hoje' })).toBe(true);
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
        ind.suspensas +
        ind.concluidas +
        ind.arquivadas
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

  it('conta ARQUIVADA e SUSPENSA sem marcá-las como atrasadas', () => {
    const arquivada = { ...TAREFAS[0], id: 'TA-ARQ', status: 'ARQUIVADA' as const, prazo: '2026-07-01' };
    const suspensa = { ...TAREFAS[1], id: 'TA-SUS', status: 'SUSPENSA' as const, prazo: '2026-07-01' };
    const base = computeIndicators(TAREFAS, NOW);
    const ind = computeIndicators([...TAREFAS, arquivada, suspensa], NOW);
    expect(ind.total).toBe(TAREFAS.length + 2);
    expect(ind.arquivadas).toBe(base.arquivadas + 1);
    expect(ind.suspensas).toBe(base.suspensas + 1);
    expect(ind.atrasadas).toBe(base.atrasadas);
  });
});

describe('novoId / createTask', () => {
  it('gera ids únicos (UUID) e nunca repete', () => {
    const a = novoId();
    const b = novoId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(10);
  });

  it('gera status CAIXA_ENTRADA e entrada de histórico de criação', () => {
    const task = createTask({
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
    const task = createTask({
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
    const task = createTask({
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

describe('proximaOcorrencia', () => {
  it('diária soma 1 dia', () => {
    expect(proximaOcorrencia('2026-08-10', 'diaria')).toBe('2026-08-11');
  });

  it('semanal soma 7 dias preservando o dia da semana', () => {
    expect(proximaOcorrencia('2026-08-10', 'semanal')).toBe('2026-08-17');
  });

  it('mensal avança um mês e clampeia 31/01 → 28/02', () => {
    expect(proximaOcorrencia('2026-01-31', 'mensal')).toBe('2026-02-28');
    expect(proximaOcorrencia('2026-03-15', 'mensal')).toBe('2026-04-15');
  });

  it('sem prazo retorna null', () => {
    expect(proximaOcorrencia(null, 'diaria')).toBeNull();
  });
});

describe('subtarefasProgresso / projetos', () => {
  it('calcula feitas/total/pct', () => {
    const comSubtarefas = {
      ...TAREFAS[0],
      subtarefas: [
        { id: 's1', titulo: 'A', concluida: true },
        { id: 's2', titulo: 'B', concluida: false },
        { id: 's3', titulo: 'C', concluida: true },
      ],
    };
    expect(subtarefasProgresso(comSubtarefas)).toEqual({ feitas: 2, total: 3, pct: 67 });
    expect(subtarefasProgresso(TAREFAS[0])).toEqual({ feitas: 0, total: 0, pct: 0 });
  });

  it('lista projetos únicos ordenados', () => {
    const comProjetos = [
      { ...TAREFAS[0], id: 'TA-A', projeto: 'Zeta' },
      { ...TAREFAS[1], id: 'TA-B', projeto: 'Alpha', status: 'CONCLUIDA' as const },
      { ...TAREFAS[2], id: 'TA-C', projeto: 'Alpha' },
    ];
    expect(projetosDe(comProjetos)).toEqual(['Alpha', 'Zeta']);
  });
});
