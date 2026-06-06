import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkoutForm from "@/components/training/WorkoutForm";
import WorkoutHistory from "@/components/training/WorkoutHistory";
import type { Tables } from "@/types/database";

export const metadata: Metadata = { title: "Training — CALIBRATE OS" };

type WorkoutWithExercises = Tables<"workouts"> & {
  workout_exercises: Tables<"workout_exercises">[];
};

export default async function TrainingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("workouts")
    .select("*, workout_exercises(*)")
    .eq("user_id", user.id)
    .order("date",       { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  const workouts = (data ?? []) as WorkoutWithExercises[];

  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            TRAINING
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Training Log
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>

        {/* Log form */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-5 text-sm font-semibold text-white">Log a Workout</p>
          <WorkoutForm defaultDate={today} />
        </div>

        {/* History */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Recent workouts
          </p>
          <WorkoutHistory workouts={workouts} />
        </div>

      </div>
    </div>
  );
}
