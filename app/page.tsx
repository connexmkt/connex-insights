import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { ConnexLogo } from "@/components/connex-logo";

export const metadata: Metadata = {
  title: "Entrar — Connex Insights",
};

function LoginFormFallback() {
  return (
    <div className="space-y-5">
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh w-full">
      <div className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-[46%] lg:px-16">
        <header>
          <ConnexLogo />
        </header>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm py-12">
            <div className="mb-8 space-y-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
                Bem-vindo de volta
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Acesse o painel para acompanhar o desempenho das suas redes
                sociais em tempo real.
              </p>
            </div>
            <Suspense fallback={<LoginFormFallback />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <footer className="text-xs text-muted-foreground">
          <p>{"© 2026 Connex Marketing. Todos os direitos reservados."}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Termos de Serviço
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Política de Privacidade
            </Link>
          </p>
        </footer>
      </div>

      <aside className="relative hidden overflow-hidden bg-[#161622] lg:block lg:w-[54%]">
        <img
          src="/login-data-art.png"
          alt="Visualização abstrata de dados de redes sociais"
          className="absolute inset-0 size-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161622] via-[#161622]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-md font-heading text-2xl font-medium leading-snug text-balance text-white">
            Transforme dados em decisões inteligentes para a sua marca.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Métricas, insights de IA e relatórios profissionais — tudo
            centralizado em uma única plataforma.
          </p>
        </div>
      </aside>
    </main>
  );
}
