import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  InstagramIntegrationStatus,
  InstagramSyncStatus,
} from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { runSyncForTenant } from "@/lib/instagram/sync-service";
import { InstagramServiceError } from "@/types/instagram";

export const POST = requireAuth(async (_request, ctx) => {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId: ctx.tenantId },
  });

  if (!integration) {
    return NextResponse.json(
      {
        error: "Integração Instagram não encontrada.",
        code: "INTEGRATION_NOT_FOUND",
      },
      { status: 404 },
    );
  }

  if (integration.status !== InstagramIntegrationStatus.CONNECTED) {
    return NextResponse.json(
      {
        error: "Integração não está em estado sincronizável.",
        code: "INTEGRATION_NOT_FOUND",
      },
      { status: 422 },
    );
  }

  if (integration.syncStatus === InstagramSyncStatus.IN_PROGRESS) {
    return NextResponse.json(
      {
        error: "Sincronização já em andamento.",
        code: "SYNC_IN_PROGRESS",
      },
      { status: 409 },
    );
  }

  try {
    const { jobId } = await runSyncForTenant(ctx.tenantId);

    return NextResponse.json(
      {
        jobId,
        syncStatus: "IN_PROGRESS" as const,
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Não foi possível iniciar a sincronização.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
});
