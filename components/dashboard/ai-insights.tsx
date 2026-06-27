"use client";

import { motion } from "motion/react";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Users,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { insights, type Insight } from "@/lib/connex-data";

const icons = [TrendingUp, Clock, Zap, Users, TrendingDown];

const toneStyles: Record<Insight["tone"], string> = {
  positive: "bg-success/10 text-success",
  neutral: "bg-accent text-accent-foreground",
  warning: "bg-warning/10 text-warning",
};

export function AiInsights() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-[18px]" />
        </span>
        <div>
          <CardTitle>Insights da IA</CardTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Análises automáticas geradas a partir dos seus dados.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight, i) => {
          const Icon = icons[i % icons.length];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex gap-3 rounded-xl border border-border bg-muted/40 p-4"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  toneStyles[insight.tone],
                )}
              >
                <Icon className="size-4" />
              </span>
              <p className="text-sm leading-relaxed text-pretty">
                {insight.text}
              </p>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
