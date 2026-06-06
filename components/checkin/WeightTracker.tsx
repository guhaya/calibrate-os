"use client";

import { useState, useActionState } from "react";
import { Scale, Trash2, Pencil, Check, X } from "lucide-react";
import { saveWeight, updateWeight, deleteWeight, type WeightState } from "@/app/actions/weight";
import type { Tables } from "@/types/database";

type WeightLog = Tables<"weight_logs">;

type Props = {
  today: string;
  history: WeightLog[];
};

// ─── Inline edit row ──────────────────────────────────────────────────────────

function EditRow({ entry, onCancel }: { entry: WeightLog; onCancel: () => void }) {
  const [state, formAction, pending] = useActionState<WeightState, FormData>(
    updateWeight,
    null
  );
  const [weight, setWeight] = useState(entry.weight_kg.toString());

  return (
    <form action={formAction} className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-zinc-900 px-4 py-3">
      <input type="hidden" name="id"   value={entry.id} />
      <input type="hidden" name="date" value={entry.date} />

      <span className="flex-1 text-xs text-zinc-500">
        {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>

      <input
        type="number"
        name="weight_kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        step="0.1"
        min="20"
        max="400"
        className="w-24 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white focus:border-emerald-400 focus:outline-none"
      />
      <span className="text-xs text-zinc-500">kg</span>

      {state?.error && (
        <span className="text-xs text-red-400">{state.error}</span>
      )}

      <button type="submit" disabled={pending} className="text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-50">
        <Check className="h-4 w-4" />
      </button>
      <button type="button" onClick={onCancel} className="text-zinc-500 transition-colors hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({ entry }: { entry: WeightLog }) {
  const [editing, setEditing] = useState(false);
  const [deleteState, deleteAction, deletePending] = useActionState<WeightState, FormData>(
    deleteWeight,
    null
  );

  if (editing) return <EditRow entry={entry} onCancel={() => setEditing(false)} />;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
      <span className="flex-1 text-xs text-zinc-500">
        {new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
      <span className="font-mono text-sm font-bold text-white">
        {entry.weight_kg} kg
      </span>
      {deleteState?.error && (
        <span className="text-xs text-red-400">{deleteState.error}</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={entry.id} />
        <button
          type="submit"
          disabled={deletePending}
          className="text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeightTracker({ today, history }: Props) {
  const todayEntry = history.find((e) => e.date === today);
  const [weight, setWeight] = useState(todayEntry?.weight_kg.toString() ?? "");
  const [addState, addAction, addPending] = useActionState<WeightState, FormData>(
    saveWeight,
    null
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-emerald-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Body Weight
        </h2>
      </div>

      {/* Log today's weight */}
      <form action={addAction} className="flex items-end gap-3">
        <input type="hidden" name="date" value={today} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {todayEntry ? "Update today's weight" : "Log today's weight"}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="weight_kg"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.0"
              step="0.1"
              min="20"
              max="400"
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
            />
            <span className="text-sm text-zinc-500">kg</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={addPending || !weight}
          className="rounded-lg bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {addPending ? "Saving…" : "Save"}
        </button>
      </form>

      {addState?.error && (
        <p className="text-xs text-red-400">{addState.error}</p>
      )}

      {/* History */}
      {history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-8 text-center">
          <Scale className="mx-auto h-6 w-6 text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-500">No weight entries yet.</p>
          <p className="mt-1 text-xs text-zinc-600">Log your first entry above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Recent history
          </p>
          {history.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
