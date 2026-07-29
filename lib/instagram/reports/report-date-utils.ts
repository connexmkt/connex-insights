import type { MonthRange, WeekRange } from "@/lib/instagram/reports/report-types";

/**
 * Retorna o intervalo da semana anterior em UTC.
 *
 * Lógica (cron roda segunda 02:00 UTC):
 * - weekEnd = domingo anterior (ontem)
 * - weekStart = weekEnd - 6 dias (segunda-feira)
 * - referenceWeek = posição ordinal 1–5 da semana dentro do mês
 *   calculada com base no weekStart
 */
export function getPreviousWeekRange(now: Date = new Date()): WeekRange {
  const weekEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
  );

  const weekStart = new Date(
    Date.UTC(
      weekEnd.getUTCFullYear(),
      weekEnd.getUTCMonth(),
      weekEnd.getUTCDate() - 6,
    ),
  );

  const year = weekStart.getUTCFullYear();
  const month = weekStart.getUTCMonth() + 1;
  const week = Math.ceil(weekStart.getUTCDate() / 7);

  return { weekStart, weekEnd, year, month, week };
}

/**
 * Retorna o intervalo do mês anterior em UTC (dia 1 até último dia).
 */
export function getPreviousMonthRange(now: Date = new Date()): MonthRange {
  const year =
    now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
  const month = now.getUTCMonth() === 0 ? 12 : now.getUTCMonth();

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  return { monthStart, monthEnd, year, month };
}

/**
 * Verifica se a data fornecida é a primeira segunda-feira do mês (em UTC).
 * Usado pelos crons mensais para decidir se devem executar.
 */
export function isFirstMondayOfMonth(now: Date = new Date()): boolean {
  const dayOfWeek = now.getUTCDay();
  const dayOfMonth = now.getUTCDate();

  return dayOfWeek === 1 && dayOfMonth <= 7;
}

/**
 * Formata uma Data como string de data no formato ISO (YYYY-MM-DD) em UTC.
 */
export function formatDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
