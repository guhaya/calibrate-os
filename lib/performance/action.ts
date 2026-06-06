// Highest Leverage Action Engine
// Pure decision tree — picks exactly ONE recommendation per day.
// Priority order: missing critical habit → struggling recovery → lowest pillar.
// No DB access — all inputs resolved by the caller.

export type ActionPillar = "checkin" | "recovery" | "nutrition" | "training" | "weight";
export type ActionPriority = "high" | "medium" | "low";

export type ActionContext = {
  today: string;
  checkedInToday: boolean;
  readinessToday: number | null;
  calibrationComponents: {
    checkin_component:   number;
    readiness_component: number;
    nutrition_component: number;
    training_component:  number;
    weight_component:    number;
  };
  mealsLoggedToday: number;
  proteinLoggedToday: number;
  proteinTarget: number | null;
  workoutsThisWeek: number;
  trainingDaysTarget: number;
  weightLoggedToday: boolean;
};

export type ActionResult = {
  action:          string;
  reason:          string;
  expected_impact: string;
  pillar:          ActionPillar;
  priority:        ActionPriority;
};

// ─── Decision tree ────────────────────────────────────────────────────────────

export function selectHighestLeverageAction(ctx: ActionContext): ActionResult {
  // Rule 1: Haven't checked in today — this is the top-of-funnel behavior.
  // Nothing else is reliable without a daily check-in.
  if (!ctx.checkedInToday) {
    return {
      action:          "Complete your morning check-in",
      reason:          "Your check-in is the foundation of CALIBRATE OS — it captures readiness, sleep, and mood so every other recommendation is grounded in how you actually feel today.",
      expected_impact: "Unlocks accurate readiness scoring and personalises today's training and recovery guidance.",
      pillar:          "checkin",
      priority:        "high",
    };
  }

  // Rule 2: Low readiness — recovery takes precedence over everything else.
  if (ctx.readinessToday !== null && ctx.readinessToday < 50) {
    return {
      action:          "Prioritise recovery today — skip or significantly reduce training intensity",
      reason:          `Your readiness score is ${ctx.readinessToday}/100. Pushing hard on a compromised system delays adaptation and increases injury risk.`,
      expected_impact: "One intentional recovery day now can unlock 2–3 higher quality training days this week.",
      pillar:          "recovery",
      priority:        "high",
    };
  }

  // Rule 3: Find the lowest-scoring pillar and generate a contextual action.
  const components = ctx.calibrationComponents;

  const pillars: { key: ActionPillar; score: number }[] = [
    { key: "checkin",   score: components.checkin_component   },
    { key: "recovery",  score: components.readiness_component },
    { key: "nutrition", score: components.nutrition_component },
    { key: "training",  score: components.training_component  },
    { key: "weight",    score: components.weight_component    },
  ];

  // Sort ascending — lowest score first
  const sorted = [...pillars].sort((a, b) => a.score - b.score);
  const lowest = sorted[0];

  // All pillars strong — maintenance action
  if (lowest.score >= 80) {
    return {
      action:          "Maintain your current momentum — log today's training session",
      reason:          "All five pillars are performing well. Your highest leverage move is to log your session and keep the streak alive.",
      expected_impact: "Consistent logging at this level compounds into an Elite Calibration Score by end of week.",
      pillar:          "training",
      priority:        "low",
    };
  }

  // Pillar-specific contextual actions
  return contextualAction(lowest.key, ctx);
}

function contextualAction(pillar: ActionPillar, ctx: ActionContext): ActionResult {
  switch (pillar) {
    case "checkin":
      return {
        action:          "Build your check-in habit — complete today's check-in right now",
        reason:          "Check-in consistency is only " + ctx.calibrationComponents.checkin_component + "/100 over the last 7 days. Daily data is what separates reactive guessing from performance optimisation.",
        expected_impact: "Each consecutive check-in raises your Check-In component — 5 days in a row moves the needle by ~30 points.",
        pillar:          "checkin",
        priority:        "high",
      };

    case "recovery":
      return {
        action:          "Focus on sleep quality tonight — target 7–9 hours and a consistent bedtime",
        reason:          "Your readiness component is " + ctx.calibrationComponents.readiness_component + "/100, indicating inconsistent recovery over the past week.",
        expected_impact: "One week of quality sleep can raise your readiness component by 20–40 points and dramatically improve training quality.",
        pillar:          "recovery",
        priority:        "medium",
      };

    case "nutrition": {
      if (ctx.mealsLoggedToday === 0) {
        return {
          action:          "Log your first meal of the day",
          reason:          "Nutrition compliance is " + ctx.calibrationComponents.nutrition_component + "/100. You haven't logged any meals today — logging is the minimum requirement for improvement.",
          expected_impact: "Days with at least one logged meal count toward your nutrition compliance streak.",
          pillar:          "nutrition",
          priority:        "high",
        };
      }
      if (ctx.proteinTarget !== null && ctx.proteinLoggedToday < ctx.proteinTarget * 0.8) {
        const remaining = Math.round(ctx.proteinTarget - ctx.proteinLoggedToday);
        return {
          action:          `Hit your protein target — you need ~${remaining}g more today`,
          reason:          `You've logged ${ctx.proteinLoggedToday}g of your ${ctx.proteinTarget}g target. Protein is the macro with the highest return on investment for body composition.`,
          expected_impact: "Consistently hitting protein targets is the single fastest way to raise your Nutrition component.",
          pillar:          "nutrition",
          priority:        "medium",
        };
      }
      return {
        action:          "Log all of today's meals to complete your nutrition tracking",
        reason:          "Nutrition compliance is " + ctx.calibrationComponents.nutrition_component + "/100. Consistent logging is the foundation of dietary awareness.",
        expected_impact: "Complete daily logging raises your Nutrition component and gives your AI brief better data to work with.",
        pillar:          "nutrition",
        priority:        "medium",
      };
    }

    case "training": {
      const target = ctx.trainingDaysTarget;
      const done   = ctx.workoutsThisWeek;
      if (done === 0) {
        return {
          action:          "Complete your first training session of the week",
          reason:          "You haven't logged any workouts this week. Training compliance is " + ctx.calibrationComponents.training_component + "/100.",
          expected_impact: "One session today can lift your Training component by up to " + Math.round(100 / target) + " points.",
          pillar:          "training",
          priority:        "high",
        };
      }
      const remaining = Math.max(0, target - done);
      return {
        action:          `Complete ${remaining} more workout${remaining !== 1 ? "s" : ""} this week to hit your target`,
        reason:          `You've trained ${done}/${target} days this week. Closing the gap now keeps your Training component on track.`,
        expected_impact: "Hitting your weekly training target puts your Training component at 100/100 and raises your overall Calibration Score.",
        pillar:          "training",
        priority:        "medium",
      };
    }

    case "weight":
      return {
        action:          "Log your weight first thing tomorrow morning",
        reason:          "Weight tracking is " + ctx.calibrationComponents.weight_component + "/100. Weekly weigh-ins provide the trend data needed to validate whether your nutrition and training plan is working.",
        expected_impact: "7 consecutive weigh-ins puts your Weight component at 100/100 — a quick 10-point Calibration Score boost.",
        pillar:          "weight",
        priority:        "low",
      };
  }
}
