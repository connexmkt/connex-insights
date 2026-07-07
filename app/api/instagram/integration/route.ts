import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getPublicIntegration } from "@/lib/instagram/integration-service";
import type { IntegrationResponse } from "@/types/instagram";

export const GET = requireAuth(async (_request, ctx) => {
  const integration = await getPublicIntegration(ctx.tenantId);

  const response: IntegrationResponse = {
    connected:
      integration !== null &&
      integration.status !== "DISCONNECTED",
    integration,
  };

  return NextResponse.json(response);
});
