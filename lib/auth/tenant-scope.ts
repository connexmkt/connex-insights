import { UserRole } from "@/lib/generated/prisma";
import type { TenantContext } from "@/types/auth";

export class ForbiddenError extends Error {
  constructor(message = "Acesso não autorizado.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Validates that a resource belongs to the authenticated user's tenant.
 * tenantId is NEVER accepted from request bodies — always derive from getTenantContext().
 */
export function assertTenantOwnership(
  context: TenantContext,
  resourceTenantId: string,
): void {
  if (context.role === UserRole.PLATFORM_ADMIN) {
    return;
  }

  if (context.tenantId !== resourceTenantId) {
    throw new ForbiddenError();
  }
}
