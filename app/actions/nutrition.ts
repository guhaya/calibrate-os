"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MealSchema, UpdateMealSchema, DeleteMealSchema } from "@/lib/schemas/nutrition";

export type NutritionState = { error: string } | null;

export async function addMeal(
  _prevState: NutritionState,
  formData: FormData
): Promise<NutritionState> {
  const parsed = MealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { error: dbError } = await supabase
    .from("nutrition_logs")
    .insert({ user_id: user.id, ...parsed.data });

  if (dbError) return { error: `Could not add meal: ${dbError.message}` };

  revalidatePath("/nutrition");
  return null;
}

export async function updateMeal(
  _prevState: NutritionState,
  formData: FormData
): Promise<NutritionState> {
  const parsed = UpdateMealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { id, ...fields } = parsed.data;

  const { error: dbError } = await supabase
    .from("nutrition_logs")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id); // redundant with RLS, but explicit

  if (dbError) return { error: `Could not update meal: ${dbError.message}` };

  revalidatePath("/nutrition");
  return null;
}

export async function deleteMeal(
  _prevState: NutritionState,
  formData: FormData
): Promise<NutritionState> {
  const parsed = DeleteMealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid meal ID." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { error: dbError } = await supabase
    .from("nutrition_logs")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (dbError) return { error: `Could not delete meal: ${dbError.message}` };

  revalidatePath("/nutrition");
  return null;
}
