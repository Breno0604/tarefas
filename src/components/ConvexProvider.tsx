/**
 * ConvexProvider — wraps the app with Convex client.
 *
 * When USE_CONVEX env var is truthy, all data flows through Convex.
 * Otherwise, falls back to localStorage (current behavior).
 */

import { ConvexProvider as ConvexReactProvider, ConvexReactClient } from "convex/react";
import React from "react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convexClient = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;
export const USE_CONVEX = Boolean(CONVEX_URL);

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
