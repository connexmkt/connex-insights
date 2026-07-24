import { InstagramAnalyticsDashboard } from "@/components/dashboard/instagram-analytics-dashboard";
import { InstagramEmptyState } from "@/components/dashboard/instagram-empty-state";
import { NetworkTabs } from "@/components/dashboard/network-tabs";
import { getTenantContext } from "@/lib/auth/session";
import { getDashboardIntegration } from "@/lib/instagram/integration-service";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const tenantContext = await getTenantContext();
  const integration = tenantContext
    ? await getDashboardIntegration(tenantContext.tenantId)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o desempenho da sua conta Instagram com métricas
            sincronizadas.
          </p>
        </div>
      </div>

      <NetworkTabs />

      {integration ? (
        <InstagramAnalyticsDashboard integration={integration} />
      ) : (
        <InstagramEmptyState />
      )}
    </div>
  );
}
