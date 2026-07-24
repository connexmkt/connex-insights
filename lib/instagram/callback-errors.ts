import { Prisma } from "@/lib/generated/prisma";
import {
  InstagramServiceError,
  MetaApiError,
} from "@/types/instagram";

export const INSTAGRAM_CALLBACK_RESULTS = [
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
] as const;

export type InstagramCallbackResult =
  (typeof INSTAGRAM_CALLBACK_RESULTS)[number];

export type InstagramCallbackStage =
  | "config"
  | "state"
  | "session"
  | "code"
  | "token_exchange"
  | "long_lived_token"
  | "profile_fetch"
  | "persist"
  | "sync";

export interface CallbackErrorMapping {
  result: InstagramCallbackResult;
  detail: string;
}

const TOKEN_PATTERN =
  /(?:access_token|EAAC|IGQ|Bearer\s)[A-Za-z0-9._-]+/gi;

function sanitizeDetail(message: string): string {
  return message
    .replace(TOKEN_PATTERN, "[token]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * Loga os escopos efetivamente concedidos pela Meta após a troca do
 * authorization code pelo short-lived token. A tela de confirmação de
 * permissões do Business Login permite que o usuário desmarque escopos
 * individualmente, e a Meta não sinaliza isso de forma clara — esse log
 * permite confirmar se `instagram_business_basic` (exigido pela troca de
 * long-lived token) foi de fato concedido, sem depender do Access Token
 * Debugger manual.
 */
export function logGrantedScopes(scopesGranted: string | undefined): void {
  console.info("[instagram/callback]", {
    stage: "token_exchange",
    grantedScopes: scopesGranted || "(nenhum escopo retornado pela Meta)",
  });
}

export function logCallbackError(
  stage: InstagramCallbackStage,
  error: unknown,
): void {
  const payload: Record<string, unknown> = { stage };

  if (error instanceof MetaApiError) {
    payload.errorType = "MetaApiError";
    payload.statusCode = error.statusCode;
    payload.metaErrorCode = error.metaErrorCode;
    payload.message = sanitizeDetail(error.message);
  } else if (error instanceof InstagramServiceError) {
    payload.errorType = "InstagramServiceError";
    payload.code = error.code;
    payload.message = sanitizeDetail(error.message);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    payload.errorType = "PrismaKnownRequestError";
    payload.prismaCode = error.code;
    payload.message = sanitizeDetail(error.message);
  } else if (error instanceof Error) {
    payload.errorType = error.name;
    payload.message = sanitizeDetail(error.message);
  } else {
    payload.errorType = "unknown";
    payload.message = "Erro desconhecido.";
  }

  console.error("[instagram/callback]", payload);
}

export function mapCallbackError(
  stage: InstagramCallbackStage,
  error: unknown,
): CallbackErrorMapping {
  logCallbackError(stage, error);

  if (error instanceof InstagramServiceError) {
    switch (error.code) {
      case "UNSUPPORTED_ACCOUNT_TYPE":
        return {
          result: "unsupported_account",
          detail: error.message,
        };
      case "ALREADY_CONNECTED":
        return {
          result: "already_connected",
          detail: error.message,
        };
      case "ACCOUNT_LINKED_ELSEWHERE":
        return {
          result: "account_linked_elsewhere",
          detail: error.message,
        };
      default:
        return {
          result: "persist_failed",
          detail: error.message,
        };
    }
  }

  if (error instanceof MetaApiError) {
    const detail = sanitizeDetail(
      `${error.message} (HTTP ${error.statusCode})`,
    );

    switch (stage) {
      case "token_exchange":
        return {
          result: "token_exchange_failed",
          detail:
            error.statusCode === 400
              ? `${detail} — Verifique INSTAGRAM_APP_SECRET e INSTAGRAM_REDIRECT_URI.`
              : detail,
        };
      case "long_lived_token":
        return { result: "long_lived_token_failed", detail };
      case "profile_fetch":
        return { result: "profile_fetch_failed", detail };
      case "sync":
        return { result: "sync_failed", detail };
      default:
        return { result: "meta_api_error", detail };
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      result: "database_error",
      detail: `Erro de banco (${error.code}): ${sanitizeDetail(error.message)}`,
    };
  }

  if (error instanceof Error) {
    if (
      error.message.includes("INSTAGRAM_TOKEN_ENCRYPTION_KEY") ||
      error.message.includes("token criptografado")
    ) {
      return {
        result: "encryption_error",
        detail: error.message,
      };
    }

    if (error.message.includes("Configuração Instagram inválida")) {
      return {
        result: "config_error",
        detail: error.message,
      };
    }
  }

  switch (stage) {
    case "token_exchange":
      return {
        result: "token_exchange_failed",
        detail: "Falha ao trocar o código de autorização por token.",
      };
    case "long_lived_token":
      return {
        result: "long_lived_token_failed",
        detail: "Falha ao obter token de longa duração.",
      };
    case "profile_fetch":
      return {
        result: "profile_fetch_failed",
        detail: "Falha ao buscar perfil na Graph API.",
      };
    case "persist":
      return {
        result: "persist_failed",
        detail: "Falha ao salvar a integração no banco.",
      };
    case "sync":
      return {
        result: "sync_failed",
        detail: "Conexão salva, mas a sincronização inicial falhou.",
      };
    default:
      return {
        result: "error",
        detail: "Erro inesperado durante a conexão.",
      };
  }
}
