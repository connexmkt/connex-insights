import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendMonthlyReport,
  sendWeeklyReport,
} from "@/lib/instagram/reports/report-sender";
import type {
  MonthlyReportIngestRequest,
  WeeklyReportIngestRequest,
} from "@/lib/instagram/reports/report-types";

vi.mock("@/lib/instagram/config", () => ({
  getInstagramConfig: vi.fn(() => ({
    connexCrmUrl: "https://crm.test.com",
    connexInsightsIngestSecret: "test-ingest-secret",
    cronSecret: "test-cron-secret",
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

const WEEKLY_PAYLOAD: WeeklyReportIngestRequest = {
  sourceReportId: "weekly-tenant-1-2026-7-3",
  clienteId: "tenant-1",
  referenceYear: 2026,
  referenceMonth: 7,
  referenceWeek: 3,
  periodStart: "2026-07-20",
  periodEnd: "2026-07-26",
  generatedAt: "2026-07-27T02:00:00Z",
  status: "AVAILABLE",
  bestPost: null,
  worstPost: null,
};

const MONTHLY_PAYLOAD: MonthlyReportIngestRequest = {
  sourceReportId: "monthly-tenant-1-2026-6",
  clienteId: "tenant-1",
  referenceYear: 2026,
  referenceMonth: 6,
  generatedAt: "2026-07-07T02:00:00Z",
  status: "AVAILABLE",
  topPosts: [],
  worstPost: null,
  followersStart: null,
  followersEnd: null,
  followersGained: null,
  followersGrowthPct: null,
  accountsReached: null,
};

function makeFetchOk(action: "created" | "updated" = "created"): Response {
  return new Response(
    JSON.stringify({ data: { id: "report-id-1", action } }),
    { status: 200 },
  );
}

function makeFetchError(status: number, errorMessage?: string): Response {
  const body = errorMessage ? { error: errorMessage } : {};
  return new Response(JSON.stringify(body), { status });
}

describe("sendWeeklyReport", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna ok:true com action quando o envio é bem-sucedido (created)", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchOk("created"));

    const result = await sendWeeklyReport(WEEKLY_PAYLOAD);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.action).toBe("created");
    }
  });

  it("retorna ok:true com action 'updated' em reenvios", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchOk("updated"));

    const result = await sendWeeklyReport(WEEKLY_PAYLOAD);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.action).toBe("updated");
    }
  });

  it("chama o endpoint semanal correto com os headers de autenticação", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchOk());

    await sendWeeklyReport(WEEKLY_PAYLOAD);

    expect(fetch).toHaveBeenCalledWith(
      "https://crm.test.com/api/integrations/connex-insights/relatorios-instagram/semanais",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-connex-insights-secret": "test-ingest-secret",
        }),
        body: JSON.stringify(WEEKLY_PAYLOAD),
      }),
    );
  });

  it("retorna ok:false com statusCode quando o CRM responde com erro HTTP sem corpo de erro", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchError(500));

    const result = await sendWeeklyReport(WEEKLY_PAYLOAD);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe("HTTP 500");
    }
  });

  it("inclui mensagem de erro do CRM quando o corpo JSON contém .error", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchError(422, "Payload inválido"));

    const result = await sendWeeklyReport(WEEKLY_PAYLOAD);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(422);
      expect(result.message).toBe("HTTP 422: Payload inválido");
    }
  });

  it("retorna ok:false com statusCode=0 quando ocorre erro de rede", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Failed to fetch"));

    const result = await sendWeeklyReport(WEEKLY_PAYLOAD);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(0);
      expect(result.message).toBe("Failed to fetch");
    }
  });

  it("retorna ok:false com mensagem padrão quando o erro de rede não é um Error", async () => {
    vi.mocked(fetch).mockRejectedValue("timeout");

    const result = await sendWeeklyReport(WEEKLY_PAYLOAD);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(0);
      expect(result.message).toBe("Erro de rede desconhecido");
    }
  });
});

describe("sendMonthlyReport", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna ok:true quando o envio é bem-sucedido", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchOk());

    const result = await sendMonthlyReport(MONTHLY_PAYLOAD);

    expect(result.ok).toBe(true);
  });

  it("chama o endpoint mensal correto", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchOk());

    await sendMonthlyReport(MONTHLY_PAYLOAD);

    expect(fetch).toHaveBeenCalledWith(
      "https://crm.test.com/api/integrations/connex-insights/relatorios-instagram/mensais",
      expect.anything(),
    );
  });

  it("retorna ok:false com statusCode quando o CRM rejeita o payload", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchError(422, "Dados inválidos"));

    const result = await sendMonthlyReport(MONTHLY_PAYLOAD);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(422);
      expect(result.message).toBe("HTTP 422: Dados inválidos");
    }
  });

  it("retorna ok:false com statusCode=0 quando ocorre erro de rede", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const result = await sendMonthlyReport(MONTHLY_PAYLOAD);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.statusCode).toBe(0);
    }
  });
});
