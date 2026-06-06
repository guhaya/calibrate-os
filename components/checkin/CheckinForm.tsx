"use client";

import { useState, useActionState } from "react";
import { Moon, Footprints, Zap, Dumbbell, Brain, Smile, Pencil } from "lucide-react";
import { saveCheckin, type CheckinState } from "@/app/actions/checkin";
import {
  computeReadinessScore,
  readinessLabel,
  readinessColor,
  readinessBorderColor,
} from "@/lib/performance/readiness";
import type { Tables } from "@/types/database";

type Checkin = Tables<"daily_checkins">;

type Props = {
  today: string;
  existing: Checkin | null;
  sleepTarget: number;
};

// ─── Rating selector ──────────────────────────────────────────────────────────

function Rating({
  name,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  name: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              value === n
                ? "bg-emerald-400 text-zinc-950"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between px-0.5">
          <span className="text-xs text-zinc-600">{lowLabel}</span>
          <span className="text-xs text-zinc-600">{highLabel}</span>
        </div>
      )}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

// ─── Completed view ───────────────────────────────────────────────────────────

function CheckinComplete({
  checkin,
  onEdit,
}: {
  checkin: Checkin;
  onEdit: () => void;
}) {
  const score = checkin.readiness_score ?? 0;
  const label = readinessLabel(score);
  const color = readinessColor(score);
  const border = readinessBorderColor(score);

  return (
    <div className="flex flex-col gap-4">
      {/* Score card */}
      <div className={`rounded-xl border ${border} bg-zinc-900 p-6`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Today&apos;s Readiness
        </p>
        <div className="mt-3 flex items-end gap-4">
          <span className={`font-mono text-7xl font-bold leading-none ${color}`}>
            {score}
          </span>
          <div className="mb-1">
            <span className={`text-sm font-bold uppercase tracking-widest ${color}`}>
              {label}
            </span>
          </div>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { icon: Moon,       label: "Sleep",    value: `${checkin.sleep_hours ?? "—"}h · Q${checkin.sleep_quality ?? "—"}` },
          { icon: Zap,        label: "Energy",   value: `${checkin.energy_level ?? "—"} / 5` },
          { icon: Dumbbell,   label: "Soreness", value: `${checkin.muscle_soreness ?? "—"} / 5` },
          { icon: Brain,      label: "Stress",   value: `${checkin.stress_level ?? "—"} / 5` },
          { icon: Smile,      label: "Mood",     value: `${checkin.mood ?? "—"} / 5` },
          { icon: Footprints, label: "Steps",    value: checkin.steps ? checkin.steps.toLocaleString() : "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <p className="mt-1.5 font-mono text-sm font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit today&apos;s check-in
      </button>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function CheckinForm({ today, existing, sleepTarget }: Props) {
  const [editing, setEditing] = useState(!existing);
  const [state, formAction, pending] = useActionState<CheckinState, FormData>(
    saveCheckin,
    null
  );

  // Form field state — pre-fill from existing check-in when editing
  const [sleepHours,     setSleepHours]     = useState(existing?.sleep_hours     ?? 7.5);
  const [sleepQuality,   setSleepQuality]   = useState(existing?.sleep_quality   ?? 3);
  const [energyLevel,    setEnergyLevel]    = useState(existing?.energy_level    ?? 3);
  const [muscleSoreness, setMuscleSoreness] = useState(existing?.muscle_soreness ?? 3);
  const [stressLevel,    setStressLevel]    = useState(existing?.stress_level    ?? 3);
  const [mood,           setMood]           = useState(existing?.mood            ?? 3);
  const [steps,          setSteps]          = useState(existing?.steps?.toString() ?? "");

  // When save succeeds (state === null and we were pending), switch back to view
  if (!editing && existing) {
    return (
      <CheckinComplete
        checkin={existing}
        onEdit={() => setEditing(true)}
      />
    );
  }

  // Preview the live readiness score as the user fills in the form
  const liveScore = computeReadinessScore({
    sleep_hours: Number(sleepHours),
    sleep_quality: sleepQuality,
    energy_level: energyLevel,
    muscle_soreness: muscleSoreness,
    stress_level: stressLevel,
    sleep_target_hours: sleepTarget,
  });
  const liveColor = readinessColor(liveScore);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="date" value={today} />

      {/* Live score preview */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Readiness Preview
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">Updates as you fill in the form</p>
        </div>
        <span className={`font-mono text-4xl font-bold ${liveColor}`}>{liveScore}</span>
      </div>

      {/* Sleep */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Sleep</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Hours slept
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              name="sleep_hours"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              step="0.5"
              min="0"
              max="24"
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
            />
            <span className="text-sm text-zinc-500">
              Target: {sleepTarget}h
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Sleep quality
          </label>
          <Rating
            name="sleep_quality"
            value={sleepQuality}
            onChange={setSleepQuality}
            lowLabel="Poor"
            highLabel="Great"
          />
        </div>
      </section>

      {/* Activity */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Footprints className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Activity</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Steps today <span className="normal-case font-normal text-zinc-600">(optional)</span>
          </label>
          <input
            type="number"
            name="steps"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="8,000"
            min="0"
            max="100000"
            className="w-40 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
          />
        </div>
      </section>

      {/* How you feel */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            How do you feel?
          </h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Energy level
          </label>
          <Rating name="energy_level" value={energyLevel} onChange={setEnergyLevel} lowLabel="Exhausted" highLabel="Energised" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Muscle soreness
          </label>
          <Rating name="muscle_soreness" value={muscleSoreness} onChange={setMuscleSoreness} lowLabel="None" highLabel="Severe" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Stress level
          </label>
          <Rating name="stress_level" value={stressLevel} onChange={setStressLevel} lowLabel="Calm" highLabel="Very high" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Mood
          </label>
          <Rating name="mood" value={mood} onChange={setMood} lowLabel="Low" highLabel="Great" />
        </div>
      </section>

      {state?.error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex gap-3">
        {existing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Check-In"}
        </button>
      </div>
    </form>
  );
}
