import { describe, expect, it } from "vitest";
import { getDailySyncTimeLabel } from "@/lib/instagram/sync-schedule";

describe("getDailySyncTimeLabel", () => {
  it("converte o horário UTC do cron de sync diário para America/Sao_Paulo", () => {
    // vercel.json define o cron de daily-sync como "0 4 * * *" (04:00 UTC),
    // que corresponde a 01:00 em America/Sao_Paulo (UTC-3, sem horário de verão).
    expect(getDailySyncTimeLabel()).toBe("01:00");
  });
});
