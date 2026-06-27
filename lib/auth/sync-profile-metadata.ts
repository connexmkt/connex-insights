import type { UserStatus } from "@/lib/generated/prisma";
import { buildProfileStatusMetadata } from "@/lib/auth/profile-metadata";
import { createAdminClient } from "@/lib/supabase/admin";

export async function syncProfileStatusMetadata(
  userId: string,
  status: UserStatus,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: buildProfileStatusMetadata(status),
  });

  if (error) {
    throw error;
  }
}
