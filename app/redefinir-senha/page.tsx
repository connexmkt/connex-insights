import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Redefinir senha — Connex Insights",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/esqueci-senha?error=link_invalido");
  }

  return (
    <AuthPageShell
      title="Definir nova senha"
      description="Escolha uma nova senha segura para acessar sua conta."
    >
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
