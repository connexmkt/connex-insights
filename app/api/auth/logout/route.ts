import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(): Promise<Response> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
