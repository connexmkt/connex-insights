export const SEED_TENANT_A = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Aurora Cosméticos",
  slug: "aurora-cosmeticos",
  userEmail: "marina@auroracosmeticos.com",
  userPassword: "connex2026",
  displayName: "Marina Velloso",
} as const;

export const SEED_TENANT_B = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Beta Industries",
  slug: "beta-industries",
  userEmail: "admin@betaindustries.com",
  userPassword: "connex2026",
  displayName: "Admin Beta",
} as const;

export const SEED_INACTIVE_USER = {
  id: "00000000-0000-4000-8000-000000000003",
  tenantId: "00000000-0000-4000-8000-000000000004",
  tenantName: "Gamma Startup",
  tenantSlug: "gamma-startup",
  userEmail: "novo@gammastartup.com",
  temporaryPassword: "temp2026!",
  newPassword: "novaSenha1",
  displayName: "Novo Usuário",
} as const;
