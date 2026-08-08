import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types';
import { paraLinha, paraTarefa, SupabaseProvider } from './SupabaseProvider';

const USUARIO = 'user-123';

function taskBase(id: string): Task {
  return {
    id,
    titulo: `Tarefa ${id}`,
    descricao: '',
    prioridade: 'media',
    prazo: null,
    status: 'CAIXA_ENTRADA',
    criadaEm: '2026-08-03T10:00:00',
    historico: [],
  };
}

// ── Fake do cliente Supabase (encadeável, registra chamadas) ──────────
function fakeClient(respostas: {
  tasks: { data: unknown; error: unknown };
  preferencias: { data: unknown; error: unknown };
}) {
  const upserts: unknown[][] = [];
  const deletes: { table: string; ids: string[] }[] = [];
  const from = vi.fn((table: string) => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => Promise.resolve(respostas.tasks)),
      maybeSingle: vi.fn(() => Promise.resolve(respostas.preferencias)),
      upsert: vi.fn((linhas: unknown) => {
        upserts.push([table, linhas]);
        return Promise.resolve({ data: null, error: null });
      }),
      delete: vi.fn(() => builder),
      in: vi.fn((_col: string, ids: string[]) => {
        deletes.push({ table, ids });
        return Promise.resolve({ data: null, error: null });
      }),
    };
    return builder;
  });
  return {
    auth: {
      getUser: async (): Promise<{ data: { user: { id: string } | null }; error: null }> => ({
        data: { user: { id: USUARIO } },
        error: null,
      }),
    },
    from,
    upserts,
    deletes,
  };
}

vi.mock('../supabaseClient', () => ({
  getSupabaseClient: () => clientMock,
}));

// Referência usada pelo vi.mock acima (preenchida no beforeEach).
let clientMock: ReturnType<typeof fakeClient>;
let responderes: {
  tasks: { data: unknown; error: unknown };
  preferencias: { data: unknown; error: unknown };
};

beforeEach(() => {
  responderes = { tasks: { data: [], error: null }, preferencias: { data: null, error: null } };
  clientMock = fakeClient(responderes);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('paraLinha / paraTarefa (mapeamento de campos)', () => {
  it('converte camelCase → snake_case com valores padrão', () => {
    const linha = paraLinha(taskBase('t1'), USUARIO, 3);
    expect(linha).toMatchObject({
      id: 't1',
      usuario_id: USUARIO,
      posicao: 3,
      favorita: false,
      lembrete_notificado: false,
      subtarefas: [],
      anotacoes: [],
      tags: [],
      categoria: null,
      atualizada_em: null,
    });
  });

  it('converte snake_case → camelCase', () => {
    const linha = paraLinha(
      {
        ...taskBase('t1'),
        favorita: true,
        categoria: 'Dev',
        tags: ['a'],
        lembrete: '2026-08-10T09:00',
        subtarefas: [{ id: 's1', titulo: 'Passo', concluida: false }],
        anotacoes: [{ id: 'a1', texto: 'nota', criadaEm: '2026-08-01T08:00:00' }],
        historico: [
          { id: 'h1', dataHora: '2026-08-03T10:00:00', statusAnterior: null, novoStatus: 'CAIXA_ENTRADA', tipo: 'status' },
        ],
      },
      USUARIO,
      0
    );
    const tarefa = paraTarefa(linha);
    expect(tarefa).toMatchObject({
      id: 't1',
      favorita: true,
      categoria: 'Dev',
      tags: ['a'],
      lembrete: '2026-08-10T09:00',
      subtarefas: [{ id: 's1', titulo: 'Passo', concluida: false }],
      anotacoes: [{ id: 'a1', texto: 'nota', criadaEm: '2026-08-01T08:00:00' }],
      historico: [{ id: 'h1', dataHora: '2026-08-03T10:00:00', statusAnterior: null, novoStatus: 'CAIXA_ENTRADA', tipo: 'status' }],
    });
  });
});

describe('SupabaseProvider', () => {
  it('load retorna null quando não há usuário logado', async () => {
    clientMock.auth.getUser = async () => ({ data: { user: null }, error: null });
    const provider = new SupabaseProvider();
    expect(await provider.load()).toBeNull();
  });

  it('load carrega tarefas ordenadas por posição e as preferências', async () => {
    responderes.tasks = {
      data: [
        paraLinha({ ...taskBase('b'), titulo: 'Segunda' }, USUARIO, 1),
        paraLinha({ ...taskBase('a'), titulo: 'Primeira' }, USUARIO, 0),
      ],
      error: null,
    };
    responderes.preferencias = {
      data: { usuario_id: USUARIO, tema: 'escuro', view: 'quadro', kpi_collapsed: true, atualizada_em: '2026-08-08T00:00:00' },
      error: null,
    };
    const provider = new SupabaseProvider();
    const salvos = await provider.load();
    expect(salvos!.tasks.map((t) => t.titulo)).toEqual(['Primeira', 'Segunda']);
    expect(salvos!.preferencias).toEqual({ tema: 'escuro', view: 'quadro', kpiCollapsed: true });
  });

  it('load lança erro quando a consulta falha (Supabase indisponível)', async () => {
    responderes.tasks = { data: null, error: { message: 'network' } };
    const provider = new SupabaseProvider();
    await expect(provider.load()).rejects.toThrow();
  });

  it('save faz upsert de todas as tarefas e exclui as removidas (diff por id)', async () => {
    const provider = new SupabaseProvider();
    // Carrega 3 tarefas para popular o diff interno.
    responderes.tasks = {
      data: [paraLinha(taskBase('t1'), USUARIO, 0), paraLinha(taskBase('t2'), USUARIO, 1), paraLinha(taskBase('t3'), USUARIO, 2)],
      error: null,
    };
    await provider.load();

    // Salva apenas t2 e t3 → t1 deve ser excluída.
    await provider.save({ tasks: [taskBase('t2'), taskBase('t3')], preferencias: null });

    const upsertChamadas = clientMock.upserts.filter(([t]) => t === 'tasks');
    expect(upsertChamadas).toHaveLength(1);
    const linhas = upsertChamadas[0][1] as Array<{ id: string; usuario_id: string }>;
    expect(linhas.map((l) => l.id)).toEqual(['t2', 't3']);
    expect(linhas.every((l) => l.usuario_id === USUARIO)).toBe(true);

    const deleteChamadas = clientMock.deletes.filter((d) => d.table === 'tasks');
    expect(deleteChamadas).toHaveLength(1);
    expect(deleteChamadas[0].ids).toEqual(['t1']);
  });

  it('save grava as preferências do usuário', async () => {
    const provider = new SupabaseProvider();
    await provider.save({
      tasks: [taskBase('t1')],
      preferencias: { tema: 'escuro', view: 'lista', kpiCollapsed: false },
    });
    const prefChamadas = clientMock.upserts.filter(([t]) => t === 'preferencias');
    expect(prefChamadas).toHaveLength(1);
    const linha = prefChamadas[0][1] as Record<string, unknown>;
    expect(linha.usuario_id).toBe(USUARIO);
    expect(linha.tema).toBe('escuro');
    expect(linha.view).toBe('lista');
  });
});
