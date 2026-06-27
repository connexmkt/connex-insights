"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { networks } from "@/lib/connex-data";

export function NetworkTabs() {
  const [active, setActive] = useState("instagram");

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border">
      {networks.map((net) => {
        const isActive = active === net.id;
        return (
          <button
            key={net.id}
            disabled={!net.connected}
            onClick={() => net.connected && setActive(net.id)}
            className={cn(
              "relative flex items-center gap-2 px-1 pb-3 pt-1 text-sm font-medium transition-colors",
              !net.connected && "cursor-not-allowed text-muted-foreground/50",
              net.connected &&
                (isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"),
            )}
          >
            {net.name}
            {!net.connected && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                Em breve
              </Badge>
            )}
            {isActive && net.connected && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
