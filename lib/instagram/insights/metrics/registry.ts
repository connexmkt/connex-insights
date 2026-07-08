import { InstagramMetricScope } from "@/lib/generated/prisma";

export interface MetricDefinition {
  name: string;
  period: string;
}

const ACCOUNT_METRICS: MetricDefinition[] = [
  { name: "reach", period: "day" },
  { name: "accounts_engaged", period: "day" },
  { name: "profile_views", period: "day" },
  { name: "total_interactions", period: "day" },
  { name: "likes", period: "day" },
  { name: "comments", period: "day" },
  { name: "shares", period: "day" },
  { name: "saves", period: "day" },
  { name: "follower_count", period: "day" },
];

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
  return ACCOUNT_METRICS;
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
  profile_views: "Visitas ao perfil",
  total_interactions: "Interações totais",
  likes: "Curtidas",
  comments: "Comentários",
  shares: "Compartilhamentos",
  saves: "Salvamentos",
  views: "Visualizações",
  engagement: "Engajamento",
};

export function getMetricLabel(metricName: string): string {
  return KPI_LABELS[metricName] ?? metricName;
}
