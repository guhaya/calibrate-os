import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  calories:       number;
  protein:        number;
  targetCalories: number | null;
  targetProtein:  number | null;
  mealCount:      number;
};

function Bar({ actual, target, color }: { actual: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
      <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function MacroSummary({
  calories, protein, targetCalories, targetProtein, mealCount,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Nutrition
        </p>
        <span className="text-xs text-zinc-600">
          {mealCount} {mealCount === 1 ? "meal" : "meals"} logged
        </span>
      </div>

      {mealCount === 0 ? (
        <div className="mt-4">
          <p className="text-sm text-zinc-500">Nothing logged today.</p>
          <Link
            href="/nutrition"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Log your first meal
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-500">Calories</span>
              <span className="font-mono text-xs text-white">
                {calories.toLocaleString()}
                {targetCalories && (
                  <span className="text-zinc-600"> / {targetCalories.toLocaleString()}</span>
                )}
              </span>
            </div>
            {targetCalories && <Bar actual={calories} target={targetCalories} color="bg-emerald-400" />}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-zinc-500">Protein</span>
              <span className="font-mono text-xs text-white">
                {Math.round(protein)}g
                {targetProtein && (
                  <span className="text-zinc-600"> / {targetProtein}g</span>
                )}
              </span>
            </div>
            {targetProtein && <Bar actual={protein} target={targetProtein} color="bg-blue-400" />}
          </div>

          <Link
            href="/nutrition"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Full nutrition log
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
