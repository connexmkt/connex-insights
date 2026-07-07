import {
  InstagramIntegrationStatus,
  InstagramSyncJobStatus,
  InstagramSyncJobType,
  InstagramSyncStatus,
} from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  getInstagramMedia,
  getInstagramProfile,
  isMetaAuthError,
} from "@/lib/instagram/graph-client";
import { markRequiresReconnection } from "@/lib/instagram/integration-service";
import { decryptToken } from "@/lib/instagram/token-crypto";
import { mapGraphAccountType } from "@/types/instagram";
import { MetaApiError } from "@/types/instagram";

export const SYNC_TIMEOUT_MS = 25_000;

async function getAccessToken(integrationId: string): Promise<string> {
  const credential = await prisma.instagramCredential.findUnique({
    where: { integrationId },
  });

  if (!credential) {
    throw new Error("Credencial não encontrada.");
  }

  return decryptToken(credential.accessTokenEnc);
}

async function upsertMediaItems(
  tenantId: string,
  integrationId: string,
  items: Array<{
    id: string;
    media_type: string;
    caption?: string;
    permalink?: string;
    thumbnail_url?: string;
    timestamp?: string;
  }>,
): Promise<void> {
  for (const item of items) {
    await prisma.instagramMedia.upsert({
      where: {
        integrationId_externalMediaId: {
          integrationId,
          externalMediaId: item.id,
        },
      },
      create: {
        tenantId,
        integrationId,
        externalMediaId: item.id,
        mediaType: item.media_type,
        caption: item.caption ?? null,
        permalink: item.permalink ?? null,
        thumbnailUrl: item.thumbnail_url ?? null,
        publishedAt: item.timestamp ? new Date(item.timestamp) : null,
      },
      update: {
        mediaType: item.media_type,
        caption: item.caption ?? null,
        permalink: item.permalink ?? null,
        thumbnailUrl: item.thumbnail_url ?? null,
        publishedAt: item.timestamp ? new Date(item.timestamp) : null,
      },
    });
  }
}

async function executeSync(integrationId: string): Promise<string> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    throw new Error("Integração não encontrada.");
  }

  if (integration.status === InstagramIntegrationStatus.DISCONNECTED) {
    throw new Error("Integração desconectada.");
  }

  const job = await prisma.instagramSyncJob.create({
    data: {
      tenantId: integration.tenantId,
      integrationId,
      jobType: InstagramSyncJobType.INITIAL,
      status: InstagramSyncJobStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  await prisma.instagramIntegration.update({
    where: { id: integrationId },
    data: { syncStatus: InstagramSyncStatus.IN_PROGRESS },
  });

  try {
    const accessToken = await getAccessToken(integrationId);
    const profile = await getInstagramProfile(accessToken);
    const accountType = mapGraphAccountType(profile.account_type);

    if (!accountType) {
      throw new MetaApiError("Tipo de conta não suportado.", 422);
    }

    const mediaResponse = await getInstagramMedia(
      profile.user_id,
      accessToken,
    );

    await prisma.instagramIntegration.update({
      where: { id: integrationId },
      data: {
        username: profile.username,
        displayName: profile.name ?? null,
        accountType,
        profilePictureUrl: profile.profile_picture_url ?? null,
        followersCount: profile.followers_count ?? null,
        followsCount: profile.follows_count ?? null,
        mediaCount: profile.media_count ?? null,
        syncStatus: InstagramSyncStatus.COMPLETED,
        lastSyncedAt: new Date(),
      },
    });

    await upsertMediaItems(
      integration.tenantId,
      integrationId,
      mediaResponse.data,
    );

    await prisma.instagramSyncJob.update({
      where: { id: job.id },
      data: {
        status: InstagramSyncJobStatus.SUCCEEDED,
        completedAt: new Date(),
      },
    });

    return job.id;
  } catch (error) {
    const errorCode =
      error instanceof MetaApiError ? "META_API_ERROR" : "INTERNAL_ERROR";
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido.";

    if (error instanceof MetaApiError && isMetaAuthError(error.statusCode)) {
      await markRequiresReconnection(integrationId);
    }

    await prisma.instagramIntegration.update({
      where: { id: integrationId },
      data: { syncStatus: InstagramSyncStatus.FAILED },
    });

    await prisma.instagramSyncJob.update({
      where: { id: job.id },
      data: {
        status: InstagramSyncJobStatus.FAILED,
        completedAt: new Date(),
        errorCode,
        errorMessage,
      },
    });

    throw error;
  }
}

export async function runInitialSync(integrationId: string): Promise<string> {
  return executeSync(integrationId);
}

export async function runSync(
  integrationId: string,
  options?: { timeoutMs?: number },
): Promise<{ jobId: string; timedOut: boolean }> {
  const timeoutMs = options?.timeoutMs ?? SYNC_TIMEOUT_MS;

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("SYNC_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    const jobId = await Promise.race([
      executeSync(integrationId),
      timeoutPromise,
    ]);
    return { jobId, timedOut: false };
  } catch (error) {
    if (error instanceof Error && error.message === "SYNC_TIMEOUT") {
      return { jobId: "", timedOut: true };
    }
    throw error;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function runSyncForTenant(
  tenantId: string,
): Promise<{ jobId: string }> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
  });

  if (!integration) {
    throw new Error("INTEGRATION_NOT_FOUND");
  }

  if (integration.status !== InstagramIntegrationStatus.CONNECTED) {
    throw new Error("INTEGRATION_NOT_SYNCABLE");
  }

  if (integration.syncStatus === InstagramSyncStatus.IN_PROGRESS) {
    throw new Error("SYNC_IN_PROGRESS");
  }

  const jobId = await executeSync(integration.id);
  return { jobId };
}
