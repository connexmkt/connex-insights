import { z } from "zod";

export const instagramCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().min(1),
  error: z.string().optional(),
  error_reason: z.string().optional(),
  error_description: z.string().optional(),
});

export const instagramCallbackResultSchema = z.enum([
  "connected",
  "connected_sync_pending",
  "denied",
  "error",
  "missing_code",
  "oauth_state_invalid",
  "session_lost",
  "unsupported_account",
  "already_connected",
  "account_linked_elsewhere",
  "token_exchange_failed",
  "long_lived_token_failed",
  "profile_fetch_failed",
  "persist_failed",
  "sync_failed",
  "database_error",
  "encryption_error",
  "config_error",
  "meta_api_error",
]);

export type InstagramCallbackResult = z.infer<
  typeof instagramCallbackResultSchema
>;

export const syncStartedResponseSchema = z.object({
  jobId: z.string().uuid(),
  syncStatus: z.literal("IN_PROGRESS"),
});

export const disconnectResponseSchema = z.object({
  success: z.literal(true),
  status: z.literal("DISCONNECTED"),
});

export const tokenRefreshJobResponseSchema = z.object({
  refreshed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
