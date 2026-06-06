"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CheckinSchema } from "@/lib/schemas/checkin";
import { computeReadinessScore } from "@/lib/performance/readiness";

export type CheckinState = { error: string } | null;

export async function saveCheckin(
  _prevState: CheckinState,
  formData: FormData
): Promise<CheckinState> {
  const parsed = CheckinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  // Fetch sleep target from profile to compute the readiness score
  const { data: profile } = await supabase
    .from("profiles")
    .select("sleep_target_hours")
    .eq("id", user.id)
    .single();

  const sleepTarget = profile?.sleep_target_hours ?? 8;
  const { date, steps, notes, ...metrics } = parsed.data;

  const readiness_score = computeReadinessScore({
    ...metrics,
    sleep_target_hours: sleepTarget,
  });

  const { error: dbError } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      date,
      ...metrics,
      steps: steps ?? null,
      notes: notes ?? null,
      readiness_score,
    },
    { onConflict: "user_id,date" }
  );

  if (dbError) return { error: `Could not save check-in: ${dbError.message}` };

  revalidatePath("/checkin");
  return null;
}
