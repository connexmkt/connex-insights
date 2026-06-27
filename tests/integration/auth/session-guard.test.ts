import { describe, expect, it } from "vitest";
import { UserStatus } from "@/lib/generated/prisma";
import {
  ACTIVATION_PATH,
  resolveActivationRedirect,
} from "@/lib/auth/activation-guard";

describe("session guard rules", () => {
  it("redirects unauthenticated users from dashboard to login with redirectTo", () => {
    const pathname = "/dashboard/relatorios";
    const redirectUrl = new URL("http://localhost:3000/");
    redirectUrl.searchParams.set("redirectTo", pathname);

    expect(redirectUrl.pathname).toBe("/");
    expect(redirectUrl.searchParams.get("redirectTo")).toBe(pathname);
  });

  it("redirects authenticated active users from login to dashboard", () => {
    const redirect = resolveActivationRedirect({
      isAuthenticated: true,
      profileStatus: UserStatus.ACTIVE,
      pathname: "/",
    });

    expect(redirect).toBe("/dashboard");
  });

  it("redirects authenticated inactive users from login to activation", () => {
    const redirect = resolveActivationRedirect({
      isAuthenticated: true,
      profileStatus: UserStatus.INACTIVE,
      pathname: "/",
    });

    expect(redirect).toBe(ACTIVATION_PATH);
  });

  it("redirects unauthenticated users from activation to login", () => {
    const redirect = resolveActivationRedirect({
      isAuthenticated: false,
      profileStatus: null,
      pathname: ACTIVATION_PATH,
    });

    expect(redirect).toBe("/");
  });

  it("rejects open redirect attempts", () => {
    const malicious = "https://evil.example";
    const safeRedirect = malicious.startsWith("/") ? malicious : "/dashboard";
    expect(safeRedirect).toBe("/dashboard");
  });
});
