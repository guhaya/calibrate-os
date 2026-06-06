import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyBrief, type BriefContext } from "@/lib/ai/generateDailyBrief";

// POST /api/ai/daily-brief
// Returns today's AI brief (cached or freshly generated).
// Used by client-side regenerate flows — the /brief page calls generateDailyBrief directly.
export async function POST() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Return cached brief if one exists for today
  const { data: cached } = await supabase
    .from("ai_daily_briefs")
    .select("today_status, key_insight, bottleneck, recommended_action, expected_outcome, model_used")
    .eq("user_id", user.id)
    .eq("date", today)
    .not("today_status", "is", null)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({ brief: cached, cached: true });
  }

  // Fetch the data needed to build the context
  const window7Start = new Date(today);
  window7Start.setDate(window7Start.getDate() - 6);
  const oldest = window7Start.toISOString().split("T")[0];

  const [
    checkinRes,
    mealsRes,
    targetsRes,
    weightsRes,
    profileRes,
    workoutsRes,
    weeklyRes,
    calibrationRes,
  ] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("readiness_score, sleep_hours, sleep_quality, energy_level, mood, stress_level, muscle_soreness")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),

    supabase
      .from("nutrition_logs")
      .select("date, calories, protein_g")
      .eq("user_id", user.id)
      .gte("date", oldest),

    supabase
      .from("nutrition_targets")
      .select("calories, protein_g")
      .eq("user_id", user.id)
      .eq("target_type", "training_day")
      .order("effective_from", { ascending: false })
      .limit(1),

    supabase
      .from("weight_logs")
      .select("weight_kg, date")
      .eq("user_id", user.id)
      .gte("date", oldest)
      .order("date", { ascending: false }),

    supabase
      .from("profiles")
      .select("full_name, training_days_per_week, primary_goal, sleep_target_hours")
      .eq("id", user.id)
      .single(),

    supabase
      .from("workouts")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", oldest),

    supabase
      .from("weekly_reports")
      .select("overall_score, checkin_days, nutrition_compliant_days, training_count, training_target")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1),

    supabase
      .from("calibration_scores")
      .select("score, checkin_component, readiness_component, nutrition_component, training_component, weight_component")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),
  ]);

  const profile   = profileRes.data;
  const checkin   = checkinRes.data;
  const allMeals  = mealsRes.data ?? [];
  const target    = targetsRes.data?.[0] ?? null;
  const weights   = weightsRes.data ?? [];
  const workouts  = workoutsRes.data ?? [];
  const lastWeek  = weeklyRes.data?.[0] ?? null;
  const calibration = calibrationRes.data;

  const todayMeals   = allMeals.filter((m) => m.date === today);
  const todayCalories = todayMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const todayProtein  = todayMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const firstName = profile?.full_name?.split(" ")[0] ?? "Athlete";

  const ctx: BriefContext = {
    firstName,
    primaryGoal:        profile?.primary_goal ?? null,
    trainingTarget:     profile?.training_days_per_week ?? 3,
    calibrationScore:   calibration?.score ?? 0,
    calibrationComponents: {
      checkin_component:   calibration?.checkin_component   ?? 0,
      readiness_component: calibration?.readiness_component ?? 0,
      nutrition_component: calibration?.nutrition_component ?? 0,
      training_component:  calibration?.training_component  ?? 0,
      weight_component:    calibration?.weight_component    ?? 0,
    },
    checkin,
    sleepTarget:         profile?.sleep_target_hours ?? 8,
    todayCalories,
    todayProtein,
    proteinTarget:       target?.protein_g ?? null,
    mealsLoggedToday:    todayMeals.length,
    workoutsThisWeek:    workouts.length,
    latestWeightKg:      weights[0]?.weight_kg ?? null,
    previousWeightKg:    weights[1]?.weight_kg ?? null,
    weeklyScore:         lastWeek?.overall_score ?? null,
    weeklyCheckinDays:   lastWeek?.checkin_days ?? null,
    weeklyNutritionDays: lastWeek?.nutrition_compliant_days ?? null,
    weeklyTrainingCount: lastWeek?.training_count ?? null,
    weeklyTrainingTarget: lastWeek?.training_target ?? null,
  };

  const brief = await generateDailyBrief(ctx);

  if (!brief) {
    return NextResponse.json({ error: "Brief generation failed", fallback: true }, { status: 503 });
  }

  await supabase
    .from("ai_daily_briefs")
    .upsert(
      {
        user_id:    user.id,
        date:       today,
        model_used: "claude-sonnet-4-6",
        generated_at: new Date().toISOString(),
        ...brief,
      },
      { onConflict: "user_id,date" }
    );

  return NextResponse.json({ brief, cached: false });
}
