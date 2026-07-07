import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/session";
import { getInstagramConfig } from "@/lib/instagram/config";
import {
  getInstagramProfile,
} from "@/lib/instagram/graph-client";
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
import { InstagramServiceError } from "@/types/instagram";

function redirectToSettings(result: string): NextResponse {
  const config = getInstagramConfig();
  const url = new URL("/dashboard/configuracoes", config.appUrl);
  url.searchParams.set("instagram", result);
  const response = NextResponse.redirect(url);
  response.cookies.delete(INSTAGRAM_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: Request): Promise<Response> {
  getInstagramConfig();

  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get("error");
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");

  if (error === "access_denied") {
    return redirectToSettings("denied");
  }

  if (!state) {
    return redirectToSettings("oauth_state_invalid");
  }

  const cookieStore = await cookies();
  const cookieNonce = cookieStore.get(INSTAGRAM_OAUTH_STATE_COOKIE)?.value;

  let statePayload;

  try {
    statePayload = verifyOAuthState(state, cookieNonce);
  } catch {
    return redirectToSettings("oauth_state_invalid");
  }

  const tenantContext = await getTenantContext();

  if (
    !tenantContext ||
    tenantContext.userId !== statePayload.userId ||
    tenantContext.tenantId !== statePayload.tenantId
  ) {
    return redirectToSettings("oauth_state_invalid");
  }

  if (!code) {
    return redirectToSettings("error");
  }

  try {
    const shortLived = await exchangeCodeForShortLivedToken(code.trim());
    const longLived = await exchangeLongLivedToken(shortLived.access_token);
    const profile = await getInstagramProfile(longLived.access_token);

    const tokenExpiresAt = new Date(Date.now() + longLived.expires_in * 1000);
    const scopesGranted = shortLived.permissions
      ? shortLived.permissions.split(",").map((s) => s.trim())
      : [];

    const { integrationId } = await persistConnection(tenantContext, {
      instagramUserId: shortLived.user_id,
      profile,
      accessToken: longLived.access_token,
      tokenExpiresAt,
      scopesGranted,
    });

    await runSync(integrationId, { timeoutMs: 25_000 });

    return redirectToSettings("connected");
  } catch (err) {
    if (err instanceof InstagramServiceError) {
      switch (err.code) {
        case "UNSUPPORTED_ACCOUNT_TYPE":
          return redirectToSettings("unsupported_account");
        case "ALREADY_CONNECTED":
          return redirectToSettings("already_connected");
        case "ACCOUNT_LINKED_ELSEWHERE":
          return redirectToSettings("account_linked_elsewhere");
        default:
          return redirectToSettings("error");
      }
    }

    return redirectToSettings("error");
  }
}
