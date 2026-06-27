import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha — Connex Insights",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Recuperar acesso"
      description="Informe seu e-mail cadastrado e enviaremos instruções para redefinir sua senha."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
