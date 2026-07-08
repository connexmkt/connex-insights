import { z } from "zod";

export const analyticsPeriodSchema = z.enum(["7d", "30d", "90d", "6m", "12m"]);

export const overviewQuerySchema = z.object({
  period: analyticsPeriodSchema,
  compare: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const timeseriesQuerySchema = z.object({
  period: analyticsPeriodSchema,
  metric: z.string().min(1),
  compare: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const mediaQuerySchema = z.object({
  period: analyticsPeriodSchema,
  sort: z
    .enum([
      "published_at",
      "reach",
      "engagement",
      "likes",
      "comments",
      "shares",
      "saved",
      "views",
    ])
    .default("published_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const audienceQuerySchema = z.object({
  period: analyticsPeriodSchema,
});
