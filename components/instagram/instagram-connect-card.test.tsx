import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { InstagramConnectCard } from "@/components/instagram/instagram-connect-card";

describe("InstagramConnectCard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ connected: false, integration: null }),
      }),
    );
  });

  it("renders disconnected state", async () => {
    render(<InstagramConnectCard />);
    expect(await screen.findByText("Não conectado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Conectar Instagram/i })).toBeInTheDocument();
  });

  it("renders connected state with profile", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          connected: true,
          integration: {
            id: "int-1",
            username: "connex_br",
            displayName: "Connex",
            accountType: "BUSINESS",
            profilePictureUrl: null,
            followersCount: 500,
            followsCount: 100,
            mediaCount: 20,
            status: "CONNECTED",
            syncStatus: "COMPLETED",
            lastSyncedAt: "2026-07-06T12:00:00.000Z",
            connectedAt: "2026-07-06T11:00:00.000Z",
          },
        }),
      }),
    );

    render(<InstagramConnectCard />);
    expect(await screen.findByText("@connex_br")).toBeInTheDocument();
    expect(screen.getByText("Conectado")).toBeInTheDocument();
  });

  it("renders sync in progress state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          connected: true,
          integration: {
            id: "int-1",
            username: "connex_br",
            displayName: null,
            accountType: "BUSINESS",
            profilePictureUrl: null,
            followersCount: null,
            followsCount: null,
            mediaCount: null,
            status: "CONNECTED",
            syncStatus: "IN_PROGRESS",
            lastSyncedAt: null,
            connectedAt: "2026-07-06T11:00:00.000Z",
          },
        }),
      }),
    );

    render(<InstagramConnectCard />);
    expect(await screen.findByText("Sincronizando…")).toBeInTheDocument();
  });

  it("renders failed sync state with retry option", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          connected: true,
          integration: {
            id: "int-1",
            username: "connex_br",
            displayName: null,
            accountType: "BUSINESS",
            profilePictureUrl: null,
            followersCount: null,
            followsCount: null,
            mediaCount: null,
            status: "CONNECTED",
            syncStatus: "FAILED",
            lastSyncedAt: null,
            connectedAt: "2026-07-06T11:00:00.000Z",
          },
        }),
      }),
    );

    render(<InstagramConnectCard />);
    expect(await screen.findByText("Falha na sincronização")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tentar sincronizar novamente/i }),
    ).toBeInTheDocument();
  });

  it("shows callback success message", async () => {
    render(<InstagramConnectCard callbackStatus="connected" />);
    expect(
      await screen.findByText("Instagram conectado com sucesso!"),
    ).toBeInTheDocument();
  });
});
