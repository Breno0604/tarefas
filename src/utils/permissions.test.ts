import { describe, expect, it, vi } from 'vitest';

vi.mock('../data/mockData', async (importOriginal) => {
  const original = await importOriginal<typeof import('../data/mockData')>();
  return {
    ...original,
    findUser: (id: string) => {
      const u = original.findUser(id);
      if (!u) return undefined;
      if (id === 'lucas') return { ...u, permissoes: ['alterar_status_outros', 'gerenciar_tarefas'] };
      if (id === 'maria') return { ...u, permissoes: [] };
      return u;
    },
  };
});

import { GESTOR_ID, TAREFAS } from '../data/mockData';
import type { Task } from '../types';
import { permissoesDe, pode, podeAlterarStatus, podeVer, tasksVisiveis } from './permissions';

const tarefaJoao: Task = TAREFAS.find((t) => t.id === 'TA-005')!; // responsável joao
const tarefaMaria: Task = TAREFAS.find((t) => t.id === 'TA-003')!; // responsável maria

describe('permissoesDe / pode', () => {
  it('gestor tem todas as permissões por construção', () => {
    const todas = ['alterar_status_outros', 'visualizar_todas_tarefas', 'criar_tarefas', 'gerenciar_tarefas'] as const;
    expect(permissoesDe(GESTOR_ID)).toEqual([...todas]);
    for (const p of todas) expect(pode(GESTOR_ID, p)).toBe(true);
  });

  it('colaborador sem permissão declarada não tem permissões', () => {
    expect(pode('maria', 'visualizar_todas_tarefas')).toBe(false);
    expect(pode('maria', 'criar_tarefas')).toBe(false);
  });

  it('colaborador do seed com visualizar_todas_tarefas pode ver', () => {
    expect(pode('joao', 'visualizar_todas_tarefas')).toBe(true);
    expect(pode('joao', 'criar_tarefas')).toBe(false);
  });

  it('usuário com permissões declaradas pode usá-las', () => {
    expect(pode('lucas', 'alterar_status_outros')).toBe(true);
    expect(pode('lucas', 'gerenciar_tarefas')).toBe(true);
    expect(pode('lucas', 'criar_tarefas')).toBe(false);
  });

  it('usuário inexistente não tem permissões', () => {
    expect(permissoesDe('zzz')).toEqual([]);
    expect(pode('zzz', 'criar_tarefas')).toBe(false);
    expect(podeAlterarStatus('zzz', tarefaJoao)).toBe(false);
  });
});

describe('podeAlterarStatus', () => {
  it('gestor sempre pode alterar', () => {
    expect(podeAlterarStatus(GESTOR_ID, tarefaJoao)).toBe(true);
    expect(podeAlterarStatus(GESTOR_ID, tarefaMaria)).toBe(true);
  });

  it('responsável pode alterar a própria tarefa', () => {
    expect(podeAlterarStatus('joao', tarefaJoao)).toBe(true);
    expect(podeAlterarStatus('maria', tarefaMaria)).toBe(true);
  });

  it('não-responsável sem permissão não pode alterar', () => {
    expect(podeAlterarStatus('joao', tarefaMaria)).toBe(false);
    expect(podeAlterarStatus('maria', tarefaJoao)).toBe(false);
  });

  it('não-responsável com alterar_status_outros pode alterar', () => {
    expect(podeAlterarStatus('lucas', tarefaJoao)).toBe(true);
    expect(podeAlterarStatus('lucas', tarefaMaria)).toBe(true);
  });
});

describe('podeVer / tasksVisiveis', () => {
  it('gestor e responsável veem a tarefa', () => {
    expect(podeVer(GESTOR_ID, tarefaJoao)).toBe(true);
    expect(podeVer('joao', tarefaJoao)).toBe(true);
  });

  it('usuário sem visualizar_todas_tarefas e não-responsável não vê', () => {
    expect(podeVer('maria', tarefaJoao)).toBe(false);
  });

  it('tasksVisiveis filtra apenas as que o usuário pode ver', () => {
    expect(tasksVisiveis([tarefaJoao, tarefaMaria], 'maria').map((t) => t.id)).toEqual(['TA-003']);
  });
});
