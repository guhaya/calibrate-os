"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WeightSchema, UpdateWeightSchema, DeleteWeightSchema } from "@/lib/schemas/weight";

export type WeightState = { error: string } | null;

export async function saveWeight(
  _prevState: WeightState,
  formData: FormData
): Promise<WeightState> {
  const parsed = WeightSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { error: dbError } = await supabase.from("weight_logs").upsert(
    { user_id: user.id, ...parsed.data },
    { onConflict: "user_id,date" }
  );

  if (dbError) return { error: `Could not save weight: ${dbError.message}` };

  revalidatePath("/checkin");
  return null;
}

export async function updateWeight(
  _prevState: WeightState,
  formData: FormData
): Promise<WeightState> {
  const parsed = UpdateWeightSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { id, ...fields } = parsed.data;

  const { error: dbError } = await supabase
    .from("weight_logs")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id);

  if (dbError) return { error: `Could not update weight: ${dbError.message}` };

  revalidatePath("/checkin");
  return null;
}

export async function deleteWeight(
  _prevState: WeightState,
  formData: FormData
): Promise<WeightState> {
  const parsed = DeleteWeightSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid entry ID." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { error: dbError } = await supabase
    .from("weight_logs")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (dbError) return { error: `Could not delete entry: ${dbError.message}` };

  revalidatePath("/checkin");
  return null;
}
