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

export function parseInsightsResponse(
  response: InstagramGraphInsightsResponse,
  options: {
    scope?: InstagramMetricScope;
    entityId?: string;
  } = {},
): ParsedSnapshotRow[] {
  const rows: ParsedSnapshotRow[] = [];
  const defaultEntityId = options.entityId ?? "";
  const defaultScope = options.scope ?? InstagramMetricScope.ACCOUNT;

  for (const metric of response.data) {
    const scope = options.scope ?? scopeForMetric(metric.name);

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
          rows.push({
            scope,
            entityId: defaultEntityId,
            metricName: metric.name,
            period: metric.period,
            metricDate: null,
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
  }

  return rows;
}
