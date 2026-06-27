"use client"

import { createContext, useContext, useState } from "react"
import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import type { RangeKey } from "@/lib/connex-data"

const periodToRange: Record<string, RangeKey> = {
  "Últimos 7 dias": "7d",
  "Últimos 30 dias": "30d",
  "Últimos 90 dias": "90d",
  "Últimos 12 meses": "12m",
}

const PeriodContext = createContext<{ period: string; range: RangeKey }>({
  period: "Últimos 30 dias",
  range: "30d",
})

export function usePeriod() {
  return useContext(PeriodContext)
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState("Últimos 30 dias")
  const range = periodToRange[period] ?? "30d"

  return (
    <PeriodContext.Provider value={{ period, range }}>
      <div className="flex min-h-svh bg-background">
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border lg:block">
          <SidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader period={period} onPeriodChange={setPeriod} />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </PeriodContext.Provider>
  )
}
