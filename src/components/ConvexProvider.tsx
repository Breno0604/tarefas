/**
 * ConvexProvider — wraps the app with Convex client.
 *
 * When VITE_CONVEX_URL is set, all data flows through Convex.
 * Otherwise, falls back to localStorage (current behavior).
 *
 * Shows PairingScreen when user hasn't chosen an account yet.
 */

import { ConvexProvider as ConvexReactProvider, ConvexReactClient } from "convex/react";
import React, { useCallback, useState } from "react";
import PairingScreen from "./PairingScreen";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexClient = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;
export const USE_CONVEX = Boolean(CONVEX_URL);

const USER_ID_KEY = "taskflow-anonymous-user-id";

/** Get or create anonymous userId. */
export function getAnonymousUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

/** Check if user has paired (has a userId stored). */
export function isPaired(): boolean {
  return Boolean(localStorage.getItem(USER_ID_KEY));
}

interface Props {
  children: React.ReactNode;
}

export default function ConvexProvider({ children }: Props) {
  const [userId, setUserId] = useState<string | null>(() =>
    isPaired() ? getAnonymousUserId() : null
  );

  const handlePaired = useCallback((id: string) => {
    setUserId(id);
  }, []);

  if (!convexClient) {
    // No Convex configured — just render children (localStorage mode)
    return <>{children}</>;
  }

  // Not paired yet — show pairing screen
  if (!userId) {
    return (
      <ConvexReactProvider client={convexClient}>
        <PairingScreen onPaired={handlePaired} />
      </ConvexReactProvider>
    );
  }

  return (
    <ConvexReactProvider client={convexClient}>
      {children}
    </ConvexReactProvider>
  );
}
