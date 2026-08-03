import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, isOverdue, isWithinDays } from './date';

const NOW = new Date('2026-08-03T12:00:00');

describe('formatDate / formatDateTime', () => {
  it('formata data no padrão pt-BR', () => {
    expect(formatDate('2026-08-03T00:00:00')).toBe('03/08/2026');
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
