import type { ReactNode } from "react";
import { ConnexLogo } from "@/components/connex-logo";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
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
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            {children}
          </div>
        </div>

        <footer className="text-xs text-muted-foreground">
          {"© 2026 Connex Marketing. Todos os direitos reservados."}
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
