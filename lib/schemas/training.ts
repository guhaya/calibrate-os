import { z } from "zod";

export const ACTIVITY_TYPES = [
  "strength",
  "running",
  "cycling",
  "swimming",
  "hiit",
  "yoga_mobility",
  "sport",
  "other",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  strength:      "Strength",
  running:       "Running",
  cycling:       "Cycling",
  swimming:      "Swimming",
  hiit:          "HIIT",
  yoga_mobility: "Yoga / Mobility",
  sport:         "Sport",
  other:         "Other",
};

// Coerce empty string → null for optional numeric form fields
const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().int().min(min).max(max).nullable().optional()
  );

export const ExerciseSchema = z.object({
  exercise_name: z.string().min(1, "Exercise name is required").max(100),
  sets: z.coerce.number().int().min(1, "At least 1 set").max(100),
  reps: z.coerce.number().int().min(1, "At least 1 rep").max(10000),
  weight_kg: z.coerce.number().min(0).max(9999.99),
  rpe: z.coerce.number().int().min(1).max(10).nullable().optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

export const WorkoutSchema = z.object({
  date:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  name:             z.string().max(100).optional(),
  activity_type:    z.enum(ACTIVITY_TYPES).default("strength"),
  duration_minutes: optionalInt(1, 1440),
  session_rpe:      optionalInt(1, 10),
  notes:            z.string().max(500).optional(),
  exercises_json:   z.string().transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val) as unknown;
      const result = z.array(ExerciseSchema).min(1, "Add at least one exercise").safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error.issues[0].message });
        return z.NEVER;
      }
      return result.data;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid exercises" });
      return z.NEVER;
    }
  }),
});

export const UpdateWorkoutSchema = WorkoutSchema.extend({
  id: z.string().uuid("Invalid workout ID"),
});

export const DeleteWorkoutSchema = z.object({
  id: z.string().uuid("Invalid workout ID"),
});
