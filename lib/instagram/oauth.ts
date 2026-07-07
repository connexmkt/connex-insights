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

/**
 * Monta a URL de autorização do Business Login for Instagram.
 * Deve usar o **Instagram App ID** (não o App ID geral do Facebook).
 * Dashboard: Instagram → API setup with Instagram login → Business login settings.
 *
 * @see https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login-for-instagram
 */
export function buildAuthorizationUrl(state: string): string {
  const config = getInstagramConfig();
  const params = new URLSearchParams({
    force_reauth: "true",
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.oauthScopes.join(","),
    state,
  });

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** Meta pode anexar `#_` ao code no redirect — não faz parte do valor. */
export function sanitizeOAuthCode(code: string): string {
  return code.replace(/#_$/, "").trim();
}

function coerceUserId(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function parsePermissions(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const scopes = value.filter((item): item is string => typeof item === "string");
    return scopes.length > 0 ? scopes.join(",") : undefined;
  }

  return undefined;
}

function describeTokenResponseShape(json: unknown): string {
  if (typeof json !== "object" || json === null) {
    return `tipo=${typeof json}`;
  }

  const topLevelKeys = Object.keys(json);

  if ("error_message" in json && typeof json.error_message === "string") {
    return `erro_meta=${json.error_message}`;
  }

  if ("data" in json && Array.isArray(json.data)) {
    const first = json.data[0];
    if (typeof first === "object" && first !== null) {
      return `data[0]_keys=${Object.keys(first).join(",")}`;
    }

    return "data=vazio";
  }

  return `keys=${topLevelKeys.join(",")}`;
}

function parseShortLivedTokenJson(
  json: unknown,
): ShortLivedTokenResponse | null {
  if (typeof json !== "object" || json === null) {
    return null;
  }

  if ("error_type" in json || "error_message" in json) {
    return null;
  }

  if ("data" in json && Array.isArray(json.data) && json.data.length > 0) {
    const first = json.data[0];

    if (
      typeof first === "object" &&
      first !== null &&
      "access_token" in first &&
      typeof first.access_token === "string"
    ) {
      const userId = coerceUserId(
        "user_id" in first ? first.user_id : "id" in first ? first.id : null,
      );

      if (userId) {
        return {
          access_token: first.access_token,
          user_id: userId,
          permissions:
            "permissions" in first
              ? parsePermissions(first.permissions)
              : undefined,
        };
      }
    }
  }

  if (
    "access_token" in json &&
    typeof json.access_token === "string"
  ) {
    const userId = coerceUserId(
      "user_id" in json ? json.user_id : "id" in json ? json.id : null,
    );

    if (userId) {
      return {
        access_token: json.access_token,
        user_id: userId,
        permissions:
          "permissions" in json ? parsePermissions(json.permissions) : undefined,
      };
    }
  }

  return null;
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
  const sanitizedCode = sanitizeOAuthCode(code);

  // Meta documenta POST com multipart/form-data (-F); usar FormData garante compatibilidade.
  const body = new FormData();
  body.append("client_id", config.appId);
  body.append("client_secret", config.appSecret);
  body.append("grant_type", "authorization_code");
  body.append("redirect_uri", config.redirectUri);
  body.append("code", sanitizedCode);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    await parseMetaError(response);
  }

  const json: unknown = await response.json();

  if (
    typeof json === "object" &&
    json !== null &&
    "error_message" in json &&
    typeof json.error_message === "string"
  ) {
    throw new MetaApiError(json.error_message, response.status || 400);
  }

  const parsed = parseShortLivedTokenJson(json);

  if (parsed) {
    return parsed;
  }

  throw new MetaApiError(
    `Resposta inesperada ao trocar code por token (${describeTokenResponseShape(json)}).`,
    500,
  );
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
