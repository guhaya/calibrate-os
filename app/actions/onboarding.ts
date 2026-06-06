"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingSchema } from "@/lib/schemas/onboarding";
import { computeNutritionTargets } from "@/lib/performance/nutrition";

export type OnboardingState = { error: string } | null;

export async function saveOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  // 1. Validate all inputs against the Zod schema
  const parsed = OnboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data. Please go back and check your answers." };
  }

  // 2. Get the authenticated user — never trust the client to send user ID
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session expired. Please sign in again." };
  }

  // 3. Convert age → approximate date of birth (Jan 1 of birth year)
  const { age, ...profileFields } = parsed.data;
  const birthYear = new Date().getFullYear() - age;
  const dateOfBirth = `${birthYear}-01-01`;

  // 4. Upsert the profile row (the trigger created a blank row on signup;
  //    we update it here. Upsert handles the edge case where the row is missing.)
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: profileFields.full_name,
      date_of_birth: dateOfBirth,
      gender: profileFields.gender,
      height_cm: profileFields.height_cm,
      weight_kg: profileFields.weight_kg,
      primary_goal: profileFields.primary_goal,
      training_days_per_week: profileFields.training_days_per_week,
      primary_activity: profileFields.primary_activity,
      onboarding_completed: true,
    });

  if (profileError) {
    return { error: `Could not save your profile: ${profileError.message}` };
  }

  // 5. Compute and insert initial nutrition targets (training day + rest day)
  const targets = computeNutritionTargets({
    weight_kg: profileFields.weight_kg,
    height_cm: profileFields.height_cm,
    age,
    gender: profileFields.gender,
    training_days_per_week: profileFields.training_days_per_week,
    primary_goal: profileFields.primary_goal,
  });

  const { error: targetsError } = await supabase.from("nutrition_targets").insert([
    { user_id: user.id, target_type: "training_day", ...targets.training_day },
    { user_id: user.id, target_type: "rest_day",     ...targets.rest_day },
  ]);

  if (targetsError) {
    return { error: `Could not save nutrition targets: ${targetsError.message}` };
  }

  // 6. All done — send the user into the app
  redirect("/dashboard");
}
