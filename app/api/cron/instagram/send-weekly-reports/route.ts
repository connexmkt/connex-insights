import { NextResponse } from "next/server";
import { getInstagramConfig } from "@/lib/instagram/config";
import { sendPendingWeeklyReportsForAllTenantsToCrm } from "@/lib/instagram/reports/weekly-report.service";

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

  const result = await sendPendingWeeklyReportsForAllTenantsToCrm();
  return NextResponse.json(result);
}
