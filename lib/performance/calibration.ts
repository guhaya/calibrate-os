// Calibration Score Engine
// Rolling 7-day composite grade measuring behavioral consistency + performance quality.
// Pure function — no DB access. All inputs resolved by the caller.

export type CalibrationInputs = {
  // last 7 days of check-in data
  checkins: { date: string; readiness_score: number | null }[];
  // last 7 days of nutrition logs — one entry per meal row (multiple per day)
  nutritionLogs: { date: string; protein_g: number | null }[];
  // protein target from nutrition_targets (training_day)
  proteinTarget: number | null;
  // last 7 days of workout dates
  workoutDates: string[];
  // user's weekly training target from profile
  trainingDaysTarget: number;
  // last 7 days of weight log dates
  weightLogDates: string[];
  // the 7 calendar dates being evaluated (today through 6 days ago)
  windowDates: string[];
};

export type CalibrationComponents = {
  readiness_component: number;
  checkin_component:   number;
  nutrition_component: number;
  training_component:  number;
  weight_component:    number;
};

export type CalibrationResult = CalibrationComponents & {
  score: number;
};

// ─── Pillar weights ────────────────────────────────────────────────────────────
// Readiness quality carries the most weight — it requires both showing up
// (check-in consistency) AND performing well (score quality).
const WEIGHTS = {
  readiness:  0.30,
  checkin:    0.20,
  nutrition:  0.20,
  training:   0.20,
  weight:     0.10,
} as const;

// ─── Pillar computations ───────────────────────────────────────────────────────

function readinessComponent(
  checkins: CalibrationInputs["checkins"]
): number {
  const scored = checkins
    .map((c) => c.readiness_score)
    .filter((s): s is number => s !== null);
  if (scored.length === 0) return 0;
  const avg = scored.reduce((a, b) => a + b, 0) / scored.length;
  return Math.round(avg);
}

function checkinComponent(
  checkins: CalibrationInputs["checkins"],
  windowDates: string[]
): number {
  const checkinDates = new Set(checkins.map((c) => c.date));
  const completed = windowDates.filter((d) => checkinDates.has(d)).length;
  return Math.round((completed / windowDates.length) * 100);
}

function nutritionComponent(
  logs: CalibrationInputs["nutritionLogs"],
  proteinTarget: number | null,
  windowDates: string[]
): number {
  if (!proteinTarget || proteinTarget <= 0) {
    // No target set — score by whether any meal was logged each day
    const loggedDates = new Set(logs.map((l) => l.date));
    const logged = windowDates.filter((d) => loggedDates.has(d)).length;
    return Math.round((logged / windowDates.length) * 100);
  }

  // Group protein by date
  const proteinByDate = new Map<string, number>();
  for (const log of logs) {
    const prev = proteinByDate.get(log.date) ?? 0;
    proteinByDate.set(log.date, prev + (log.protein_g ?? 0));
  }

  // A day is compliant if protein logged ≥ 80% of target
  const threshold = proteinTarget * 0.8;
  const compliant = windowDates.filter(
    (d) => (proteinByDate.get(d) ?? 0) >= threshold
  ).length;

  return Math.round((compliant / windowDates.length) * 100);
}

function trainingComponent(
  workoutDates: string[],
  targetDays: number
): number {
  if (targetDays <= 0) return 100; // user isn't a training-focus person
  const actual = workoutDates.length;
  return Math.min(Math.round((actual / targetDays) * 100), 100);
}

function weightComponent(
  weightLogDates: string[],
  windowDates: string[]
): number {
  const logged = new Set(weightLogDates);
  const present = windowDates.filter((d) => logged.has(d)).length;
  return Math.round((present / windowDates.length) * 100);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function computeCalibrationScore(
  inputs: CalibrationInputs
): CalibrationResult {
  const { checkins, nutritionLogs, proteinTarget, workoutDates,
          trainingDaysTarget, weightLogDates, windowDates } = inputs;

  const components: CalibrationComponents = {
    readiness_component: readinessComponent(checkins),
    checkin_component:   checkinComponent(checkins, windowDates),
    nutrition_component: nutritionComponent(nutritionLogs, proteinTarget, windowDates),
    training_component:  trainingComponent(workoutDates, trainingDaysTarget),
    weight_component:    weightComponent(weightLogDates, windowDates),
  };

  const score = Math.round(
    components.readiness_component * WEIGHTS.readiness +
    components.checkin_component   * WEIGHTS.checkin   +
    components.nutrition_component * WEIGHTS.nutrition  +
    components.training_component  * WEIGHTS.training   +
    components.weight_component    * WEIGHTS.weight
  );

  return { ...components, score };
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export type CalibrationCategory =
  | "ELITE"
  | "EXCELLENT"
  | "IMPROVING"
  | "AT RISK"
  | "CRITICAL";

export function calibrationCategory(score: number): CalibrationCategory {
  if (score >= 90) return "ELITE";
  if (score >= 80) return "EXCELLENT";
  if (score >= 70) return "IMPROVING";
  if (score >= 60) return "AT RISK";
  return "CRITICAL";
}

export function calibrationColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  if (score >= 60) return "text-orange-400";
  return "text-red-400";
}

export function calibrationBorderColor(score: number): string {
  if (score >= 80) return "border-emerald-400/30";
  if (score >= 70) return "border-amber-400/30";
  if (score >= 60) return "border-orange-400/30";
  return "border-red-400/30";
}

// Build the array of the last N calendar dates (today first)
export function buildWindowDates(today: string, days = 7): string[] {
  const result: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split("T")[0]);
  }
  return result;
}
