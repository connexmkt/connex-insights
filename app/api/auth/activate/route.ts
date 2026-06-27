import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  ACCOUNT_ALREADY_ACTIVE_MESSAGE,
  INVALID_TEMPORARY_PASSWORD_MESSAGE,
} from "@/lib/auth/messages";
import { activateAccountSchema } from "@/lib/auth/schemas";
import { requirePreActivation } from "@/lib/auth/require-pre-activation";
import { syncProfileStatusMetadata } from "@/lib/auth/sync-profile-metadata";
import { UserStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

function createEphemeralClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const POST = requirePreActivation(async (request, context) => {
  const body: unknown = await request.json();
  const parsed = activateAccountSchema.safeParse(body);

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

  const profile = await prisma.profile.findUnique({
    where: { id: context.userId },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Acesso não autorizado.", code: "ACCOUNT_NOT_FOUND" },
      { status: 403 },
    );
  }

  if (profile.status === UserStatus.ACTIVE) {
    return NextResponse.json(
      { error: ACCOUNT_ALREADY_ACTIVE_MESSAGE, code: "ACCOUNT_ALREADY_ACTIVE" },
      { status: 409 },
    );
  }

  const ephemeral = createEphemeralClient();
  const { error: verifyError } = await ephemeral.auth.signInWithPassword({
    email: context.email,
    password: parsed.data.temporaryPassword,
  });

  if (verifyError) {
    return NextResponse.json(
      {
        error: INVALID_TEMPORARY_PASSWORD_MESSAGE,
        code: "INVALID_TEMPORARY_PASSWORD",
      },
      { status: 401 },
    );
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (updateError) {
    return NextResponse.json(
      { error: "Não foi possível atualizar a senha.", code: "PASSWORD_UPDATE_FAILED" },
      { status: 500 },
    );
  }

  await prisma.profile.update({
    where: { id: context.userId },
    data: { status: UserStatus.ACTIVE },
  });

  await syncProfileStatusMetadata(context.userId, UserStatus.ACTIVE);

  return NextResponse.json({
    success: true,
    redirectTo: "/dashboard",
  });
});
