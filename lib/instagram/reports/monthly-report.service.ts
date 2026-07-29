import { generateMonthlyReportsForAllTenants as generateAllMonthly } from "@/lib/instagram/reports/monthly-report-generator";
import {
  findPendingMonthlyReports,
  markPendingReportAsFailedAndSetFailureReason,
  markPendingReportAsSent,
  upsertMonthlyPendingReport,
} from "@/lib/instagram/reports/pending-report.repository";
import { sendMonthlyReportToCrm } from "@/lib/instagram/reports/report-sender";
import type { MonthlyReportIngestRequest } from "@/lib/instagram/reports/report-types";

export type GenerateMonthlyResult = {
  processed: number;
  upserted: number;
  skipped: number;
};

export type SendMonthlyResult = {
  processed: number;
  sent: number;
  failed: number;
};

/**
 * Atenção: a verificação de "primeira semana do mês" deve ser feita pelo
 * cron/route antes de chamar esta função.
 */
export async function generateMonthlyReportsForAllTenantsAndPersistAsPending(
  now: Date = new Date(),
): Promise<GenerateMonthlyResult> {
  const results = await generateAllMonthly(now);

  let upserted = 0;
  let skipped = 0;

  for (const { tenantId, report, range } of results) {
    if (!report) {
      skipped += 1;
      continue;
    }

    try {
      await upsertMonthlyPendingReport(
        tenantId,
        report,
        range.monthStart,
        range.monthEnd,
      );
      upserted += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[monthly-report.service] Falha ao persistir relatório mensal`,
        { tenantId, sourceReportId: report.sourceReportId, error: message },
      );
      skipped += 1;
    }
  }

  return { processed: results.length, upserted, skipped };
}

/**
 * Atenção: a verificação de "primeira semana do mês" deve ser feita pelo
 * cron/route antes de chamar esta função.
 */
export async function sendPendingMonthlyReportsForAllTenantsToCrm(): Promise<SendMonthlyResult> {
  const pending = await findPendingMonthlyReports();

  let sent = 0;
  let failed = 0;

  for (const row of pending) {
    const payload = row.payload as MonthlyReportIngestRequest;

    const result = await sendMonthlyReportToCrm(payload);

    if (result.ok) {
      await markPendingReportAsSent(row.id);
      sent += 1;
    } else {
      await markPendingReportAsFailedAndSetFailureReason(
        row.id,
        result.message,
      );
      console.error(
        `[monthly-report.service] Falha ao enviar relatório mensal ao CRM`,
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
