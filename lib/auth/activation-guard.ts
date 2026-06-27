import { UserStatus } from "@/lib/generated/prisma";

export const ACTIVATION_PATH = "/ativar-conta";

export function resolveActivationRedirect(params: {
  isAuthenticated: boolean;
  profileStatus: UserStatus | null;
  pathname: string;
  redirectTo?: string | null;
}): string | null {
  const { isAuthenticated, profileStatus, pathname, redirectTo } = params;

  if (!isAuthenticated) {
    if (pathname === ACTIVATION_PATH) {
      return "/";
    }
    return null;
  }

  if (profileStatus === UserStatus.INACTIVE) {
    if (pathname.startsWith("/dashboard") || pathname === "/") {
      return ACTIVATION_PATH;
    }
    return null;
  }

  if (profileStatus === UserStatus.ACTIVE) {
    if (pathname === ACTIVATION_PATH) {
      return "/dashboard";
    }
    if (pathname === "/") {
      const safeRedirect =
        redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
      return safeRedirect;
    }
  }

  return null;
}
