import { z } from "zod";

export const OnboardingSchema = z.object({
  full_name: z.string().min(1, "Name is required.").max(100),
  age: z.coerce
    .number()
    .int()
    .min(16, "Must be at least 16.")
    .max(100, "Must be under 100."),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    errorMap: () => ({ message: "Please select a gender." }),
  }),
  height_cm: z.coerce
    .number()
    .min(100, "Height must be at least 100 cm.")
    .max(250, "Height must be under 250 cm."),
  weight_kg: z.coerce
    .number()
    .min(30, "Weight must be at least 30 kg.")
    .max(300, "Weight must be under 300 kg."),
  primary_goal: z.enum(
    ["strength", "endurance", "body_composition", "general_health", "energy_cognition"],
    { errorMap: () => ({ message: "Please select a goal." }) }
  ),
  training_days_per_week: z.coerce.number().int().min(1).max(7),
  primary_activity: z.string().min(1, "Please select an activity.").max(100),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;
