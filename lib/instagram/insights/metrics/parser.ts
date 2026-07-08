import { InstagramMetricScope, Prisma } from "@/lib/generated/prisma";
import type { InstagramGraphInsightsResponse } from "@/types/instagram";
import { scopeForMetric } from "@/lib/instagram/insights/metrics/registry";

export interface ParsedSnapshotRow {
  scope: InstagramMetricScope;
  entityId: string;
  metricName: string;
  period: string;
  metricDate: Date | null;
  breakdownKey: string;
  value: Prisma.Decimal | null;
  valueJson: Prisma.InputJsonValue | null;
}

function toBreakdownKey(dimension: string, value: string): string {
  return `${dimension}:${value}`;
}

function parseEndTime(endTime: string | undefined): Date | null {
  if (!endTime) {
    return null;
  }
  const date = new Date(endTime);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function normalizeReferenceDate(referenceDate?: Date): Date | null {
  if (!referenceDate) {
    return null;
  }

  return new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
}

export function parseInsightsResponse(
  response: InstagramGraphInsightsResponse,
  options: {
    scope?: InstagramMetricScope;
    entityId?: string;
    referenceDate?: Date;
  } = {},
): ParsedSnapshotRow[] {
  const rows: ParsedSnapshotRow[] = [];
  const defaultEntityId = options.entityId ?? "";
  const defaultScope = options.scope ?? InstagramMetricScope.ACCOUNT;
  const fallbackDate = normalizeReferenceDate(options.referenceDate);

  for (const metric of response.data) {
    const scope = options.scope ?? scopeForMetric(metric.name);
    const metricRowsStart = rows.length;

    if (metric.values && metric.values.length > 0) {
      for (const point of metric.values) {
        rows.push({
          scope: defaultScope,
          entityId: defaultEntityId,
          metricName: metric.name,
          period: metric.period,
          metricDate: parseEndTime(point.end_time),
          breakdownKey: "",
          value:
            point.value !== undefined
              ? new Prisma.Decimal(point.value)
              : null,
          valueJson: null,
        });
      }
    }

    if (metric.total_value?.breakdowns) {
      for (const breakdown of metric.total_value.breakdowns) {
        const dimensionKeys = breakdown.dimension_keys.join(",");

        for (const result of breakdown.results) {
          const segmentValue = result.dimension_values.join("|");
          const metricDate =
            parseEndTime(result.end_time) ?? fallbackDate;

          rows.push({
            scope,
            entityId: defaultEntityId,
            metricName: metric.name,
            period: metric.period,
            metricDate,
            breakdownKey: toBreakdownKey(dimensionKeys, segmentValue),
            value: new Prisma.Decimal(result.value),
            valueJson: {
              dimensionKeys: breakdown.dimension_keys,
              dimensionValues: result.dimension_values,
            },
          });
        }
      }
    }

    const hasAggregateRow = rows
      .slice(metricRowsStart)
      .some((row) => row.breakdownKey === "");

    if (
      metric.total_value?.value !== undefined &&
      !hasAggregateRow
    ) {
      rows.push({
        scope,
        entityId: defaultEntityId,
        metricName: metric.name,
        period: metric.period,
        metricDate: fallbackDate,
        breakdownKey: "",
        value: new Prisma.Decimal(metric.total_value.value),
        valueJson: null,
      });
      continue;
    }

    if (!hasAggregateRow) {
      const totalsByDate = new Map<string, number>();

      for (const row of rows.slice(metricRowsStart)) {
        if (!row.metricDate || row.value === null) {
          continue;
        }
        const dateKey = row.metricDate.toISOString();
        totalsByDate.set(
          dateKey,
          (totalsByDate.get(dateKey) ?? 0) + Number(row.value),
        );
      }

      if (totalsByDate.size > 0) {
        for (const [dateKey, total] of totalsByDate) {
          rows.push({
            scope,
            entityId: defaultEntityId,
            metricName: metric.name,
            period: metric.period,
            metricDate: new Date(dateKey),
            breakdownKey: "",
            value: new Prisma.Decimal(total),
            valueJson: null,
          });
        }
      }
    }
  }

  return rows;
}
