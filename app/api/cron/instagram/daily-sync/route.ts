import { NextResponse } from "next/server";
import { getInstagramConfig } from "@/lib/instagram/config";
import { runDailySyncForAllTenants } from "@/lib/instagram/cron/cron-service";

function verifyCronSecret(request: Request): boolean {
  const config = getInstagramConfig();
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${config.cronSecret}`;
}

// A Vercel sempre invoca cron jobs com GET — um handler POST aqui faz todo
// disparo do cron retornar 405 e a sincronização nunca rodar.
export async function GET(request: Request): Promise<Response> {
  getInstagramConfig();

  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Não autorizado.", code: "SESSION_EXPIRED" },
      { status: 401 },
    );
  }

  const result = await runDailySyncForAllTenants();
  return NextResponse.json(result);
}
