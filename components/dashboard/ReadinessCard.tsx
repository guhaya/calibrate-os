import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  readinessLabel,
  readinessColor,
  readinessBorderColor,
} from "@/lib/performance/readiness";

type Props = {
  score:     number | null;
  checkedIn: boolean;
  streak:    number;
};

export default function ReadinessCard({ score, checkedIn, streak }: Props) {
  if (!checkedIn || score === null) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Readiness
        </p>
        <p className="mt-3 text-lg font-semibold text-white">
          No check-in yet today.
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          Takes 60 seconds. Know your performance state.
        </p>
        <Link
          href="/checkin"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300"
        >
          Check in now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const label  = readinessLabel(score);
  const color  = readinessColor(score);
  const border = readinessBorderColor(score);

  return (
    <div className={`rounded-xl border ${border} bg-zinc-900 p-6`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Today&apos;s Readiness
        </p>
        {streak > 0 && (
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-400">
            🔥 {streak}-day streak
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end gap-4">
        <span className={`font-mono text-7xl font-bold leading-none ${color}`}>
          {score}
        </span>
        <div className="mb-1.5">
          <span className={`text-base font-bold uppercase tracking-widest ${color}`}>
            {label}
          </span>
        </div>
      </div>

      <Link
        href="/checkin"
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        View full check-in
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
