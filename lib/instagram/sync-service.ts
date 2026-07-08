import {
  InstagramIntegrationStatus,
  InstagramSyncJobType,
  InstagramSyncStatus,
} from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { getInstagramConfig } from "@/lib/instagram/config";
import {
  runSynchronization,
  runSynchronizationWithTimeout,
} from "@/lib/instagram/sync/synchronization-service";

export const SYNC_TIMEOUT_MS = 25_000;

async function resolveSyncJobType(
  integrationId: string,
): Promise<InstagramSyncJobType> {
  const snapshotCount = await prisma.instagramMetricSnapshot.count({
    where: { integrationId },
  });

  return snapshotCount === 0
    ? InstagramSyncJobType.INITIAL
    : InstagramSyncJobType.INCREMENTAL;
}

export async function runInitialSync(integrationId: string): Promise<string> {
  return runSynchronization(integrationId, {
    jobType: InstagramSyncJobType.INITIAL,
  });
}

export async function runSync(
  integrationId: string,
  options?: { timeoutMs?: number },
): Promise<{ jobId: string; timedOut: boolean }> {
  return runSynchronizationWithTimeout(integrationId, {
    jobType: InstagramSyncJobType.INITIAL,
    timeoutMs: options?.timeoutMs ?? SYNC_TIMEOUT_MS,
  });
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

  const jobType = await resolveSyncJobType(integration.id);

  const jobId = await runSynchronization(integration.id, {
    jobType,
  });

  return { jobId };
}

export async function runDailySyncForAllTenants(): Promise<{
  processed: number;
  succeeded: number;
  partial: number;
  failed: number;
}> {
  const integrations = await prisma.instagramIntegration.findMany({
    where: {
      status: InstagramIntegrationStatus.CONNECTED,
    },
  });

  let succeeded = 0;
  let partial = 0;
  let failed = 0;

  for (const integration of integrations) {
    try {
      const jobType = await resolveSyncJobType(integration.id);
      const jobId = await runSynchronization(integration.id, {
        jobType,
      });

      const job = await prisma.instagramSyncJob.findUnique({
        where: { id: jobId },
        select: { status: true },
      });

      if (job?.status === "PARTIAL") {
        partial += 1;
      } else {
        succeeded += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    processed: integrations.length,
    succeeded,
    partial,
    failed,
  };
}

export async function runMetricsPurge(): Promise<{ deleted: number }> {
  const config = getInstagramConfig();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.metricRetentionDays);

  const result = await prisma.instagramMetricSnapshot.deleteMany({
    where: {
      collectedAt: { lt: cutoff },
    },
  });

  return { deleted: result.count };
}
