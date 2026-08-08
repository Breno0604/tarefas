import { storageProvider } from './index';
import type { LoadedState } from './StorageProvider';
export type { LoadedState } from './StorageProvider';

/**
 * Fachada da persistência: delega para o provider selecionado em `services/index.ts`.
 * Consumidores (AppContext, testes) usam estas funções e não conhecem o provider.
 */
export async function loadState(): Promise<LoadedState | null> {
  return storageProvider.load();
}

export async function saveState(state: LoadedState): Promise<void> {
  await storageProvider.save(state);
}

export async function clearState(): Promise<void> {
  await storageProvider.clear();
}
