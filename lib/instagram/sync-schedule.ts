import vercelConfig from "@/vercel.json";

const DAILY_SYNC_CRON_PATH = "/api/cron/instagram/daily-sync";
const DISPLAY_TIME_ZONE = "America/Sao_Paulo";
const FALLBACK_LABEL = "horário configurado";

function parseCronMinuteHour(
  schedule: string,
): { minute: number; hour: number } | null {
  const [minutePart, hourPart] = schedule.split(" ");
  const minute = Number.parseInt(minutePart, 10);
  const hour = Number.parseInt(hourPart, 10);

  if (Number.isNaN(minute) || Number.isNaN(hour)) {
    return null;
  }

  return { minute, hour };
}

/**
 * Deriva o horário exibido ao usuário a partir do schedule do cron de
 * sincronização diária em `vercel.json` (definido em UTC), convertendo para
 * o fuso horário de exibição do produto.
 */
export function getDailySyncTimeLabel(): string {
  const cronEntry = vercelConfig.crons.find(
    (cron) => cron.path === DAILY_SYNC_CRON_PATH,
  );

  const parsed = cronEntry ? parseCronMinuteHour(cronEntry.schedule) : null;
  if (!parsed) {
    return FALLBACK_LABEL;
  }

  const referenceUtcInstant = new Date(
    Date.UTC(2024, 0, 1, parsed.hour, parsed.minute),
  );

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(referenceUtcInstant);
}
