import { getInstagramConfig } from "@/lib/instagram/config";
import type {
  InstagramGraphInsightsResponse,
  InstagramGraphMediaResponse,
  InstagramGraphProfile,
} from "@/types/instagram";
import { MetaApiError, isMetaAuthError } from "@/types/instagram";

const GRAPH_BASE = "https://graph.instagram.com/v25.0";

const PROFILE_FIELDS =
  "user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count";

const MEDIA_FIELDS =
  "id,media_type,caption,permalink,media_url,thumbnail_url,timestamp";

export interface GraphFetchStats {
  failedRequests: number;
  retryCount: number;
  remainingApiQuota: Record<string, unknown> | null;
}

async function parseGraphError(response: Response): Promise<never> {
  let message = `Erro na Graph API (${response.status})`;
  let metaErrorCode: number | undefined;

  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null
    ) {
      if ("message" in body.error && typeof body.error.message === "string") {
        message = body.error.message;
      }
      if ("code" in body.error && typeof body.error.code === "number") {
        metaErrorCode = body.error.code;
      }
    }
  } catch {
    // Mantém mensagem genérica
  }

  throw new MetaApiError(message, response.status, metaErrorCode);
}

function extractQuotaHeaders(response: Response): Record<string, unknown> | null {
  const usage = response.headers.get("x-app-usage");
  const businessUsage = response.headers.get("x-business-use-case-usage");

  if (!usage && !businessUsage) {
    return null;
  }

  const quota: Record<string, unknown> = {};
  if (usage) {
    try {
      quota.appUsage = JSON.parse(usage) as unknown;
    } catch {
      quota.appUsage = usage;
    }
  }
  if (businessUsage) {
    try {
      quota.businessUseCaseUsage = JSON.parse(businessUsage) as unknown;
    } catch {
      quota.businessUseCaseUsage = businessUsage;
    }
  }
  return quota;
}

async function fetchWithRetry(
  url: string,
  stats?: GraphFetchStats,
): Promise<Response> {
  const config = getInstagramConfig();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.syncMaxRetries; attempt += 1) {
    if (attempt > 0 && stats) {
      stats.retryCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }

    const response = await fetch(url);

    if (response.ok) {
      if (stats) {
        stats.remainingApiQuota = extractQuotaHeaders(response);
      }
      return response;
    }

    if (response.status === 429 && attempt < config.syncMaxRetries) {
      lastError = new MetaApiError("Rate limit atingido.", 429);
      continue;
    }

    await parseGraphError(response);
  }

  if (stats) {
    stats.failedRequests += 1;
  }

  throw lastError ?? new MetaApiError("Falha na Graph API.", 500);
}

export async function getInstagramProfile(
  accessToken: string,
  stats?: GraphFetchStats,
): Promise<InstagramGraphProfile> {
  const params = new URLSearchParams({
    fields: PROFILE_FIELDS,
    access_token: accessToken,
  });

  const response = await fetchWithRetry(
    `${GRAPH_BASE}/me?${params.toString()}`,
    stats,
  );

  const json: unknown = await response.json();

  if (
    typeof json !== "object" ||
    json === null ||
    !("user_id" in json) ||
    !("username" in json) ||
    !("account_type" in json) ||
    typeof json.user_id !== "string" ||
    typeof json.username !== "string" ||
    typeof json.account_type !== "string"
  ) {
    throw new MetaApiError("Resposta de perfil inválida.", 500);
  }

  return json as InstagramGraphProfile;
}

export async function getInstagramMediaPage(
  professionalUserId: string,
  accessToken: string,
  after?: string | null,
  stats?: GraphFetchStats,
): Promise<InstagramGraphMediaResponse> {
  const params = new URLSearchParams({
    fields: MEDIA_FIELDS,
    access_token: accessToken,
    limit: "50",
  });

  if (after) {
    params.set("after", after);
  }

  const response = await fetchWithRetry(
    `${GRAPH_BASE}/${professionalUserId}/media?${params.toString()}`,
    stats,
  );

  const json: unknown = await response.json();

  if (
    typeof json !== "object" ||
    json === null ||
    !("data" in json) ||
    !Array.isArray(json.data)
  ) {
    throw new MetaApiError("Resposta de mídia inválida.", 500);
  }

  return json as InstagramGraphMediaResponse;
}

export async function getInstagramMedia(
  professionalUserId: string,
  accessToken: string,
): Promise<InstagramGraphMediaResponse> {
  return getInstagramMediaPage(professionalUserId, accessToken);
}

export async function getAccountInsights(
  professionalUserId: string,
  accessToken: string,
  options: {
    metric: string;
    period: string;
    since?: number;
    until?: number;
  },
  stats?: GraphFetchStats,
): Promise<InstagramGraphInsightsResponse> {
  const params = new URLSearchParams({
    metric: options.metric,
    period: options.period,
    access_token: accessToken,
  });

  if (options.since !== undefined) {
    params.set("since", String(options.since));
  }
  if (options.until !== undefined) {
    params.set("until", String(options.until));
  }

  const response = await fetchWithRetry(
    `${GRAPH_BASE}/${professionalUserId}/insights?${params.toString()}`,
    stats,
  );

  const json: unknown = await response.json();

  if (
    typeof json !== "object" ||
    json === null ||
    !("data" in json) ||
    !Array.isArray(json.data)
  ) {
    throw new MetaApiError("Resposta de insights inválida.", 500);
  }

  return json as InstagramGraphInsightsResponse;
}

export async function getMediaInsights(
  mediaId: string,
  accessToken: string,
  metrics: string[],
  stats?: GraphFetchStats,
): Promise<InstagramGraphInsightsResponse> {
  const params = new URLSearchParams({
    metric: metrics.join(","),
    access_token: accessToken,
  });

  const response = await fetchWithRetry(
    `${GRAPH_BASE}/${mediaId}/insights?${params.toString()}`,
    stats,
  );

  const json: unknown = await response.json();

  if (
    typeof json !== "object" ||
    json === null ||
    !("data" in json) ||
    !Array.isArray(json.data)
  ) {
    throw new MetaApiError("Resposta de insights de mídia inválida.", 500);
  }

  return json as InstagramGraphInsightsResponse;
}

export async function getAudienceInsights(
  professionalUserId: string,
  accessToken: string,
  options: {
    metric: string;
    breakdown?: string;
  },
  stats?: GraphFetchStats,
): Promise<InstagramGraphInsightsResponse> {
  const params = new URLSearchParams({
    metric: options.metric,
    period: "lifetime",
    metric_type: "total_value",
    access_token: accessToken,
  });

  if (options.breakdown) {
    params.set("breakdown", options.breakdown);
  }

  const response = await fetchWithRetry(
    `${GRAPH_BASE}/${professionalUserId}/insights?${params.toString()}`,
    stats,
  );

  const json: unknown = await response.json();

  if (
    typeof json !== "object" ||
    json === null ||
    !("data" in json) ||
    !Array.isArray(json.data)
  ) {
    throw new MetaApiError("Resposta de audiência inválida.", 500);
  }

  return json as InstagramGraphInsightsResponse;
}

export { isMetaAuthError, MetaApiError };
