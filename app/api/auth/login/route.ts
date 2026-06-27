import { NextResponse } from "next/server";
import { UserStatus } from "@/lib/generated/prisma";
import { ACTIVATION_PATH } from "@/lib/auth/activation-guard";
import { loginSchema } from "@/lib/auth/schemas";
import { syncProfileStatusMetadata } from "@/lib/auth/sync-profile-metadata";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user?.email) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos.", code: "INVALID_CREDENTIALS" },
      { status: 401 },
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { id: data.user.id },
  });

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Acesso não autorizado.", code: "ACCOUNT_NOT_FOUND" },
      { status: 403 },
    );
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
