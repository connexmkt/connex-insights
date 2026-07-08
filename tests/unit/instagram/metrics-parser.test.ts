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
