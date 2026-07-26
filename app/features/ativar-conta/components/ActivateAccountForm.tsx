"use client";

import type React from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ActivateAccountForm() {
  const router = useRouter();
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password === temporaryPassword) {
      setError("A nova senha deve ser diferente da senha temporária.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temporaryPassword,
          password,
          confirmPassword,
        }),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
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

      const redirectPath =
        typeof payload === "object" &&
        payload !== null &&
        "redirectTo" in payload &&
        typeof payload.redirectTo === "string"
          ? payload.redirectTo
          : "/dashboard";

      router.push(redirectPath);
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="temporary-password">Senha temporária</Label>
        <div className="relative">
          <Input
            id="temporary-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Informe a senha recebida"
            value={temporaryPassword}
            onChange={(event) => setTemporaryPassword(event.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Use pelo menos 8 caracteres, incluindo letras e números.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
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
            Ativando...
          </>
        ) : (
          "Confirmar"
        )}
      </Button>
    </form>
  );
}
