import { prisma } from "@/lib/db/prisma";
import type { ParsedSnapshotRow } from "@/lib/instagram/insights/metrics/parser";

export async function insertMetricSnapshots(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  rows: ParsedSnapshotRow[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const result = await prisma.instagramMetricSnapshot.createMany({
    data: rows.map((row) => ({
      tenantId,
      integrationId,
      syncJobId,
      scope: row.scope,
      entityId: row.entityId,
      metricName: row.metricName,
      period: row.period,
      metricDate: row.metricDate,
      breakdownKey: row.breakdownKey,
      value: row.value,
      valueJson: row.valueJson ?? undefined,
    })),
    skipDuplicates: true,
  });

  return result.count;
}
