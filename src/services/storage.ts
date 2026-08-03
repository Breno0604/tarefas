import { storageProvider } from './index';
import type { LoadedState } from './StorageProvider';
export { STORAGE_KEY } from './providers/LocalStorageProvider';
export type { LoadedState } from './StorageProvider';

/**
 * Facade da persistência: delega para o provider selecionado em `services/index.ts`.
 * Consumidores (AppContext, testes) usam estas funções e não conhecem o provider.
 */
export function loadState(): LoadedState | null {
  return storageProvider.load();
}

export function saveState(state: LoadedState): void {
  storageProvider.save(state);
}

export function clearState(): void {
  storageProvider.clear();
}
