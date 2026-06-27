import { UserStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";

export async function getProfileStatusForUser(
  userId: string,
): Promise<UserStatus | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { status: true },
  });

  return profile?.status ?? null;
}
