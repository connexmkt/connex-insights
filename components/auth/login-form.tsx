"use client";

import type React from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
    const query =
      redirectTo !== "/dashboard"
        ? `?redirectTo=${encodeURIComponent(redirectTo)}`
        : "";

    try {
      const response = await fetch(`/api/auth/login${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Login ou senha incorretos.";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="login"
          className="text-[13px] font-medium text-[#f6f4f0]"
        >
          Login
        </label>
        <input
          id="login"
          type="text"
          autoComplete="username"
          placeholder="seu.login"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          required
          className="h-[42px] w-full rounded-[10px] border border-[#33323e] bg-[#141319] px-3.5 text-sm text-[#f6f4f0] outline-none transition-[border-color,box-shadow] placeholder:text-[#6b6a78] focus:border-[#5566ff] focus:shadow-[0_0_0_3px_rgba(85,102,255,0.2)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-[13px] font-medium text-[#f6f4f0]"
          >
            Senha
          </label>
          <Link
            href="/esqueci-senha"
            className="text-xs font-medium text-[#5566ff] transition-colors hover:text-[#8f9aff]"
          >
            Esqueci minha senha
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-[42px] w-full rounded-[10px] border border-[#33323e] bg-[#141319] px-3.5 pr-11 text-sm text-[#f6f4f0] outline-none transition-[border-color,box-shadow] placeholder:text-[#6b6a78] focus:border-[#5566ff] focus:shadow-[0_0_0_3px_rgba(85,102,255,0.2)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9b9aa8] transition-colors hover:text-[#f6f4f0]"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="size-[17px]" />
            ) : (
              <Eye className="size-[17px]" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-[13px] text-[#ef4444]" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#5566ff] text-sm font-semibold text-white transition-colors hover:bg-[#4353e0] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}
