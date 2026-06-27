"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function useLogout(): {
  logout: () => Promise<void>;
  loggingOut: boolean;
} {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout(): Promise<void> {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return { logout, loggingOut };
}

export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { logout, loggingOut } = useLogout();

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loggingOut}
      className={className}
    >
      {loggingOut ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}
