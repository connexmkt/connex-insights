import type { UserRole } from "@/lib/generated/prisma";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
}

export interface TenantContext {
  userId: string;
  tenantId: string;
  email: string;
  displayName: string;
  role: UserRole;
  tenant: TenantSummary;
}

export interface SessionPayload {
  user: AuthUser;
  tenant: TenantSummary;
}

export interface AuthenticatedRequestContext {
  tenantContext: TenantContext;
}
