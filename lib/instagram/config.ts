import { z } from "zod";

const instagramConfigSchema = z.object({
  appId: z.string().min(1),
  appSecret: z.string().min(1),
  redirectUri: z.string().url(),
  oauthScopes: z.array(z.string().min(1)).min(1),
  tokenEncryptionKey: z.string().min(1),
  oauthStateSecret: z.string().min(1),
  cronSecret: z.string().min(1),
  appUrl: z.string().url(),
});

export type InstagramConfig = z.infer<typeof instagramConfigSchema>;

let cachedConfig: InstagramConfig | null = null;

function parseScopes(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
}

export function getInstagramConfig(): InstagramConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = instagramConfigSchema.safeParse({
    appId: process.env.INSTAGRAM_APP_ID,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
    redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
    oauthScopes: parseScopes(process.env.INSTAGRAM_OAUTH_SCOPES),
    tokenEncryptionKey: process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY,
    oauthStateSecret: process.env.INSTAGRAM_OAUTH_STATE_SECRET,
    cronSecret: process.env.CRON_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Configuração Instagram inválida ou ausente: ${fields}. Verifique variáveis de ambiente.`,
    );
  }

  cachedConfig = parsed.data;
  return cachedConfig;
}

export function resetInstagramConfigCache(): void {
  cachedConfig = null;
}
