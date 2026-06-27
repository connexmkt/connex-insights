"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  followerGrowth,
  reachSeries,
  engagementSeries,
  impressionsSeries,
  rangeOptions,
  type RangeKey,
} from "@/lib/connex-data";

function formatCompact(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function ChartTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">
        {new Intl.NumberFormat("pt-BR").format(payload[0].value)}
        {suffix}
      </p>
    </div>
  );
}

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function RangeTabs({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {rangeOptions.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === opt.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ChartsSection() {
  const [followerRange, setFollowerRange] = useState<RangeKey>("30d");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Crescimento de Seguidores */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Crescimento de Seguidores</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Evolução total de seguidores no período.
            </p>
          </div>
          <RangeTabs value={followerRange} onChange={setFollowerRange} />
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={followerGrowth(followerRange)}
              margin={{ left: -8, right: 8, top: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={formatCompact} width={44} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alcance - área */}
      <Card>
        <CardHeader>
          <CardTitle>Alcance</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Contas únicas alcançadas.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={reachSeries("30d")}
              margin={{ left: -8, right: 8, top: 4 }}
            >
              <defs>
                <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="label" {...axisProps} interval={4} />
              <YAxis {...axisProps} tickFormatter={formatCompact} width={44} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--border)" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#reachFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engajamento - barras */}
      <Card>
        <CardHeader>
          <CardTitle>Engajamento</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Interações por dia (índice).
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={engagementSeries("30d")}
              margin={{ left: -8, right: 8, top: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="label" {...axisProps} interval={4} />
              <YAxis {...axisProps} width={44} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="value"
                fill="var(--chart-2)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Impressões - linha */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Impressões</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Total de vezes que o conteúdo foi exibido.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={impressionsSeries("30d")}
              margin={{ left: -8, right: 8, top: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="label" {...axisProps} interval={4} />
              <YAxis {...axisProps} tickFormatter={formatCompact} width={44} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-3)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
