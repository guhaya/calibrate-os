import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  computeWeeklyReport,
  computeWeeklyTrends,
  buildWeekDates,
  getCurrentWeekStart,
  getLastCompletedWeekStart,
  formatWeekLabel,
  weeklyCategory,
  weeklyColor,
  type WeeklyReportStorable,
} from "@/lib/performance/weeklyReport";
import WeeklyReportCard from "@/components/reports/WeeklyReportCard";

export const metadata: Metadata = { title: "Weekly Reports — CALIBRATE OS" };

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today              = new Date().toISOString().split("T")[0];
  const currentWeekStart   = getCurrentWeekStart(today);
  const lastWeekStart      = getLastCompletedWeekStart(today);
  const prevWeekStart      = getLastCompletedWeekStart(lastWeekStart); // week before last

  // Oldest date we need: start of the week before last
  const oldest = prevWeekStart;

  // ── All data in parallel ──────────────────────────────────────────────────
  const [
    profileRes,
    checkinsRes,
    nutritionRes,
    targetsRes,
    workoutsRes,
    weightsRes,
    storedReportsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("training_days_per_week")
      .eq("id", user.id)
      .single(),

    supabase
      .from("daily_checkins")
      .select("date, readiness_score")
      .eq("user_id", user.id)
      .gte("date", oldest)
      .order("date", { ascending: true }),

    supabase
      .from("nutrition_logs")
      .select("date, protein_g")
      .eq("user_id", user.id)
      .gte("date", oldest),

    supabase
      .from("nutrition_targets")
      .select("protein_g")
      .eq("user_id", user.id)
      .eq("target_type", "training_day")
      .order("effective_from", { ascending: false })
      .limit(1),

    supabase
      .from("workouts")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", oldest),

    supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .gte("date", oldest)
      .order("date", { ascending: true }),

    // Last 8 stored completed reports for history
    supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(8),
  ]);

  const profile      = profileRes.data;
  const checkins     = checkinsRes.data     ?? [];
  const nutrition    = nutritionRes.data    ?? [];
  const proteinTarget = targetsRes.data?.[0]?.protein_g ?? null;
  const workouts     = workoutsRes.data     ?? [];
  const weights      = weightsRes.data      ?? [];
  const storedReports = storedReportsRes.data ?? [];

  const trainingTarget = profile?.training_days_per_week ?? 3;

  // ── Helper: compute report for a given week ───────────────────────────────
  function reportForWeek(weekStart: string): WeeklyReportStorable {
    const weekEnd   = buildWeekDates(weekStart)[6];
    const weekDates = buildWeekDates(weekStart);
    return computeWeeklyReport({
      weekStart, weekEnd, weekDates,
      checkins:      checkins.filter((c) => weekDates.includes(c.date)),
      nutritionLogs: nutrition.filter((n) => weekDates.includes(n.date)),
      proteinTarget,
      workouts:      workouts.filter((w) => weekDates.includes(w.date)),
      trainingTarget,
      weights:       weights.filter((w) => weekDates.includes(w.date)),
    });
  }

  // ── Current week (in-progress, not stored) ────────────────────────────────
  const currentWeekEnd    = buildWeekDates(currentWeekStart)[6];
  const currentWeekReport = reportForWeek(currentWeekStart);

  // ── Last completed week (compute + upsert) ────────────────────────────────
  const lastWeekEnd    = buildWeekDates(lastWeekStart)[6];
  const lastWeekReport = reportForWeek(lastWeekStart);

  await supabase
    .from("weekly_reports")
    .upsert(
      {
        user_id:                  user.id,
        week_start:               lastWeekStart,
        week_end:                 lastWeekEnd,
        overall_score:            lastWeekReport.overall_score,
        checkin_days:             lastWeekReport.checkin_days,
        checkin_rate:             lastWeekReport.checkin_rate,
        avg_readiness:            lastWeekReport.avg_readiness,
        nutrition_compliant_days: lastWeekReport.nutrition_compliant_days,
        nutrition_rate:           lastWeekReport.nutrition_rate,
        training_count:           lastWeekReport.training_count,
        training_target:          lastWeekReport.training_target,
        weight_start_kg:          lastWeekReport.weight_start_kg,
        weight_end_kg:            lastWeekReport.weight_end_kg,
        wins:                     lastWeekReport.wins,
        bottlenecks:              lastWeekReport.bottlenecks,
        recommended_focus:        lastWeekReport.recommended_focus,
      },
      { onConflict: "user_id,week_start" }
    );

  // ── Trends: compare current week to last completed week ───────────────────
  const currentTrends = computeWeeklyTrends(currentWeekReport, lastWeekReport);

  // ── Previous completed week (for last-week card trends) ───────────────────
  const prevWeekReport = reportForWeek(prevWeekStart);
  const lastWeekTrends = computeWeeklyTrends(lastWeekReport, prevWeekReport);

  // ── Render ────────────────────────────────────────────────────────────────
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
            Weekly Reports
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>

        {/* This week — in progress */}
        <WeeklyReportCard
          report={currentWeekReport}
          weekStart={currentWeekStart}
          weekEnd={currentWeekEnd}
          trends={currentTrends}
          inProgress
        />

        {/* Last completed week */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Last Week
          </p>
          <WeeklyReportCard
            report={lastWeekReport}
            weekStart={lastWeekStart}
            weekEnd={lastWeekEnd}
            trends={lastWeekTrends}
          />
        </div>

        {/* History */}
        {storedReports.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
              History
            </p>
            <div className="space-y-2">
              {storedReports
                .filter((r) => r.week_start !== lastWeekStart)
                .map((r) => {
                  const score    = r.overall_score;
                  const category = weeklyCategory(score);
                  const color    = weeklyColor(score);
                  const label    = formatWeekLabel(r.week_start, r.week_end);
                  const trainingRate = r.training_target > 0
                    ? Math.min(Math.round((r.training_count / r.training_target) * 100), 100)
                    : 100;

                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4"
                    >
                      <div>
                        <p className="text-xs text-zinc-500">{label}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`font-mono text-2xl font-bold ${color}`}>{score}</span>
                          <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{category}</span>
                        </div>
                      </div>

                      <div className="flex gap-4 text-center">
                        <div>
                          <p className="font-mono text-sm font-bold text-white">{r.checkin_days}/7</p>
                          <p className="text-[10px] text-zinc-600">Check-in</p>
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-white">
                            {r.avg_readiness ?? "—"}
                          </p>
                          <p className="text-[10px] text-zinc-600">Ready</p>
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-white">
                            {r.training_count}/{r.training_target}
                          </p>
                          <p className="text-[10px] text-zinc-600">Training</p>
                        </div>
                        <div>
                          <p className={`font-mono text-sm font-bold ${color}`}>
                            {r.nutrition_rate}%
                          </p>
                          <p className="text-[10px] text-zinc-600">Nutrition</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {storedReports.filter((r) => r.week_start !== lastWeekStart).length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-600">
            Previous weeks will appear here as you build your history.
          </p>
        )}

      </div>
    </div>
  );
}
