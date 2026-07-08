import { requireAuth } from "@/lib/auth/require-auth";
import {
  PRIVATE_DYNAMIC,
  privateJsonResponse,
} from "@/lib/api/private-json-response";
import {
  InstagramIntegrationStatus,
  InstagramSyncStatus,
} from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { runSyncForTenant } from "@/lib/instagram/sync-service";

export const dynamic = PRIVATE_DYNAMIC.dynamic;

export const POST = requireAuth(async (_request, ctx) => {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId: ctx.tenantId },
  });

  if (!integration) {
    return privateJsonResponse(
      {
        error: "Integração Instagram não encontrada.",
        code: "INTEGRATION_NOT_FOUND",
      },
      { status: 404 },
    );
  }

  if (integration.status !== InstagramIntegrationStatus.CONNECTED) {
    return privateJsonResponse(
      {
        error: "Integração não está em estado sincronizável.",
        code: "INTEGRATION_NOT_FOUND",
      },
      { status: 422 },
    );
  }

  if (integration.syncStatus === InstagramSyncStatus.IN_PROGRESS) {
    return privateJsonResponse(
      {
        error: "Sincronização já em andamento.",
        code: "SYNC_IN_PROGRESS",
      },
      { status: 409 },
    );
  }

  try {
    const { jobId } = await runSyncForTenant(ctx.tenantId);

    return privateJsonResponse(
      {
        jobId,
        syncStatus: "IN_PROGRESS" as const,
      },
      { status: 202 },
    );
  } catch {
    return privateJsonResponse(
      {
        error: "Não foi possível iniciar a sincronização.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
});
