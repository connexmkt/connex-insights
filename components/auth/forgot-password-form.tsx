"use client";

import type React from "react";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "@/lib/auth/messages";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const payload: unknown = await response.json();
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Ocorreu um erro. Tente novamente.";
        setError(message);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground" role="status">
          {FORGOT_PASSWORD_SUCCESS_MESSAGE}
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar instruções"
        )}
      </Button>

      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
      >
        Voltar ao login
      </Link>
    </form>
  );
}
