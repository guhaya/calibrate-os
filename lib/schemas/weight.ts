import { z } from "zod";

export const WeightSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format."),
  weight_kg: z.coerce
    .number()
    .min(20, "Weight must be at least 20 kg.")
    .max(400, "Weight must be under 400 kg."),
  notes: z.string().max(200).optional(),
});

export const UpdateWeightSchema = WeightSchema.extend({
  id: z.string().uuid("Invalid entry ID."),
});

export const DeleteWeightSchema = z.object({
  id: z.string().uuid("Invalid entry ID."),
});

export type WeightInput = z.infer<typeof WeightSchema>;
