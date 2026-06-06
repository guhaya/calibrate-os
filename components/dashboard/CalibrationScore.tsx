import {
  calibrationCategory,
  calibrationColor,
  calibrationBorderColor,
  type CalibrationResult,
} from "@/lib/performance/calibration";

type Props = {
  result: CalibrationResult;
};

const PILLARS = [
  { key: "checkin_component"   as const, label: "Check-In"  },
  { key: "readiness_component" as const, label: "Readiness" },
  { key: "nutrition_component" as const, label: "Nutrition" },
  { key: "training_component"  as const, label: "Training"  },
  { key: "weight_component"    as const, label: "Weight"    },
] as const;

function PillarBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
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
        <div
          className={`h-1 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function CalibrationScore({ result }: Props) {
  const { score } = result;
  const category = calibrationCategory(score);
  const color    = calibrationColor(score);
  const border   = calibrationBorderColor(score);

  return (
    <div className={`rounded-xl border ${border} bg-zinc-900 p-6`}>
      {/* Label */}
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Calibration Score
      </p>
      <p className="mt-0.5 text-xs text-zinc-600">Rolling 7-day performance grade</p>

      {/* Score + category */}
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

      {/* Pillar breakdown */}
      <div className="mt-6 space-y-2.5">
        {PILLARS.map(({ key, label }) => (
          <PillarBar key={key} label={label} value={result[key]} />
        ))}
      </div>
    </div>
  );
}
