import type { Task, TaskView, Tema } from '../types';

export interface Preferencias {
  tema: Tema;
  view: TaskView;
  kpiCollapsed: boolean;
}

export interface LoadedState {
  tasks: Task[];
  preferencias: Preferencias | null;
}

/**
 * Contrato de persistência do app. O provider padrão é o Supabase
 * (fonte oficial dos dados, 100% online). Providers síncronos usados
 * apenas em testes podem implementar `loadSync`/`saveSync` para boot
 * imediato e sem autenticação.
 */
export interface StorageProvider {
  /** Indica se o provider exige autenticação (Supabase) antes de carregar dados. */
  requiresAuth: boolean;
  load(): Promise<LoadedState | null>;
  save(state: LoadedState): Promise<void>;
  clear(): Promise<void>;
  /** Carregamento síncrono opcional — implementado apenas por providers de teste. */
  loadSync?(): LoadedState | null;
}
