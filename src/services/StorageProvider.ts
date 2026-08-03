import type { Task } from '../types';

export interface LoadedState {
  tasks: Task[];
}

/**
 * Contrato de persistência do app: quem salva/carrega as tarefas.
 * Trocar o destino (localStorage → API) = trocar o provider selecionado
 * em `services/index.ts` (env var VITE_STORAGE_PROVIDER), sem tocar no AppContext.
 */
export interface StorageProvider {
  /** Retorna o estado salvo ou null quando não há dados/válidos (fallback para o seed). */
  load(): LoadedState | null;
  save(state: LoadedState): void;
  clear(): void;
}
