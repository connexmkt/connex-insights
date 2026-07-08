import type { IntegrationPublic } from "@/types/instagram";

export type AnalyticsPeriodPreset = "7d" | "30d" | "90d" | "6m" | "12m";

export type TrendDirection = "up" | "down" | "neutral";

export type MetricStatus = "available" | "unavailable";

export interface DateRange {
  preset: AnalyticsPeriodPreset;
  since: Date;
  until: Date;
}

export interface MetricValue {
  name: string;
  label: string;
  status: MetricStatus;
  value: number | null;
  previousValue?: number | null;
  changePercent?: number | null;
  trend?: TrendDirection | null;
}

export interface TimeseriesPoint {
  date: string;
  label: string;
  value: number | null;
}

export interface SyncStatusResponse {
  syncStatus: string;
  lastSyncedAt: string | null;
  freshnessLabel: string;
  integrationStatus: string;
}

export interface OverviewResponse {
  period: {
    preset: AnalyticsPeriodPreset;
    since: string;
    until: string;
  };
  integration: {
    username: string;
    profilePictureUrl: string | null;
    status: IntegrationPublic["status"];
    displayName: string | null;
  };
  kpis: MetricValue[];
  sync: SyncStatusResponse;
}

export interface TimeseriesResponse {
  metric: string;
  period: AnalyticsPeriodPreset;
  points: TimeseriesPoint[];
  comparePoints?: TimeseriesPoint[] | null;
}

export interface MediaAnalyticsItem {
  id: string;
  externalMediaId: string;
  mediaType: string;
  caption: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  publishedAt: string | null;
  metrics: Record<string, MetricValue>;
}

export interface MediaListResponse {
  items: MediaAnalyticsItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AudienceSegment {
  dimension: string;
  value: string;
  count: number | null;
  percentage: number | null;
}

export interface AudienceResponse {
  available: boolean;
  demographics: Record<string, AudienceSegment[]>;
  onlineFollowers: AudienceSegment[] | null;
}
