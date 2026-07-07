import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/session";
import {
  type InstagramCallbackResult,
  mapCallbackError,
} from "@/lib/instagram/callback-errors";
import { getInstagramConfig } from "@/lib/instagram/config";
import { getInstagramProfile } from "@/lib/instagram/graph-client";
import { persistConnection } from "@/lib/instagram/integration-service";
import {
  exchangeCodeForShortLivedToken,
  exchangeLongLivedToken,
} from "@/lib/instagram/oauth";
import {
  INSTAGRAM_OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "@/lib/instagram/oauth-state";
import { runSync } from "@/lib/instagram/sync-service";

function redirectToSettings(
  result: InstagramCallbackResult,
  detail?: string,
): NextResponse {
  const config = getInstagramConfig();
  const url = new URL("/dashboard/configuracoes", config.appUrl);
  url.searchParams.set("instagram", result);

  if (detail) {
    url.searchParams.set("instagram_detail", detail);
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: Request): Promise<Response> {
  try {
    getInstagramConfig();
  } catch (error) {
    const mapped = mapCallbackError("config", error);
    return redirectToSettings(mapped.result, mapped.detail);
  }

  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get("error");
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");

  if (error === "access_denied") {
    return redirectToSettings("denied");
  }

  if (!state) {
    return redirectToSettings(
      "oauth_state_invalid",
      "Parâmetro state ausente no retorno da Meta.",
    );
  }

  const cookieStore = await cookies();
  const cookieNonce = cookieStore.get(INSTAGRAM_OAUTH_STATE_COOKIE)?.value;

  let statePayload;

  try {
    statePayload = verifyOAuthState(state, cookieNonce);
  } catch (error) {
    const mapped = mapCallbackError("state", error);
    return redirectToSettings("oauth_state_invalid", mapped.detail);
  }

  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    return redirectToSettings(
      "session_lost",
      "Sessão do Connex expirou durante o OAuth. Faça login e tente novamente.",
    );
  }

  if (
    tenantContext.userId !== statePayload.userId ||
    tenantContext.tenantId !== statePayload.tenantId
  ) {
    return redirectToSettings(
      "session_lost",
      "Usuário ou workspace não correspondem à sessão que iniciou a conexão.",
    );
  }

  if (!code) {
    return redirectToSettings(
      "missing_code",
      "A Meta não retornou o código de autorização. Tente conectar novamente.",
    );
  }

  let shortLived;

  try {
    shortLived = await exchangeCodeForShortLivedToken(code.trim());
  } catch (error) {
    const mapped = mapCallbackError("token_exchange", error);
    return redirectToSettings(mapped.result, mapped.detail);
  }

  let longLived;

  try {
    longLived = await exchangeLongLivedToken(shortLived.access_token);
  } catch (error) {
    const mapped = mapCallbackError("long_lived_token", error);
    return redirectToSettings(mapped.result, mapped.detail);
  }

  let profile;

  try {
    profile = await getInstagramProfile(longLived.access_token);
  } catch (error) {
    const mapped = mapCallbackError("profile_fetch", error);
    return redirectToSettings(mapped.result, mapped.detail);
  }

  const tokenExpiresAt = new Date(Date.now() + longLived.expires_in * 1000);
  const scopesGranted = shortLived.permissions
    ? shortLived.permissions.split(",").map((s) => s.trim())
    : [];

  let integrationId: string;

  try {
    const persisted = await persistConnection(tenantContext, {
      instagramUserId: shortLived.user_id,
      profile,
      accessToken: longLived.access_token,
      tokenExpiresAt,
      scopesGranted,
    });
    integrationId = persisted.integrationId;
  } catch (error) {
    const mapped = mapCallbackError("persist", error);
    return redirectToSettings(mapped.result, mapped.detail);
  }

  try {
    const syncResult = await runSync(integrationId, { timeoutMs: 25_000 });

    if (syncResult.timedOut) {
      return redirectToSettings(
        "connected_sync_pending",
        "Conexão concluída. A sincronização continua em segundo plano.",
      );
    }

    return redirectToSettings("connected");
  } catch (error) {
    const mapped = mapCallbackError("sync", error);
    return redirectToSettings(mapped.result, mapped.detail);
  }
}
