import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getMediaAnalytics } from "@/lib/instagram/analytics/media-query";
import { mediaQuerySchema } from "@/lib/instagram/analytics/schemas";

export const GET = requireAuth(async (request, ctx) => {
  const requestUrl = new URL(request.url);
  const params = Object.fromEntries(requestUrl.searchParams.entries());
  const parsed = mediaQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos.", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const data = await getMediaAnalytics(
    ctx.tenantId,
    parsed.data.period,
    parsed.data.sort,
    parsed.data.order,
    parsed.data.page,
    parsed.data.pageSize,
  );

  if (!data) {
    return NextResponse.json(
      { error: "Integração não encontrada.", code: "INTEGRATION_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
});
