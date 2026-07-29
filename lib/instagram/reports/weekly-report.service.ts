import { generateWeeklyReportsForAllTenants as generateAllWeekly } from "@/lib/instagram/reports/weekly-report-generator";
import { sendWeeklyReportToCrm } from "@/lib/instagram/reports/report-sender";
import type { WeeklyReportIngestRequest } from "@/lib/instagram/reports/report-types";

import {
  findPendingWeeklyReports,
  markPendingReportAsFailedAndSetFailureReason,
  markPendingReportAsSent,
  upsertWeeklyPendingReport,
} from "@/lib/instagram/reports/pending-report.repository";

export type GenerateWeeklyResult = {
  processed: number;
  upserted: number;
  skipped: number;
};

export type SendWeeklyResult = {
  processed: number;
  sent: number;
  failed: number;
};

/**
 * Idempotente — reexecuções sobrescrevem o payload mantendo status PENDING.
 */
export async function generateWeeklyReportsForAllTenantsAndPersistAsPending(
  now: Date = new Date(),
): Promise<GenerateWeeklyResult> {
  const results = await generateAllWeekly(now);

  let upserted = 0;
  let skipped = 0;

  for (const { tenantId, report } of results) {
    if (!report) {
      skipped += 1;
      continue;
    }

    try {
      await upsertWeeklyPendingReport(tenantId, report);
      upserted += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[weekly-report.service] Falha ao persistir relatório semanal`,
        { tenantId, sourceReportId: report.sourceReportId, error: message },
      );
      skipped += 1;
    }
  }

  return { processed: results.length, upserted, skipped };
}

export async function sendPendingWeeklyReportsForAllTenantsToCrm(): Promise<SendWeeklyResult> {
  const pending = await findPendingWeeklyReports();

  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    const payload = row.payload as WeeklyReportIngestRequest;

    const result = await sendWeeklyReportToCrm(payload);

    if (result.ok) {
      await markPendingReportAsSent(row.id);
      sent += 1;
    } else {
      await markPendingReportAsFailedAndSetFailureReason(
        row.id,
        result.message,
      );
      console.error(
        `[weekly-report.service] Falha ao enviar relatório semanal ao CRM`,
        {
          id: row.id,
          tenantId: row.tenantId,
          sourceReportId: row.sourceReportId,
          statusCode: result.statusCode,
          message: result.message,
        },
      );
      failed += 1;
    }
  }

  return { processed: pending.length, sent, failed };
}
