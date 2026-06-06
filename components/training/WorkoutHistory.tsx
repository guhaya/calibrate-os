import { Dumbbell } from "lucide-react";
import WorkoutCard from "./WorkoutCard";
import type { Tables } from "@/types/database";

type WorkoutWithExercises = Tables<"workouts"> & {
  workout_exercises: Tables<"workout_exercises">[];
};

export default function WorkoutHistory({ workouts }: { workouts: WorkoutWithExercises[] }) {
  if (workouts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center">
        <Dumbbell className="mx-auto h-8 w-8 text-zinc-700" />
        <p className="mt-3 text-sm text-zinc-500">No workouts logged yet.</p>
        <p className="mt-1 text-xs text-zinc-600">Log your first session above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
