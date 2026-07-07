import { getInstagramConfig } from "@/lib/instagram/config";
import type {
  LongLivedTokenResponse,
  ShortLivedTokenResponse,
} from "@/types/instagram";
import { MetaApiError } from "@/types/instagram";

const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_TOKEN_URL = "https://graph.instagram.com/access_token";
const REFRESH_TOKEN_URL = "https://graph.instagram.com/refresh_access_token";

export function buildAuthorizationUrl(state: string): string {
  const config = getInstagramConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.oauthScopes.join(","),
    force_reauth: "true",
    state,
  });

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function parseMetaError(response: Response): Promise<never> {
  let message = `Erro na API Meta (${response.status})`;

  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error_message" in body &&
      typeof body.error_message === "string"
    ) {
      message = body.error_message;
    } else if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null &&
      "message" in body.error &&
      typeof body.error.message === "string"
    ) {
      message = body.error.message;
    }
  } catch {
    // Mantém mensagem genérica
  }

  throw new MetaApiError(message, response.status);
}

export async function exchangeCodeForShortLivedToken(
  code: string,
): Promise<ShortLivedTokenResponse> {
  const config = getInstagramConfig();
  const body = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    await parseMetaError(response);
  }

  const json: unknown = await response.json();

  if (
    typeof json === "object" &&
    json !== null &&
    "data" in json &&
    Array.isArray(json.data) &&
    json.data.length > 0
  ) {
    const first = json.data[0];
    if (
      typeof first === "object" &&
      first !== null &&
      "access_token" in first &&
      "user_id" in first &&
      typeof first.access_token === "string" &&
      typeof first.user_id === "string"
    ) {
      return {
        access_token: first.access_token,
        user_id: first.user_id,
        permissions:
          "permissions" in first && typeof first.permissions === "string"
            ? first.permissions
            : undefined,
      };
    }
  }

  if (
    typeof json === "object" &&
    json !== null &&
    "access_token" in json &&
    "user_id" in json &&
    typeof json.access_token === "string" &&
    typeof json.user_id === "string"
  ) {
    return {
      access_token: json.access_token,
      user_id: json.user_id,
    };
  }

  throw new MetaApiError("Resposta inesperada ao trocar code por token.", 500);
}

export async function exchangeLongLivedToken(
  shortLivedToken: string,
): Promise<LongLivedTokenResponse> {
  const config = getInstagramConfig();
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: config.appSecret,
    access_token: shortLivedToken,
  });

  const response = await fetch(`${GRAPH_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    await parseMetaError(response);
  }

  const json: unknown = await response.json();

  if (
    typeof json === "object" &&
    json !== null &&
    "access_token" in json &&
    "expires_in" in json &&
    typeof json.access_token === "string" &&
    typeof json.expires_in === "number"
  ) {
    return {
      access_token: json.access_token,
      token_type:
        "token_type" in json && typeof json.token_type === "string"
          ? json.token_type
          : "bearer",
      expires_in: json.expires_in,
    };
  }

  throw new MetaApiError("Resposta inesperada ao obter long-lived token.", 500);
}

export async function refreshLongLivedToken(
  accessToken: string,
): Promise<LongLivedTokenResponse> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: accessToken,
  });

  const response = await fetch(`${REFRESH_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    await parseMetaError(response);
  }

  const json: unknown = await response.json();

  if (
    typeof json === "object" &&
    json !== null &&
    "access_token" in json &&
    "expires_in" in json &&
    typeof json.access_token === "string" &&
    typeof json.expires_in === "number"
  ) {
    return {
      access_token: json.access_token,
      token_type:
        "token_type" in json && typeof json.token_type === "string"
          ? json.token_type
          : "bearer",
      expires_in: json.expires_in,
    };
  }

  throw new MetaApiError("Resposta inesperada ao renovar token.", 500);
}
