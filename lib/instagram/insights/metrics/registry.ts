import { InstagramMetricScope } from "@/lib/generated/prisma";

export type InsightMetricType = "time_series" | "total_value";
export type MetricAggregation = "sum" | "latest";

export interface MetricDefinition {
  name: string;
  period: string;
  metricType: InsightMetricType;
  breakdown?: string;
  aggregation: MetricAggregation;
}

const ACCOUNT_INSIGHT_METRICS: MetricDefinition[] = [
  {
    name: "reach",
    period: "day",
    metricType: "time_series",
    aggregation: "sum",
  },
  {
    name: "accounts_engaged",
    period: "day",
    metricType: "total_value",
    aggregation: "latest",
  },
  {
    name: "profile_links_taps",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "total_interactions",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "likes",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "comments",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "shares",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "saves",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "views",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "replies",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
  {
    name: "reposts",
    period: "day",
    metricType: "total_value",
    aggregation: "sum",
  },
];

export const OVERVIEW_KPI_METRICS = [
  "follower_count",
  "reach",
  "accounts_engaged",
  "profile_links_taps",
  "total_interactions",
  "likes",
  "comments",
  "shares",
  "saves",
  "views",
] as const;

const MEDIA_METRICS_BY_TYPE: Record<string, string[]> = {
  IMAGE: ["reach", "saved", "likes", "comments", "shares", "total_interactions"],
  VIDEO: [
    "reach",
    "saved",
    "likes",
    "comments",
    "shares",
    "total_interactions",
    "views",
  ],
  CAROUSEL_ALBUM: [
    "reach",
    "saved",
    "likes",
    "comments",
    "shares",
    "total_interactions",
  ],
  REELS: [
    "reach",
    "saved",
    "likes",
    "comments",
    "shares",
    "total_interactions",
    "views",
  ],
};

const DEFAULT_MEDIA_METRICS = [
  "reach",
  "saved",
  "likes",
  "comments",
  "shares",
  "total_interactions",
];

export function getAccountMetricDefinitions(): MetricDefinition[] {
  return ACCOUNT_INSIGHT_METRICS;
}

export function getMetricDefinition(
  metricName: string,
): MetricDefinition | undefined {
  return ACCOUNT_INSIGHT_METRICS.find((metric) => metric.name === metricName);
}

export function getMetricAggregation(metricName: string): MetricAggregation {
  if (metricName === "follower_count" || metricName === "accounts_engaged") {
    return "latest";
  }

  return getMetricDefinition(metricName)?.aggregation ?? "sum";
}

const MEDIA_FALLBACK_METRICS = new Set([
  "total_interactions",
  "likes",
  "comments",
  "shares",
  "saves",
  "views",
]);

export function supportsMediaFallback(metricName: string): boolean {
  return MEDIA_FALLBACK_METRICS.has(metricName);
}

export function toMediaMetricName(metricName: string): string {
  if (metricName === "saves") {
    return "saved";
  }
  return metricName;
}

export function getMediaMetricsForType(mediaType: string): string[] {
  const normalized = mediaType.toUpperCase();
  return MEDIA_METRICS_BY_TYPE[normalized] ?? DEFAULT_MEDIA_METRICS;
}

export function getAudienceMetricDefinitions(): Array<{
  name: string;
  breakdown?: string;
}> {
  return [
    { name: "follower_demographics", breakdown: "age,gender,country,city" },
    { name: "online_followers" },
  ];
}

export function scopeForMetric(metricName: string): InstagramMetricScope {
  if (metricName === "follower_demographics" || metricName === "online_followers") {
    return InstagramMetricScope.AUDIENCE;
  }
  return InstagramMetricScope.ACCOUNT;
}

export const KPI_LABELS: Record<string, string> = {
  follower_count: "Seguidores",
  reach: "Alcance",
  accounts_engaged: "Contas engajadas",
  profile_links_taps: "Toques no perfil",
  total_interactions: "Interações totais",
  likes: "Curtidas",
  comments: "Comentários",
  shares: "Compartilhamentos",
  saves: "Salvamentos",
  saved: "Salvamentos",
  views: "Visualizações",
  replies: "Respostas",
  reposts: "Reposts",
  engagement: "Engajamento",
};

export function getMetricLabel(metricName: string): string {
  return KPI_LABELS[metricName] ?? metricName;
}
