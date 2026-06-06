"use client";

import { useState, useActionState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { deleteWorkout, type TrainingState } from "@/app/actions/training";
import WorkoutForm from "./WorkoutForm";
import type { Tables } from "@/types/database";

type WorkoutWithExercises = Tables<"workouts"> & {
  workout_exercises: Tables<"workout_exercises">[];
};

function computeVolume(exercises: Tables<"workout_exercises">[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets * ex.reps * Number(ex.weight_kg), 0);
}

export default function WorkoutCard({ workout }: { workout: WorkoutWithExercises }) {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [deleteState, deleteAction, isDeleting] = useActionState<TrainingState, FormData>(
    deleteWorkout,
    null
  );

  // Optimistic hide — card disappears the moment delete succeeds (before server re-render)
  if (deleteState === null && isDeleting === false && deleteState !== undefined) {
    // handled by revalidatePath re-rendering the parent
  }

  const exercises = [...workout.workout_exercises].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const volume = computeVolume(exercises);

  const dateLabel = new Date(workout.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  if (editing) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Edit Workout</p>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-zinc-500 transition-colors hover:text-white"
          >
            Cancel
          </button>
        </div>
        <WorkoutForm
          editing={workout}
          defaultDate={workout.date}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">
            {workout.name ?? "Workout"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{dateLabel}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={workout.id} />
            <button
              type="submit"
              disabled={isDeleting}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:text-rose-400 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 flex items-center gap-5">
        <div>
          <p className="text-xs text-zinc-500">Exercises</p>
          <p className="font-mono text-sm font-bold text-white">{exercises.length}</p>
        </div>
        <div className="h-6 w-px bg-zinc-800" />
        <div>
          <p className="text-xs text-zinc-500">Volume</p>
          <p className="font-mono text-sm font-bold text-white">
            {volume > 0 ? `${volume.toLocaleString()} kg` : "—"}
          </p>
        </div>
      </div>

      {deleteState?.error && (
        <p className="mt-2 text-xs text-rose-400">{deleteState.error}</p>
      )}

      {/* Toggle exercises */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-white"
      >
        {expanded
          ? <><ChevronUp className="h-3 w-3" /> Hide exercises</>
          : <><ChevronDown className="h-3 w-3" /> Show exercises</>
        }
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2"
            >
              <p className="text-sm text-white">{ex.exercise_name}</p>
              <p className="font-mono text-xs text-zinc-400">
                {ex.sets}×{ex.reps}
                {Number(ex.weight_kg) > 0 ? ` @ ${ex.weight_kg}kg` : ""}
                {ex.rpe !== null ? ` · RPE ${ex.rpe}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
