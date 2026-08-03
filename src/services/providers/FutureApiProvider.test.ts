import { afterEach, describe, expect, it, vi } from 'vitest';
import { FutureApiProvider } from './FutureApiProvider';

describe('FutureApiProvider (stub)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('load retorna null (fallback para o seed) e avisa', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const provider = new FutureApiProvider();
    expect(provider.load()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('save e clear não lançam', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const provider = new FutureApiProvider();
    expect(() => provider.save({ tasks: [] })).not.toThrow();
    expect(() => provider.clear()).not.toThrow();
  });
});
