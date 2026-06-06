import {
  weeklyCategory,
  weeklyColor,
  weeklyBorderColor,
  formatWeekLabel,
  type WeeklyReportStorable,
  type Trend,
} from "@/lib/performance/weeklyReport";

type Props = {
  report: WeeklyReportStorable;
  weekStart: string;
  weekEnd: string;
  trends?: Trend[];
  inProgress?: boolean;
};

function PillarBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? "bg-emerald-400" :
    value >= 60 ? "bg-amber-400"   : "bg-red-400";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="font-mono text-xs font-semibold text-white">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-1 rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

const TREND_ICONS: Record<Trend["direction"], string> = {
  up:   "↑",
  down: "↓",
  flat: "→",
};
const TREND_COLORS: Record<Trend["direction"], string> = {
  up:   "text-emerald-400",
  down: "text-red-400",
  flat: "text-zinc-500",
};

export default function WeeklyReportCard({
  report,
  weekStart,
  weekEnd,
  trends,
  inProgress = false,
}: Props) {
  const score    = report.overall_score;
  const category = weeklyCategory(score);
  const color    = weeklyColor(score);
  const border   = weeklyBorderColor(score);
  const weekLabel = formatWeekLabel(weekStart, weekEnd);

  const checkinRate   = report.checkin_rate;
  const readinessVal  = report.avg_readiness ?? 0;
  const nutritionRate = report.nutrition_rate;
  const trainingRate  = report.training_target > 0
    ? Math.min(Math.round((report.training_count / report.training_target) * 100), 100)
    : 100;

  const weightDelta =
    report.weight_start_kg !== null && report.weight_end_kg !== null
      ? report.weight_end_kg - report.weight_start_kg
      : null;

  return (
    <div className={`rounded-xl border ${border} bg-zinc-900 p-6`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Weekly Report
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">{weekLabel}</p>
        </div>
        {inProgress && (
          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            In Progress
          </span>
        )}
      </div>

      {/* Score */}
      <div className="mt-4 flex items-end gap-4">
        <span className={`font-mono text-7xl font-bold leading-none ${color}`}>
          {score}
        </span>
        <div className="mb-1.5">
          <span className={`text-base font-bold uppercase tracking-widest ${color}`}>
            {category}
          </span>
        </div>
      </div>

      {/* Pillar bars */}
      <div className="mt-6 space-y-2.5">
        <PillarBar label="Check-In"  value={checkinRate} />
        <PillarBar label="Readiness" value={readinessVal} />
        <PillarBar label="Nutrition" value={nutritionRate} />
        <PillarBar label="Training"  value={trainingRate} />
      </div>

      {/* Wins */}
      {report.wins.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Wins</p>
          <ul className="mt-2 space-y-1.5">
            {(report.wins as string[]).map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottlenecks */}
      {report.bottlenecks.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Bottlenecks</p>
          <ul className="mt-2 space-y-1.5">
            {(report.bottlenecks as string[]).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trends */}
      {trends && trends.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Trends</p>
          <div className="mt-2 space-y-2">
            {trends.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`shrink-0 font-mono text-sm font-bold ${TREND_COLORS[t.direction]}`}>
                  {TREND_ICONS[t.direction]}
                </span>
                <div>
                  <span className="text-xs font-semibold text-zinc-400">{t.label}: </span>
                  <span className="text-xs text-zinc-500">{t.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended focus */}
      <div className="mt-5 rounded-lg bg-zinc-800/60 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Focus for Next Week
        </p>
        <p className="mt-1 text-sm text-zinc-300">{report.recommended_focus}</p>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-x-2 gap-y-3 border-t border-zinc-800 pt-4 sm:grid-cols-5">
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-white">{report.checkin_days}/7</p>
          <p className="text-[10px] text-zinc-600">Check-ins</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-white">
            {report.avg_readiness ?? "—"}
          </p>
          <p className="text-[10px] text-zinc-600">Avg Ready</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-white">
            {report.nutrition_compliant_days}/7
          </p>
          <p className="text-[10px] text-zinc-600">Nutrition</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-white">
            {report.training_count}/{report.training_target}
          </p>
          <p className="text-[10px] text-zinc-600">Training</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-lg font-bold text-white">
            {weightDelta === null
              ? "—"
              : weightDelta === 0
                ? "±0"
                : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)}`}
          </p>
          <p className="text-[10px] text-zinc-600">Wt kg</p>
        </div>
      </div>
    </div>
  );
}
