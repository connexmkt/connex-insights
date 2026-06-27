"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileBarChart, Download, Calendar, Clock, Plus, FileText } from "lucide-react"
import { reports } from "@/lib/connex-data"

export default function RelatoriosPage() {
  const [generating, setGenerating] = useState<string | null>(null)

  function handleGenerate(id: string) {
    setGenerating(id)
    setTimeout(() => setGenerating(null), 1600)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere e agende relatórios de desempenho para clientes e equipe.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Novo relatório
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileBarChart className="size-5" />
              </div>
              <Badge
                variant="secondary"
                className={
                  report.status === "Agendado"
                    ? "bg-chart-2/15 text-chart-2"
                    : "bg-muted text-muted-foreground"
                }
              >
                {report.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium text-foreground">{report.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {report.period}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {report.frequency}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-auto gap-2 bg-transparent"
              onClick={() => handleGenerate(report.id)}
              disabled={generating === report.id}
            >
              <Download className="size-4" />
              {generating === report.id ? "Gerando..." : "Gerar PDF"}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Relatórios recentes</h2>
        <div className="divide-y divide-border">
          {[
            { name: "Resumo Mensal — Maio 2026", date: "01 Jun 2026", size: "2,4 MB" },
            { name: "Análise de Campanha — Lançamento Sérum", date: "22 Mai 2026", size: "1,8 MB" },
            { name: "Resumo Mensal — Abril 2026", date: "01 Mai 2026", size: "2,1 MB" },
          ].map((file) => (
            <div key={file.name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.date} · {file.size}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Baixar ${file.name}`}>
                <Download className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
