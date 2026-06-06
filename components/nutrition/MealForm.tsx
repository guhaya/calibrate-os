"use client";

import { useState, useActionState } from "react";
import { X } from "lucide-react";
import { addMeal, updateMeal, type NutritionState } from "@/app/actions/nutrition";
import type { Tables } from "@/types/database";

type Meal = Tables<"nutrition_logs">;

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch",     label: "Lunch"     },
  { value: "dinner",    label: "Dinner"    },
  { value: "snack",     label: "Snack"     },
] as const;

type Props = {
  today: string;
  editing?: Meal | null;
  defaultMealType?: string;
  onClose: () => void;
};

function NumberInput({
  name, label, value, onChange, step = "1", unit,
}: {
  name: string; label: string; value: string;
  onChange: (v: string) => void; step?: string; unit: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          min="0"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
          placeholder="0"
        />
        <span className="shrink-0 text-xs text-zinc-500">{unit}</span>
      </div>
    </div>
  );
}

export default function MealForm({ today, editing, defaultMealType, onClose }: Props) {
  const action = editing ? updateMeal : addMeal;
  const [state, formAction, pending] = useActionState<NutritionState, FormData>(
    action,
    null
  );

  const [mealType,  setMealType]  = useState(editing?.meal_type  ?? defaultMealType ?? "breakfast");
  const [mealName,  setMealName]  = useState(editing?.meal_name  ?? "");
  const [calories,  setCalories]  = useState(editing?.calories?.toString()  ?? "");
  const [proteinG,  setProteinG]  = useState(editing?.protein_g?.toString()  ?? "");
  const [carbsG,    setCarbsG]    = useState(editing?.carbs_g?.toString()    ?? "");
  const [fatG,      setFatG]      = useState(editing?.fat_g?.toString()      ?? "");

  // If server action succeeded, close the form
  if (state === null && pending === false && (editing || mealName)) {
    // state starts null before first submit, so only close after a successful round-trip
    // We rely on the parent re-rendering from revalidatePath to signal success
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {editing ? "Edit meal" : "Add meal"}
        </h3>
        <button type="button" onClick={onClose} className="text-zinc-500 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        action={async (fd: FormData) => {
          await formAction(fd);
          // Close on success — revalidatePath will refresh the page data
          onClose();
        }}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="date" value={today} />
        {editing && <input type="hidden" name="id" value={editing.id} />}

        {/* Meal type */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Meal type</span>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMealType(value)}
                className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                  mealType === value
                    ? "bg-emerald-400 text-zinc-950"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input type="hidden" name="meal_type" value={mealType} />
        </div>

        {/* Meal name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Meal name</label>
          <input
            type="text"
            name="meal_name"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Chicken and rice"
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
          />
        </div>

        {/* Macros grid */}
        <div className="grid grid-cols-2 gap-3">
          <NumberInput name="calories" label="Calories" value={calories} onChange={setCalories} unit="kcal" />
          <NumberInput name="protein_g" label="Protein" value={proteinG} onChange={setProteinG} step="0.1" unit="g" />
          <NumberInput name="carbs_g"   label="Carbs"   value={carbsG}   onChange={setCarbsG}   step="0.1" unit="g" />
          <NumberInput name="fat_g"     label="Fat"     value={fatG}     onChange={setFatG}     step="0.1" unit="g" />
        </div>

        {state?.error && (
          <p className="text-xs text-red-400">{state.error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !mealName}
            className="flex-1 rounded-lg bg-emerald-400 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : editing ? "Update" : "Add meal"}
          </button>
        </div>
      </form>
    </div>
  );
}
