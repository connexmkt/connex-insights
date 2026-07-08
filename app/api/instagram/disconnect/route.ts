import { requireAuth } from "@/lib/auth/require-auth";
import {
  PRIVATE_DYNAMIC,
  privateJsonResponse,
} from "@/lib/api/private-json-response";
import { disconnect } from "@/lib/instagram/integration-service";
import { InstagramServiceError } from "@/types/instagram";

export const dynamic = PRIVATE_DYNAMIC.dynamic;

export const POST = requireAuth(async (_request, ctx) => {
  try {
    await disconnect(ctx);

    return privateJsonResponse({
      success: true,
      status: "DISCONNECTED" as const,
    });
  } catch (error) {
    if (
      error instanceof InstagramServiceError &&
      error.code === "INTEGRATION_NOT_FOUND"
    ) {
      return privateJsonResponse(
        {
          error: error.message,
          code: error.code,
        },
        { status: 404 },
      );
    }

    return privateJsonResponse(
      {
        error: "Não foi possível desconectar a integração.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
});
