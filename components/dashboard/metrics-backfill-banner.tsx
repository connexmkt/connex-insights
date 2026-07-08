"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricsBackfillBannerProps {
  onSync: () => void;
  syncing: boolean;
}

export function MetricsBackfillBanner({
  onSync,
  syncing,
}: MetricsBackfillBannerProps): React.JSX.Element {
  return (
    <Card className="border-primary/30 bg-primary/5" aria-live="polite">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Métricas ainda não importadas</p>
            <p className="text-sm text-muted-foreground">
              A conta está conectada, mas o histórico de insights ainda não foi
              sincronizado. Inicie a importação para preencher KPIs e gráficos.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <RefreshCw
            className={cn("size-4", syncing && "animate-spin")}
            aria-hidden="true"
          />
          {syncing ? "Importando..." : "Importar métricas"}
        </button>
      </CardContent>
    </Card>
  );
}
