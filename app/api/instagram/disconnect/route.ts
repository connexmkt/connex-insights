import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { disconnect } from "@/lib/instagram/integration-service";
import { InstagramServiceError } from "@/types/instagram";

export const POST = requireAuth(async (_request, ctx) => {
  try {
    await disconnect(ctx);

    return NextResponse.json({
      success: true,
      status: "DISCONNECTED" as const,
    });
  } catch (error) {
    if (
      error instanceof InstagramServiceError &&
      error.code === "INTEGRATION_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Não foi possível desconectar a integração.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
});
