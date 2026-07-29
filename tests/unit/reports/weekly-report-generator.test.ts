import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  InstagramIntegrationStatus,
  type InstagramIntegration,
  type InstagramMedia,
  type InstagramMetricSnapshot,
} from "@/lib/generated/prisma";
import {
  generateWeeklyReportForTenant,
  generateWeeklyReportsForAllTenants,
} from "@/lib/instagram/reports/weekly-report-generator";
import { prisma } from "@/lib/db/prisma";
import type { WeekRange } from "@/lib/instagram/reports/report-types";

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
    },
  },
}));

const TENANT_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const INTEGRATION_ID = "bbbbbbbb-0000-0000-0000-000000000001";

function makeWeekRange(): WeekRange {
  return {
    weekStart: new Date("2026-07-20T00:00:00Z"),
    weekEnd: new Date("2026-07-26T00:00:00Z"),
    year: 2026,
    month: 7,
    week: 3,
  };
}

function makeMedia(externalMediaId: string, date = "2026-07-21") {
  return {
    id: `id-${externalMediaId}`,
    externalMediaId,
    permalink: `https://www.instagram.com/p/${externalMediaId}/`,
    thumbnailUrl: null,
    mediaType: "IMAGE",
    publishedAt: new Date(`${date}T10:00:00Z`),
  };
}

function makeSnapshot(
  entityId: string,
  value: number,
  metric = "total_interactions",
  collectedAt = "2026-07-23T00:00:00Z",
) {
  return {
    entityId,
    metricName: metric,
    value,
    collectedAt: new Date(collectedAt),
  };
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

describe("generateWeeklyReportForTenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando a integração não é encontrada", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(null);

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result).toBeNull();
  });

  it("retorna null quando a integração não está CONNECTED", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration("DISCONNECTED" as InstagramIntegrationStatus),
    );

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result).toBeNull();
  });

  it("retorna status PARTIAL quando não há posts no período", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [] as unknown as InstagramMedia[],
    );

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result).not.toBeNull();
    expect(result!.status).toBe("PARTIAL");
    expect(result!.bestPost).toBeNull();
    expect(result!.worstPost).toBeNull();
  });

  it("retorna status PARTIAL quando há posts mas nenhum tem total_interactions", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [makeMedia("ext1")] as unknown as InstagramMedia[],
    );
    vi.mocked(prisma.instagramMetricSnapshot.findMany).mockResolvedValue(
      [] as unknown as InstagramMetricSnapshot[],
    );

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result!.status).toBe("PARTIAL");
    expect(result!.bestPost).toBeNull();
    expect(result!.worstPost).toBeNull();
  });

  it("retorna AVAILABLE com bestPost e worstPost distintos quando há múltiplos posts com métricas", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue([
      makeMedia("ext1"),
      makeMedia("ext2"),
    ] as unknown as InstagramMedia[]);
    vi.mocked(prisma.instagramMetricSnapshot.findMany).mockResolvedValue([
      makeSnapshot("ext1", 100),
      makeSnapshot("ext2", 40),
    ] as unknown as InstagramMetricSnapshot[]);

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result!.status).toBe("AVAILABLE");
    expect(result!.bestPost!.instagramMediaId).toBe("ext1");
    expect(result!.bestPost!.primaryMetricValue).toBe(100);
    expect(result!.worstPost!.instagramMediaId).toBe("ext2");
    expect(result!.worstPost!.primaryMetricValue).toBe(40);
  });

  it("retorna worstPost=null quando há apenas um post com métricas", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [makeMedia("ext1")] as unknown as InstagramMedia[],
    );
    vi.mocked(prisma.instagramMetricSnapshot.findMany).mockResolvedValue([
      makeSnapshot("ext1", 100),
    ] as unknown as InstagramMetricSnapshot[]);

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result!.status).toBe("AVAILABLE");
    expect(result!.bestPost).not.toBeNull();
    expect(result!.worstPost).toBeNull();
  });

  it("popula os campos de período e referência corretamente", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [] as unknown as InstagramMedia[],
    );

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result!.sourceReportId).toBe(`weekly-${TENANT_ID}-2026-7-3`);
    expect(result!.clienteId).toBe(TENANT_ID);
    expect(result!.referenceYear).toBe(2026);
    expect(result!.referenceMonth).toBe(7);
    expect(result!.referenceWeek).toBe(3);
    expect(result!.periodStart).toBe("2026-07-20");
    expect(result!.periodEnd).toBe("2026-07-26");
  });

  it("usa o snapshot mais recente quando há múltiplos snapshots da mesma métrica", async () => {
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [makeMedia("ext1")] as unknown as InstagramMedia[],
    );
    vi.mocked(prisma.instagramMetricSnapshot.findMany).mockResolvedValue([
      makeSnapshot("ext1", 50, "total_interactions", "2026-07-21T00:00:00Z"),
      makeSnapshot("ext1", 80, "total_interactions", "2026-07-23T00:00:00Z"),
    ] as unknown as InstagramMetricSnapshot[]);

    const result = await generateWeeklyReportForTenant(TENANT_ID, makeWeekRange());

    expect(result!.status).toBe("AVAILABLE");
    expect(result!.bestPost!.primaryMetricValue).toBe(80);
  });
});

describe("generateWeeklyReportsForAllTenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna relatórios para todos os tenants CONNECTED", async () => {
    vi.mocked(prisma.instagramIntegration.findMany).mockResolvedValue([
      { tenantId: "tenant-1" },
      { tenantId: "tenant-2" },
    ] as unknown as InstagramIntegration[]);
    vi.mocked(prisma.instagramIntegration.findUnique)
      .mockResolvedValueOnce(
        makeIntegration(InstagramIntegrationStatus.CONNECTED),
      )
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [] as unknown as InstagramMedia[],
    );

    const results = await generateWeeklyReportsForAllTenants(new Date("2026-07-27T02:00:00Z"));

    expect(results).toHaveLength(2);
    expect(results[0]!.tenantId).toBe("tenant-1");
    expect(results[0]!.report).not.toBeNull();
    expect(results[1]!.tenantId).toBe("tenant-2");
    expect(results[1]!.report).toBeNull();
  });

  it("retorna lista vazia quando não há integrações CONNECTED", async () => {
    vi.mocked(prisma.instagramIntegration.findMany).mockResolvedValue(
      [] as unknown as InstagramIntegration[],
    );

    const results = await generateWeeklyReportsForAllTenants();

    expect(results).toHaveLength(0);
  });

  it("calcula o intervalo da semana anterior com base na data fornecida", async () => {
    vi.mocked(prisma.instagramIntegration.findMany).mockResolvedValue([
      { tenantId: TENANT_ID },
    ] as unknown as InstagramIntegration[]);
    vi.mocked(prisma.instagramIntegration.findUnique).mockResolvedValue(
      makeIntegration(),
    );
    vi.mocked(prisma.instagramMedia.findMany).mockResolvedValue(
      [] as unknown as InstagramMedia[],
    );

    // Segunda-feira 27/07/2026 02:00 UTC → semana anterior: 20-26/07
    const results = await generateWeeklyReportsForAllTenants(new Date("2026-07-27T02:00:00Z"));

    expect(results[0]!.report!.periodStart).toBe("2026-07-20");
    expect(results[0]!.report!.periodEnd).toBe("2026-07-26");
  });
});
