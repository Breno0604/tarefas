import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

// Referência compartilhada: o mock cria o provider de memória e o beforeEach o redefine.
const mockState = vi.hoisted(() => ({
  provider: null as { reset: () => void } | null,
}));

vi.mock('../services/index', async () => {
  const { MemoryStorageProvider } = await import('../services/providers/MemoryStorageProvider');
  const { TAREFAS } = await import('../data/mockData');
  const provider = new MemoryStorageProvider({ tasks: TAREFAS, preferencias: null });
  mockState.provider = provider;
  return { storageProvider: provider };
});

beforeEach(() => {
  mockState.provider?.reset();
});
