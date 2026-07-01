import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  parseProfileStatus,
  type ProfileStatus,
} from "@/lib/auth/user-status";

const PROFILE_STATUS_METADATA_KEY = "profile_status";

export interface MiddlewareUser {
  id: string;
  profileStatus: ProfileStatus | null;
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
    data: { session },
  } = await supabase.auth.getSession();

  const authUser = session?.user;
  if (!authUser) {
    return { response: supabaseResponse, user: null };
  }

  return {
    response: supabaseResponse,
    user: {
      id: authUser.id,
      profileStatus: parseProfileStatus(
        authUser.app_metadata[PROFILE_STATUS_METADATA_KEY],
      ),
    },
  };
}
