import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/performance/streak";
import ReadinessCard from "@/components/dashboard/ReadinessCard";
import MacroSummary from "@/components/dashboard/MacroSummary";
import WeightSummary from "@/components/dashboard/WeightSummary";
import QuickActions from "@/components/dashboard/QuickActions";

export const metadata: Metadata = { title: "Dashboard — CALIBRATE OS" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // All queries fire in parallel — independent data sources
  const [checkinRes, mealsRes, targetsRes, weightRes, streakRes, profileRes] =
    await Promise.all([
      supabase
        .from("daily_checkins")
        .select("readiness_score")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle(),

      supabase
        .from("nutrition_logs")
        .select("calories, protein_g")
        .eq("user_id", user.id)
        .eq("date", today),

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
        .order("date", { ascending: false })
        .limit(2),

      supabase
        .from("daily_checkins")
        .select("date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(60),

      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single(),
    ]);

  // Derived values
  const checkin   = checkinRes.data;
  const meals     = mealsRes.data ?? [];
  const target    = targetsRes.data?.[0] ?? null;
  const weights   = weightRes.data ?? [];
  const streak    = computeStreak((streakRes.data ?? []).map((r) => r.date), today);
  const firstName = profileRes.data?.full_name?.split(" ")[0] ?? "there";

  const totalCalories = meals.reduce((s, m) => s + (m.calories  ?? 0), 0);
  const totalProtein  = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0);

  const latestWeight   = weights[0]?.weight_kg ?? null;
  const previousWeight = weights[1]?.weight_kg ?? null;
  const latestWeightDate = weights[0]?.date ?? null;

  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

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

        {/* Readiness — full width, most important */}
        <ReadinessCard
          score={checkin?.readiness_score ?? null}
          checkedIn={!!checkin}
          streak={streak}
        />

        {/* Quick actions */}
        <div className="mt-4">
          <QuickActions checkedIn={!!checkin} mealCount={meals.length} />
        </div>

        {/* Nutrition + Weight — 2-col on wider screens */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MacroSummary
            calories={totalCalories}
            protein={totalProtein}
            targetCalories={target?.calories ?? null}
            targetProtein={target?.protein_g ?? null}
            mealCount={meals.length}
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
