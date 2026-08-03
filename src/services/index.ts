import { LocalStorageProvider } from './providers/LocalStorageProvider';
import { FutureApiProvider } from './providers/FutureApiProvider';
import type { StorageProvider } from './StorageProvider';

/**
 * Ponto único de seleção do provider de persistência.
 * Trocar o destino (localStorage → API) = mudar esta env var; nada mais muda.
 */
const useApi = import.meta.env.VITE_STORAGE_PROVIDER === 'api';

export const storageProvider: StorageProvider = useApi
  ? new FutureApiProvider()
  : new LocalStorageProvider();
