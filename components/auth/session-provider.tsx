"use client";

import { createContext, useContext } from "react";
import type { TenantContext } from "@/types/auth";

const SessionContext = createContext<TenantContext | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: TenantContext;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
  );
}

export function useSession(): TenantContext {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error("useSession deve ser usado dentro de SessionProvider");
  }

  return session;
}
