import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { timeseriesQuerySchema } from "@/lib/instagram/analytics/schemas";
import { getTimeseriesAnalytics } from "@/lib/instagram/analytics/timeseries-query";

export const GET = requireAuth(async (request, ctx) => {
  const requestUrl = new URL(request.url);
  const params = Object.fromEntries(requestUrl.searchParams.entries());
  const parsed = timeseriesQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos.", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const data = await getTimeseriesAnalytics(
    ctx.tenantId,
    parsed.data.metric,
    parsed.data.period,
    parsed.data.compare ?? false,
  );

  if (!data) {
    return NextResponse.json(
      { error: "Integração não encontrada.", code: "INTEGRATION_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
});
