import { NextResponse } from "next/server";
import { getInstagramConfig } from "@/lib/instagram/config";
import { generateMonthlyReportsForAllTenants } from "@/lib/instagram/reports/monthly-report.service";

function verifyCronSecret(request: Request): boolean {
  const config = getInstagramConfig();
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${config.cronSecret}`;
}

export async function GET(request: Request): Promise<Response> {
  getInstagramConfig();

  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Não autorizado.", code: "SESSION_EXPIRED" },
      { status: 401 },
    );
  }

  const today = new Date();
  if (today.getUTCDate() > 7) {
    return NextResponse.json({ skipped: true, reason: "not-first-week" });
  }

  const result = await generateMonthlyReportsForAllTenants();
  return NextResponse.json(result);
}
