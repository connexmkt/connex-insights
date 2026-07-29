/**
 * Tipos TypeScript espelhando o contrato OpenAPI definido em
 * connex-crm/specs/003-relatorios-instagram-crm/contracts/instagram-reports-ingestion-api.yaml
 */

export type ReportStatus = "AVAILABLE" | "PARTIAL";

export interface PostPayload {
  instagramMediaId: string;
  permalink?: string | null;
  thumbnailUrl?: string | null;
  contentType?: string | null;
  publishedAt?: string | null;
  primaryMetricName?: string | null;
  primaryMetricValue?: number | null;
  metrics?: Record<string, unknown>;
}

export interface WeeklyReportIngestRequest {
  sourceReportId: string;
  clienteId: string;
  referenceYear: number;
  referenceMonth: number;
  referenceWeek: number;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  status: ReportStatus;
  bestPost?: PostPayload | null;
  worstPost?: PostPayload | null;
}

export interface MonthlyReportIngestRequest {
  sourceReportId: string;
  clienteId: string;
  referenceYear: number;
  referenceMonth: number;
  generatedAt: string;
  status: ReportStatus;
  topPosts?: PostPayload[];
  worstPost?: PostPayload | null;
  followersGained?: number | null;
  followersStart?: number | null;
  followersEnd?: number | null;
  followersGrowthPct?: number | null;
  accountsReached?: number | null;
}

export interface IngestResponse {
  data: {
    id: string;
    action: "created" | "updated";
  };
}

export interface WeekRange {
  weekStart: Date;
  weekEnd: Date;
  year: number;
  month: number;
  week: number;
}

export interface MonthRange {
  monthStart: Date;
  monthEnd: Date;
  year: number;
  month: number;
}
