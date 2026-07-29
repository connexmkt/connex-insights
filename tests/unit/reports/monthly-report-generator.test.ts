import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  InstagramIntegrationStatus,
  type InstagramIntegration,
  type InstagramMedia,
  type InstagramMetricSnapshot,
} from "@/lib/generated/prisma";
import {
  generateMonthlyReportForTenant,
  generateMonthlyReportsForAllTenants,
} from "@/lib/instagram/reports/monthly-report-generator";
import { prisma } from "@/lib/db/prisma";
import type { MonthRange } from "@/lib/instagram/reports/report-types";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    instagramIntegration: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    instagramMedia: {
      findMany: vi.fn(),
    },
    instagramMetricSnapshot: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

const TENANT_ID = "aaaaaaaa-0000-0000-0000-000000000002";
const INTEGRATION_ID = "bbbbbbbb-0000-0000-0000-000000000002";

function makeMonthRange(): MonthRange {
  return {
    monthStart: new Date("2026-06-01T00:00:00Z"),
    monthEnd: new Date("2026-06-30T00:00:00Z"),
    year: 2026,
    month: 6,
  };
}

function makeMedia(externalMediaId: string, date = "2026-06-15") {
  return {
    externalMediaId,
    permalink: `https://www.instagram.com/p/${externalMediaId}/`,
    thumbnailUrl: null,
    mediaType: "IMAGE",
    publishedAt: new Date(`${date}T10:00:00Z`),
  };
}

function makeMediaSnapshot(
  entityId: string,
  value: number,
  metric = "total_interactions",
  collectedAt = "2026-06-20T00:00:00Z",
) {
  return {
    entityId,
    metricName: metric,
    value,
    collectedAt: new Date(collectedAt),
  };
}

function makeFollowerSnapshot(value: number, collectedAt: string) {
  return { value, collectedAt: new Date(collectedAt) };
}

function makeIntegration(
  status: InstagramIntegrationStatus = InstagramIntegrationStatus.CONNECTED,
) {
  return {
    id: INTEGRATION_ID,
    tenantId: TENANT_ID,
    status,
  } as unknown as InstagramIntegration;
}

function makeAggregateResult(value: number | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { _sum: { value } } as any;
}

/** Configura os mocks sem media nem métricas de seguidores (caso base). */
function setupNoDataMocks() {
  vi.mocked(prisma.instagramMetricSnapshot.findMany).mockResolvedValue(
    [] as unknown as InstagramMetricSnapshot[],
  );
  vi.mocked(prisma.instagramMetricSnapshot.aggregate).mockResolvedValue(
    makeAggregateResult(null),
  );
  vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
    [] as unknown as InstagramMedia[],
  );
}

