import { describe, expect, it } from 'vitest';
import {
  diasDesde,
  formatDate,
  formatDateTime,
  idadeRelativa,
  isDueToday,
  isOverdue,
  isWithinDays,
} from './date';

const NOW = new Date('2026-08-03T12:00:00');

describe('formatDate / formatDateTime', () => {
  it('formata data no padrão pt-BR', () => {
    expect(formatDate('2026-08-03T00:00:00')).toBe('03/08/2026');
  });

  it('formata prazo date-only sem deslocar um dia em fusos negativos', () => {
    // 'YYYY-MM-DD' é parseado como UTC pelo new Date; parsePrazo interpreta como meia-noite local.
    expect(formatDate('2026-08-03')).toBe('03/08/2026');
  });

  it('formata data e hora no padrão pt-BR', () => {
    expect(formatDateTime('2026-08-03T08:30:00')).toContain('03/08/2026');
  });
});

describe('isOverdue', () => {
  it('prazo de ontem e não finalizada = atrasada', () => {
    expect(isOverdue('2026-08-02T00:00:00', 'EM_EXECUCAO', NOW)).toBe(true);
  });

  it('prazo de hoje não é atrasado', () => {
    expect(isOverdue('2026-08-03T00:00:00', 'EM_EXECUCAO', NOW)).toBe(false);
  });

  it('tarefa finalizada nunca é atrasada', () => {
    expect(isOverdue('2026-07-01T00:00:00', 'FINALIZADA', NOW)).toBe(false);
  });

  it('tarefa concluída nunca é atrasada (backlog de aprovação não é atraso de entrega)', () => {
    expect(isOverdue('2026-07-01T00:00:00', 'CONCLUIDA', NOW)).toBe(false);
  });

  it('tarefa cancelada nunca é atrasada', () => {
    expect(isOverdue('2026-07-01T00:00:00', 'CANCELADA', NOW)).toBe(false);
  });

  it('sem prazo nunca é atrasada', () => {
    expect(isOverdue(null, 'NOVA', NOW)).toBe(false);
  });
});

describe('isWithinDays', () => {
  it('prazo em 3 dias está dentro de 7 dias', () => {
    expect(isWithinDays('2026-08-06T00:00:00', 7, NOW)).toBe(true);
  });

  it('prazo de ontem não está dentro de 7 dias', () => {
    expect(isWithinDays('2026-08-02T00:00:00', 7, NOW)).toBe(false);
  });
});

describe('isDueToday', () => {
  it('prazo de hoje é verdadeiro', () => {
    expect(isDueToday('2026-08-03T00:00:00', NOW)).toBe(true);
  });

  it('prazo de ontem ou amanhã é falso', () => {
    expect(isDueToday('2026-08-02T00:00:00', NOW)).toBe(false);
    expect(isDueToday('2026-08-04T00:00:00', NOW)).toBe(false);
  });

  it('sem prazo nunca é hoje', () => {
    expect(isDueToday(null, NOW)).toBe(false);
  });
});

describe('diasDesde', () => {
  it('conta dias inteiros decorridos desde o timestamp', () => {
    expect(diasDesde('2026-08-01T15:00:00', NOW)).toBe(2);
    expect(diasDesde('2026-08-03T00:30:00', NOW)).toBe(0);
  });

  it('nunca retorna negativo para timestamp no futuro', () => {
    expect(diasDesde('2026-08-10T00:00:00', NOW)).toBe(0);
  });
});

describe('idadeRelativa', () => {
  it('formata "hoje" e intervalos em dias', () => {
    expect(idadeRelativa(0)).toBe('hoje');
    expect(idadeRelativa(1)).toBe('há 1 dia');
    expect(idadeRelativa(3)).toBe('há 3 dias');
  });
});
