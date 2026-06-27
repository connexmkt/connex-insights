import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { UserStatus } from "@/lib/generated/prisma";
import { readProfileStatusFromAuthUser } from "@/lib/auth/profile-metadata";

export interface MiddlewareUser {
  id: string;
  profileStatus: UserStatus | null;
}

export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; user: MiddlewareUser | null }> {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: supabaseResponse, user: null };
  }

  return {
    response: supabaseResponse,
    user: {
      id: user.id,
      profileStatus: readProfileStatusFromAuthUser(user),
    },
  };
}
