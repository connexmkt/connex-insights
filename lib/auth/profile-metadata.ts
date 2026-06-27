import type { User } from "@supabase/supabase-js";
import { UserStatus } from "@/lib/generated/prisma";

const PROFILE_STATUS_METADATA_KEY = "profile_status";

export function readProfileStatusFromAuthUser(
  user: User,
): UserStatus | null {
  const status = user.app_metadata[PROFILE_STATUS_METADATA_KEY];

  switch (status) {
    case UserStatus.ACTIVE:
    case UserStatus.INACTIVE:
    case UserStatus.SUSPENDED:
      return status;
    default:
      return null;
  }
}

export function buildProfileStatusMetadata(
  status: UserStatus,
): Record<string, UserStatus> {
  return { [PROFILE_STATUS_METADATA_KEY]: status };
}
