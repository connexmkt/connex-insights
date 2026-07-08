"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Heart,
  MessageCircle,
  Minus,
  Share2,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { SyncStatusBanner } from "@/components/dashboard/sync-status-banner";
import { cn } from "@/lib/utils";
import type {
  AnalyticsPeriodPreset,
  AudienceResponse,
  MediaListResponse,
  MetricValue,
  OverviewResponse,
  TimeseriesResponse,
} from "@/types/analytics";
import type { IntegrationPublic } from "@/types/instagram";

const KPI_ICONS: Record<string, typeof Users> = {
  follower_count: Users,
  reach: Eye,
  accounts_engaged: Heart,
  profile_views: Eye,
  total_interactions: MessageCircle,
};

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function MetricCard({
  metric,
  index,
}: {
  metric: MetricValue;
  index: number;
}): React.JSX.Element {
  const Icon = KPI_ICONS[metric.name] ?? Users;
  const positive = metric.trend === "up";
  const negative = metric.trend === "down";

  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        {metric.status === "available" && metric.changePercent != null && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              positive && "text-success",
              negative && "text-destructive",
              !positive && !negative && "text-muted-foreground",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            ) : negative ? (
              <ArrowDownRight className="size-3.5" aria-hidden="true" />
            ) : (
              <Minus className="size-3.5" aria-hidden="true" />
            )}
            {`${Math.abs(metric.changePercent)}%`}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm text-muted-foreground">{metric.label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">
          {metric.status === "unavailable"
            ? "Indisponível"
            : formatNumber(metric.value)}
        </p>
      </div>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}): React.JSX.Element | null {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">
        {new Intl.NumberFormat("pt-BR").format(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
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
  const [reachSeries, setReachSeries] = useState<TimeseriesResponse | null>(null);
  const [followerSeries, setFollowerSeries] =
    useState<TimeseriesResponse | null>(null);
  const [media, setMedia] = useState<MediaListResponse | null>(null);
  const [audience, setAudience] = useState<AudienceResponse | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);

    const compareParam = compare ? "true" : "false";
    const [overviewRes, reachRes, followerRes, mediaRes, audienceRes] =
      await Promise.all([
        fetch(
          `/api/instagram/analytics/overview?period=${period}&compare=${compareParam}`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/instagram/analytics/timeseries?period=${period}&metric=reach&compare=${compareParam}`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/instagram/analytics/timeseries?period=${period}&metric=follower_count&compare=${compareParam}`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/instagram/analytics/media?period=${period}&sort=reach&order=desc&page=1`,
          { cache: "no-store" },
        ),
        fetch(`/api/instagram/analytics/audience?period=${period}`, {
          cache: "no-store",
        }),
      ]);

    if (overviewRes.ok) {
      setOverview((await overviewRes.json()) as OverviewResponse);
    }

    if (reachRes.ok) {
      setReachSeries((await reachRes.json()) as TimeseriesResponse);
    }

    if (followerRes.ok) {
      setFollowerSeries((await followerRes.json()) as TimeseriesResponse);
    }

    if (mediaRes.ok) {
      setMedia((await mediaRes.json()) as MediaListResponse);
    }

    if (audienceRes.ok) {
      setAudience((await audienceRes.json()) as AudienceResponse);
    }

    setLoading(false);
  }, [compare, period]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadData();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadData]);

  const axisProps = useMemo(
    () => ({
      stroke: "var(--muted-foreground)",
      fontSize: 11,
      tickLine: false,
      axisLine: false,
    }),
    [],
  );

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
            <p className="text-sm text-muted-foreground">
              {overview?.sync.freshnessLabel ?? "Carregando status..."}
            </p>
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {overview?.kpis.map((metric, index) => (
          <MetricCard key={metric.name} metric={metric} index={index} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Crescimento de Seguidores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={followerSeries?.points ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alcance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={reachSeries?.points ?? []}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={44} />
                <Tooltip content={<ChartTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interações</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reachSeries?.points ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="value"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts com Melhor Desempenho</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Publicação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Curtidas</TableHead>
                <TableHead className="pr-6 text-right">Engajamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {media?.items.length ? (
                media.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnailUrl ?? "/placeholder.svg"}
                          alt=""
                          className="size-10 rounded-md object-cover"
                        />
                        <span className="max-w-[220px] truncate text-sm">
                          {item.caption ?? "Sem legenda"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.mediaType}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(item.metrics.reach?.value)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(item.metrics.likes?.value)}
                    </TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">
                      {formatNumber(item.metrics.engagement?.value)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm">
                    Nenhuma publicação encontrada para o período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audiência</CardTitle>
        </CardHeader>
        <CardContent>
          {audience?.available ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(audience.demographics).map(([dimension, segments]) => (
                <div key={dimension} className="space-y-3">
                  <p className="text-sm font-medium capitalize">{dimension}</p>
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
              ))}
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
