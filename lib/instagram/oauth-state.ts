import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getInstagramConfig } from "@/lib/instagram/config";
import type { OAuthStatePayload } from "@/types/instagram";

export const INSTAGRAM_OAUTH_STATE_COOKIE = "instagram_oauth_state";
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function signPayload(payloadBase64: string): string {
  const { oauthStateSecret } = getInstagramConfig();
  return createHmac("sha256", oauthStateSecret)
    .update(payloadBase64)
    .digest("base64url");
}

function encodePayload(payload: OAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(payloadBase64: string): OAuthStatePayload {
  const parsed: unknown = JSON.parse(
    Buffer.from(payloadBase64, "base64url").toString("utf8"),
  );

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("tenantId" in parsed) ||
    !("userId" in parsed) ||
    !("nonce" in parsed) ||
    !("exp" in parsed)
  ) {
    throw new Error("Payload OAuth inválido.");
  }

  const payload = parsed as OAuthStatePayload;

  if (
    typeof payload.tenantId !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.exp !== "number"
  ) {
    throw new Error("Payload OAuth inválido.");
  }

  return payload;
}

export function createOAuthState(
  tenantId: string,
  userId: string,
): { state: string; nonce: string; cookieValue: string } {
  const nonce = randomBytes(16).toString("hex");
  const payload: OAuthStatePayload = {
    tenantId,
    userId,
    nonce,
    exp: Date.now() + OAUTH_STATE_TTL_MS,
  };
  const payloadBase64 = encodePayload(payload);
  const signature = signPayload(payloadBase64);
  const state = `${payloadBase64}.${signature}`;

  return {
    state,
    nonce,
    cookieValue: nonce,
  };
}

export function verifyOAuthState(
  state: string,
  cookieNonce: string | undefined,
): OAuthStatePayload {
  const [payloadBase64, signature] = state.split(".");

  if (!payloadBase64 || !signature) {
    throw new Error("State OAuth malformado.");
  }

  const expectedSignature = signPayload(payloadBase64);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Assinatura OAuth inválida.");
  }

  const payload = decodePayload(payloadBase64);

  if (Date.now() > payload.exp) {
    throw new Error("State OAuth expirado.");
  }

  if (!cookieNonce || cookieNonce !== payload.nonce) {
    throw new Error("Nonce OAuth não corresponde ao cookie.");
  }

  return payload;
}
