import { UserRole } from "@/lib/generated/prisma";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.MEMBER]: "Membro",
  [UserRole.TENANT_ADMIN]: "Administrador do workspace",
  [UserRole.PLATFORM_ADMIN]: "Administrador da plataforma",
};

export function formatUserRole(role: UserRole): string {
  return ROLE_LABELS[role];
}
