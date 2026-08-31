# Auth Strategy for Convex

## Decision: Anonymous + Optional Upgrade

For the initial migration, use **Convex Anonymous Auth**:

- Users get an anonymous account automatically (no login required).
- Data is scoped to `userId` in every table query/mutation.
- Optional: add email/password or Google OAuth later for cross-device sync.

## Why Anonymous First?

1. **Zero-friction onboarding** — the app works immediately, no signup wall.
2. **Preserves current UX** — the app is single-user local-first today.
3. **Easy upgrade path** — Convex's `auth.getUserId(ctx)` works with any auth provider.
4. **All data already has userId** — schema is ready, just need to wire it up.

## Implementation

```ts
// convex/auth.ts
import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireUserId(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
```

## Future: Cross-device Sync

Once anonymous auth works:
1. Add `@convex-dev/auth` with Google provider.
2. Add "Upgrade account" button in Settings.
3. Migrate anonymous data to the real account on login.
