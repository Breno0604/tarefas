import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { clearState, loadState, saveState, STORAGE_KEY } from './storage';

const fakeTask = (id: string, status: Task['status'] = 'CAIXA_ENTRADA'): Task => ({
  id,
  titulo: `Tarefa ${id}`,
  descricao: '',
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
      JSON.stringify({ version: 999, tasks: [] })
    );
    expect(loadState()).toBeNull();
  });

  it('retorna null quando o shape do estado é inválido', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, tasks: 'x' }));
    expect(loadState()).toBeNull();
  });

  it('descarta apenas tarefas inválidas, mantendo as válidas', () => {
    const invalida = { id: 'TA-BAD', titulo: 42 }; // sem shape de Task
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, tasks: [fakeTask('TA-001'), invalida] })
    );
    expect(loadState()).toEqual({ tasks: [fakeTask('TA-001')] });
  });

  it('descarta tarefa com status fora do enum', () => {
    const invalida: unknown = { ...fakeTask('TA-BAD'), status: 'XPTO' };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, tasks: [fakeTask('TA-001'), invalida] })
    );
    expect(loadState()).toEqual({ tasks: [fakeTask('TA-001')] });
  });

  it('descarta tarefa com prioridade fora do enum', () => {
    const invalida: unknown = { ...fakeTask('TA-BAD'), prioridade: 'ultra' };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, tasks: [fakeTask('TA-001'), invalida] })
    );
    expect(loadState()).toEqual({ tasks: [fakeTask('TA-001')] });
  });

  it('mantém tarefa completa com campos opcionais válidos', () => {
    const completa = {
      ...fakeTask('TA-OK'),
      favorita: true,
      categoria: 'Dev',
      tags: ['a', 'b'],
      atualizadaEm: '2026-08-03T10:00:00',
      concluidaEm: '2026-08-03T11:00:00',
      historico: [
        {
          id: 'h1',
          dataHora: '2026-08-03T10:00:00',
          statusAnterior: null,
          novoStatus: 'CAIXA_ENTRADA',
          tipo: 'status',
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, tasks: [completa] }));
    expect(loadState()).toEqual({ tasks: [completa] });
  });

  it('clearState remove os dados', () => {
    saveState({ tasks: [fakeTask('TA-001')] });
    clearState();
    expect(loadState()).toBeNull();
  });
});
