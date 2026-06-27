import { describe, expect, it } from "vitest";
import { UserStatus } from "@/lib/generated/prisma";
import {
  ACTIVATION_PATH,
  resolveActivationRedirect,
} from "@/lib/auth/activation-guard";

describe("resolveActivationRedirect", () => {
  it("redirects unauthenticated users away from activation page", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: false,
        profileStatus: null,
        pathname: ACTIVATION_PATH,
      }),
    ).toBe("/");
  });

  it("redirects inactive users from dashboard to activation", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: true,
        profileStatus: UserStatus.INACTIVE,
        pathname: "/dashboard",
      }),
    ).toBe(ACTIVATION_PATH);
  });

  it("redirects inactive users from login to activation", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: true,
        profileStatus: UserStatus.INACTIVE,
        pathname: "/",
      }),
    ).toBe(ACTIVATION_PATH);
  });

  it("redirects active users away from activation page", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: true,
        profileStatus: UserStatus.ACTIVE,
        pathname: ACTIVATION_PATH,
      }),
    ).toBe("/dashboard");
  });

  it("redirects active users from login to dashboard", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: true,
        profileStatus: UserStatus.ACTIVE,
        pathname: "/",
      }),
    ).toBe("/dashboard");
  });

  it("preserves redirectTo for active users on login", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: true,
        profileStatus: UserStatus.ACTIVE,
        pathname: "/",
        redirectTo: "/dashboard/relatorios",
      }),
    ).toBe("/dashboard/relatorios");
  });

  it("rejects open redirect attempts for active users on login", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: true,
        profileStatus: UserStatus.ACTIVE,
        pathname: "/",
        redirectTo: "https://evil.example",
      }),
    ).toBe("/dashboard");
  });

  it("allows inactive users to stay on activation page", () => {
    expect(
      resolveActivationRedirect({
        isAuthenticated: true,
        profileStatus: UserStatus.INACTIVE,
        pathname: ACTIVATION_PATH,
      }),
    ).toBeNull();
  });
});
