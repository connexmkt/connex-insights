import { describe, expect, it } from "vitest";
import { UserStatus } from "@/lib/generated/prisma";
import {
  ACTIVATION_PATH,
  resolveActivationRedirect,
} from "@/lib/auth/activation-guard";

describe("activation route guard rules", () => {
  it("blocks dashboard bypass for inactive pre-activation session", () => {
    const redirect = resolveActivationRedirect({
      isAuthenticated: true,
      profileStatus: UserStatus.INACTIVE,
      pathname: "/dashboard/metricas",
    });

    expect(redirect).toBe(ACTIVATION_PATH);
  });

  it("blocks activation page without authentication", () => {
    const redirect = resolveActivationRedirect({
      isAuthenticated: false,
      profileStatus: null,
      pathname: ACTIVATION_PATH,
    });

    expect(redirect).toBe("/");
  });

  it("redirects inactive users away from duplicate login", () => {
    const redirect = resolveActivationRedirect({
      isAuthenticated: true,
      profileStatus: UserStatus.INACTIVE,
      pathname: "/",
    });

    expect(redirect).toBe(ACTIVATION_PATH);
  });

  it("allows active users on protected routes", () => {
    const redirect = resolveActivationRedirect({
      isAuthenticated: true,
      profileStatus: UserStatus.ACTIVE,
      pathname: "/dashboard",
    });

    expect(redirect).toBeNull();
  });
});
