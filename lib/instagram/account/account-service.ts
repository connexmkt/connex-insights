import { InstagramMetricScope } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import type { GraphFetchStats } from "@/lib/instagram/graph-client";
import { getInstagramProfile } from "@/lib/instagram/graph-client";
import { mapGraphAccountType } from "@/types/instagram";
import { MetaApiError } from "@/types/instagram";

export async function syncAccountProfile(
  integrationId: string,
  accessToken: string,
  stats?: GraphFetchStats,
): Promise<{ followersCount: number | null }> {
  const profile = await getInstagramProfile(accessToken, stats);
  const accountType = mapGraphAccountType(profile.account_type);

  if (!accountType) {
    throw new MetaApiError("Tipo de conta não suportado.", 422);
  }

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
    },
  });

  return { followersCount: profile.followers_count ?? null };
}

export async function snapshotFollowerCount(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  followersCount: number | null | undefined,
): Promise<number> {
  if (followersCount === null || followersCount === undefined) {
    return 0;
  }

  const { insertMetricSnapshots } = await import(
    "@/lib/instagram/insights/snapshot-repository"
  );
  const { Prisma } = await import("@/lib/generated/prisma");

  return insertMetricSnapshots(tenantId, integrationId, syncJobId, [
    {
      scope: InstagramMetricScope.ACCOUNT,
      entityId: "",
      metricName: "follower_count",
      period: "day",
      metricDate: new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate(),
        ),
      ),
      breakdownKey: "",
      value: new Prisma.Decimal(followersCount),
      valueJson: null,
    },
  ]);
}
