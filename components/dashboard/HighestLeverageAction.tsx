import type { ActionResult } from "@/lib/performance/action";

type Props = {
  action: ActionResult;
};

const PILLAR_LABELS: Record<string, string> = {
  checkin:   "Check-In",
  recovery:  "Recovery",
  nutrition: "Nutrition",
  training:  "Training",
  weight:    "Weight",
};

const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const PILLAR_STYLES: Record<string, string> = {
  checkin:   "bg-sky-500/15 text-sky-400",
  recovery:  "bg-violet-500/15 text-violet-400",
  nutrition: "bg-lime-500/15 text-lime-400",
  training:  "bg-orange-500/15 text-orange-400",
  weight:    "bg-zinc-500/15 text-zinc-400",
};

export default function HighestLeverageAction({ action }: Props) {
  const pillarLabel   = PILLAR_LABELS[action.pillar]   ?? action.pillar;
  const pillarStyle   = PILLAR_STYLES[action.pillar]   ?? "bg-zinc-500/15 text-zinc-400";
  const priorityStyle = PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.medium;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Highest Leverage Action
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${priorityStyle}`}>
            {action.priority}
          </span>
          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pillarStyle}`}>
            {pillarLabel}
          </span>
        </div>
      </div>

      {/* Action */}
      <p className="mt-3 text-base font-semibold leading-snug text-white">
        {action.action}
      </p>

      {/* Reason */}
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        {action.reason}
      </p>

      {/* Expected impact */}
      <div className="mt-4 rounded-lg bg-zinc-800/60 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Expected Impact
        </p>
        <p className="mt-1 text-sm text-zinc-300">
          {action.expected_impact}
        </p>
      </div>
    </div>
  );
}
