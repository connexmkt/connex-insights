import { Badge } from "@/components/ui/badge";
import type { IntegrationPublic } from "@/types/instagram";

interface InstagramSyncStatusProps {
  integration: IntegrationPublic;
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function getSyncBadge(integration: IntegrationPublic): {
  label: string;
  className: string;
} {
  switch (integration.syncStatus) {
    case "PENDING":
      return {
        label: "Aguardando sincronização",
        className: "bg-muted text-muted-foreground",
      };
    case "IN_PROGRESS":
      return {
        label: "Sincronizando…",
        className: "bg-chart-4/15 text-chart-4",
      };
    case "COMPLETED":
      return {
        label: "Sincronizado",
        className: "bg-chart-2/15 text-chart-2",
      };
    case "FAILED":
      return {
        label: "Falha na sincronização",
        className: "bg-destructive/15 text-destructive",
      };
    default: {
      const _exhaustive: never = integration.syncStatus;
      throw new Error(`Status de sync não tratado: ${_exhaustive}`);
    }
  }
}

export function InstagramSyncStatus({
  integration,
}: InstagramSyncStatusProps): React.JSX.Element {
  const badge = getSyncBadge(integration);

  return (
    <div className="space-y-1" aria-live="polite" aria-atomic="true">
      <Badge variant="secondary" className={badge.className}>
        {badge.label}
      </Badge>
      {integration.lastSyncedAt ? (
        <p className="text-xs text-muted-foreground">
          Última sincronização: {formatDate(integration.lastSyncedAt)}
        </p>
      ) : null}
    </div>
  );
}
