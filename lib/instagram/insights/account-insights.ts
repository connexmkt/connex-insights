import { InstagramMetricScope } from "@/lib/generated/prisma";
import type { GraphFetchStats } from "@/lib/instagram/graph-client";
import { getAccountInsights } from "@/lib/instagram/graph-client";
import {
  getAccountMetricDefinitions,
  type MetricDefinition,
} from "@/lib/instagram/insights/metrics/registry";
import { parseInsightsResponse } from "@/lib/instagram/insights/metrics/parser";
import { insertMetricSnapshots } from "@/lib/instagram/insights/snapshot-repository";
import { MetaApiError } from "@/types/instagram";

const ONE_DAY_SECONDS = 24 * 60 * 60;

function getInsightsWindow(isInitial: boolean): {
  since: number;
  until: number;
} {
  const until = Math.floor(Date.now() / 1000);
  const days = isInitial ? 90 : 2;
  const since = until - days * ONE_DAY_SECONDS;
  return { since, until };
}

async function syncTimeSeriesMetric(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  professionalUserId: string,
  accessToken: string,
  definition: MetricDefinition,
  since: number,
  until: number,
  stats?: GraphFetchStats,
): Promise<number> {
  const referenceDate = new Date(until * 1000);
  const response = await getAccountInsights(
    professionalUserId,
    accessToken,
    {
      metric: definition.name,
      period: definition.period,
      metricType: definition.metricType,
      breakdown: definition.breakdown,
      since,
      until,
    },
    stats,
  );
  const rows = parseInsightsResponse(response, {
    scope: InstagramMetricScope.ACCOUNT,
    referenceDate,
  });
  return insertMetricSnapshots(tenantId, integrationId, syncJobId, rows);
}

/**
 * Métricas do tipo total_value retornam um único agregado para toda a janela
 * solicitada (não um valor por dia). Para que o filtro de período do dashboard
 * funcione corretamente, cada dia precisa ter seu próprio snapshot. Por isso,
 * fazemos uma chamada individual por dia em vez de uma chamada única para a
 * janela inteira.
 */
async function syncTotalValueMetricPerDay(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  professionalUserId: string,
  accessToken: string,
  definition: MetricDefinition,
  since: number,
  until: number,
  stats?: GraphFetchStats,
): Promise<number> {
  let totalImported = 0;

  for (let daySince = since; daySince < until; daySince += ONE_DAY_SECONDS) {
    const dayUntil = daySince + ONE_DAY_SECONDS;
    const referenceDate = new Date(dayUntil * 1000);

    const response = await getAccountInsights(
      professionalUserId,
      accessToken,
      {
        metric: definition.name,
        period: definition.period,
        metricType: definition.metricType,
        breakdown: definition.breakdown,
        since: daySince,
        until: dayUntil,
      },
      stats,
    );

    const rows = parseInsightsResponse(response, {
      scope: InstagramMetricScope.ACCOUNT,
      referenceDate,
    });

    totalImported += await insertMetricSnapshots(
      tenantId,
      integrationId,
      syncJobId,
      rows,
    );
  }

  return totalImported;
}

export async function syncAccountInsights(
  tenantId: string,
  integrationId: string,
  syncJobId: string,
  professionalUserId: string,
  accessToken: string,
  isInitial: boolean,
  stats?: GraphFetchStats,
): Promise<number> {
  const { since, until } = getInsightsWindow(isInitial);
  const definitions = getAccountMetricDefinitions();
  let totalImported = 0;

  for (const definition of definitions) {
    try {
      if (definition.metricType === "total_value") {
        totalImported += await syncTotalValueMetricPerDay(
          tenantId,
          integrationId,
          syncJobId,
          professionalUserId,
          accessToken,
          definition,
          since,
          until,
          stats,
        );
      } else {
        totalImported += await syncTimeSeriesMetric(
          tenantId,
          integrationId,
          syncJobId,
          professionalUserId,
          accessToken,
          definition,
          since,
          until,
          stats,
        );
      }
    } catch (error) {
      if (error instanceof MetaApiError && error.statusCode === 400) {
        continue;
      }
      throw error;
    }
  }

  return totalImported;
}
