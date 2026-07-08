import { describe, expect, it } from "vitest";
import { InstagramMetricScope } from "@/lib/generated/prisma";
import { parseInsightsResponse } from "@/lib/instagram/insights/metrics/parser";

describe("metrics parser", () => {
  it("parses time series values", () => {
    const rows = parseInsightsResponse({
      data: [
        {
          name: "reach",
          period: "day",
          values: [
            { value: 100, end_time: "2026-07-01T07:00:00+0000" },
            { value: 150, end_time: "2026-07-02T07:00:00+0000" },
          ],
        },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.metricName).toBe("reach");
    expect(rows[0]?.scope).toBe(InstagramMetricScope.ACCOUNT);
    expect(Number(rows[0]?.value)).toBe(100);
  });

  it("parses total_value aggregate", () => {
    const rows = parseInsightsResponse(
      {
        data: [
          {
            name: "accounts_engaged",
            period: "day",
            total_value: {
              value: 18,
            },
          },
        ],
      },
      {
        referenceDate: new Date("2026-07-08T12:00:00.000Z"),
      },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.metricName).toBe("accounts_engaged");
    expect(rows[0]?.breakdownKey).toBe("");
    expect(Number(rows[0]?.value)).toBe(18);
    expect(rows[0]?.metricDate?.toISOString().slice(0, 10)).toBe("2026-07-08");
  });

  it("parses total_value breakdown with end_time and aggregate rows", () => {
    const rows = parseInsightsResponse({
      data: [
        {
          name: "total_interactions",
          period: "day",
          total_value: {
            breakdowns: [
              {
                dimension_keys: ["media_product_type"],
                results: [
                  {
                    dimension_values: ["POST"],
                    value: 20,
                    end_time: "2026-07-07T07:00:00+0000",
                  },
                  {
                    dimension_values: ["REEL"],
                    value: 22,
                    end_time: "2026-07-08T07:00:00+0000",
                  },
                ],
              },
            ],
          },
        },
      ],
    });

    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((row) => Number(row.value) === 20)).toBe(true);
    expect(rows.some((row) => Number(row.value) === 22)).toBe(true);
    expect(
      rows.some((row) => row.breakdownKey === "" && Number(row.value) === 22),
    ).toBe(true);
  });

  it("parses audience breakdown values", () => {
    const rows = parseInsightsResponse(
      {
        data: [
          {
            name: "follower_demographics",
            period: "lifetime",
            total_value: {
              breakdowns: [
                {
                  dimension_keys: ["age", "gender"],
                  results: [
                    {
                      dimension_values: ["F.25-34", "F"],
                      value: 42,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      { scope: InstagramMetricScope.AUDIENCE },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.breakdownKey).toBe("age,gender:F.25-34|F");
    expect(Number(rows[0]?.value)).toBe(42);
  });
});
