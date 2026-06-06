"use client";

import { useState, useEffect, useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createWorkout, updateWorkout, type TrainingState } from "@/app/actions/training";
import type { Tables } from "@/types/database";

type WorkoutWithExercises = Tables<"workouts"> & {
  workout_exercises: Tables<"workout_exercises">[];
};

type ExerciseRow = {
  exercise_name: string;
  sets:          string;
  reps:          string;
  weight_kg:     string;
  rpe:           string;
};

type Props = {
  defaultDate: string;
  editing?:    WorkoutWithExercises;
  onDone?:     () => void;
};

const EMPTY: ExerciseRow = {
  exercise_name: "",
  sets:      "3",
  reps:      "10",
  weight_kg: "0",
  rpe:       "",
};

function toRow(ex: Tables<"workout_exercises">): ExerciseRow {
  return {
    exercise_name: ex.exercise_name,
    sets:      String(ex.sets),
    reps:      String(ex.reps),
    weight_kg: String(ex.weight_kg),
    rpe:       ex.rpe !== null ? String(ex.rpe) : "",
  };
}

export default function WorkoutForm({ defaultDate, editing, onDone }: Props) {
  const initialExercises = editing
    ? [...editing.workout_exercises]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(toRow)
    : [{ ...EMPTY }];

  const [exercises, setExercises] = useState<ExerciseRow[]>(initialExercises);

  const action = editing ? updateWorkout : createWorkout;
  const [state, formAction, isPending] = useActionState<TrainingState, FormData>(action, null);

  // After success: notify parent (edit mode) or reset form (add mode)
  useEffect(() => {
    if (state === null && !isPending) return; // initial state, not a completed action
    // state === null means success (our actions return null on success)
  }, [state, isPending]);

  // Track whether a successful submit has happened
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted && state === null && !isPending) {
      if (onDone) {
        onDone();
      } else {
        setExercises([{ ...EMPTY }]);
        setSubmitted(false);
      }
    }
  }, [submitted, state, isPending, onDone]);

  function addExercise() {
    setExercises((prev) => [...prev, { ...EMPTY }]);
  }

  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateExercise(i: number, field: keyof ExerciseRow, value: string) {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex))
    );
  }

  const exercisesPayload = exercises.map((ex) => ({
    exercise_name: ex.exercise_name,
    sets:      Number(ex.sets)      || 1,
    reps:      Number(ex.reps)      || 1,
    weight_kg: Number(ex.weight_kg) || 0,
    rpe:       ex.rpe !== "" ? Number(ex.rpe) : null,
  }));

  return (
    <form
      action={(fd) => {
        setSubmitted(true);
        return formAction(fd);
      }}
      className="space-y-5"
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <input type="hidden" name="exercises_json" value={JSON.stringify(exercisesPayload)} />

      {/* Date + Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={editing?.date ?? defaultDate}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Name <span className="normal-case font-normal text-zinc-600">(optional)</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={editing?.name ?? ""}
            placeholder="e.g. Push Day"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Exercises
          </p>
          <button
            type="button"
            onClick={addExercise}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add exercise
          </button>
        </div>

        {exercises.map((ex, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-800/40 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500">Exercise {i + 1}</p>
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(i)}
                  className="text-zinc-600 transition-colors hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Exercise name"
              value={ex.exercise_name}
              onChange={(e) => updateExercise(i, "exercise_name", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
            />

            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { field: "sets"      as const, label: "Sets" },
                  { field: "reps"      as const, label: "Reps" },
                  { field: "weight_kg" as const, label: "kg"   },
                  { field: "rpe"       as const, label: "RPE"  },
                ] as const
              ).map(({ field, label }) => (
                <div key={field}>
                  <label className="mb-1 block text-xs text-zinc-500">{label}</label>
                  <input
                    type="number"
                    min={field === "rpe" ? 1 : 0}
                    max={field === "rpe" ? 10 : undefined}
                    step={field === "weight_kg" ? "0.5" : "1"}
                    placeholder={field === "rpe" ? "—" : undefined}
                    value={ex[field]}
                    onChange={(e) => updateExercise(i, field, e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-center text-sm text-white placeholder:text-zinc-700 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Notes <span className="normal-case font-normal text-zinc-600">(optional)</span>
        </label>
        <textarea
          name="notes"
          defaultValue={editing?.notes ?? ""}
          placeholder="Any notes about this session…"
          rows={2}
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-rose-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
      >
        {isPending ? "Saving…" : editing ? "Save changes" : "Log workout"}
      </button>
    </form>
  );
}
