import Link from "next/link";
import type { ReactNode } from "react";
import { ConnexLogo } from "@/components/connex-logo";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6 sm:px-8">
          <Link href="/" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ConnexLogo />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Voltar ao login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-14">
        <div className="mb-10 space-y-3 border-b border-border pb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdated}
          </p>
        </div>

        <article className="legal-content">{children}</article>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 Connex Marketing. Todos os direitos reservados.</span>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Política de Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
