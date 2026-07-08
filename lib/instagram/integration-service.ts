import {
  InstagramIntegrationStatus,
  Prisma,
} from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { encryptToken } from "@/lib/instagram/token-crypto";
import type { TenantContext } from "@/types/auth";
import type { IntegrationPublic } from "@/types/instagram";
import { InstagramServiceError } from "@/types/instagram";
import { mapGraphAccountType } from "@/types/instagram";
import type { InstagramGraphProfile } from "@/types/instagram";
import { mapIntegrationUniqueViolation } from "@/lib/instagram/integration-unique-violation";

export interface PersistConnectionInput {
  instagramUserId: string;
  profile: InstagramGraphProfile;
  accessToken: string;
  tokenExpiresAt: Date;
  scopesGranted: string[];
}

function toIntegrationPublic(integration: {
  id: string;
  username: string;
  displayName: string | null;
  accountType: IntegrationPublic["accountType"];
  profilePictureUrl: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
  status: IntegrationPublic["status"];
  syncStatus: IntegrationPublic["syncStatus"];
  lastSyncedAt: Date | null;
  connectedAt: Date | null;
}): IntegrationPublic {
  return {
    id: integration.id,
    username: integration.username,
    displayName: integration.displayName,
    accountType: integration.accountType,
    profilePictureUrl: integration.profilePictureUrl,
    followersCount: integration.followersCount,
    followsCount: integration.followsCount,
    mediaCount: integration.mediaCount,
    status: integration.status,
    syncStatus: integration.syncStatus,
    lastSyncedAt: integration.lastSyncedAt?.toISOString() ?? null,
    connectedAt: integration.connectedAt?.toISOString() ?? null,
  };
}

export async function getIntegrationByTenant(tenantId: string) {
  return prisma.instagramIntegration.findUnique({
    where: { tenantId },
    include: { credential: true },
  });
}

export async function getPublicIntegration(
  tenantId: string,
): Promise<IntegrationPublic | null> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
  });

  if (
    !integration ||
    integration.status === InstagramIntegrationStatus.DISCONNECTED
  ) {
    return null;
  }

  return toIntegrationPublic(integration);
}

export async function hasConnectedIntegration(tenantId: string): Promise<boolean> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId },
    select: { status: true },
  });

  return integration?.status === InstagramIntegrationStatus.CONNECTED;
}

export async function persistConnection(
  ctx: TenantContext,
  input: PersistConnectionInput,
): Promise<{ integrationId: string }> {
  const accountType = mapGraphAccountType(input.profile.account_type);

  if (!accountType) {
    throw new InstagramServiceError(
      `Apenas contas Instagram Business ou Creator são suportadas (account_type recebido: "${input.profile.account_type}").`,
      "UNSUPPORTED_ACCOUNT_TYPE",
      422,
    );
  }

  const existingByTenant = await prisma.instagramIntegration.findUnique({
    where: { tenantId: ctx.tenantId },
  });

  if (
    existingByTenant &&
    existingByTenant.status === InstagramIntegrationStatus.CONNECTED
  ) {
    throw new InstagramServiceError(
      "Este workspace já possui uma conta Instagram conectada.",
      "ALREADY_CONNECTED",
      409,
    );
  }

  const existingByProfessional = await prisma.instagramIntegration.findUnique({
    where: {
      instagramProfessionalId: input.profile.user_id,
    },
  });

  if (
    existingByProfessional &&
    existingByProfessional.tenantId !== ctx.tenantId &&
    existingByProfessional.status !== InstagramIntegrationStatus.DISCONNECTED
  ) {
    throw new InstagramServiceError(
      "Esta conta Instagram já está vinculada a outro workspace.",
      "ACCOUNT_LINKED_ELSEWHERE",
      409,
    );
  }

  const staleDisconnectedElsewhere =
    existingByProfessional &&
    existingByProfessional.tenantId !== ctx.tenantId &&
    existingByProfessional.status === InstagramIntegrationStatus.DISCONNECTED
      ? existingByProfessional.id
      : null;

  const encryptedToken = encryptToken(input.accessToken);
  const now = new Date();

  try {
    const integration = await prisma.$transaction(async (tx) => {
      if (staleDisconnectedElsewhere) {
        await tx.instagramIntegration.delete({
          where: { id: staleDisconnectedElsewhere },
        });
      }

      const integrationData = {
        instagramUserId: input.instagramUserId,
        instagramProfessionalId: input.profile.user_id,
        username: input.profile.username,
        displayName: input.profile.name ?? null,
        accountType,
        profilePictureUrl: input.profile.profile_picture_url ?? null,
        followersCount: input.profile.followers_count ?? null,
        followsCount: input.profile.follows_count ?? null,
        mediaCount: input.profile.media_count ?? null,
        status: InstagramIntegrationStatus.CONNECTED,
        syncStatus: "PENDING" as const,
        connectedAt: now,
        disconnectedAt: null,
        connectedByUserId: ctx.userId,
      };

      const record = existingByTenant
        ? await tx.instagramIntegration.update({
            where: { id: existingByTenant.id },
            data: integrationData,
          })
        : await tx.instagramIntegration.create({
            data: {
              ...integrationData,
              tenantId: ctx.tenantId,
            },
          });

      await tx.instagramCredential.upsert({
        where: { integrationId: record.id },
        create: {
          integrationId: record.id,
          tenantId: ctx.tenantId,
          accessTokenEnc: encryptedToken,
          tokenExpiresAt: input.tokenExpiresAt,
          scopesGranted: input.scopesGranted,
        },
        update: {
          accessTokenEnc: encryptedToken,
          tokenExpiresAt: input.tokenExpiresAt,
          scopesGranted: input.scopesGranted,
          lastRefreshedAt: null,
        },
      });

      return record;
    });

    return { integrationId: integration.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const violation = mapIntegrationUniqueViolation(error.meta?.target);

      if (violation === "ACCOUNT_LINKED_ELSEWHERE") {
        throw new InstagramServiceError(
          "Esta conta Instagram já está vinculada a outro workspace.",
          "ACCOUNT_LINKED_ELSEWHERE",
          409,
        );
      }

      throw new InstagramServiceError(
        "Este workspace já possui uma conta Instagram conectada.",
        "ALREADY_CONNECTED",
        409,
      );
    }

    throw error;
  }
}

export async function markRequiresReconnection(
  integrationId: string,
): Promise<void> {
  await prisma.instagramIntegration.update({
    where: { id: integrationId },
    data: {
      status: InstagramIntegrationStatus.REQUIRES_RECONNECTION,
    },
  });
}

export async function disconnect(ctx: TenantContext): Promise<void> {
  const integration = await prisma.instagramIntegration.findUnique({
    where: { tenantId: ctx.tenantId },
  });

  if (!integration) {
    throw new InstagramServiceError(
      "Integração Instagram não encontrada.",
      "INTEGRATION_NOT_FOUND",
      404,
    );
  }

  await prisma.instagramIntegration.update({
    where: { id: integration.id },
    data: {
      status: InstagramIntegrationStatus.DISCONNECTED,
      disconnectedAt: new Date(),
    },
  });
}

export { toIntegrationPublic };
