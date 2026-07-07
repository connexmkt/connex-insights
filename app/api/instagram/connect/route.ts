import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getInstagramConfig } from "@/lib/instagram/config";
import { hasConnectedIntegration } from "@/lib/instagram/integration-service";
import { buildAuthorizationUrl } from "@/lib/instagram/oauth";
import {
  INSTAGRAM_OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_MS,
  createOAuthState,
} from "@/lib/instagram/oauth-state";

export const GET = requireAuth(async (_request, ctx) => {
  getInstagramConfig();

  const alreadyConnected = await hasConnectedIntegration(ctx.tenantId);

  if (alreadyConnected) {
    return NextResponse.json(
      {
        error: "Este workspace já possui uma conta Instagram conectada.",
        code: "ALREADY_CONNECTED",
      },
      { status: 409 },
    );
  }

  const { state, cookieValue } = createOAuthState(ctx.tenantId, ctx.userId);
  const authorizationUrl = buildAuthorizationUrl(state);
  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set(INSTAGRAM_OAUTH_STATE_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_MS / 1000,
  });

  return response;
});
