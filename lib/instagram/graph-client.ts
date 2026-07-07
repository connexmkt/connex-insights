import type {
  InstagramGraphMediaResponse,
  InstagramGraphProfile,
} from "@/types/instagram";
import { MetaApiError, isMetaAuthError } from "@/types/instagram";

const GRAPH_BASE = "https://graph.instagram.com/v25.0";

const PROFILE_FIELDS =
  "user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count";

const MEDIA_FIELDS =
  "id,media_type,caption,permalink,thumbnail_url,timestamp";

async function parseGraphError(response: Response): Promise<never> {
  let message = `Erro na Graph API (${response.status})`;
  let metaErrorCode: number | undefined;

  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error !== null
    ) {
      if ("message" in body.error && typeof body.error.message === "string") {
        message = body.error.message;
      }
      if ("code" in body.error && typeof body.error.code === "number") {
        metaErrorCode = body.error.code;
      }
    }
  } catch {
    // Mantém mensagem genérica
  }

  throw new MetaApiError(message, response.status, metaErrorCode);
}

export async function getInstagramProfile(
  accessToken: string,
): Promise<InstagramGraphProfile> {
  const params = new URLSearchParams({
    fields: PROFILE_FIELDS,
    access_token: accessToken,
  });

  const response = await fetch(`${GRAPH_BASE}/me?${params.toString()}`);

  if (!response.ok) {
    await parseGraphError(response);
  }

  const json: unknown = await response.json();

  if (
    typeof json !== "object" ||
    json === null ||
    !("user_id" in json) ||
    !("username" in json) ||
    !("account_type" in json) ||
    typeof json.user_id !== "string" ||
    typeof json.username !== "string" ||
    typeof json.account_type !== "string"
  ) {
    throw new MetaApiError("Resposta de perfil inválida.", 500);
  }

  return json as InstagramGraphProfile;
}

export async function getInstagramMedia(
  professionalUserId: string,
  accessToken: string,
): Promise<InstagramGraphMediaResponse> {
  const params = new URLSearchParams({
    fields: MEDIA_FIELDS,
    access_token: accessToken,
  });

  const response = await fetch(
    `${GRAPH_BASE}/${professionalUserId}/media?${params.toString()}`,
  );

  if (!response.ok) {
    await parseGraphError(response);
  }

  const json: unknown = await response.json();

  if (
    typeof json !== "object" ||
    json === null ||
    !("data" in json) ||
    !Array.isArray(json.data)
  ) {
    throw new MetaApiError("Resposta de mídia inválida.", 500);
  }

  return json as InstagramGraphMediaResponse;
}

export { isMetaAuthError, MetaApiError };
