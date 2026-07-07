import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getInstagramConfig } from "@/lib/instagram/config";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const { tokenEncryptionKey } = getInstagramConfig();
  const key = Buffer.from(tokenEncryptionKey, "base64");

  if (key.length !== 32) {
    throw new Error(
      "INSTAGRAM_TOKEN_ENCRYPTION_KEY deve conter exatamente 32 bytes em base64.",
    );
  }

  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivBase64, authTagBase64, encryptedBase64] = ciphertext.split(":");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Formato de token criptografado inválido.");
  }

  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}
