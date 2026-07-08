import { NextResponse } from "next/server";

export function privateJsonResponse(
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store, must-revalidate");
  headers.set("Vary", "Cookie");

  return NextResponse.json(body, { ...init, headers });
}
