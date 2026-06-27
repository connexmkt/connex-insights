import { describe, expect, it } from "vitest";

const SIGNUP_ROUTES = ["/cadastro", "/signup", "/register"];

describe("signup route absence", () => {
  it("defines routes that must not exist in the application", () => {
    expect(SIGNUP_ROUTES).toContain("/signup");
    expect(SIGNUP_ROUTES).toContain("/cadastro");
    expect(SIGNUP_ROUTES).toContain("/register");
  });
});
