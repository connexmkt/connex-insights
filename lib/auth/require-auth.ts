import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth/session";
import type { TenantContext } from "@/types/auth";

type AuthenticatedHandler = (
  request: Request,
  context: TenantContext,
) => Promise<Response> | Response;

export function requireAuth(handler: AuthenticatedHandler) {
  return async (request: Request): Promise<Response> => {
    const tenantContext = await getTenantContext();

    if (!tenantContext) {
      return NextResponse.json(
        { error: "Sessão expirada.", code: "SESSION_EXPIRED" },
        { status: 401 },
      );
    }

    return handler(request, tenantContext);
  };
}
