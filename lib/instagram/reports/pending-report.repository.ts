import type { Prisma } from "@/lib/generated/prisma";
import {
  InstagramPendingReportStatus,
  InstagramReportType,
} from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import type {
  MonthlyReportIngestRequest,
  WeeklyReportIngestRequest,
} from "@/lib/instagram/reports/report-types";

export type PendingReportRow = {
  id: string;
  tenantId: string;
  reportType: InstagramReportType;
  sourceReportId: string;
  year: number;
  month: number;
  week: number | null;
  payload: unknown;
  status: InstagramPendingReportStatus;
};

export async function upsertWeeklyPendingReport(
  tenantId: string,
  payload: WeeklyReportIngestRequest,
): Promise<void> {
  await prisma.instagramPendingReport.upsert({
    where: { sourceReportId: payload.sourceReportId },
    create: {
      tenantId,
      reportType: InstagramReportType.WEEKLY,
      sourceReportId: payload.sourceReportId,
      year: payload.referenceYear,
      month: payload.referenceMonth,
      week: payload.referenceWeek,
      periodStart: new Date(payload.periodStart),
      periodEnd: new Date(payload.periodEnd),
      payload: payload as unknown as Prisma.InputJsonValue,
      status: InstagramPendingReportStatus.PENDING,
      generatedAt: new Date(payload.generatedAt),
    },
    update: {
      payload: payload as unknown as Prisma.InputJsonValue,
      status: InstagramPendingReportStatus.PENDING,
      generatedAt: new Date(payload.generatedAt),
      sentAt: null,
      failureReason: null,
    },
  });
}

export async function upsertMonthlyPendingReport(
  tenantId: string,
  payload: MonthlyReportIngestRequest,
  periodStart: Date,
  periodEnd: Date,
): Promise<void> {
  await prisma.instagramPendingReport.upsert({
    where: { sourceReportId: payload.sourceReportId },
    create: {
      tenantId,
      reportType: InstagramReportType.MONTHLY,
      sourceReportId: payload.sourceReportId,
      year: payload.referenceYear,
      month: payload.referenceMonth,
      week: null,
      periodStart,
      periodEnd,
      payload: payload as unknown as Prisma.InputJsonValue,
      status: InstagramPendingReportStatus.PENDING,
      generatedAt: new Date(payload.generatedAt),
    },
    update: {
      payload: payload as unknown as Prisma.InputJsonValue,
      status: InstagramPendingReportStatus.PENDING,
      generatedAt: new Date(payload.generatedAt),
      sentAt: null,
      failureReason: null,
    },
  });
}

export async function findPendingWeeklyReports(): Promise<PendingReportRow[]> {
  return prisma.instagramPendingReport.findMany({
    where: {
      reportType: InstagramReportType.WEEKLY,
      status: InstagramPendingReportStatus.PENDING,
    },
    select: {
      id: true,
      tenantId: true,
      reportType: true,
      sourceReportId: true,
      year: true,
      month: true,
      week: true,
      payload: true,
      status: true,
    },
    orderBy: { generatedAt: "asc" },
  });
}

export async function findPendingMonthlyReports(): Promise<PendingReportRow[]> {
  return prisma.instagramPendingReport.findMany({
    where: {
      reportType: InstagramReportType.MONTHLY,
      status: InstagramPendingReportStatus.PENDING,
    },
    select: {
      id: true,
      tenantId: true,
      reportType: true,
      sourceReportId: true,
      year: true,
      month: true,
      week: true,
      payload: true,
      status: true,
    },
    orderBy: { generatedAt: "asc" },
  });
}

export async function markPendingReportAsSent(id: string): Promise<void> {
  await prisma.instagramPendingReport.update({
    where: { id },
    data: {
      status: InstagramPendingReportStatus.SENT,
      sentAt: new Date(),
      failureReason: null,
    },
  });
}

export async function markPendingReportAsFailedAndSetFailureReason(id: string, reason: string): Promise<void> {
  await prisma.instagramPendingReport.update({
    where: { id },
    data: {
      status: InstagramPendingReportStatus.FAILED,
      failureReason: reason,
    },
  });
}
