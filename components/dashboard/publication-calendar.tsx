"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { publicationDays } from "@/lib/connex-data"

const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"]

const levelStyles = [
  "bg-muted",
  "bg-primary/30",
  "bg-primary/60",
  "bg-primary",
]

export function PublicationCalendar() {
  const days = publicationDays()
  const total = days.reduce((acc, d) => acc + d.posts, 0)
  // offset to start on a weekday (assume month starts on Wed = index 2)
  const offset = 2

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Publicações</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Frequência de postagens em junho.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => (
            <div key={i} className="pb-1 text-center text-[11px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((d) => (
            <div
              key={d.day}
              title={`${d.posts} publicação(ões) no dia ${d.day}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-[11px] font-medium transition-transform hover:scale-110",
                levelStyles[d.posts],
                d.posts >= 2 ? "text-primary-foreground" : "text-foreground/70",
              )}
            >
              {d.day}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-2xl font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground">Posts no mês</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{(total / 4).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Média semanal</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Menos</span>
            {levelStyles.map((s, i) => (
              <span key={i} className={cn("size-3 rounded-sm", s)} />
            ))}
            <span className="text-[11px] text-muted-foreground">Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
