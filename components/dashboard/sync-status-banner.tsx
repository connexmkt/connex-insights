"use client";

import Link from "next/link";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SyncStatusResponse } from "@/types/analytics";

interface SyncStatusBannerProps {
  sync: SyncStatusResponse;
}

export function SyncStatusBanner({
  sync,
}: SyncStatusBannerProps): React.JSX.Element | null {
  if (sync.syncStatus === "IN_PROGRESS") {
    return (
      <Card aria-live="polite">
        <CardContent className="flex items-start gap-3 py-4">
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Sincronizando dados</p>
            <p className="text-sm text-muted-foreground">
              Estamos importando suas métricas do Instagram. Os dados históricos
              permanecem visíveis durante a sincronização.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sync.syncStatus === "FAILED") {
    return (
      <Card
        className="border-destructive/40 bg-destructive/5"
        aria-live="polite"
      >
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Falha na última sincronização</p>
              <p className="text-sm text-muted-foreground">
                Não foi possível atualizar todos os dados. As métricas anteriores
                continuam disponíveis.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/configuracoes"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Ver integração
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (sync.integrationStatus === "REQUIRES_RECONNECTION") {
    return (
      <Card
        className={cn("border-destructive/40 bg-destructive/5")}
        aria-live="polite"
      >
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Reconexão necessária</p>
              <p className="text-sm text-muted-foreground">
                Sua autorização Instagram expirou. Reconecte para continuar
                sincronizando novos dados.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/configuracoes"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
          >
            Reconectar Instagram
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
}
