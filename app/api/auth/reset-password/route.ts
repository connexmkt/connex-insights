import { NextResponse } from "next/server";
import {
  INVALID_RESET_LINK_MESSAGE,
  RESET_PASSWORD_SUCCESS_MESSAGE,
} from "@/lib/auth/messages";
import { resetPasswordSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: INVALID_RESET_LINK_MESSAGE, code: "SESSION_EXPIRED" },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json(
      { error: INVALID_RESET_LINK_MESSAGE, code: "INVALID_RESET_LINK" },
      { status: 401 },
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({
    success: true,
    message: RESET_PASSWORD_SUCCESS_MESSAGE,
  });
}
