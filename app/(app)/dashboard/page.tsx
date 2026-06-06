import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/performance/streak";
import {
  computeCalibrationScore,
  buildWindowDates,
} from "@/lib/performance/calibration";
import {
  selectHighestLeverageAction,
  type ActionResult,
} from "@/lib/performance/action";
import CalibrationScore from "@/components/dashboard/CalibrationScore";
import HighestLeverageAction from "@/components/dashboard/HighestLeverageAction";
import ReadinessCard from "@/components/dashboard/ReadinessCard";
import MacroSummary from "@/components/dashboard/MacroSummary";
import WeightSummary from "@/components/dashboard/WeightSummary";
import QuickActions from "@/components/dashboard/QuickActions";

export const metadata: Metadata = { title: "Dashboard — CALIBRATE OS" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today   = new Date().toISOString().split("T")[0];
  const window7 = buildWindowDates(today, 7);   // [today, yesterday, ..., 6 days ago]
  const oldest  = window7[window7.length - 1];  // 6 days ago

  // ── All queries in parallel ───────────────────────────────────────────────
  const [
    checkinTodayRes,
    checkins60Res,
    mealsLast7Res,
    targetsRes,
    weights7Res,
    profileRes,
    workouts7Res,
    calibrationTodayRes,
    actionTodayRes,
  ] = await Promise.all([
    // Today's check-in (for readiness card)
    supabase
      .from("daily_checkins")
      .select("readiness_score")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),

    // Last 60 check-ins (streak + calibration readiness component)
    supabase
      .from("daily_checkins")
      .select("date, readiness_score")
      .eq("user_id", user.id)
      .gte("date", (() => {
        const d = new Date(today + "T12:00:00");
        d.setDate(d.getDate() - 59);
        return d.toISOString().split("T")[0];
      })())
      .order("date", { ascending: false }),

    // Meals last 7 days (today's totals + nutrition compliance)
    supabase
      .from("nutrition_logs")
      .select("date, calories, protein_g")
      .eq("user_id", user.id)
      .gte("date", oldest),

    // Nutrition target (macro summary + calibration)
    supabase
      .from("nutrition_targets")
      .select("calories, protein_g")
      .eq("user_id", user.id)
      .eq("target_type", "training_day")
      .order("effective_from", { ascending: false })
      .limit(1),

    // Weight logs last 7 days (weight summary + calibration)
    supabase
      .from("weight_logs")
      .select("weight_kg, date")
      .eq("user_id", user.id)
      .gte("date", oldest)
      .order("date", { ascending: false }),

    // Profile (name + training target for calibration)
    supabase
      .from("profiles")
      .select("full_name, training_days_per_week")
      .eq("id", user.id)
      .single(),

    // Workouts last 7 days (dashboard count + calibration)
    supabase
      .from("workouts")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", oldest),

    // Today's calibration score (cached — skip recompute if present)
    supabase
      .from("calibration_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),

    // Today's highest leverage action (cached — recomputed below if missing)
    supabase
      .from("daily_actions")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),
  ]);

  // ── Derive data ───────────────────────────────────────────────────────────
  const checkin   = checkinTodayRes.data;
  const checkins  = checkins60Res.data  ?? [];
  const allMeals  = mealsLast7Res.data  ?? [];
  const target    = targetsRes.data?.[0] ?? null;
  const weights   = weights7Res.data    ?? [];
  const workouts  = workouts7Res.data   ?? [];
  const profile   = profileRes.data;

  const streak           = computeStreak(checkins.map((c) => c.date), today);
  const firstName        = profile?.full_name?.split(" ")[0] ?? "there";
  const workoutsThisWeek = workouts.length;

  // Today's nutrition totals for macro summary card
  const todayMeals   = allMeals.filter((m) => m.date === today);
  const totalCalories = todayMeals.reduce((s, m) => s + (m.calories  ?? 0), 0);
  const totalProtein  = todayMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0);

  // Weight trend (latest two entries)
  const latestWeight     = weights[0]?.weight_kg ?? null;
  const previousWeight   = weights[1]?.weight_kg ?? null;
  const latestWeightDate = weights[0]?.date ?? null;

  // ── Calibration Score (compute + upsert if not cached) ───────────────────
  let calibration = calibrationTodayRes.data;

  if (!calibration) {
    const checkins7 = checkins.filter((c) => window7.includes(c.date));

    const result = computeCalibrationScore({
      checkins:           checkins7,
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

  // ── Render ────────────────────────────────────────────────────────────────
  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  // Provide a fallback result if upsert somehow fails (e.g. network blip)
  const calibrationResult = calibration ?? {
    score: 0,
    readiness_component: 0,
    checkin_component: 0,
    nutrition_component: 0,
    training_component: 0,
    weight_component: 0,
  };

  // ── Highest Leverage Action (compute + upsert on every visit) ────────────
  const todayProtein      = todayMeals.reduce((s, m) => s + (m.protein_g ?? 0), 0);
  const weightLoggedToday = weights.some((w) => w.date === today);

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
    weightLoggedToday,
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

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            CALIBRATE OS
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Hey, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>

        {/* Calibration Score — primary KPI, hero position */}
        <CalibrationScore result={calibrationResult} />

        {/* Highest Leverage Action — what to do right now */}
        <div className="mt-4">
          <HighestLeverageAction action={displayAction} />
        </div>

        {/* Readiness — today's snapshot */}
        <div className="mt-4">
          <ReadinessCard
            score={checkin?.readiness_score ?? null}
            checkedIn={!!checkin}
            streak={streak}
          />
        </div>

        {/* Quick actions */}
        <div className="mt-4">
          <QuickActions
            checkedIn={!!checkin}
            mealCount={todayMeals.length}
            workoutsThisWeek={workoutsThisWeek}
          />
        </div>

        {/* Nutrition + Weight — 2-col on wider screens */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MacroSummary
            calories={totalCalories}
            protein={totalProtein}
            targetCalories={target?.calories ?? null}
            targetProtein={target?.protein_g ?? null}
            mealCount={todayMeals.length}
          />
          <WeightSummary
            latest={latestWeight}
            previous={previousWeight}
            date={latestWeightDate}
          />
        </div>

      </div>
    </div>
  );
}
