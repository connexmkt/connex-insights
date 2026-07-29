import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivateAccountForm } from "@/app/ativar-conta/components/ActivateAccountForm";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { getPreActivationContext, getTenantContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Ativar conta — Connex Insights",
};

export default async function ActivateAccountPage() {
  const activeSession = await getTenantContext();

  if (activeSession) {
    redirect("/dashboard");
  }

  const preActivationContext = await getPreActivationContext();

  if (!preActivationContext) {
    redirect("/");
  }

  return (
    <AuthPageShell
      title="Ative sua conta"
      description="Informe a senha temporária recebida e defina uma nova senha para acessar a plataforma."
    >
      <ActivateAccountForm />
    </AuthPageShell>
  );
}
