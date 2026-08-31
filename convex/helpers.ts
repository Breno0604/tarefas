/**
 * Shared helpers for Convex functions.
 *
 * Convex functions cannot import from outside the convex/ directory,
 * so we duplicate the minimal helpers needed here.
 */

/** Generate a unique ID with an optional prefix. */
export function uid(prefix: string = ''): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return prefix ? `${prefix}-${id}` : id
}
