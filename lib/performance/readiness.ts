type ReadinessInputs = {
  sleep_hours: number;
  sleep_quality: number;      // 1–5
  energy_level: number;       // 1–5
  muscle_soreness: number;    // 1–5  (5 = severe = bad)
  stress_level: number;       // 1–5  (5 = very stressed = bad)
  sleep_target_hours: number; // from profile, default 8
};

// Returns 0–100. Green ≥ 80, Yellow 50–79, Red < 50.
export function computeReadinessScore(inputs: ReadinessInputs): number {
  const { sleep_hours, sleep_quality, energy_level, muscle_soreness, stress_level, sleep_target_hours } = inputs;

  // Normalize each metric to 0–1
  const sleepNorm    = Math.min(sleep_hours / Math.max(sleep_target_hours, 1), 1.0);
  const qualityNorm  = (sleep_quality - 1) / 4;
  const energyNorm   = (energy_level - 1) / 4;
  const sorenessNorm = (5 - muscle_soreness) / 4; // inverted: low soreness = good
  const stressNorm   = (5 - stress_level) / 4;    // inverted: low stress = good

  // Weighted sum: sleep 40%, quality 20%, energy 20%, soreness 10%, stress 10%
  const raw = sleepNorm * 0.4 + qualityNorm * 0.2 + energyNorm * 0.2 + sorenessNorm * 0.1 + stressNorm * 0.1;

  return Math.round(raw * 100);
}

export function readinessLabel(score: number): "READY" | "MODERATE" | "RECOVER" {
  if (score >= 80) return "READY";
  if (score >= 50) return "MODERATE";
  return "RECOVER";
}

export function readinessColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function readinessBorderColor(score: number): string {
  if (score >= 80) return "border-emerald-400/30";
  if (score >= 50) return "border-amber-400/30";
  return "border-red-400/30";
}
