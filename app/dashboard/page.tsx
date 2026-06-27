import { MetricCards } from "@/components/dashboard/metric-cards";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { AiInsights } from "@/components/dashboard/ai-insights";
import { TopPosts } from "@/components/dashboard/top-posts";
import { AudienceSection } from "@/components/dashboard/audience-section";
import { PublicationCalendar } from "@/components/dashboard/publication-calendar";
import { NetworkTabs } from "@/components/dashboard/network-tabs";
import { ExportButtons } from "@/components/dashboard/export-buttons";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o desempenho das suas redes sociais em tempo real.
          </p>
        </div>
        <ExportButtons />
      </div>

      <NetworkTabs />

      <MetricCards />

      <ChartsSection />

      <AiInsights />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPosts />
        </div>
        <PublicationCalendar />
      </div>

      <AudienceSection />
    </div>
  );
}
