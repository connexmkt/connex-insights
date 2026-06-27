import { NextResponse } from "next/server";
import { getPreActivationContext } from "@/lib/auth/session";
import type { PreActivationContext } from "@/types/auth";

type PreActivationHandler = (
  request: Request,
  context: PreActivationContext,
) => Promise<Response> | Response;

export function requirePreActivation(handler: PreActivationHandler) {
  return async (request: Request): Promise<Response> => {
    const context = await getPreActivationContext();

    if (!context) {
      return NextResponse.json(
        { error: "Sessão expirada.", code: "SESSION_EXPIRED" },
        { status: 401 },
      );
    }

    return handler(request, context);
  };
}
