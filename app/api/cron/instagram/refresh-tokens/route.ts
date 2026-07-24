import { NextResponse } from "next/server";
import { InstagramIntegrationStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { getInstagramConfig } from "@/lib/instagram/config";
import { markRequiresReconnection } from "@/lib/instagram/integration-service";
import { refreshLongLivedToken } from "@/lib/instagram/oauth";
import { encryptToken, decryptToken } from "@/lib/instagram/token-crypto";
import { isMetaAuthError, MetaApiError } from "@/types/instagram";

const REFRESH_WINDOW_DAYS = 14;
const MIN_TOKEN_AGE_HOURS = 24;

function verifyCronSecret(request: Request): boolean {
  const config = getInstagramConfig();
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${config.cronSecret}`;
}

// A Vercel sempre invoca cron jobs com GET — um handler POST aqui faz todo
// disparo do cron retornar 405 e o refresh de tokens nunca rodar.
export async function GET(request: Request): Promise<Response> {
  getInstagramConfig();

  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Não autorizado.", code: "SESSION_EXPIRED" },
      { status: 401 },
    );
  }

  const now = new Date();
  const refreshThreshold = new Date(
    now.getTime() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const minTokenAge = new Date(
    now.getTime() - MIN_TOKEN_AGE_HOURS * 60 * 60 * 1000,
  );

  const credentials = await prisma.instagramCredential.findMany({
    where: {
      tokenExpiresAt: { lte: refreshThreshold },
      integration: {
        status: InstagramIntegrationStatus.CONNECTED,
      },
    },
    include: {
      integration: true,
    },
  });

  let refreshed = 0;
  let failed = 0;
  let skipped = 0;

  for (const credential of credentials) {
    if (credential.createdAt > minTokenAge) {
      skipped += 1;
      continue;
    }

    try {
      const accessToken = decryptToken(credential.accessTokenEnc);
      const refreshedToken = await refreshLongLivedToken(accessToken);
      const tokenExpiresAt = new Date(
        Date.now() + refreshedToken.expires_in * 1000,
      );

      await prisma.instagramCredential.update({
        where: { id: credential.id },
        data: {
          accessTokenEnc: encryptToken(refreshedToken.access_token),
          tokenExpiresAt,
          lastRefreshedAt: now,
        },
      });

      refreshed += 1;
    } catch (error) {
      failed += 1;

      if (
        error instanceof MetaApiError &&
        isMetaAuthError(error.statusCode)
      ) {
        await markRequiresReconnection(credential.integrationId);
      }
    }
  }

  return NextResponse.json({ refreshed, failed, skipped });
}
