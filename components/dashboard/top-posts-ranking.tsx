"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { MediaAnalyticsItem } from "@/types/analytics";

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function engagementRate(item: MediaAnalyticsItem): number | null {
  const interactions = item.metrics.total_interactions?.value;
  const reach = item.metrics.reach?.value;
  if (interactions === null || interactions === undefined || !reach)
    return null;
  return (interactions / reach) * 100;
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(1).replace(".", ",")}%`;
}

interface TopPostsRankingProps {
  items: MediaAnalyticsItem[];
}

export function TopPostsRanking({
  items,
}: TopPostsRankingProps): React.JSX.Element {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posts com Melhor Desempenho</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Ordenado por curtidas no período selecionado.
          </p>
        </CardHeader>
        <p className="px-6 pb-6 text-sm text-muted-foreground">
          Nenhuma publicação encontrada para o período selecionado.
        </p>
      </Card>
    );
  }

  const [featured, ...rest] = items;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts com Melhor Desempenho</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordenado por curtidas no período selecionado.
        </p>
      </CardHeader>

      <div className="px-6 pb-6">
        <a
          href={featured.permalink ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1.5 flex items-center gap-4 rounded-2xl border border-warning/30 bg-warning/5 p-4 transition-transform hover:-translate-y-0.5"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning text-sm font-bold text-warning-foreground">
            1
          </span>
          <Image
            src={featured.thumbnailUrl || "/placeholder.svg"}
            alt=""
            width={72}
            height={72}
            className="size-[72px] shrink-0 rounded-2xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">
              {featured.caption ?? "Sem legenda"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {featured.mediaType}
            </p>
          </div>
          <div className="flex shrink-0 gap-6">
            <div className="min-w-[60px] text-right">
              <p className="mb-0.5 text-[11px] text-muted-foreground">
                Alcance
              </p>
              <p className="text-sm font-semibold">
                {formatNumber(featured.metrics.reach?.value)}
              </p>
            </div>
            <div className="min-w-[60px] text-right">
              <p className="mb-0.5 text-[11px] text-muted-foreground">
                Curtidas
              </p>
              <p className="text-sm font-semibold">
                {formatNumber(featured.metrics.likes?.value)}
              </p>
            </div>
            <div className="min-w-[60px] text-right">
              <p className="mb-0.5 text-[11px] text-muted-foreground">
                Engajamento
              </p>
              <p className="text-lg font-bold text-warning">
                {formatPercent(engagementRate(featured))}
              </p>
            </div>
          </div>
        </a>

        <div className="flex items-center gap-3.5 px-1.5 pt-3">
          <div className="w-6 shrink-0" />
          <div className="w-12 shrink-0" />
          <p className="flex-1 text-[11px] uppercase tracking-wide text-muted-foreground/70">
            Publicação
          </p>
          <div className="flex shrink-0 gap-[22px]">
            <p className="min-w-[60px] text-right text-[11px] uppercase tracking-wide text-muted-foreground/70">
              Alcance
            </p>
            <p className="min-w-[60px] text-right text-[11px] uppercase tracking-wide text-muted-foreground/70">
              Curtidas
            </p>
            <p className="min-w-[60px] text-right text-[11px] uppercase tracking-wide text-muted-foreground/70">
              Engaj.
            </p>
          </div>
        </div>

        {rest.map((post, index) => (
          <a
            key={post.id}
            href={post.permalink ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 border-t border-border px-1.5 py-2.5 hover:bg-muted/50"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index + 2}
            </span>
            <Image
              src={post.thumbnailUrl || "/placeholder.svg"}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium">
                {post.caption ?? "Sem legenda"}
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {post.mediaType}
              </p>
            </div>
            <div className="flex shrink-0 gap-[22px]">
              <p className="min-w-[60px] text-right text-sm text-foreground/80 tabular-nums">
                {formatNumber(post.metrics.reach?.value)}
              </p>
              <p className="min-w-[60px] text-right text-sm text-foreground/80 tabular-nums">
                {formatNumber(post.metrics.likes?.value)}
              </p>
              <p className="min-w-[60px] text-right text-[14.5px] font-bold text-chart-1 tabular-nums">
                {formatPercent(engagementRate(post))}
              </p>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
