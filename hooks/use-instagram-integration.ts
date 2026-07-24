"use client";

import { useCallback, useEffect, useState } from "react";
import type { IntegrationPublic, IntegrationResponse } from "@/types/instagram";

async function fetchIntegrationState(): Promise<IntegrationResponse | null> {
  const response = await fetch("/api/instagram/integration", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as IntegrationResponse;
}

export function useInstagramIntegration() {
  const [integration, setIntegration] = useState<IntegrationPublic | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async (): Promise<void> => {
    const data = await fetchIntegrationState();

    if (!data) {
      setIntegration(null);
      setConnected(false);
      setLoading(false);
      return;
    }

    setIntegration(data.integration);
    setConnected(data.connected);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Adiado para fora do corpo síncrono do efeito, evitando o disparo de
    // renders em cascata (react-hooks/set-state-in-effect).
    void Promise.resolve().then(() => refetch());
  }, [refetch]);

  return { integration, connected, loading, refetch };
}
