"use client";

import { useEffect, useMemo, useState } from "react";
import {
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
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  MousePointerClick,
  Percent,
  Play,
  Share2,
  type LucideIcon,
  Users,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  AnalyticsPeriodPreset,
  MediaAnalyticsItem,
  MetricValue,
  OverviewResponse,
  TimeseriesResponse,
} from "@/types/analytics";

type GroupKey = "reach" | "growth" | "engagement";
type ChartType = "line" | "bar" | "dual" | "ranking";

interface MetricConfig {
  key: string;
  group: GroupKey;
  label: string;
  icon: LucideIcon;
  chartType: ChartType;
  accent: "chart-1" | "chart-2" | "chart-3" | "chart-4";
  /** Métrica sem suporte no backend hoje — valores gerados no cliente. */
  mocked?: boolean;
}

const METRICS: MetricConfig[] = [
  { key: "reach", group: "reach", label: "Alcance", icon: Eye, chartType: "line", accent: "chart-1" },
  { key: "views", group: "reach", label: "Visualizações", icon: Play, chartType: "line", accent: "chart-1" },
  { key: "profile_links_taps", group: "reach", label: "Toques no perfil", icon: MousePointerClick, chartType: "bar", accent: "chart-3" },
  { key: "follower_count", group: "growth", label: "Seguidores", icon: Users, chartType: "line", accent: "chart-1" },
  { key: "accounts_engaged", group: "growth", label: "Contas engajadas", icon: Heart, chartType: "dual", accent: "chart-2", mocked: true },
  { key: "engagement_rate", group: "engagement", label: "Taxa de engajamento", icon: Percent, chartType: "line", accent: "chart-1", mocked: true },
  { key: "likes", group: "engagement", label: "Curtidas", icon: Heart, chartType: "bar", accent: "chart-3" },
  { key: "comments", group: "engagement", label: "Comentários", icon: MessageCircle, chartType: "bar", accent: "chart-3" },
  { key: "shares", group: "engagement", label: "Compartilhamentos", icon: Share2, chartType: "bar", accent: "chart-3" },
  { key: "saves", group: "engagement", label: "Salvamentos", icon: Bookmark, chartType: "ranking", accent: "chart-4" },
];

// Tailwind precisa de nomes de classe literais no código-fonte para gerar o
// CSS — por isso um mapa fixo em vez de interpolar `border-${accent}`.
const ACCENT_BORDER_CLASS: Record<MetricConfig["accent"], string> = {
  "chart-1": "border-chart-1",
  "chart-2": "border-chart-2",
  "chart-3": "border-chart-3",
  "chart-4": "border-chart-4",
};

const TABS: Array<{ key: GroupKey; label: string }> = [
  { key: "reach", label: "Alcance e Descoberta" },
  { key: "growth", label: "Crescimento e Audiência" },
  { key: "engagement", label: "Engajamento" },
];

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

// MOCK: taxa de engajamento aproximada apenas para exibição temporária da
// interface — o backend ainda não calcula/armazena essa métrica
// (InstagramMetricSnapshot não possui "engagement_rate"). Substituir por
// dados reais assim que o cálculo existir na API.
function seededRand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function mockEngagementRateSeries(
  period: AnalyticsPeriodPreset,
  labels: string[],
): { label: string; value: number }[] {
  const rand = seededRand(777);
  const base = period === "7d" ? 4.4 : period === "30d" ? 3.8 : period === "90d" ? 3.3 : 2.9;
  return labels.map((label) => ({
    label,
    value: Math.max(0.4, base + (rand() - 0.5) * 1.2),
  }));
}

function mockEngagementRateValue(period: AnalyticsPeriodPreset): number {
  return period === "7d" ? 4.1 : period === "30d" ? 3.6 : period === "90d" ? 3.3 : 2.8;
}

// MOCK: o backend não distingue, dentro de "contas engajadas", quem já
// seguia o perfil de quem não seguia — não existe essa quebra em
// InstagramMetricSnapshot. Aplicamos uma proporção fixa só para ilustrar a
// comparação na interface; trocar por dados reais quando essa métrica
// existir.
const MOCK_FOLLOWER_ENGAGEMENT_RATIO = 0.68;

function splitEngagedAccounts(
  points: TimeseriesResponse["points"],
): { label: string; followers: number | null; nonFollowers: number | null }[] {
  return points.map((point) => ({
    label: point.label,
    followers:
      point.value === null ? null : Math.round(point.value * MOCK_FOLLOWER_ENGAGEMENT_RATIO),
    nonFollowers:
      point.value === null
        ? null
        : Math.round(point.value * (1 - MOCK_FOLLOWER_ENGAGEMENT_RATIO)),
  }));
}

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
          {new Intl.NumberFormat("pt-BR").format(entry.value)}
          {entry.name ? (
            <span className="ml-1 font-normal text-muted-foreground">{entry.name}</span>
          ) : null}
        </p>
      ))}
    </div>
  );
}

function MetricCardButton({
  config,
  metricValue,
  displayValue,
  selected,
  onSelect,
}: {
  config: MetricConfig;
  metricValue: MetricValue | undefined;
  displayValue: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = config.icon;
  const unavailable = !config.mocked && metricValue?.status === "unavailable";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex flex-col items-start rounded-xl border-2 bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        selected ? ACCENT_BORDER_CLASS[config.accent] : "border-transparent",
      )}
    >
      <span
        className={cn(
          "mb-3 flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
      <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">
        {unavailable ? "Indisponível" : displayValue}
      </p>
    </button>
  );
}

