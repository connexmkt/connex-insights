import {
  InstagramAccountType,
  InstagramIntegrationStatus,
  InstagramSyncStatus,
} from "@/lib/generated/prisma";

export interface IntegrationPublic {
  id: string;
  username: string;
  displayName: string | null;
  accountType: InstagramAccountType;
  profilePictureUrl: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
  status: InstagramIntegrationStatus;
  syncStatus: InstagramSyncStatus;
  lastSyncedAt: string | null;
  connectedAt: string | null;
}

export interface IntegrationResponse {
  connected: boolean;
  integration: IntegrationPublic | null;
}

export interface OAuthStatePayload {
  tenantId: string;
  userId: string;
  nonce: string;
  exp: number;
}

export interface InstagramGraphProfile {
  user_id: string;
  username: string;
  name?: string;
  account_type: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface InstagramGraphMediaItem {
  id: string;
  media_type: string;
  caption?: string;
  permalink?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
}

export interface InstagramGraphMediaResponse {
  data: InstagramGraphMediaItem[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

export interface InstagramGraphInsightValue {
  value?: number;
  end_time?: string;
}

export interface InstagramGraphInsightMetric {
  name: string;
  period: string;
  values?: InstagramGraphInsightValue[];
  total_value?: {
    value?: number;
    breakdowns?: Array<{
      dimension_keys: string[];
      results: Array<{
        dimension_values: string[];
        value: number;
        end_time?: string;
      }>;
    }>;
  };
}

export interface InstagramGraphInsightsResponse {
  data: InstagramGraphInsightMetric[];
}

export interface ShortLivedTokenResponse {
  access_token: string;
  user_id: string;
  permissions?: string;
}

export interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export type InstagramErrorCode =
  | "SESSION_EXPIRED"
  | "ALREADY_CONNECTED"
  | "ACCOUNT_LINKED_ELSEWHERE"
  | "UNSUPPORTED_ACCOUNT_TYPE"
  | "OAUTH_DENIED"
  | "OAUTH_STATE_INVALID"
  | "SYNC_IN_PROGRESS"
  | "INTEGRATION_NOT_FOUND"
  | "META_API_ERROR"
  | "INTERNAL_ERROR";

export class InstagramServiceError extends Error {
  constructor(
    message: string,
    public readonly code: InstagramErrorCode,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "InstagramServiceError";
  }
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly metaErrorCode?: number,
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

function normalizeAccountTypeKey(accountType: string): string {
  return accountType.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

/**
 * Mapeia account_type da Graph API para enum Prisma.
 * A Meta pode retornar Business, BUSINESS, Media_Creator, MEDIA_CREATOR, CREATOR, etc.
 */
export function mapGraphAccountType(
  accountType: string,
): InstagramAccountType | null {
  const normalized = normalizeAccountTypeKey(accountType);

  switch (normalized) {
    case "BUSINESS":
      return InstagramAccountType.BUSINESS;
    case "MEDIA_CREATOR":
    case "CREATOR":
      return InstagramAccountType.MEDIA_CREATOR;
    case "PERSONAL":
      return null;
    default: {
      return null;
    }
  }
}

export function isMetaAuthError(statusCode: number): boolean {
  return statusCode === 401 || statusCode === 403;
}
