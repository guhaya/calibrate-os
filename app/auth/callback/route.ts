import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Handles the redirect after email confirmation and OAuth sign-in.
// Supabase sends the user here with ?code=... after they verify their email.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not verify your account. Please try again.`);
}
