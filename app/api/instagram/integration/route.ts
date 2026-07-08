import { requireAuth } from "@/lib/auth/require-auth";
import {
  PRIVATE_DYNAMIC,
  privateJsonResponse,
} from "@/lib/api/private-json-response";
import { getPublicIntegration } from "@/lib/instagram/integration-service";
import type { IntegrationResponse } from "@/types/instagram";

export const dynamic = PRIVATE_DYNAMIC.dynamic;

export const GET = requireAuth(async (_request, ctx) => {
  const integration = await getPublicIntegration(ctx.tenantId);

  const response: IntegrationResponse = {
    connected:
      integration !== null &&
      integration.status !== "DISCONNECTED",
    integration,
  };

  return privateJsonResponse(response);
});
