"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InstagramConnectButton } from "@/components/instagram/instagram-connect-button";
import { InstagramProfileSummary } from "@/components/instagram/instagram-profile-summary";
import { InstagramSyncStatus } from "@/components/instagram/instagram-sync-status";
import { useInstagramIntegration } from "@/hooks/use-instagram-integration";
import type { IntegrationPublic } from "@/types/instagram";

interface InstagramConnectCardProps {
  callbackStatus?: string | null;
  callbackDetail?: string | null;
}

const CALLBACK_MESSAGES: Record<string, { title: string; variant: "success" | "error" }> = {
  connected: {
    title: "Instagram conectado com sucesso!",
    variant: "success",
  },
  connected_sync_pending: {
    title: "Instagram conectado! Sincronização em andamento…",
    variant: "success",
  },
  denied: {
    title: "Conexão cancelada. Nenhuma alteração foi feita.",
    variant: "error",
  },
  error: {
    title: "Não foi possível concluir a conexão. Tente novamente.",
    variant: "error",
  },
  missing_code: {
    title: "Código de autorização não recebido da Meta.",
    variant: "error",
  },
  session_lost: {
    title: "Sessão expirada durante a conexão. Faça login e tente novamente.",
    variant: "error",
  },
  token_exchange_failed: {
    title: "Falha ao validar autorização com a Meta (troca de código).",
    variant: "error",
  },
  long_lived_token_failed: {
    title: "Falha ao obter token de longa duração da Meta.",
    variant: "error",
  },
  profile_fetch_failed: {
    title: "Falha ao buscar dados do perfil Instagram.",
    variant: "error",
  },
  persist_failed: {
    title: "Falha ao salvar a integração no Connex.",
    variant: "error",
  },
  sync_failed: {
    title: "Conta conectada, mas a sincronização inicial falhou.",
    variant: "error",
  },
  database_error: {
    title: "Erro de banco de dados ao salvar a conexão.",
    variant: "error",
  },
  encryption_error: {
    title: "Erro na configuração de criptografia de tokens.",
    variant: "error",
  },
  config_error: {
    title: "Configuração Instagram incompleta no servidor.",
    variant: "error",
  },
  meta_api_error: {
    title: "A API da Meta retornou um erro.",
    variant: "error",
  },
  unsupported_account: {
    title: "Apenas contas Instagram Business ou Creator são suportadas.",
    variant: "error",
  },
  already_connected: {
    title: "Este workspace já possui uma conta Instagram conectada.",
    variant: "error",
  },
  account_linked_elsewhere: {
    title: "Esta conta Instagram já está vinculada a outro workspace.",
    variant: "error",
  },
  oauth_state_invalid: {
    title: "Sessão OAuth expirada. Inicie a conexão novamente.",
    variant: "error",
  },
};

function getConnectionBadge(integration: IntegrationPublic): {
  label: string;
  className: string;
} {
  switch (integration.status) {
    case "CONNECTED":
      return {
        label: "Conectado",
        className: "bg-chart-2/15 text-chart-2",
      };
    case "DISCONNECTED":
      return {
        label: "Desconectado",
        className: "bg-muted text-muted-foreground",
      };
    case "REQUIRES_RECONNECTION":
      return {
        label: "Requer reconexão",
        className: "bg-destructive/15 text-destructive",
      };
    default: {
      const _exhaustive: never = integration.status;
      throw new Error(`Status não tratado: ${_exhaustive}`);
    }
  }
}

export function InstagramConnectCard({
  callbackStatus,
  callbackDetail,
}: InstagramConnectCardProps): React.JSX.Element {
  const { integration, loading, refetch } = useInstagramIntegration();
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!integration || integration.syncStatus !== "IN_PROGRESS") {
      return;
    }

    const interval = setInterval(() => {
      void refetch();
    }, 2000);

    return () => clearInterval(interval);
  }, [integration, refetch]);

  async function handleDisconnect(): Promise<void> {
    setDisconnecting(true);
    const response = await fetch("/api/instagram/disconnect", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    });
    setDisconnecting(false);
    setShowDisconnectConfirm(false);

    if (response.ok) {
      await refetch();
    }
  }

  async function handleRetrySync(): Promise<void> {
    setRetrying(true);
    await fetch("/api/instagram/sync", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    });
    setRetrying(false);
    await refetch();
  }

  const callbackMessage = callbackStatus
    ? CALLBACK_MESSAGES[callbackStatus]
    : undefined;

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Carregando integração…</p>
      </Card>
    );
  }

  const isConnected =
    integration !== null && integration.status === "CONNECTED";
  const requiresReconnection =
    integration?.status === "REQUIRES_RECONNECTION";
  const isDisconnected = integration?.status === "DISCONNECTED";
  const showHistoricalProfile =
    integration !== null && (isConnected || isDisconnected || requiresReconnection);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Instagram</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Conecte sua conta Instagram Professional para sincronizar dados.
          </p>
        </div>
        <div
          className="flex size-9 items-center justify-center rounded-md bg-[#E1306C] text-sm font-semibold text-primary-foreground"
          aria-hidden
        >
          I
        </div>
      </div>

      {callbackMessage ? (
        <div
          className={`mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            callbackMessage.variant === "success"
              ? "border-chart-2/30 bg-chart-2/10 text-chart-2"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
          role="alert"
        >
          {callbackMessage.variant === "success" ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <div className="space-y-1">
            <p>{callbackMessage.title}</p>
            {callbackDetail ? (
              <p className="text-xs opacity-90">
                <span className="font-medium">Detalhe:</span> {callbackDetail}
              </p>
            ) : null}
            {callbackStatus && callbackStatus !== "connected" ? (
              <p className="font-mono text-xs opacity-75">
                Código: {callbackStatus}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {requiresReconnection ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Sua autorização expirou. Reconecte para retomar a sincronização.
        </div>
      ) : null}

      <Separator className="my-5" />

      {showHistoricalProfile && integration ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <InstagramProfileSummary integration={integration} />
            <Badge
              variant="secondary"
              className={getConnectionBadge(integration).className}
            >
              {getConnectionBadge(integration).label}
            </Badge>
          </div>
          <InstagramSyncStatus integration={integration} />

          <div className="flex flex-wrap gap-2">
            {requiresReconnection ? (
              <InstagramConnectButton reconnect />
            ) : null}
            {isDisconnected ? <InstagramConnectButton /> : null}
            {integration.syncStatus === "FAILED" && isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRetrySync()}
                disabled={retrying}
              >
                Tentar sincronizar novamente
              </Button>
            ) : null}
            {isConnected ? (
              showDisconnectConfirm ? (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDisconnect()}
                    disabled={disconnecting}
                  >
                    Confirmar desconexão
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(false)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisconnectConfirm(true)}
                >
                  Desconectar
                </Button>
              )
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Instagram</p>
            <p className="text-xs text-muted-foreground">Não conectado</p>
          </div>
          <InstagramConnectButton />
        </div>
      )}
    </Card>
  );
}
