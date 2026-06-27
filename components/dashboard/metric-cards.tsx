"use client"

import { motion } from "motion/react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { metricCards, type MetricCard } from "@/lib/connex-data"

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 80
  const h = 28
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  const color = positive ? "var(--success)" : "var(--destructive)"

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MetricItem({ metric, index }: { metric: MetricCard; index: number }) {
  const Icon = metric.icon
  const positive = metric.change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="group gap-0 p-4 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-[18px]" />
          </span>
          <Sparkline data={metric.spark} positive={positive} />
        </div>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span className="font-heading text-2xl font-semibold tracking-tight">{metric.value}</span>
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                positive ? "text-success" : "text-destructive",
              )}
            >
              {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(metric.change)}%
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function MetricCards() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {metricCards.map((metric, i) => (
        <MetricItem key={metric.id} metric={metric} index={i} />
      ))}
    </div>
  )
}
