import { prisma } from "@/lib/db/prisma";
import { decryptToken } from "@/lib/instagram/token-crypto";

export async function getAccessTokenForIntegration(
  integrationId: string,
): Promise<string> {
  const credential = await prisma.instagramCredential.findUnique({
    where: { integrationId },
  });

  if (!credential) {
    throw new Error("Credencial não encontrada.");
  }

  return decryptToken(credential.accessTokenEnc);
}
