import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Get Started — CALIBRATE OS" };

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  // Already onboarded — skip straight to the app
  if (profile?.onboarding_completed) redirect("/dashboard");

  return <OnboardingFlow />;
}
