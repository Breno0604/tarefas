import type { Permission, Task } from '../types';
import { findUser, GESTOR_ID } from '../data/mockData';

const TODAS_AS_PERMISSOES: Permission[] = [
  'alterar_status_outros',
  'visualizar_todas_tarefas',
  'criar_tarefas',
  'gerenciar_tarefas',
];

export function permissoesDe(userId: string): Permission[] {
  if (userId === GESTOR_ID) return [...TODAS_AS_PERMISSOES];
  return findUser(userId)?.permissoes ?? [];
}

export function pode(userId: string, perm: Permission): boolean {
  return permissoesDe(userId).includes(perm);
}

export function podeAlterarStatus(userId: string, task: Task): boolean {
  return userId === GESTOR_ID || task.responsavelId === userId || pode(userId, 'alterar_status_outros');
}

export function podeVer(userId: string, task: Task): boolean {
  return userId === GESTOR_ID || task.responsavelId === userId || pode(userId, 'visualizar_todas_tarefas');
}

export function tasksVisiveis(tasks: Task[], userId: string): Task[] {
  return tasks.filter((t) => podeVer(userId, t));
}
