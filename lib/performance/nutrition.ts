type NutritionInputs = {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  training_days_per_week: number;
  primary_goal: string;
};

type MacroTarget = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type NutritionTargets = {
  training_day: MacroTarget;
  rest_day: MacroTarget;
};

// Mifflin-St Jeor BMR + TDEE → training/rest day macro targets.
export function computeNutritionTargets(inputs: NutritionInputs): NutritionTargets {
  const { weight_kg, height_cm, age, gender, training_days_per_week, primary_goal } =
    inputs;

  // Base BMR formula component (shared)
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  const bmr =
    gender === "male" ? base + 5 : gender === "female" ? base - 161 : base - 78;

  // Activity multiplier based on training frequency
  const activityMultiplier =
    training_days_per_week <= 1 ? 1.375 :
    training_days_per_week <= 3 ? 1.55 :
    training_days_per_week <= 5 ? 1.725 : 1.9;

  const tdee = Math.round(bmr * activityMultiplier);

  // Goal-based calorie adjustment on top of TDEE
  const goalAdjustment =
    primary_goal === "strength"         ?  200 :
    primary_goal === "body_composition" ? -200 :
    primary_goal === "endurance"        ?  100 : 0;

  // Training days need more carbs/calories; rest days are lower
  const trainingCalories = tdee + goalAdjustment + 150;
  const restCalories     = tdee + goalAdjustment - 150;

  // Protein: 2 g/kg body weight (standard for active individuals)
  const protein_g = Math.round(weight_kg * 2);

  const buildMacros = (calories: number): MacroTarget => {
    const fat_g   = Math.round((calories * 0.3) / 9);
    const carbs_g = Math.max(0, Math.round((calories - protein_g * 4 - fat_g * 9) / 4));
    return { calories: Math.round(calories), protein_g, carbs_g, fat_g };
  };

  return {
    training_day: buildMacros(trainingCalories),
    rest_day:     buildMacros(restCalories),
  };
}