interface MetricsChartsPanelProps {
  overview: OverviewResponse;
  period: AnalyticsPeriodPreset;
}

export function MetricsChartsPanel({
  overview,
  period,
}: MetricsChartsPanelProps): React.JSX.Element {
  const [tab, setTab] = useState<GroupKey>("reach");
  const [selectedMetric, setSelectedMetric] = useState<string>("reach");
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [savesRanking, setSavesRanking] = useState<MediaAnalyticsItem[] | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(false);

  const metric = useMemo(
    () => METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0],
    [selectedMetric],
  );

  function handleTabChange(next: GroupKey) {
    setTab(next);
    const first = METRICS.find((m) => m.group === next);
    if (first) setSelectedMetric(first.key);
  }

  useEffect(() => {
    if (metric.mocked || metric.chartType === "ranking") {
      // Adiado para fora do corpo síncrono do efeito, evitando o disparo de
      // renders em cascata (react-hooks/set-state-in-effect).
      void Promise.resolve().then(() => setTimeseries(null));
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setLoadingChart(true);
    });

    fetch(
      `/api/instagram/analytics/timeseries?period=${period}&metric=${metric.key}`,
      { cache: "no-store" },
    )
      .then((res) => (res.ok ? (res.json() as Promise<TimeseriesResponse>) : null))
      .then((data) => {
        if (!cancelled) setTimeseries(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingChart(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metric.key, metric.mocked, metric.chartType, period]);

  useEffect(() => {
    if (metric.chartType !== "ranking") {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setLoadingRanking(true);
    });

    fetch(
      `/api/instagram/analytics/media?period=${period}&sort=saved&order=desc&page=1&pageSize=5`,
      { cache: "no-store" },
    )
      .then((res) => (res.ok ? (res.json() as Promise<{ items: MediaAnalyticsItem[] }>) : null))
      .then((data) => {
        if (!cancelled) setSavesRanking(data?.items ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingRanking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [metric.chartType, period]);

  const visibleMetrics = METRICS.filter((m) => m.group === tab);

  const engagementRateLabels = timeseries?.points.map((p) => p.label) ?? [];
  const mockedLineData =
    metric.key === "engagement_rate"
      ? mockEngagementRateSeries(
          period,
          engagementRateLabels.length
            ? engagementRateLabels
            : Array.from({ length: period === "7d" ? 7 : 10 }, (_, i) => `${i + 1}`),
        )
      : null;

  const lineData =
    mockedLineData ?? timeseries?.points.map((p) => ({ label: p.label, value: p.value })) ?? [];

  const dualData = timeseries ? splitEngagedAccounts(timeseries.points) : [];

  const currentKpi = overview.kpis.find((k) => k.name === metric.key);
  const chartValue =
    metric.key === "engagement_rate"
      ? `${mockEngagementRateValue(period).toFixed(1).replace(".", ",")}%`
      : formatNumber(currentKpi?.value);

  return (
    <div className="space-y-5">
      <div className="flex w-fit gap-1 rounded-lg border border-border bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="group"
        aria-label="Selecionar métrica"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
      >
        {visibleMetrics.map((config) => {
          const kpi = overview.kpis.find((k) => k.name === config.key);
          const displayValue =
            config.key === "engagement_rate"
              ? `${mockEngagementRateValue(period).toFixed(1).replace(".", ",")}%`
              : formatNumber(kpi?.value);

          return (
            <MetricCardButton
              key={config.key}
              config={config}
              metricValue={kpi}
              displayValue={displayValue}
              selected={config.key === selectedMetric}
              onSelect={() => setSelectedMetric(config.key)}
            />
          );
        })}
      </div>

      <Card className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground",
            )}
          >
            <metric.icon className="size-[18px]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">{metric.label}</p>
            <p className="mt-0.5 font-heading text-xl font-semibold tracking-tight">
              {loadingChart ? "…" : chartValue}
            </p>
          </div>
        </div>

        {metric.chartType === "ranking" ? (
          <SavesRankingList items={savesRanking} loading={loadingRanking} />
        ) : metric.chartType === "dual" ? (
          <div>
            <div className="mb-3 flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-chart-1" />
                Seguidores (estimado)
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-chart-3" />
                Não seguidores (estimado)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dualData} margin={{ left: -8, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={formatNumber} width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
                <Line
                  type="monotone"
                  dataKey="followers"
                  name="Seguidores"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="nonFollowers"
                  name="Não seguidores"
                  stroke="var(--chart-3)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : metric.chartType === "bar" ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={lineData} margin={{ left: -8, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} width={44} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lineData} margin={{ left: -8, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={formatNumber} width={44} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

function SavesRankingList({
  items,
  loading,
}: {
  items: MediaAnalyticsItem[] | null;
  loading: boolean;
}) {
  if (loading && !items) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma publicação com salvamentos no período selecionado.
      </p>
    );
  }

  return (
    <div>
      {items.map((post, index) => (
        <a
          key={post.id}
          href={post.permalink ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 border-t border-border py-2.5 first:border-t-0 hover:bg-muted/50"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <Image
            src={post.thumbnailUrl || "/placeholder.svg"}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {post.caption ?? "Sem legenda"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{post.mediaType}</p>
          </div>
          <div className="min-w-[70px] shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Salvamentos</p>
            <p className="text-sm font-semibold text-chart-3">
              {formatNumber(post.metrics.saved?.value ?? post.metrics.saves?.value)}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
