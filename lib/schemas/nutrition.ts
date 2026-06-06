import { z } from "zod";

export const MealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format."),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"], {
    errorMap: () => ({ message: "Please select a meal type." }),
  }),
  meal_name: z.string().min(1, "Meal name is required.").max(100),
  calories: z.coerce.number().int().min(0).max(5000),
  protein_g: z.coerce.number().min(0).max(500),
  carbs_g: z.coerce.number().min(0).max(500),
  fat_g: z.coerce.number().min(0).max(500),
});

export const UpdateMealSchema = MealSchema.extend({
  id: z.string().uuid("Invalid meal ID."),
});

export const DeleteMealSchema = z.object({
  id: z.string().uuid("Invalid meal ID."),
});

export type MealInput = z.infer<typeof MealSchema>;
export type UpdateMealInput = z.infer<typeof UpdateMealSchema>;
