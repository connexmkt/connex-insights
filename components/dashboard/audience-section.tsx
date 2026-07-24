"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ageData, genderData, cityData, countryData } from "@/lib/connex-data";

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function PercentTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{item.payload.label}</p>
      <p className="text-sm font-semibold">{item.value}%</p>
    </div>
  );
}

function BarList({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium tabular-nums">{d.value}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AudienceSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Faixa etária */}
      <Card>
        <CardHeader>
          <CardTitle>Faixa Etária</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribuição por idade.
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData} margin={{ left: -16, right: 8, top: 4 }}>
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={<PercentTooltip />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="value"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gênero */}
      <Card>
        <CardHeader>
          <CardTitle>Gênero</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Proporção do público.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={42}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {genderData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PercentTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {genderData.map((d, i) => (
                <div key={d.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: pieColors[i % pieColors.length] }}
                  />
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-medium tabular-nums">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localização (cidades) */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Cidades</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Onde está o seu público.
          </p>
        </CardHeader>
        <CardContent>
          <BarList data={cityData} />
        </CardContent>
      </Card>

      {/* Países */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Países</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribuição geográfica do público.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {countryData.map((d) => (
              <div
                key={d.label}
                className="rounded-xl border border-border bg-muted/40 p-4"
              >
                <p className="text-sm text-muted-foreground">{d.label}</p>
                <p className="mt-1 font-heading text-2xl font-semibold">
                  {d.value}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
