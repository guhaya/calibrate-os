import type { Metadata } from "next";
import type { ActionResult } from "@/lib/performance/action";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  computeCalibrationScore,
  buildWindowDates,
  calibrationCategory,
  calibrationColor,
} from "@/lib/performance/calibration";
import { selectHighestLeverageAction } from "@/lib/performance/action";
import { generateDailyBrief, type BriefContext } from "@/lib/ai/generateDailyBrief";
import CalibrationScore from "@/components/dashboard/CalibrationScore";
import HighestLeverageAction from "@/components/dashboard/HighestLeverageAction";

export const metadata: Metadata = { title: "Daily Brief — CALIBRATE OS" };

export default async function BriefPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today   = new Date().toISOString().split("T")[0];
  const window7 = buildWindowDates(today, 7);
  const oldest  = window7[window7.length - 1];

  const [
    checkinTodayRes,
    checkins7Res,
    mealsLast7Res,
    targetsRes,
    weights7Res,
    profileRes,
    workouts7Res,
    calibrationTodayRes,
    actionTodayRes,
    aiBriefCachedRes,
    weeklyReportRes,
  ] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("readiness_score, sleep_hours, sleep_quality, energy_level, mood, stress_level, muscle_soreness")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),

    supabase
      .from("daily_checkins")
      .select("date, readiness_score")
      .eq("user_id", user.id)
      .gte("date", oldest)
      .order("date", { ascending: false }),

    supabase
      .from("nutrition_logs")
      .select("date, calories, protein_g, carbs_g, fat_g")
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
      .from("calibration_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),

    supabase
      .from("daily_actions")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),

    supabase
      .from("ai_daily_briefs")
      .select("today_status, key_insight, bottleneck, recommended_action, expected_outcome")
      .eq("user_id", user.id)
      .eq("date", today)
      .not("today_status", "is", null)
      .maybeSingle(),

    supabase
      .from("weekly_reports")
      .select("overall_score, checkin_days, nutrition_compliant_days, training_count, training_target")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1),
  ]);

  const checkin   = checkinTodayRes.data;
  const checkins  = checkins7Res.data  ?? [];
  const allMeals  = mealsLast7Res.data ?? [];
  const target    = targetsRes.data?.[0] ?? null;
  const weights   = weights7Res.data   ?? [];
  const workouts  = workouts7Res.data  ?? [];
  const profile   = profileRes.data;
  const lastWeek  = weeklyReportRes.data?.[0] ?? null;

  // ── Calibration Score ──────────────────────────────────────────────────────
  let calibration = calibrationTodayRes.data;

  if (!calibration) {
    const result = computeCalibrationScore({
      checkins,
      nutritionLogs:      allMeals,
      proteinTarget:      target?.protein_g ?? null,
      workoutDates:       workouts.map((w) => w.date),
      trainingDaysTarget: profile?.training_days_per_week ?? 3,
      weightLogDates:     weights.map((w) => w.date),
      windowDates:        window7,
    });

    const { data: upserted } = await supabase
      .from("calibration_scores")
      .upsert(
        { user_id: user.id, date: today, ...result },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    calibration = upserted;
  }

  const calibrationResult = calibration ?? {
    score: 0,
    readiness_component: 0,
    checkin_component: 0,
    nutrition_component: 0,
    training_component: 0,
    weight_component: 0,
  };

  // ── Highest Leverage Action ────────────────────────────────────────────────
  const todayMeals     = allMeals.filter((m) => m.date === today);
  const todayProtein   = todayMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const todayCalories  = todayMeals.reduce((s, m) => s + (m.calories  ?? 0), 0);
  const workoutsThisWeek = workouts.length;

  const computedAction = selectHighestLeverageAction({
    today,
    checkedInToday:    !!checkin,
    readinessToday:    checkin?.readiness_score ?? null,
    calibrationComponents: {
      checkin_component:   calibrationResult.checkin_component,
      readiness_component: calibrationResult.readiness_component,
      nutrition_component: calibrationResult.nutrition_component,
      training_component:  calibrationResult.training_component,
      weight_component:    calibrationResult.weight_component,
    },
    mealsLoggedToday:   todayMeals.length,
    proteinLoggedToday: todayProtein,
    proteinTarget:      target?.protein_g ?? null,
    workoutsThisWeek,
    trainingDaysTarget: profile?.training_days_per_week ?? 3,
    weightLoggedToday:  weights.some((w) => w.date === today),
  });

  let dailyAction = actionTodayRes.data;

  const { data: upsertedAction } = await supabase
    .from("daily_actions")
    .upsert(
      { user_id: user.id, date: today, ...computedAction },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (upsertedAction) dailyAction = upsertedAction;

  // DB row has pillar/priority as string — cast back since we wrote the values
  const displayAction = (dailyAction ?? computedAction) as ActionResult;

  // ── Brief sections ────────────────────────────────────────────────────────
  const firstName  = profile?.full_name?.split(" ")[0] ?? "there";

  // Check cached AI brief first; if missing, generate (falls back to null on failure)
  let aiBrief = aiBriefCachedRes.data ?? null;

  if (!aiBrief) {
    const ctx: BriefContext = {
      firstName,
      primaryGoal:        profile?.primary_goal ?? null,
      trainingTarget:     profile?.training_days_per_week ?? 3,
      calibrationScore:   calibrationResult.score,
      calibrationComponents: {
        checkin_component:   calibrationResult.checkin_component,
        readiness_component: calibrationResult.readiness_component,
        nutrition_component: calibrationResult.nutrition_component,
        training_component:  calibrationResult.training_component,
        weight_component:    calibrationResult.weight_component,
      },
      checkin,
      sleepTarget:         profile?.sleep_target_hours ?? 8,
      todayCalories,
      todayProtein,
      proteinTarget:       target?.protein_g ?? null,
      mealsLoggedToday:    todayMeals.length,
      workoutsThisWeek,
      latestWeightKg:      weights[0]?.weight_kg ?? null,
      previousWeightKg:    weights[1]?.weight_kg ?? null,
      weeklyScore:         lastWeek?.overall_score ?? null,
      weeklyCheckinDays:   lastWeek?.checkin_days ?? null,
      weeklyNutritionDays: lastWeek?.nutrition_compliant_days ?? null,
      weeklyTrainingCount: lastWeek?.training_count ?? null,
      weeklyTrainingTarget: lastWeek?.training_target ?? null,
    };

    const generated = await generateDailyBrief(ctx);

    if (generated) {
      aiBrief = generated;
      await supabase
        .from("ai_daily_briefs")
        .upsert(
          {
            user_id:     user.id,
            date:        today,
            model_used:  "claude-sonnet-4-6",
            generated_at: new Date().toISOString(),
            ...generated,
          },
          { onConflict: "user_id,date" }
        );
    }
  }
  const dateLabel  = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const score    = calibrationResult.score;
  const category = calibrationCategory(score);
  const color    = calibrationColor(score);

  // Today's Status
  const statusText = checkin
    ? `Readiness ${checkin.readiness_score ?? "—"}/100 · Sleep ${checkin.sleep_hours ?? "—"}h · Energy ${checkin.energy_level ?? "—"}/10 · Mood ${checkin.mood ?? "—"}/10`
    : "No check-in logged yet today.";

  // Key Insight — surface most notable data point
  const latestWeight   = weights[0]?.weight_kg ?? null;
  const previousWeight = weights[1]?.weight_kg ?? null;
  const weightDelta    = latestWeight && previousWeight
    ? latestWeight - previousWeight
    : null;

  let keyInsight = "";
  if (calibrationResult.training_component === 100) {
    keyInsight = "Training consistency is perfect this week — every scheduled session completed.";
  } else if (weightDelta !== null && Math.abs(weightDelta) >= 0.5) {
    const direction = weightDelta > 0 ? "up" : "down";
    keyInsight = `Body weight is trending ${direction} ${Math.abs(weightDelta).toFixed(1)} kg from the prior log.`;
  } else if (todayProtein > 0 && target?.protein_g) {
    const pct = Math.round((todayProtein / target.protein_g) * 100);
    keyInsight = `You're at ${pct}% of your protein target today (${Math.round(todayProtein)}g / ${target.protein_g}g).`;
  } else if (!checkin) {
    keyInsight = "Complete your check-in to unlock today's full performance snapshot.";
  } else {
    keyInsight = `Calibration Score is ${score} — ${category}. ${score >= 80 ? "Keep the momentum going." : "Small daily improvements compound fast."}`;
  }

  // Bottleneck — lowest-scoring pillar
  const components = [
    { label: "Check-In consistency",  score: calibrationResult.checkin_component   },
    { label: "Recovery quality",       score: calibrationResult.readiness_component },
    { label: "Nutrition compliance",   score: calibrationResult.nutrition_component },
    { label: "Training frequency",     score: calibrationResult.training_component  },
    { label: "Weight tracking",        score: calibrationResult.weight_component    },
  ];
  const bottleneck = [...components].sort((a, b) => a.score - b.score)[0];

  // Expected Outcome
  const outcomeText = score >= 80
    ? "Maintain this level for another 7 days to reach and sustain an Elite Calibration Score."
    : `Addressing the ${bottleneck.label.toLowerCase()} bottleneck is the fastest path to lifting your Calibration Score.`;

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Daily Brief
            </p>
            {aiBrief && (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Generated by Claude
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {firstName}&rsquo;s Brief
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>

        {/* 1. Today's Status */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Today&rsquo;s Status
          </p>
          {aiBrief ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{aiBrief.today_status}</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-zinc-300">{statusText}</p>
              {todayCalories > 0 && (
                <p className="mt-1 text-sm text-zinc-400">
                  Nutrition: {Math.round(todayCalories)} kcal · {Math.round(todayProtein)}g protein logged so far.
                </p>
              )}
            </>
          )}
        </section>

        {/* 2. Key Insight */}
        <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Key Insight
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {aiBrief ? aiBrief.key_insight : keyInsight}
          </p>
        </section>

        {/* 3. Bottleneck */}
        <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Bottleneck
          </p>
          {aiBrief ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{aiBrief.bottleneck}</p>
          ) : (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-base font-semibold text-white">{bottleneck.label}</span>
                <span className={`font-mono text-sm font-bold ${color}`}>{bottleneck.score}/100</span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                This is the pillar dragging your Calibration Score down most. Fix this first.
              </p>
            </>
          )}
        </section>

        {/* 4. Recommended Action */}
        {aiBrief ? (
          <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Recommended Action
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{aiBrief.recommended_action}</p>
          </section>
        ) : (
          <div className="mt-4">
            <HighestLeverageAction action={displayAction} />
          </div>
        )}

        {/* 5. Expected Outcome */}
        <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Expected Outcome
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {aiBrief ? aiBrief.expected_outcome : outcomeText}
          </p>
        </section>

        {/* Calibration Score — full breakdown at bottom for reference */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Full Calibration Breakdown
          </p>
          <CalibrationScore result={calibrationResult} />
        </div>

      </div>
    </div>
  );
}
