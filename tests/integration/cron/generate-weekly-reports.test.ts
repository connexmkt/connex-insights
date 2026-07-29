import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/instagram/generate-weekly-reports/route";
import type { GenerateWeeklyResult } from "@/lib/instagram/reports/weekly-report.service";

vi.mock("@/lib/instagram/config", () => ({
  getInstagramConfig: vi.fn(() => ({
    cronSecret: "test-cron-secret",
    connexCrmUrl: "https://crm.test.com",
    connexInsightsIngestSecret: "test-ingest-secret",
    appId: "app-id",
    appSecret: "app-secret",
    redirectUri: "https://test.com/callback",
    oauthScopes: ["instagram_basic"],
    tokenEncryptionKey: "encryption-key-test",
    oauthStateSecret: "state-secret",
    appUrl: "https://test.com",
    syncBatchSize: 25,
    syncMaxRetries: 3,
    metricRetentionDays: 90,
  })),
}));

vi.mock("@/lib/instagram/reports/weekly-report.service", () => ({
  generateWeeklyReportsForAllTenants: vi.fn(),
}));

import { generateWeeklyReportsForAllTenants } from "@/lib/instagram/reports/weekly-report.service";

const CRON_URL = "https://insights.test.com/api/cron/instagram/generate-weekly-reports";

function makeRequest(authHeader?: string): Request {
  const headers: HeadersInit = {};
  if (authHeader !== undefined) {
    headers["authorization"] = authHeader;
  }
  return new Request(CRON_URL, { headers });
}

describe("GET /api/cron/instagram/generate-weekly-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 401 quando não há header de autorização", async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string; code: string };
    expect(body.code).toBe("SESSION_EXPIRED");
  });

  it("retorna 401 quando o Bearer token está incorreto", async () => {
    const response = await GET(makeRequest("Bearer wrong-secret"));

    expect(response.status).toBe(401);
  });

  it("retorna 401 quando o header não usa o formato Bearer", async () => {
    const response = await GET(makeRequest("Basic test-cron-secret"));

    expect(response.status).toBe(401);
  });

  it("retorna 200 e o resultado do service quando o secret é válido", async () => {
    const mockResult: GenerateWeeklyResult = { processed: 3, upserted: 2, skipped: 1 };
    vi.mocked(generateWeeklyReportsForAllTenants).mockResolvedValue(mockResult);

    const response = await GET(makeRequest("Bearer test-cron-secret"));

    expect(response.status).toBe(200);
    const body = (await response.json()) as GenerateWeeklyResult;
    expect(body.processed).toBe(3);
    expect(body.upserted).toBe(2);
    expect(body.skipped).toBe(1);
  });

  it("delega ao service sem argumentos adicionais", async () => {
    vi.mocked(generateWeeklyReportsForAllTenants).mockResolvedValue({
      processed: 0,
      upserted: 0,
      skipped: 0,
    });

    await GET(makeRequest("Bearer test-cron-secret"));

    expect(generateWeeklyReportsForAllTenants).toHaveBeenCalledOnce();
  });
});
