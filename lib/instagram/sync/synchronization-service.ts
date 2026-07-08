import { revalidateTag } from "next/cache";
import {
  InstagramIntegrationStatus,
  InstagramSyncJobStatus,
  InstagramSyncJobType,
  InstagramSyncStatus,
  Prisma,
} from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import {
  snapshotFollowerCount,
  syncAccountProfile,
} from "@/lib/instagram/account/account-service";
import type { GraphFetchStats } from "@/lib/instagram/graph-client";
import { isMetaAuthError } from "@/lib/instagram/graph-client";
import { syncAudienceInsights } from "@/lib/instagram/insights/audience-insights";
import { syncAccountInsights } from "@/lib/instagram/insights/account-insights";
import { syncMediaInsights } from "@/lib/instagram/insights/media-insights";
import { markRequiresReconnection } from "@/lib/instagram/integration-service";
import {
  syncAllMedia,
  syncIncrementalMedia,
} from "@/lib/instagram/media/media-service";
import { getAccessTokenForIntegration } from "@/lib/instagram/token-service";
import { MetaApiError } from "@/types/instagram";

export interface SyncRunOptions {
  jobType?: InstagramSyncJobType;
  timeoutMs?: number;
}

export interface SyncRunResult {
  jobId: string;
  timedOut: boolean;
}

interface PhaseError {
  phase: string;
  error: unknown;
}

async function runPhases(
  integrationId: string,
  jobId: string,
  jobType: InstagramSyncJobType,
): Promise<{
  mediaImported: number;
  metricsImported: number;
  stats: GraphFetchStats;
  phaseErrors: PhaseError[];
}> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    throw new Error("Integração não encontrada.");
  }

  const accessToken = await getAccessTokenForIntegration(integrationId);
  const stats: GraphFetchStats = {
    failedRequests: 0,
    retryCount: 0,
    remainingApiQuota: null,
  };
  const phaseErrors: PhaseError[] = [];
  let mediaImported = 0;
  let metricsImported = 0;
  const isInitial = jobType === InstagramSyncJobType.INITIAL;

  try {
    const profileResult = await syncAccountProfile(
      integrationId,
      accessToken,
      stats,
    );
    metricsImported += await snapshotFollowerCount(
      integration.tenantId,
      integrationId,
      jobId,
      profileResult.followersCount,
    );
  } catch (error) {
    phaseErrors.push({ phase: "account", error });
  }

  try {
    const mediaResult = isInitial
      ? await syncAllMedia(
          integrationId,
          integration.tenantId,
          integration.instagramProfessionalId,
          accessToken,
          stats,
        )
      : await syncIncrementalMedia(
          integrationId,
          integration.tenantId,
          integration.instagramProfessionalId,
          accessToken,
          stats,
        );
    mediaImported = mediaResult.importedCount;
  } catch (error) {
    phaseErrors.push({ phase: "media", error });
  }

  try {
    metricsImported += await syncAccountInsights(
      integration.tenantId,
      integrationId,
      jobId,
      integration.instagramProfessionalId,
      accessToken,
      isInitial,
      stats,
    );
  } catch (error) {
    phaseErrors.push({ phase: "account_insights", error });
  }

  try {
    metricsImported += await syncMediaInsights(
      integration.tenantId,
      integrationId,
      jobId,
      accessToken,
      stats,
    );
  } catch (error) {
    phaseErrors.push({ phase: "media_insights", error });
  }

  try {
    metricsImported += await syncAudienceInsights(
      integration.tenantId,
      integrationId,
      jobId,
      integration.instagramProfessionalId,
      accessToken,
      stats,
    );
  } catch (error) {
    phaseErrors.push({ phase: "audience", error });
  }

  return { mediaImported, metricsImported, stats, phaseErrors };
}

function resolveJobStatus(
  phaseErrors: PhaseError[],
): InstagramSyncJobStatus {
  if (phaseErrors.length === 0) {
    return InstagramSyncJobStatus.SUCCEEDED;
  }

  const authError = phaseErrors.find(
    (item) =>
      item.error instanceof MetaApiError &&
      isMetaAuthError(item.error.statusCode),
  );

  if (authError) {
    return InstagramSyncJobStatus.FAILED;
  }

  return InstagramSyncJobStatus.PARTIAL;
}

export async function runSynchronization(
  integrationId: string,
  options: SyncRunOptions = {},
): Promise<string> {
  const jobType = options.jobType ?? InstagramSyncJobType.INITIAL;
  const startedAt = Date.now();

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
      jobType,
      status: InstagramSyncJobStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  await prisma.instagramIntegration.update({
    where: { id: integrationId },
    data: { syncStatus: InstagramSyncStatus.IN_PROGRESS },
  });

  try {
    const { mediaImported, metricsImported, stats, phaseErrors } =
      await runPhases(integrationId, job.id, jobType);

    const jobStatus = resolveJobStatus(phaseErrors);
    const syncStatus =
      jobStatus === InstagramSyncJobStatus.FAILED
        ? InstagramSyncStatus.FAILED
        : InstagramSyncStatus.COMPLETED;

    await prisma.instagramIntegration.update({
      where: { id: integrationId },
      data: {
        syncStatus,
        lastSyncedAt:
          jobStatus === InstagramSyncJobStatus.FAILED
            ? integration.lastSyncedAt
            : new Date(),
      },
    });

    const firstError = phaseErrors[0]?.error;
    const errorCode =
      firstError instanceof MetaApiError ? "META_API_ERROR" : "INTERNAL_ERROR";
    const errorMessage =
      firstError instanceof Error ? firstError.message : null;

    if (
      firstError instanceof MetaApiError &&
      isMetaAuthError(firstError.statusCode)
    ) {
      await markRequiresReconnection(integrationId);
    }

    await prisma.instagramSyncJob.update({
      where: { id: job.id },
      data: {
        status: jobStatus,
        completedAt: new Date(),
        mediaImportedCount: mediaImported,
        metricsImportedCount: metricsImported,
        failedRequestsCount: stats.failedRequests,
        retryCount: stats.retryCount,
        durationMs: Date.now() - startedAt,
        remainingApiQuota:
          stats.remainingApiQuota === null
            ? undefined
            : (stats.remainingApiQuota as Prisma.InputJsonValue),
        errorCode: phaseErrors.length > 0 ? errorCode : null,
        errorMessage: phaseErrors.length > 0 ? errorMessage : null,
      },
    });

    revalidateTag(`instagram-analytics-${integration.tenantId}`, "max");

    if (jobStatus === InstagramSyncJobStatus.FAILED && firstError) {
      throw firstError;
    }

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
        durationMs: Date.now() - startedAt,
        errorCode,
        errorMessage,
      },
    });

    throw error;
  }
}

export async function runSynchronizationWithTimeout(
  integrationId: string,
  options: SyncRunOptions = {},
): Promise<SyncRunResult> {
  const timeoutMs = options.timeoutMs ?? 25_000;

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("SYNC_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    const jobId = await Promise.race([
      runSynchronization(integrationId, options),
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
