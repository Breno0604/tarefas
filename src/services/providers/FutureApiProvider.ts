import type { LoadedState, StorageProvider } from '../StorageProvider';

/**
 * Stub para um backend real (futuro). Ativado via `VITE_STORAGE_PROVIDER=api`.
 *
 * Ainda não realiza chamadas de rede — o carregamento assíncrono (com estado de
 * "carregando" e tratamento de erro de rede) será o próximo passo. Por enquanto,
 * `load()` retorna null, fazendo o app cair no seed (comportamento seguro).
 */
export class FutureApiProvider implements StorageProvider {
  load(): LoadedState | null {
    console.warn('FutureApiProvider ainda não implementado — usando o seed.');
    return null;
  }

  save(_state: LoadedState): void {
    console.warn('FutureApiProvider ainda não implementado — nenhum dado enviado.');
  }

  clear(): void {
    console.warn('FutureApiProvider ainda não implementado — nenhum dado apagado.');
  }
}
