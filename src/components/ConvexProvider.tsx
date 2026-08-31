/**
 * ConvexProvider — wraps the app with Convex client.
 *
 * When VITE_CONVEX_URL is set, all data flows through Convex.
 * Otherwise, falls back to localStorage (current behavior).
 *
 * Auth: uses client-side anonymous userId (stored in localStorage).
 * Can be upgraded to @convex-dev/auth later.
 */

import { ConvexProvider as ConvexReactProvider, ConvexReactClient } from "convex/react";
import React from "react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexClient = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;
export const USE_CONVEX = Boolean(CONVEX_URL);

/** Get or create anonymous userId. */
export function getAnonymousUserId(): string {
  const KEY = "taskflow-anonymous-user-id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

interface Props {
  children: React.ReactNode;
}

export default function ConvexProvider({ children }: Props) {
  if (!convexClient) {
    // No Convex configured — just render children (localStorage mode)
    return <>{children}</>;
  }

  return (
    <ConvexReactProvider client={convexClient}>
      {children}
    </ConvexReactProvider>
  );
}
