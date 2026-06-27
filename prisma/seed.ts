import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/db/prisma";
import { buildProfileStatusMetadata } from "../lib/auth/profile-metadata";
import { UserRole, UserStatus } from "../lib/generated/prisma";
import {
  SEED_INACTIVE_USER,
  SEED_TENANT_A,
  SEED_TENANT_B,
} from "../tests/helpers/seed-fixtures";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function ensureAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  password: string,
  tenantId: string,
  profileStatus: UserStatus,
): Promise<string> {
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers.users.find((user) => user.email === email);

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: {
        tenant_id: tenantId,
        ...buildProfileStatusMetadata(profileStatus),
      },
      email_confirm: true,
    });
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      tenant_id: tenantId,
      ...buildProfileStatusMetadata(profileStatus),
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`Falha ao criar usuário ${email}`);
  }

  return data.user.id;
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  await prisma.tenant.upsert({
    where: { id: SEED_TENANT_A.id },
    update: {
      name: SEED_TENANT_A.name,
      slug: SEED_TENANT_A.slug,
    },
    create: {
      id: SEED_TENANT_A.id,
      name: SEED_TENANT_A.name,
      slug: SEED_TENANT_A.slug,
    },
  });

  await prisma.tenant.upsert({
    where: { id: SEED_TENANT_B.id },
    update: {
      name: SEED_TENANT_B.name,
      slug: SEED_TENANT_B.slug,
    },
    create: {
      id: SEED_TENANT_B.id,
      name: SEED_TENANT_B.name,
      slug: SEED_TENANT_B.slug,
    },
  });

  await prisma.tenant.upsert({
    where: { id: SEED_INACTIVE_USER.tenantId },
    update: {
      name: SEED_INACTIVE_USER.tenantName,
      slug: SEED_INACTIVE_USER.tenantSlug,
    },
    create: {
      id: SEED_INACTIVE_USER.tenantId,
      name: SEED_INACTIVE_USER.tenantName,
      slug: SEED_INACTIVE_USER.tenantSlug,
    },
  });

  const userAId = await ensureAuthUser(
    admin,
    SEED_TENANT_A.userEmail,
    SEED_TENANT_A.userPassword,
    SEED_TENANT_A.id,
    UserStatus.ACTIVE,
  );

  const userBId = await ensureAuthUser(
    admin,
    SEED_TENANT_B.userEmail,
    SEED_TENANT_B.userPassword,
    SEED_TENANT_B.id,
    UserStatus.ACTIVE,
  );

  const inactiveUserId = await ensureAuthUser(
    admin,
    SEED_INACTIVE_USER.userEmail,
    SEED_INACTIVE_USER.temporaryPassword,
    SEED_INACTIVE_USER.tenantId,
    UserStatus.INACTIVE,
  );

  await prisma.profile.upsert({
    where: { id: userAId },
    update: {
      tenantId: SEED_TENANT_A.id,
      displayName: SEED_TENANT_A.displayName,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: userAId,
      tenantId: SEED_TENANT_A.id,
      displayName: SEED_TENANT_A.displayName,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.profile.upsert({
    where: { id: userBId },
    update: {
      tenantId: SEED_TENANT_B.id,
      displayName: SEED_TENANT_B.displayName,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
    },
    create: {
      id: userBId,
      tenantId: SEED_TENANT_B.id,
      displayName: SEED_TENANT_B.displayName,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.profile.upsert({
    where: { id: inactiveUserId },
    update: {
      tenantId: SEED_INACTIVE_USER.tenantId,
      displayName: SEED_INACTIVE_USER.displayName,
      role: UserRole.MEMBER,
      status: UserStatus.INACTIVE,
    },
    create: {
      id: inactiveUserId,
      tenantId: SEED_INACTIVE_USER.tenantId,
      displayName: SEED_INACTIVE_USER.displayName,
      role: UserRole.MEMBER,
      status: UserStatus.INACTIVE,
    },
  });

  console.log("Seed concluído:");
  console.log(`- ${SEED_TENANT_A.userEmail} / ${SEED_TENANT_A.userPassword} (ACTIVE)`);
  console.log(`- ${SEED_TENANT_B.userEmail} / ${SEED_TENANT_B.userPassword} (ACTIVE)`);
  console.log(
    `- ${SEED_INACTIVE_USER.userEmail} / ${SEED_INACTIVE_USER.temporaryPassword} (INACTIVE)`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
