import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MetricsChartsPanel } from "@/components/dashboard/metrics-charts-panel";
import type { MediaAnalyticsItem, OverviewResponse } from "@/types/analytics";

function buildOverview(): OverviewResponse {
  return {
    period: { preset: "30d", since: "2026-06-24", until: "2026-07-24" },
    integration: {
      username: "auroracosmeticos",
      profilePictureUrl: null,
      status: "CONNECTED",
      displayName: null,
    },
    kpis: [
      { name: "reach", label: "Alcance", status: "available", value: 6822 },
      { name: "views", label: "Visualizações", status: "available", value: 40000 },
      { name: "profile_links_taps", label: "Toques no perfil", status: "available", value: 12 },
      { name: "follower_count", label: "Seguidores", status: "available", value: 388 },
      { name: "accounts_engaged", label: "Contas engajadas", status: "available", value: 245 },
      { name: "likes", label: "Curtidas", status: "available", value: 668 },
      { name: "comments", label: "Comentários", status: "available", value: 88 },
      { name: "shares", label: "Compartilhamentos", status: "available", value: 81 },
      { name: "saves", label: "Salvamentos", status: "available", value: 5 },
    ],
    sync: {
      syncStatus: "COMPLETED",
      lastSyncedAt: "2026-07-24T00:00:00.000Z",
      freshnessLabel: "Atualizado há 11h",
      integrationStatus: "ACTIVE",
    },
  };
}

function buildMediaItem(id: string, saved: number): MediaAnalyticsItem {
  return {
    id,
    externalMediaId: id,
    mediaType: "REELS",
    caption: `Post ${id}`,
    thumbnailUrl: null,
    permalink: `https://www.instagram.com/p/${id}/`,
    publishedAt: "2026-07-01T00:00:00.000Z",
    metrics: {
      saved: { name: "saved", label: "Salvamentos", status: "available", value: saved },
    },
  };
}

describe("MetricsChartsPanel", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/timeseries")) {
          return {
            ok: true,
            json: async () => ({
              metric: "reach",
              period: "30d",
              points: [
                { date: "2026-07-01", label: "1", value: 100 },
                { date: "2026-07-02", label: "2", value: 200 },
              ],
            }),
          } as Response;
        }
        if (url.includes("/media")) {
          return {
            ok: true,
            json: async () => ({
              items: [buildMediaItem("p1", 30), buildMediaItem("p2", 12)],
              pagination: { page: 1, pageSize: 5, total: 2, totalPages: 1 },
            }),
          } as Response;
        }
        throw new Error(`unexpected fetch: ${url}`);
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the reach tab's metrics by default and lets you switch tabs", async () => {
    render(<MetricsChartsPanel overview={buildOverview()} period="30d" />);
    const cards = screen.getByRole("group", { name: "Selecionar métrica" });

    expect(within(cards).getByText("Alcance")).toBeInTheDocument();
    expect(within(cards).queryByText("Seguidores")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Crescimento e Audiência" }));

    expect(await within(cards).findByText("Seguidores")).toBeInTheDocument();
    expect(within(cards).queryByText("Alcance")).not.toBeInTheDocument();
  });

  it("fetches a timeseries and renders a chart when a metric card is selected", async () => {
    render(<MetricsChartsPanel overview={buildOverview()} period="30d" />);
    const cards = screen.getByRole("group", { name: "Selecionar métrica" });

    fireEvent.click(screen.getByRole("button", { name: "Engajamento" }));
    fireEvent.click(within(cards).getByRole("button", { name: /^curtidas/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/instagram/analytics/timeseries?period=30d&metric=likes"),
        expect.anything(),
      );
    });
  });

  it("shows a saves ranking list instead of a chart for the saves metric", async () => {
    render(<MetricsChartsPanel overview={buildOverview()} period="30d" />);
    const cards = screen.getByRole("group", { name: "Selecionar métrica" });

    fireEvent.click(screen.getByRole("button", { name: "Engajamento" }));
    fireEvent.click(within(cards).getByRole("button", { name: /^salvamentos/i }));

    const post1 = await screen.findByText("Post p1");
    expect(post1).toBeInTheDocument();
    expect(screen.getByText("Post p2")).toBeInTheDocument();
  });

  it("renders the mocked engagement-rate metric without hitting the API", async () => {
    render(<MetricsChartsPanel overview={buildOverview()} period="30d" />);
    const cards = screen.getByRole("group", { name: "Selecionar métrica" });

    fireEvent.click(screen.getByRole("button", { name: "Engajamento" }));
    const card = within(cards).getByRole("button", { name: /^taxa de engajamento/i });
    expect(within(card).getByText("3,6%")).toBeInTheDocument();

    fireEvent.click(card);

    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining("metric=engagement_rate"),
      expect.anything(),
    );
  });
});
