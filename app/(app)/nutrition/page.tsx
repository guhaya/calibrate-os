import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NutritionLog from "@/components/nutrition/NutritionLog";

export const metadata: Metadata = { title: "Nutrition — CALIBRATE OS" };

export default async function NutritionPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Fetch meals and targets in parallel
  const [mealsRes, targetsRes] = await Promise.all([
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: true }),

    supabase
      .from("nutrition_targets")
      .select("*")
      .eq("user_id", user.id)
      .eq("target_type", "training_day")
      .order("effective_from", { ascending: false })
      .limit(1),
  ]);

  const meals  = mealsRes.data ?? [];
  const target = targetsRes.data?.[0] ?? null;

  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Nutrition
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>

        <NutritionLog today={today} meals={meals} target={target} />
      </div>
    </div>
  );
}
