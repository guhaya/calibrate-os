import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that never require authentication
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  // Refresh the session cookie and get the authenticated user.
  // updateSession() also returns the Supabase client so we can reuse
  // it for the profile query without creating a second instance.
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const { pathname } = request.nextUrl;

  const isPublicPath     = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isOnboardingPath = pathname.startsWith("/onboarding");

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!user) {
    if (isPublicPath) return supabaseResponse;
    return redirectTo(request, "/login");
  }

  // ── Authenticated — check onboarding status ────────────────────────────────
  // Reuse the same client that updateSession() already created (same cookie
  // state). RLS allows each user to read their own profile row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const onboardingDone = profile?.onboarding_completed === true;

  if (!onboardingDone) {
    // Onboarding incomplete — only /onboarding is accessible
    if (isOnboardingPath) return supabaseResponse;
    return redirectTo(request, "/onboarding");
  }

  // Onboarding complete — keep them out of public/onboarding paths
  if (isPublicPath || isOnboardingPath) {
    return redirectTo(request, "/dashboard");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
