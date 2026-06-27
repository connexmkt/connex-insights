import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/redefinir-senha";
  const safeNext = nextPath.startsWith("/") ? nextPath : "/redefinir-senha";

  if (!code) {
    return NextResponse.redirect(new URL("/?error=auth_callback", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/esqueci-senha?error=link_invalido", requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
