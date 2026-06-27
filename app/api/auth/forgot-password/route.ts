import { NextResponse } from "next/server";
import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "@/lib/auth/messages";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

function getResetRedirectUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/auth/callback?next=/redefinir-senha`;
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: getResetRedirectUrl(),
    });
  } catch {
    // Anti-enumeração: falha de envio não é exposta ao usuário
  }

  return NextResponse.json({
    success: true,
    message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
  });
}
