"use client";

import { Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { MetricsBackfillBanner } from "@/components/dashboard/metrics-backfill-banner";
import { MetricsChartsPanel } from "@/components/dashboard/metrics-charts-panel";
import { SyncStatusBanner } from "@/components/dashboard/sync-status-banner";
import { TopPostsRanking } from "@/components/dashboard/top-posts-ranking";
import { getDailySyncTimeLabel } from "@/lib/instagram/sync-schedule";
import type {
  AnalyticsPeriodPreset,
  AudienceResponse,
  MediaListResponse,
  OverviewResponse,
} from "@/types/analytics";
import type { IntegrationPublic } from "@/types/instagram";

const DAILY_SYNC_TIME_LABEL = getDailySyncTimeLabel();

const INSIGHT_METRICS = [
  "reach",
  "accounts_engaged",
  "profile_links_taps",
  "total_interactions",
  "likes",
  "comments",
  "shares",
  "saves",
  "views",
];

function needsMetricsBackfill(overview: OverviewResponse | null): boolean {
  if (!overview || overview.sync.syncStatus === "IN_PROGRESS") {
    return false;
  }

  return INSIGHT_METRICS.every((metricName) => {
    const metric = overview.kpis.find((item) => item.name === metricName);
    return metric?.status === "unavailable";
  });
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="h-28 animate-pulse bg-muted/40" />
        ))}
      </div>
      <Card className="h-72 animate-pulse bg-muted/40" />
    </div>
  );
}

interface InstagramAnalyticsDashboardProps {
  integration: IntegrationPublic;
}

export function InstagramAnalyticsDashboard({
  integration,
}: InstagramAnalyticsDashboardProps): React.JSX.Element {
  const [period, setPeriod] = useState<AnalyticsPeriodPreset>("30d");
  const [compare, setCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [media, setMedia] = useState<MediaListResponse | null>(null);
  const [audience, setAudience] = useState<AudienceResponse | null>(null);
  const [syncingMetrics, setSyncingMetrics] = useState(false);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);

    const compareParam = compare ? "true" : "false";
    const [overviewRes, mediaRes, audienceRes] = await Promise.all([
      fetch(
        `/api/instagram/analytics/overview?period=${period}&compare=${compareParam}`,
        { cache: "no-store" },
      ),
      fetch(
        `/api/instagram/analytics/media?period=${period}&sort=likes&order=desc&page=1&pageSize=5`,
        { cache: "no-store" },
      ),
      fetch(`/api/instagram/analytics/audience?period=${period}`, {
        cache: "no-store",
      }),
    ]);

    if (overviewRes.ok) {
      setOverview((await overviewRes.json()) as OverviewResponse);
    }

    if (mediaRes.ok) {
      setMedia((await mediaRes.json()) as MediaListResponse);
    }

    if (audienceRes.ok) {
      setAudience((await audienceRes.json()) as AudienceResponse);
    }

    setLoading(false);
  }, [compare, period]);

  const handleImportMetrics = useCallback(async (): Promise<void> => {
    setSyncingMetrics(true);
    await fetch("/api/instagram/sync", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    });
    await loadData();
    setSyncingMetrics(false);
  }, [loadData]);

  const metricsBackfillNeeded = needsMetricsBackfill(overview);

  useEffect(() => {
    if (!metricsBackfillNeeded) {
      return;
    }

    const storageKey = `instagram-metrics-backfill:${integration.id}`;
    if (sessionStorage.getItem(storageKey) === "1") {
      return;
    }

    sessionStorage.setItem(storageKey, "1");
    // Adiado para fora do corpo síncrono do efeito, evitando o disparo de
    // renders em cascata (react-hooks/set-state-in-effect).
    void Promise.resolve().then(() => handleImportMetrics());
  }, [handleImportMetrics, integration.id, metricsBackfillNeeded]);

  useEffect(() => {
    if (overview?.sync.syncStatus !== "IN_PROGRESS") {
      return;
    }

    const interval = setInterval(() => {
      void loadData();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadData, overview?.sync.syncStatus]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadData();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadData]);

  if (loading && !overview) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage
              src={integration.profilePictureUrl ?? undefined}
              alt={`Foto de perfil @${integration.username}`}
            />
            <AvatarFallback>
              {integration.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-heading text-lg font-semibold">
              @{integration.username}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-muted-foreground">
                {overview?.sync.freshnessLabel ?? "Carregando status..."}
              </p>
              <Tooltip>
                <TooltipTrigger className="inline-flex text-muted-foreground hover:text-foreground">
                  <Info className="size-3.5" />
                  <span className="sr-only">
                    Informações sobre a atualização automática dos dados
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Atualiza automaticamente às {DAILY_SYNC_TIME_LABEL}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
        <DateRangePicker
          value={period}
          onChange={setPeriod}
          compare={compare}
          onCompareChange={setCompare}
        />
      </div>

      {overview ? <SyncStatusBanner sync={overview.sync} /> : null}

      {metricsBackfillNeeded ? (
        <MetricsBackfillBanner
          onSync={() => void handleImportMetrics()}
          syncing={
            syncingMetrics || overview?.sync.syncStatus === "IN_PROGRESS"
          }
        />
      ) : null}

      {overview ? (
        <MetricsChartsPanel overview={overview} period={period} />
      ) : null}

      <TopPostsRanking items={media?.items ?? []} />

      <Card>
        <CardHeader>
          <CardTitle>Audiência</CardTitle>
        </CardHeader>
        <CardContent>
          {audience?.available ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(audience.demographics).map(
                ([dimension, segments]) => (
                  <div key={dimension} className="space-y-3">
                    <p className="text-sm font-medium capitalize">
                      {dimension}
                    </p>
                    {segments.slice(0, 5).map((segment) => (
                      <div
                        key={`${dimension}-${segment.value}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {segment.value}
                        </span>
                        <span className="font-medium tabular-nums">
                          {segment.percentage !== null
                            ? `${segment.percentage}%`
                            : formatNumber(segment.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Dados demográficos indisponíveis para sua conta no momento.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
