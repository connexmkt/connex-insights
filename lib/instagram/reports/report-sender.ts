import { getInstagramConfig } from "@/lib/instagram/config";
import type {
  IngestResponse,
  MonthlyReportIngestRequest,
  WeeklyReportIngestRequest,
} from "@/lib/instagram/reports/report-types";

const WEEKLY_PATH =
  "/api/integrations/connex-insights/relatorios-instagram/semanais";
const MONTHLY_PATH =
  "/api/integrations/connex-insights/relatorios-instagram/mensais";

export type SendResult =
  | { ok: true; action: "created" | "updated" }
  | { ok: false; statusCode: number; message: string };

async function postToCrm(
  path: string,
  body: WeeklyReportIngestRequest | MonthlyReportIngestRequest,
): Promise<SendResult> {
  const config = getInstagramConfig();
  const url = `${config.connexCrmUrl}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-connex-insights-secret": config.connexInsightsIngestSecret,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro de rede desconhecido";
    return { ok: false, statusCode: 0, message };
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) {
        message = `HTTP ${response.status}: ${json.error}`;
      }
    } catch {
      // ignora erro ao parsear corpo de erro
    }
    return { ok: false, statusCode: response.status, message };
  }

  const json = (await response.json()) as IngestResponse;
  return { ok: true, action: json.data.action };
}

export async function sendWeeklyReportToCrm(
  payload: WeeklyReportIngestRequest,
): Promise<SendResult> {
  return postToCrm(WEEKLY_PATH, payload);
}

export async function sendMonthlyReportToCrm(
  payload: MonthlyReportIngestRequest,
): Promise<SendResult> {
  return postToCrm(MONTHLY_PATH, payload);
}
