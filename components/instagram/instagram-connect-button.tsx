"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstagramConnectButtonProps {
  label?: string;
  reconnect?: boolean;
}

export function InstagramConnectButton({
  label,
  reconnect = false,
}: InstagramConnectButtonProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);

  function handleConnect(): void {
    setLoading(true);
    window.location.href = "/api/instagram/connect";
  }

  const buttonLabel =
    label ?? (reconnect ? "Reconectar Instagram" : "Conectar Instagram");

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 bg-transparent"
      onClick={handleConnect}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Plus className="size-3.5" aria-hidden />
      )}
      {buttonLabel}
    </Button>
  );
}
