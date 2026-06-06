import { z } from "zod";

export const CheckinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format."),
  sleep_hours: z.coerce
    .number()
    .min(0, "Sleep hours cannot be negative.")
    .max(24, "Sleep hours cannot exceed 24."),
  sleep_quality: z.coerce.number().int().min(1).max(5),
  energy_level: z.coerce.number().int().min(1).max(5),
  muscle_soreness: z.coerce.number().int().min(1).max(5),
  stress_level: z.coerce.number().int().min(1).max(5),
  mood: z.coerce.number().int().min(1).max(5),
  steps: z.coerce.number().int().min(0).max(100000).optional(),
  notes: z.string().max(500).optional(),
});

export type CheckinInput = z.infer<typeof CheckinSchema>;
