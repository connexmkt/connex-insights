/** Constantes leves para uso em Edge Middleware (sem dependência do Prisma). */
export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export type ProfileStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

const PROFILE_STATUS_VALUES = new Set<string>(Object.values(USER_STATUS));

export function parseProfileStatus(value: unknown): ProfileStatus | null {
  if (typeof value !== "string" || !PROFILE_STATUS_VALUES.has(value)) {
    return null;
  }
  return value as ProfileStatus;
}
