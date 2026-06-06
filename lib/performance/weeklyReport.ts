// Weekly Performance Report engine.
// Pure functions — no DB access. All inputs resolved by the caller.

export type WeeklyReportInputs = {
  weekStart: string;
  weekEnd: string;
  weekDates: string[];
  checkins: { date: string; readiness_score: number | null }[];
  nutritionLogs: { date: string; protein_g: number | null }[];
  proteinTarget: number | null;
  workouts: { date: string }[];
  trainingTarget: number;
  weights: { date: string; weight_kg: number }[];
};

export type Trend = {
  label: string;
  direction: "up" | "down" | "flat";
  text: string;
};

// Storable fields — these are persisted to weekly_reports
export type WeeklyReportStorable = {
  overall_score:            number;
  checkin_days:             number;
  checkin_rate:             number;
  avg_readiness:            number | null;
  nutrition_compliant_days: number;
  nutrition_rate:           number;
  training_count:           number;
  training_target:          number;
  weight_start_kg:          number | null;
  weight_end_kg:            number | null;
  wins:                     string[];
  bottlenecks:              string[];
  recommended_focus:        string;
};

// ─── Main computation ──────────────────────────────────────────────────────────

export function computeWeeklyReport(inputs: WeeklyReportInputs): WeeklyReportStorable {
  const { weekDates, checkins, nutritionLogs, proteinTarget, workouts, trainingTarget, weights } = inputs;

  // ── Check-in ───────────────────────────────────────────────────────────────
  const checkinDates = new Set(checkins.map((c) => c.date));
  const checkinDays  = weekDates.filter((d) => checkinDates.has(d)).length;
  const checkinRate  = Math.round((checkinDays / 7) * 100);

  const readinessScores = checkins
    .filter((c) => weekDates.includes(c.date) && c.readiness_score !== null)
    .map((c) => c.readiness_score as number);
  const avgReadiness = readinessScores.length > 0
    ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length)
    : null;

  // ── Nutrition ──────────────────────────────────────────────────────────────
  let nutritionCompliantDays = 0;
  if (!proteinTarget || proteinTarget <= 0) {
    const loggedDates = new Set(nutritionLogs.map((l) => l.date));
    nutritionCompliantDays = weekDates.filter((d) => loggedDates.has(d)).length;
  } else {
    const proteinByDate = new Map<string, number>();
    for (const log of nutritionLogs) {
      if (weekDates.includes(log.date)) {
        proteinByDate.set(log.date, (proteinByDate.get(log.date) ?? 0) + (log.protein_g ?? 0));
      }
    }
    const threshold = proteinTarget * 0.8;
    nutritionCompliantDays = weekDates.filter((d) => (proteinByDate.get(d) ?? 0) >= threshold).length;
  }
  const nutritionRate = Math.round((nutritionCompliantDays / 7) * 100);

  // ── Training ───────────────────────────────────────────────────────────────
  const trainingCount = workouts.filter((w) => weekDates.includes(w.date)).length;
  const trainingRate  = Math.min(Math.round((trainingCount / Math.max(trainingTarget, 1)) * 100), 100);

  // ── Weight ─────────────────────────────────────────────────────────────────
  const weekWeights = weights
    .filter((w) => weekDates.includes(w.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const weightStartKg   = weekWeights[0]?.weight_kg ?? null;
  const weightEndKg     = weekWeights[weekWeights.length - 1]?.weight_kg ?? null;
  const weightLoggedDays = weekWeights.length;
  const weightRate       = Math.round((weightLoggedDays / 7) * 100);

  // ── Overall score (same weights as Calibration Score) ─────────────────────
  const overallScore = Math.round(
    (avgReadiness ?? 0) * 0.30 +
    checkinRate         * 0.20 +
    nutritionRate       * 0.20 +
    trainingRate        * 0.20 +
    weightRate          * 0.10
  );

  // ── Wins ───────────────────────────────────────────────────────────────────
  const wins: string[] = [];
  if (checkinDays === 7)
    wins.push("Perfect check-in week — all 7 days logged");
  else if (checkinDays >= 5)
    wins.push(`Strong check-in habit — ${checkinDays}/7 days`);

  if (nutritionCompliantDays >= 5)
    wins.push(`Hit ${proteinTarget ? "protein target" : "nutrition tracking"} ${nutritionCompliantDays}/7 days`);

  if (trainingTarget > 0 && trainingCount >= trainingTarget)
    wins.push(`Hit training target — ${trainingCount}/${trainingTarget} sessions`);
  else if (trainingTarget > 0 && trainingCount >= Math.ceil(trainingTarget * 0.75) && trainingCount > 0)
    wins.push(`Near training target — ${trainingCount}/${trainingTarget} sessions`);

  if (avgReadiness !== null && avgReadiness >= 75)
    wins.push(`High average readiness — ${avgReadiness}/100`);

  if (weightLoggedDays >= 5)
    wins.push(`Consistent weight tracking — ${weightLoggedDays}/7 days`);

  if (weightStartKg !== null && weightEndKg !== null && weightEndKg < weightStartKg - 0.1)
    wins.push(`Weight trending down — ${(weightStartKg - weightEndKg).toFixed(1)} kg`);

  // ── Bottlenecks ────────────────────────────────────────────────────────────
  const bottlenecks: string[] = [];
  if (checkinDays < 4)
    bottlenecks.push(`Low check-in consistency — ${checkinDays}/7 days`);

  if (nutritionCompliantDays < 3)
    bottlenecks.push(`Low nutrition compliance — ${nutritionCompliantDays}/7 days`);

  if (trainingCount === 0)
    bottlenecks.push("No training sessions logged");
  else if (trainingTarget > 0 && trainingCount < Math.ceil(trainingTarget / 2))
    bottlenecks.push(`Well below training target — ${trainingCount}/${trainingTarget} sessions`);

  if (avgReadiness !== null && avgReadiness < 50)
    bottlenecks.push(`Low average readiness — ${avgReadiness}/100`);

  if (weightLoggedDays === 0)
    bottlenecks.push("Weight not tracked this week");

  // ── Recommended focus ──────────────────────────────────────────────────────
  const pillars = [
    { label: "daily check-ins",    rate: checkinRate   },
    { label: "nutrition tracking", rate: nutritionRate  },
    { label: "training sessions",  rate: trainingRate   },
    { label: "weight logging",     rate: weightRate     },
    ...(avgReadiness !== null ? [{ label: "recovery quality", rate: avgReadiness }] : []),
  ];
  const weakest = [...pillars].sort((a, b) => a.rate - b.rate)[0];
  const recommendedFocus =
    `Prioritise ${weakest.label} next week — it's your weakest area and the fastest path to a higher Calibration Score.`;

  return {
    overall_score:            overallScore,
    checkin_days:             checkinDays,
    checkin_rate:             checkinRate,
    avg_readiness:            avgReadiness,
    nutrition_compliant_days: nutritionCompliantDays,
    nutrition_rate:           nutritionRate,
    training_count:           trainingCount,
    training_target:          trainingTarget,
    weight_start_kg:          weightStartKg,
    weight_end_kg:            weightEndKg,
    wins,
    bottlenecks,
    recommended_focus:        recommendedFocus,
  };
}

// ─── Trend computation ─────────────────────────────────────────────────────────
// Compares current week to previous week. Returns an array of trend observations.

export function computeWeeklyTrends(
  current: WeeklyReportStorable,
  previous: WeeklyReportStorable | null
): Trend[] {
  if (!previous) return [];
  const trends: Trend[] = [];

  const checkinDelta = current.checkin_rate - previous.checkin_rate;
  trends.push({
    label: "Check-In",
    direction: checkinDelta > 5 ? "up" : checkinDelta < -5 ? "down" : "flat",
    text: Math.abs(checkinDelta) <= 5
      ? `Steady at ${current.checkin_rate}% (last week: ${previous.checkin_rate}%)`
      : checkinDelta > 0
        ? `Up ${checkinDelta}% vs last week (${current.checkin_rate}% → ${previous.checkin_rate}%)`
        : `Down ${Math.abs(checkinDelta)}% vs last week (${current.checkin_rate}% → ${previous.checkin_rate}%)`,
  });

  if (current.avg_readiness !== null && previous.avg_readiness !== null) {
    const delta = current.avg_readiness - previous.avg_readiness;
    trends.push({
      label: "Readiness",
      direction: delta > 3 ? "up" : delta < -3 ? "down" : "flat",
      text: Math.abs(delta) <= 3
        ? `Holding steady — avg ${current.avg_readiness} (last week: ${previous.avg_readiness})`
        : delta > 0
          ? `Improved ${delta} pts vs last week (${current.avg_readiness} vs ${previous.avg_readiness})`
          : `Dropped ${Math.abs(delta)} pts vs last week (${current.avg_readiness} vs ${previous.avg_readiness})`,
    });
  }

  const nutritionDelta = current.nutrition_rate - previous.nutrition_rate;
  trends.push({
    label: "Nutrition",
    direction: nutritionDelta > 10 ? "up" : nutritionDelta < -10 ? "down" : "flat",
    text: Math.abs(nutritionDelta) <= 10
      ? `Nutrition compliance steady at ${current.nutrition_rate}%`
      : nutritionDelta > 0
        ? `Compliance up ${nutritionDelta}% vs last week`
        : `Compliance down ${Math.abs(nutritionDelta)}% vs last week`,
  });

  const trainingDelta = current.training_count - previous.training_count;
  trends.push({
    label: "Training",
    direction: trainingDelta > 0 ? "up" : trainingDelta < 0 ? "down" : "flat",
    text: trainingDelta === 0
      ? `${current.training_count} sessions — same as last week`
      : trainingDelta > 0
        ? `${current.training_count} sessions this week, up from ${previous.training_count}`
        : `${current.training_count} sessions this week, down from ${previous.training_count}`,
  });

  if (current.weight_end_kg !== null && previous.weight_end_kg !== null) {
    const delta = current.weight_end_kg - previous.weight_end_kg;
    trends.push({
      label: "Weight",
      direction: delta < -0.2 ? "down" : delta > 0.2 ? "up" : "flat",
      text: Math.abs(delta) < 0.2
        ? `Weight stable — ${current.weight_end_kg} kg`
        : delta < 0
          ? `Down ${Math.abs(delta).toFixed(1)} kg vs last week`
          : `Up ${delta.toFixed(1)} kg vs last week`,
    });
  }

  return trends;
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

export function buildWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export function getCurrentWeekStart(today: string): string {
  const d = new Date(today + "T12:00:00");
  const day = d.getDay(); // 0=Sun, 1=Mon…
  const daysBack = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split("T")[0];
}

export function getLastCompletedWeekStart(today: string): string {
  const thisMonday = getCurrentWeekStart(today);
  const d = new Date(thisMonday + "T12:00:00");
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end   = new Date(weekEnd   + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

export type WeeklyCategory = "ELITE" | "EXCELLENT" | "IMPROVING" | "AT RISK" | "CRITICAL";

export function weeklyCategory(score: number): WeeklyCategory {
  if (score >= 90) return "ELITE";
  if (score >= 80) return "EXCELLENT";
  if (score >= 70) return "IMPROVING";
  if (score >= 60) return "AT RISK";
  return "CRITICAL";
}

export function weeklyColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

export function weeklyBorderColor(score: number): string {
  if (score >= 80) return "border-emerald-400/30";
  if (score >= 70) return "border-amber-400/30";
  if (score >= 60) return "border-orange-400/30";
  return "border-red-400/30";
}
