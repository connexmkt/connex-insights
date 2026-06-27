import { type NextRequest, NextResponse } from "next/server";
import { UserStatus } from "@/lib/generated/prisma";
import { resolveActivationRedirect } from "@/lib/auth/activation-guard";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const redirectTo = request.nextUrl.searchParams.get("redirectTo");

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const activationRedirect = resolveActivationRedirect({
    isAuthenticated: Boolean(user),
    profileStatus: user?.profileStatus ?? null,
    pathname,
    redirectTo,
  });

  if (activationRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = activationRedirect;
    if (activationRedirect !== "/dashboard") {
      redirectUrl.search = "";
    } else {
      redirectUrl.search = "";
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && pathname === "/ativar-conta") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (
    user &&
    user.profileStatus === UserStatus.SUSPENDED &&
    (isProtectedRoute || pathname === "/ativar-conta")
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/ativar-conta",
    "/esqueci-senha",
    "/redefinir-senha",
    "/auth/callback",
  ],
};
