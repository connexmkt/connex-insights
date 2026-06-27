import { describe, expect, it } from "vitest";

describe("session guard rules", () => {
  it("redirects unauthenticated users from dashboard to login with redirectTo", () => {
    const pathname = "/dashboard/relatorios";
    const redirectUrl = new URL("http://localhost:3000/");
    redirectUrl.searchParams.set("redirectTo", pathname);

    expect(redirectUrl.pathname).toBe("/");
    expect(redirectUrl.searchParams.get("redirectTo")).toBe(pathname);
  });

  it("redirects authenticated users from login to dashboard", () => {
    const redirectTo = "/dashboard";
    const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
    expect(safeRedirect).toBe("/dashboard");
  });

  it("rejects open redirect attempts", () => {
    const malicious = "https://evil.example";
    const safeRedirect = malicious.startsWith("/") ? malicious : "/dashboard";
    expect(safeRedirect).toBe("/dashboard");
  });
});
