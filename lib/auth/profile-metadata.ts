import type { User } from "@supabase/supabase-js";
import type { UserStatus } from "@/lib/generated/prisma";
import { parseProfileStatus } from "@/lib/auth/user-status";

const PROFILE_STATUS_METADATA_KEY = "profile_status";

export function readProfileStatusFromAuthUser(
  user: User,
): UserStatus | null {
  return parseProfileStatus(user.app_metadata[PROFILE_STATUS_METADATA_KEY]);
}

export function buildProfileStatusMetadata(
  status: UserStatus,
): Record<string, UserStatus> {
  return { [PROFILE_STATUS_METADATA_KEY]: status };
}
