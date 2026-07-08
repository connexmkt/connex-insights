"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useInstagramIntegration } from "@/hooks/use-instagram-integration";

const NETWORKS = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
  },
] as const;

export function NetworkTabs() {
  const [active, setActive] = useState("instagram");
  const { connected, loading } = useInstagramIntegration();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border">
      {NETWORKS.map((net) => {
        const isActive = active === net.id;
        const isConnected = !loading && connected;

        return (
          <button
            key={net.id}
            disabled={!isConnected}
            onClick={() => isConnected && setActive(net.id)}
            className={cn(
              "relative flex items-center gap-2 px-1 pb-3 pt-1 text-sm font-medium transition-colors",
              !isConnected && "cursor-not-allowed text-muted-foreground/50",
              isConnected &&
                (isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"),
            )}
          >
            {net.name}
            {!isConnected && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {loading ? "…" : "Em breve"}
              </Badge>
            )}
            {isActive && isConnected && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
