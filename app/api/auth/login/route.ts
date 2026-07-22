import { NextResponse } from "next/server";
import { UserStatus } from "@/lib/generated/prisma";
import { ACTIVATION_PATH } from "@/lib/auth/activation-guard";
import { loginSchema } from "@/lib/auth/schemas";
import { syncProfileStatusMetadata } from "@/lib/auth/sync-profile-metadata";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function invalidCredentialsResponse(): NextResponse {
  return NextResponse.json(
    { error: "Login ou senha incorretos.", code: "INVALID_CREDENTIALS" },
    { status: 401 },
  );
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json();
  const parsed = loginSchema.safeParse(body);

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

  // O `login` é o identificador exposto ao usuário (distinto do e-mail de
  // contato provisionado pelo connex-crm — ver specs/001-user-auth/spec.md
  // § Nota de atualização). O Supabase Auth continua autenticando por
  // e-mail internamente, então resolvemos login -> auth.users.email antes
  // de chamar signInWithPassword. Erros nesta etapa retornam a mesma
  // mensagem genérica de credenciais inválidas, para não revelar se um
  // login existe.
  const profile = await prisma.profile.findUnique({
    where: { login: parsed.data.login },
  });

  if (!profile) {
    return invalidCredentialsResponse();
  }

  const admin = createAdminClient();
  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(
    profile.id,
  );

  if (authUserError || !authUser.user?.email) {
    return invalidCredentialsResponse();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return invalidCredentialsResponse();
  }

  await syncProfileStatusMetadata(data.user.id, profile.status);

  if (profile.status === UserStatus.SUSPENDED) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Acesso não autorizado.", code: "ACCOUNT_SUSPENDED" },
      { status: 403 },
    );
  }

  if (profile.status === UserStatus.INACTIVE) {
    return NextResponse.json({
      success: true,
      requiresActivation: true,
      redirectTo: ACTIVATION_PATH,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  }

  const requestUrl = new URL(request.url);
  const redirectParam = requestUrl.searchParams.get("redirectTo") ?? "/dashboard";
  const redirectTo = redirectParam.startsWith("/") ? redirectParam : "/dashboard";

  return NextResponse.json({
    success: true,
    requiresActivation: false,
    redirectTo,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
}
