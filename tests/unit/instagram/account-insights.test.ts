import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/instagram/graph-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/instagram/graph-client")>();
  return {
    ...original,
    getAccountInsights: vi.fn(),
  };
});

vi.mock("@/lib/instagram/insights/snapshot-repository", () => ({
  insertMetricSnapshots: vi.fn().mockResolvedValue(1),
}));

vi.mock("@/lib/instagram/insights/metrics/registry", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/lib/instagram/insights/metrics/registry")
    >();
  return {
    ...original,
    getAccountMetricDefinitions: () => [
      { name: "reach", period: "day", metricType: "time_series", aggregation: "sum" },
      { name: "views", period: "day", metricType: "total_value", aggregation: "sum" },
    ],
  };
});

const TOTAL_VALUE_RESPONSE = (name: string, value: number) => ({
  data: [{ name, period: "day", total_value: { value } }],
});

const TIME_SERIES_RESPONSE = (name: string) => ({
  data: [
    {
      name,
      period: "day",
      values: [
        { value: 100, end_time: "2026-07-27T07:00:00+0000" },
        { value: 150, end_time: "2026-07-28T07:00:00+0000" },
      ],
    },
  ],
});

describe("syncAccountInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-28T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("faz uma chamada única para métricas time_series (janela completa)", async () => {
    const { getAccountInsights } = await import("@/lib/instagram/graph-client");
    const mockFetch = vi.mocked(getAccountInsights);

    mockFetch.mockImplementation((_userId, _token, opts) => {
      if (opts.metric === "reach") {
        return Promise.resolve(TIME_SERIES_RESPONSE("reach"));
      }
      return Promise.resolve(TOTAL_VALUE_RESPONSE("views", 500));
    });

    const { syncAccountInsights } = await import(
      "@/lib/instagram/insights/account-insights"
    );
    await syncAccountInsights(
      "tenant-1",
      "integration-1",
      "job-1",
      "user-123",
      "access-token",
      false,
    );

    const reachCalls = mockFetch.mock.calls.filter(
      ([, , opts]) => opts.metric === "reach",
    );

    // time_series: uma única chamada para a janela inteira de 2 dias
    expect(reachCalls).toHaveLength(1);
    const [, , opts] = reachCalls[0]!;
    expect(opts.until! - opts.since!).toBeGreaterThan(24 * 60 * 60);
  });

  it("faz uma chamada por dia para métricas total_value", async () => {
    const { getAccountInsights } = await import("@/lib/instagram/graph-client");
    vi.mocked(getAccountInsights).mockImplementation((_userId, _token, opts) => {
      if (opts.metric === "reach") {
        return Promise.resolve(TIME_SERIES_RESPONSE("reach"));
      }
      return Promise.resolve(TOTAL_VALUE_RESPONSE("views", 500));
    });

    const { syncAccountInsights } = await import(
      "@/lib/instagram/insights/account-insights"
    );

    // isInitial=false → janela de 2 dias → 2 chamadas para views
    await syncAccountInsights(
      "tenant-1",
      "integration-1",
      "job-1",
      "user-123",
      "access-token",
      false,
    );

    const viewsCalls = vi
      .mocked(getAccountInsights)
      .mock.calls.filter(([, , opts]) => opts.metric === "views");

    expect(viewsCalls).toHaveLength(2);

    for (const [, , opts] of viewsCalls) {
      expect(opts.until! - opts.since!).toBe(24 * 60 * 60);
    }
  });

  it("cada dia de total_value é salvo com metricDate distinto", async () => {
    const { getAccountInsights } = await import("@/lib/instagram/graph-client");
    vi.mocked(getAccountInsights).mockImplementation((_userId, _token, opts) => {
      if (opts.metric === "reach") {
        return Promise.resolve(TIME_SERIES_RESPONSE("reach"));
      }
      return Promise.resolve(TOTAL_VALUE_RESPONSE("views", 300));
    });

    const { insertMetricSnapshots } = await import(
      "@/lib/instagram/insights/snapshot-repository"
    );

    const { syncAccountInsights } = await import(
      "@/lib/instagram/insights/account-insights"
    );
    await syncAccountInsights(
      "tenant-1",
      "integration-1",
      "job-1",
      "user-123",
      "access-token",
      false,
    );

    const viewsInsertCalls = vi
      .mocked(insertMetricSnapshots)
      .mock.calls.filter((call) =>
        call[3].some((row) => row.metricName === "views"),
      );

    // 2 chamadas de insert para views (uma por dia)
    expect(viewsInsertCalls).toHaveLength(2);

    // Os metricDates devem ser diferentes
    const dates = viewsInsertCalls.map(
      (call) =>
        call[3].find((row) => row.metricName === "views")?.metricDate?.toISOString(),
    );
    expect(dates[0]).not.toBe(dates[1]);
  });

  it("ignora erro 400 e continua para a próxima métrica", async () => {
    const { getAccountInsights, MetaApiError } = await import(
      "@/lib/instagram/graph-client"
    );
    vi.mocked(getAccountInsights).mockRejectedValue(
      new MetaApiError("Unsupported metric", 400),
    );

    const { syncAccountInsights } = await import(
      "@/lib/instagram/insights/account-insights"
    );

    await expect(
      syncAccountInsights(
        "tenant-1",
        "integration-1",
        "job-1",
        "user-123",
        "access-token",
        false,
      ),
    ).resolves.toBe(0);
  });
});
