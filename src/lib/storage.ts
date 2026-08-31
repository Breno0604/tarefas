/**
 * Storage adapter abstraction.
 *
 * Decouples persistence from localStorage so the app can swap
 * backends (e.g. Convex, IndexedDB, Firebase) without touching
 * the store internals.
 */

export interface StorageAdapter {
  load(key: string): string | null
  save(key: string, value: string): void
  remove(key: string): void
}

/** Default browser localStorage adapter. */
export const localStorageAdapter: StorageAdapter = {
  load(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  save(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.warn('[Storage] write failed:', (e as Error)?.message || e)
      window.dispatchEvent(
        new CustomEvent('taskflow:storage-error', { detail: { error: e } }),
      )
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  },
}

/** In-memory adapter (useful for testing). */
export function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, string>()
  return {
    load: (key: string) => store.get(key) ?? null,
    save: (key: string, value: string) => {
      store.set(key, value)
    },
    remove: (key: string) => {
      store.delete(key)
    },
  }
}

/** Singleton adapter — change this one import to swap all persistence. */
let _adapter: StorageAdapter = localStorageAdapter

export function getStorageAdapter(): StorageAdapter {
  return _adapter
}

export function setStorageAdapter(adapter: StorageAdapter): void {
  _adapter = adapter
}
