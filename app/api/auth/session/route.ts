import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const GET = requireAuth(async (_request, context) => {
  return NextResponse.json({
    user: {
      id: context.userId,
      email: context.email,
      displayName: context.displayName,
      role: context.role,
    },
    tenant: context.tenant,
  });
});
