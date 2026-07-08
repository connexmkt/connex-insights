import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getSyncStatusAnalytics } from "@/lib/instagram/analytics/overview-query";

export const GET = requireAuth(async (_request, ctx) => {
  const data = await getSyncStatusAnalytics(ctx.tenantId);

  if (!data) {
    return NextResponse.json(
      { error: "Integração não encontrada.", code: "INTEGRATION_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
});
