"use client";

import { useState, useActionState } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { deleteMeal, type NutritionState } from "@/app/actions/nutrition";
import MealForm from "./MealForm";
import type { Tables } from "@/types/database";

type Meal    = Tables<"nutrition_logs">;
type Target  = Tables<"nutrition_targets">;

type Props = {
  today:  string;
  meals:  Meal[];
  target: Target | null;
};

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = typeof MEAL_ORDER[number];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch:     "Lunch",
  dinner:    "Dinner",
  snack:     "Snack",
};

// ─── Macro progress bar ───────────────────────────────────────────────────────

function MacroBar({
  label, actual, target, unit, color,
}: {
  label: string; actual: number; target: number; unit: string; color: string;
}) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const over = actual > target && target > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="font-mono text-xs text-zinc-400">
          <span className={over ? "text-amber-400" : "text-white"}>{Math.round(actual)}</span>
          {target > 0 && <span className="text-zinc-600"> / {target} {unit}</span>}
        </span>
      </div>
      {target > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${over ? "bg-amber-400" : color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Single meal row ──────────────────────────────────────────────────────────

function MealRow({
  meal, today, onEdit,
}: {
  meal: Meal; today: string; onEdit: (m: Meal) => void;
}) {
  const [state, deleteAction, pending] = useActionState<NutritionState, FormData>(
    deleteMeal,
    null
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{meal.meal_name ?? "—"}</p>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">
            {meal.calories ?? 0} kcal
            {meal.protein_g != null && (
              <> · <span className="text-blue-400">{Math.round(meal.protein_g)}P</span></>
            )}
            {meal.carbs_g != null && (
              <> · <span className="text-amber-400">{Math.round(meal.carbs_g)}C</span></>
            )}
            {meal.fat_g != null && (
              <> · <span className="text-rose-400">{Math.round(meal.fat_g)}F</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(meal)}
            className="text-zinc-600 transition-colors hover:text-zinc-300"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={meal.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NutritionLog({ today, meals, target }: Props) {
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [addMealType,   setAddMealType]   = useState<string>("breakfast");
  const [editingMeal,   setEditingMeal]   = useState<Meal | null>(null);

  // Totals for today
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein:  acc.protein  + (m.protein_g  ?? 0),
      carbs:    acc.carbs    + (m.carbs_g    ?? 0),
      fat:      acc.fat      + (m.fat_g      ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const grouped = MEAL_ORDER.reduce<Record<MealType, Meal[]>>(
    (acc, type) => {
      acc[type] = meals.filter((m) => m.meal_type === type);
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] }
  );

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setShowAddForm(false);
  };

  const handleAddForType = (type: string) => {
    setAddMealType(type);
    setEditingMeal(null);
    setShowAddForm(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Macro summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Today&apos;s macros
        </p>
        {!target ? (
          <p className="text-xs text-zinc-600">
            Nutrition targets not set. Complete onboarding to see targets.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <MacroBar
              label="Calories" actual={totals.calories}
              target={target.calories ?? 0} unit="kcal" color="bg-emerald-400"
            />
            <MacroBar
              label="Protein" actual={totals.protein}
              target={target.protein_g ?? 0} unit="g" color="bg-blue-400"
            />
            <MacroBar
              label="Carbs" actual={totals.carbs}
              target={target.carbs_g ?? 0} unit="g" color="bg-amber-400"
            />
            <MacroBar
              label="Fat" actual={totals.fat}
              target={target.fat_g ?? 0} unit="g" color="bg-rose-400"
            />
          </div>
        )}
      </div>

      {/* Add meal button */}
      {!showAddForm && !editingMeal && (
        <button
          type="button"
          onClick={() => handleAddForType("breakfast")}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add meal
        </button>
      )}

      {/* Add form */}
      {showAddForm && (
        <MealForm
          today={today}
          defaultMealType={addMealType}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Meal groups */}
      {meals.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center">
          <UtensilsCrossed className="mx-auto h-8 w-8 text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-500">No meals logged today.</p>
          <p className="mt-1 text-xs text-zinc-600">Tap &quot;Add meal&quot; to get started.</p>
        </div>
      ) : (
        MEAL_ORDER.map((type) => {
          const group = grouped[type];
          return (
            <div key={type} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  {MEAL_LABELS[type]}
                </h3>
                <button
                  type="button"
                  onClick={() => handleAddForType(type)}
                  className="flex items-center gap-1 text-xs text-zinc-600 transition-colors hover:text-emerald-400"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              {/* Inline edit form */}
              {editingMeal && editingMeal.meal_type === type && (
                <MealForm
                  today={today}
                  editing={editingMeal}
                  onClose={() => setEditingMeal(null)}
                />
              )}

              {group.length === 0 && !(editingMeal?.meal_type === type) ? (
                <p className="text-xs text-zinc-700 italic">Nothing logged yet.</p>
              ) : (
                group.map((meal) =>
                  editingMeal?.id === meal.id ? null : (
                    <MealRow
                      key={meal.id}
                      meal={meal}
                      today={today}
                      onEdit={handleEdit}
                    />
                  )
                )
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
