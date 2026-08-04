import type { Permission, Task } from '../types';
import { findUser, GESTOR_ID } from '../data/mockData';

const TODAS_AS_PERMISSOES: Permission[] = [
  'alterar_status_outros',
  'visualizar_todas_tarefas',
  'criar_tarefas',
  'gerenciar_tarefas',
];

/** Permissões de um usuário; o gestor tem todas por construção. */
export function permissoesDe(userId: string): Permission[] {
  if (userId === GESTOR_ID) return [...TODAS_AS_PERMISSOES];
  return findUser(userId)?.permissoes ?? [];
}

/** O usuário possui a permissão? (gestor sempre sim) */
export function pode(userId: string, perm: Permission): boolean {
  return permissoesDe(userId).includes(perm);
}

/** Pode avançar/retroceder o status desta tarefa? (gestor, responsável ou com permissão específica) */
export function podeAlterarStatus(userId: string, task: Task): boolean {
  return userId === GESTOR_ID || task.responsavelId === userId || pode(userId, 'alterar_status_outros');
}

/** Pode visualizar esta tarefa? (gestor, responsável ou com permissão de visualizar todas) */
export function podeVer(userId: string, task: Task): boolean {
  return userId === GESTOR_ID || task.responsavelId === userId || pode(userId, 'visualizar_todas_tarefas');
}

/** Tarefas que o usuário pode visualizar. */
export function tasksVisiveis(tasks: Task[], userId: string): Task[] {
  return tasks.filter((t) => podeVer(userId, t));
}
