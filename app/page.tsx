import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar — Connex Insights",
};

function LoginFormFallback() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-[42px] animate-pulse rounded-[10px] bg-[#141319]" />
      <div className="h-[42px] animate-pulse rounded-[10px] bg-[#141319]" />
      <div className="h-11 animate-pulse rounded-[10px] bg-[#141319]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh w-full flex-col items-center overflow-hidden bg-[#17161c] text-[#f6f4f0]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 900px 600px at 50% 0%, #211f2c 0%, #17161c 60%)",
        }}
      />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
        <div className="w-full max-w-[400px] rounded-[20px] border border-[#2c2b36] bg-[#1d1c24] px-9 py-10 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_20px_48px_-20px_rgba(0,0,0,0.5)]">
          <div className="mb-1 flex justify-center">
            <Image
              src="/logo-empresa-escuro-removebg-preview-copia.png"
              alt="Connex"
              width={260}
              height={146}
              priority
              className="h-auto w-[260px] max-w-full object-contain"
            />
          </div>

          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <footer className="relative z-10 w-full max-w-[1200px] px-8 pb-8 text-center">
        <p className="text-xs text-[#9b9aa8]">
          © 2026 Connex Marketing. Todos os direitos reservados.
        </p>
        <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          <Link
            href="/terms"
            className="text-[#5566ff] transition-colors hover:text-[#8f9aff]"
          >
            Termos de Serviço
          </Link>
          <Link
            href="/privacy"
            className="text-[#5566ff] transition-colors hover:text-[#8f9aff]"
          >
            Política de Privacidade
          </Link>
        </p>
      </footer>
    </main>
  );
}
