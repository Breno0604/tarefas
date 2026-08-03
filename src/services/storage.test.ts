import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { clearState, loadState, saveState, STORAGE_KEY } from './storage';

const fakeTask = (id: string, status: Task['status'] = 'NOVA'): Task => ({
  id,
  titulo: `Tarefa ${id}`,
  descricao: '',
  responsavelId: 'joao',
  criadorId: 'carlos',
  prioridade: 'media',
  prazo: null,
  status,
  criadaEm: '2026-08-03T10:00:00',
  historico: [],
});

function installMockLocalStorage() {
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

beforeEach(() => installMockLocalStorage());

afterEach(() => {
  delete (globalThis as Record<string, unknown>).localStorage;
});

describe('storage', () => {
  it('salva e carrega o estado', () => {
    const tasks = [fakeTask('TA-001'), fakeTask('TA-002', 'CONCLUIDA')];
    saveState({ tasks });

    expect(loadState()).toEqual({ tasks });
  });

  it('retorna null quando não há dados salvos', () => {
    expect(loadState()).toBeNull();
  });

  it('retorna null para JSON corrompido', () => {
    (globalThis as Record<string, unknown>).localStorage = {
      getItem: () => '{not-valid-json',
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    expect(loadState()).toBeNull();
  });

  it('retorna null para versão incompatível (migração futura)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 999, tasks: [], currentUserId: 'carlos' })
    );
    expect(loadState()).toBeNull();
  });

  it('retorna null quando o shape do estado é inválido', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: 'x' }));
    expect(loadState()).toBeNull();
  });

  it('descarta apenas tarefas inválidas, mantendo as válidas', () => {
    const invalida = { id: 'TA-BAD', titulo: 42 }; // sem shape de Task
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, tasks: [fakeTask('TA-001'), invalida] })
    );
    expect(loadState()).toEqual({ tasks: [fakeTask('TA-001')] });
  });

  it('clearState remove os dados', () => {
    saveState({ tasks: [fakeTask('TA-001')] });
    clearState();
    expect(loadState()).toBeNull();
  });
});
