import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/") {
    const redirectTo =
      request.nextUrl.searchParams.get("redirectTo") ?? "/dashboard";
    const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = safeRedirect;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/esqueci-senha",
    "/redefinir-senha",
    "/auth/callback",
  ],
};