describe("generateMonthlyReportForTenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando a integração não é encontrada", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(null);

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result).toBeNull();
  });

  it("retorna null quando a integração não está CONNECTED", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration("DISCONNECTED" as InstagramIntegrationStatus),
    );

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result).toBeNull();
  });

  it("retorna status PARTIAL com campos nulos quando não há dados no período", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    setupNoDataMocks();

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result!.status).toBe("PARTIAL");
    expect(result!.topPosts).toHaveLength(0);
    expect(result!.worstPost).toBeNull();
    expect(result!.followersStart).toBeNull();
    expect(result!.followersEnd).toBeNull();
    expect(result!.followersGained).toBeNull();
    expect(result!.followersGrowthPct).toBeNull();
    expect(result!.accountsReached).toBeNull();
  });

  it("computa estatísticas de seguidores e reach corretamente", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );

    // 1ª chamada de findMany → follower_count snapshots; sem media → não há 2ª chamada
    vi.mocked(prisma.instagramMetricSnapshot.findMany).mockResolvedValue([
      makeFollowerSnapshot(1000, "2026-06-01T00:00:00Z"),
      makeFollowerSnapshot(1100, "2026-06-15T00:00:00Z"),
      makeFollowerSnapshot(1200, "2026-06-30T00:00:00Z"),
    ] as unknown as InstagramMetricSnapshot[]);
    vi.mocked(prisma.instagramMetricSnapshot.aggregate).mockResolvedValue(
      makeAggregateResult(5000),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [] as unknown as InstagramMedia[],
    );

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result!.followersStart).toBe(1000);
    expect(result!.followersEnd).toBe(1200);
    expect(result!.followersGained).toBe(200);
    expect(result!.followersGrowthPct).toBe(20);
    expect(result!.accountsReached).toBe(5000);
  });

  it("retorna followersGrowthPct=null quando followersStart é zero", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMetricSnapshot.findMany).mockResolvedValue([
      makeFollowerSnapshot(0, "2026-06-01T00:00:00Z"),
      makeFollowerSnapshot(100, "2026-06-30T00:00:00Z"),
    ] as unknown as InstagramMetricSnapshot[]);
    vi.mocked(prisma.instagramMetricSnapshot.aggregate).mockResolvedValue(
      makeAggregateResult(null),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [] as unknown as InstagramMedia[],
    );

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result!.followersGrowthPct).toBeNull();
  });

  it("retorna AVAILABLE com topPosts (máx 3) e worstPost separado quando há 4+ posts", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    // 1ª findMany → follower (vazio); 2ª findMany → media snapshots
    vi.mocked(prisma.instagramMetricSnapshot.findMany)
      .mockResolvedValueOnce([] as unknown as InstagramMetricSnapshot[])
      .mockResolvedValueOnce([
        makeMediaSnapshot("ext1", 400),
        makeMediaSnapshot("ext2", 300),
        makeMediaSnapshot("ext3", 200),
        makeMediaSnapshot("ext4", 100),
      ] as unknown as InstagramMetricSnapshot[]);
    vi.mocked(prisma.instagramMetricSnapshot.aggregate).mockResolvedValue(
      makeAggregateResult(null),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue([
      makeMedia("ext1", "2026-06-10"),
      makeMedia("ext2", "2026-06-11"),
      makeMedia("ext3", "2026-06-12"),
      makeMedia("ext4", "2026-06-13"),
    ] as unknown as InstagramMedia[]);

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result!.status).toBe("AVAILABLE");
    expect(result!.topPosts).toHaveLength(3);
    expect(result!.topPosts![0]!.instagramMediaId).toBe("ext1");
    expect(result!.topPosts![1]!.instagramMediaId).toBe("ext2");
    expect(result!.topPosts![2]!.instagramMediaId).toBe("ext3");
    expect(result!.worstPost!.instagramMediaId).toBe("ext4");
  });

  it("retorna worstPost=null quando todos os posts cabem no topPosts (≤3 posts)", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMetricSnapshot.findMany)
      .mockResolvedValueOnce([] as unknown as InstagramMetricSnapshot[])
      .mockResolvedValueOnce([
        makeMediaSnapshot("ext1", 300),
        makeMediaSnapshot("ext2", 200),
        makeMediaSnapshot("ext3", 100),
      ] as unknown as InstagramMetricSnapshot[]);
    vi.mocked(prisma.instagramMetricSnapshot.aggregate).mockResolvedValue(
      makeAggregateResult(null),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue([
      makeMedia("ext1"),
      makeMedia("ext2"),
      makeMedia("ext3"),
    ] as unknown as InstagramMedia[]);

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result!.topPosts).toHaveLength(3);
    expect(result!.worstPost).toBeNull();
  });

  it("popula sourceReportId, referenceYear e referenceMonth corretamente", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    setupNoDataMocks();

    const result = await generateMonthlyReportForTenant(
      TENANT_ID,
      makeMonthRange(),
    );

    expect(result!.sourceReportId).toBe(`monthly-${TENANT_ID}-2026-6`);
    expect(result!.clienteId).toBe(TENANT_ID);
    expect(result!.referenceYear).toBe(2026);
    expect(result!.referenceMonth).toBe(6);
  });
});

describe("generateMonthlyReportsForAllTenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processa todos os tenants CONNECTED e retorna o range correto", async () => {
    vi.mocked(prisma.instagramIntegration.findMany).mockResolvedValue([
      { tenantId: TENANT_ID },
    ] as unknown as InstagramIntegration[]);
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    setupNoDataMocks();

    // Julho 2026 → mês anterior = Junho 2026
    const now = new Date("2026-07-07T02:00:00Z");
    const results = await generateMonthlyReportsForAllTenants(now);

    expect(results).toHaveLength(1);
    expect(results[0]!.tenantId).toBe(TENANT_ID);
    expect(results[0]!.report).not.toBeNull();
    expect(results[0]!.range.year).toBe(2026);
    expect(results[0]!.range.month).toBe(6);
  });

  it("retorna null no relatório para tenant sem integração CONNECTED", async () => {
    vi.mocked(prisma.instagramIntegration.findMany).mockResolvedValue([
      { tenantId: TENANT_ID },
    ] as unknown as InstagramIntegration[]);
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(null);

    const results = await generateMonthlyReportsForAllTenants();

    expect(results[0]!.report).toBeNull();
  });

  it("trata corretamente a virada de ano (janeiro → dezembro do ano anterior)", async () => {
    vi.mocked(prisma.instagramIntegration.findMany).mockResolvedValue([
      { tenantId: TENANT_ID },
    ] as unknown as InstagramIntegration[]);
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    setupNoDataMocks();

    // Janeiro 2027 → mês anterior = Dezembro 2026
    const now = new Date("2027-01-07T02:00:00Z");
    const results = await generateMonthlyReportsForAllTenants(now);

    expect(results[0]!.range.year).toBe(2026);
    expect(results[0]!.range.month).toBe(12);
  });
});
