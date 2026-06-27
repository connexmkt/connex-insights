import { UserStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import type { SessionPayload, TenantContext } from "@/types/auth";

async function buildSessionPayload(
  userId: string,
  email: string,
): Promise<SessionPayload | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });

  if (!profile || profile.status !== UserStatus.ACTIVE) {
    return null;
  }

  return {
    user: {
      id: profile.id,
      email,
      displayName: profile.displayName,
      role: profile.role,
    },
    tenant: {
      id: profile.tenant.id,
      name: profile.tenant.name,
      slug: profile.tenant.slug,
    },
  };
}

export async function getSession(): Promise<SessionPayload | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return buildSessionPayload(user.id, user.email);
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return {
    userId: session.user.id,
    tenantId: session.tenant.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
    tenant: session.tenant,
  };
}
