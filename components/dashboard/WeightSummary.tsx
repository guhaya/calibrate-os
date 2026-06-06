import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

type Props = {
  latest:   number | null;
  previous: number | null;
  date:     string | null;
};

export default function WeightSummary({ latest, previous, date }: Props) {
  const delta = latest !== null && previous !== null ? latest - previous : null;

  const TrendIcon =
    delta === null ? null :
    delta > 0.05  ? TrendingUp :
    delta < -0.05 ? TrendingDown : Minus;

  const trendColor =
    delta === null  ? "" :
    delta > 0.05   ? "text-rose-400" :
    delta < -0.05  ? "text-emerald-400" : "text-zinc-400";

  const dateLabel = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Body Weight
      </p>

      {latest === null ? (
        <div className="mt-3">
          <p className="text-sm text-zinc-500">No entries yet.</p>
          <Link
            href="/checkin"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Log weight
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white">{latest}</span>
            <span className="text-sm text-zinc-500">kg</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            {TrendIcon && delta !== null && (
              <>
                <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                <span className={`font-mono text-xs ${trendColor}`}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
                </span>
              </>
            )}
            {dateLabel && (
              <span className="text-xs text-zinc-600">as of {dateLabel}</span>
            )}
          </div>

          <Link
            href="/checkin"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            View history
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
