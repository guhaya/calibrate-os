// All Anthropic API calls for daily briefs route through this module.
// Never call the Anthropic SDK directly elsewhere in the codebase.
// ANTHROPIC_API_KEY is server-only — this file must never be imported by client components.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env automatically

export type BriefContext = {
  firstName:         string;
  primaryGoal:       string | null;
  trainingTarget:    number;
  calibrationScore:  number;
  calibrationComponents: {
    checkin_component:   number;
    readiness_component: number;
    nutrition_component: number;
    training_component:  number;
    weight_component:    number;
  };
  checkin: {
    readiness_score:  number | null;
    sleep_hours:      number | null;
    sleep_quality:    number | null;
    energy_level:     number | null;
    muscle_soreness:  number | null;
    stress_level:     number | null;
    mood:             number | null;
  } | null;
  sleepTarget:         number;
  todayCalories:       number;
  todayProtein:        number;
  proteinTarget:       number | null;
  mealsLoggedToday:    number;
  workoutsThisWeek:    number;
  latestWeightKg:      number | null;
  previousWeightKg:    number | null;
  weeklyScore:         number | null;
  weeklyCheckinDays:   number | null;
  weeklyNutritionDays: number | null;
  weeklyTrainingCount: number | null;
  weeklyTrainingTarget: number | null;
};

export type BriefResult = {
  today_status:       string;
  key_insight:        string;
  bottleneck:         string;
  recommended_action: string;
  expected_outcome:   string;
};

function buildPrompt(ctx: BriefContext): string {
  const goalLabel: Record<string, string> = {
    strength:          "Build Strength",
    endurance:         "Build Endurance",
    body_composition:  "Improve Body Composition",
    general_health:    "General Health",
    energy_cognition:  "Energy & Cognition",
  };
  const goal = ctx.primaryGoal ? (goalLabel[ctx.primaryGoal] ?? ctx.primaryGoal) : "General Performance";

  const calibCategory =
    ctx.calibrationScore >= 90 ? "ELITE"      :
    ctx.calibrationScore >= 80 ? "EXCELLENT"  :
    ctx.calibrationScore >= 70 ? "IMPROVING"  :
    ctx.calibrationScore >= 60 ? "AT RISK"    : "CRITICAL";

  const checkinBlock = ctx.checkin
    ? [
        `  Readiness: ${ctx.checkin.readiness_score ?? "—"}/100`,
        `  Sleep: ${ctx.checkin.sleep_hours ?? "—"}h (target ${ctx.sleepTarget}h) | Quality: ${ctx.checkin.sleep_quality ?? "—"}/5`,
        `  Energy: ${ctx.checkin.energy_level ?? "—"}/5 | Mood: ${ctx.checkin.mood ?? "—"}/5 | Soreness: ${ctx.checkin.muscle_soreness ?? "—"}/5 | Stress: ${ctx.checkin.stress_level ?? "—"}/5`,
      ].join("\n")
    : "  Not completed today";

  const nutritionBlock = ctx.mealsLoggedToday > 0
    ? [
        `  ${Math.round(ctx.todayCalories)} kcal | ${Math.round(ctx.todayProtein)}g protein`,
        ctx.proteinTarget
          ? `  Protein target: ${ctx.proteinTarget}g (${Math.round((ctx.todayProtein / ctx.proteinTarget) * 100)}% hit)`
          : "  No protein target set",
      ].join("\n")
    : "  No meals logged yet today";

  const weightBlock = ctx.latestWeightKg !== null
    ? (() => {
        const delta = ctx.previousWeightKg !== null
          ? ctx.latestWeightKg - ctx.previousWeightKg
          : null;
        const trend = delta === null ? "" : delta > 0.1 ? ` (+${delta.toFixed(1)} kg)` : delta < -0.1 ? ` (${delta.toFixed(1)} kg)` : " (stable)";
        return `  ${ctx.latestWeightKg} kg${trend}`;
      })()
    : "  Not logged this week";

  const weeklyBlock = ctx.weeklyScore !== null
    ? [
        `  Score: ${ctx.weeklyScore}/100`,
        `  Check-ins: ${ctx.weeklyCheckinDays ?? "—"}/7 | Nutrition: ${ctx.weeklyNutritionDays ?? "—"}/7 | Training: ${ctx.weeklyTrainingCount ?? "—"}/${ctx.weeklyTrainingTarget ?? "—"}`,
      ].join("\n")
    : "  No weekly report available yet";

  return `You are a performance coach for CALIBRATE OS, a human performance tracking system. Write a brief for the user below.

Rules:
- Be specific to THEIR numbers — never give generic fitness advice
- Sound like a coach who knows their history, not a chatbot
- 2-3 sentences per section, no more
- Use their actual numbers (scores, grams, hours, counts)
- Be direct and honest — if something is low, say so
- Respond ONLY with valid JSON, nothing else

USER: ${ctx.firstName} | Goal: ${goal} | Training target: ${ctx.trainingTarget} days/week

CALIBRATION SCORE: ${ctx.calibrationScore}/100 (${calibCategory})
  Check-In component:   ${ctx.calibrationComponents.checkin_component}/100
  Readiness component:  ${ctx.calibrationComponents.readiness_component}/100
  Nutrition component:  ${ctx.calibrationComponents.nutrition_component}/100
  Training component:   ${ctx.calibrationComponents.training_component}/100
  Weight component:     ${ctx.calibrationComponents.weight_component}/100

TODAY'S CHECK-IN
${checkinBlock}

NUTRITION TODAY
${nutritionBlock}

TRAINING THIS WEEK
  ${ctx.workoutsThisWeek} of ${ctx.trainingTarget} sessions completed

WEIGHT
${weightBlock}

LAST WEEK
${weeklyBlock}

Return exactly this JSON with no other text:
{"today_status":"...","key_insight":"...","bottleneck":"...","recommended_action":"...","expected_outcome":"..."}`;
}

function parseBriefResponse(text: string): BriefResult | null {
  try {
    // Strip any markdown code fences Claude might add despite instructions
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const fields: (keyof BriefResult)[] = [
      "today_status", "key_insight", "bottleneck", "recommended_action", "expected_outcome",
    ];
    for (const field of fields) {
      if (typeof parsed[field] !== "string" || !parsed[field]) return null;
    }
    return parsed as unknown as BriefResult;
  } catch {
    return null;
  }
}

export async function generateDailyBrief(ctx: BriefContext): Promise<BriefResult | null> {
  try {
    const prompt = buildPrompt(ctx);

    const message = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 700,
      messages:   [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const result = parseBriefResponse(textBlock.text);
    return result;
  } catch (err) {
    // Log server-side; caller falls back to rule-based content
    console.error("[generateDailyBrief] Claude API error:", err);
    return null;
  }
}
