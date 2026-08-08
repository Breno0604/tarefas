import type { LoadedState, StorageProvider } from '../StorageProvider';

/**
 * Provider em memória usado somente nos testes: boot síncrono (`loadSync`)
 * e sem autenticação. Recebe um estado inicial (ex.: o seed) e pode ser
 * redefinido com `reset()` para isolar os testes.
 */
export class MemoryStorageProvider implements StorageProvider {
  readonly requiresAuth = false;
  private dados: LoadedState | null;

  constructor(private estadoInicial: LoadedState | null = null) {
    this.dados = estadoInicial;
  }

  reset(): void {
    this.dados = this.estadoInicial;
  }

  loadSync(): LoadedState | null {
    return this.dados
      ? { tasks: [...this.dados.tasks], preferencias: this.dados.preferencias }
      : null;
  }

  async load(): Promise<LoadedState | null> {
    return this.loadSync();
  }

  async save(state: LoadedState): Promise<void> {
    this.dados = { tasks: [...state.tasks], preferencias: state.preferencias };
  }

  async clear(): Promise<void> {
    this.dados = null;
  }
}
