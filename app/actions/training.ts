"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WorkoutSchema, UpdateWorkoutSchema, DeleteWorkoutSchema } from "@/lib/schemas/training";

export type TrainingState = { error: string } | null;

export async function createWorkout(
  _prevState: TrainingState,
  formData: FormData
): Promise<TrainingState> {
  const parsed = WorkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { exercises_json: exercises, date, name, notes } = parsed.data;

  const { data: workout, error: workoutErr } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, date, name: name ?? null, notes: notes ?? null })
    .select("id")
    .single();

  if (workoutErr || !workout) {
    return { error: workoutErr?.message ?? "Failed to create workout." };
  }

  const exerciseRows = exercises.map((ex, i) => ({
    workout_id: workout.id,
    user_id:    user.id,
    exercise_name: ex.exercise_name,
    sets:       ex.sets,
    reps:       ex.reps,
    weight_kg:  ex.weight_kg,
    rpe:        ex.rpe ?? null,
    sort_order: i,
  }));

  const { error: exErr } = await supabase.from("workout_exercises").insert(exerciseRows);
  if (exErr) {
    // Roll back — cascade on workout delete removes exercises too
    await supabase.from("workouts").delete().eq("id", workout.id);
    return { error: exErr.message };
  }

  revalidatePath("/training");
  revalidatePath("/dashboard");
  return null;
}

export async function updateWorkout(
  _prevState: TrainingState,
  formData: FormData
): Promise<TrainingState> {
  const parsed = UpdateWorkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { id, exercises_json: exercises, date, name, notes } = parsed.data;

  const { error: updateErr } = await supabase
    .from("workouts")
    .update({ date, name: name ?? null, notes: notes ?? null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateErr) return { error: updateErr.message };

  // Delete-and-reinsert is simpler than diffing individual exercise rows
  const { error: delErr } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("workout_id", id);

  if (delErr) return { error: delErr.message };

  const exerciseRows = exercises.map((ex, i) => ({
    workout_id:    id,
    user_id:       user.id,
    exercise_name: ex.exercise_name,
    sets:          ex.sets,
    reps:          ex.reps,
    weight_kg:     ex.weight_kg,
    rpe:           ex.rpe ?? null,
    sort_order:    i,
  }));

  const { error: exErr } = await supabase.from("workout_exercises").insert(exerciseRows);
  if (exErr) return { error: exErr.message };

  revalidatePath("/training");
  revalidatePath("/dashboard");
  return null;
}

export async function deleteWorkout(
  _prevState: TrainingState,
  formData: FormData
): Promise<TrainingState> {
  const parsed = DeleteWorkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid workout ID." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Session expired. Please sign in again." };

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/training");
  revalidatePath("/dashboard");
  return null;
}
