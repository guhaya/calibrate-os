import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckinForm from "@/components/checkin/CheckinForm";
import WeightTracker from "@/components/checkin/WeightTracker";

export const metadata: Metadata = { title: "Check-In — CALIBRATE OS" };

export default async function CheckInPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Fetch all three in parallel — independent queries
  const [checkinRes, profileRes, weightRes] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("sleep_target_hours, full_name")
      .eq("id", user.id)
      .single(),

    supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(10),
  ]);

  const checkin      = checkinRes.data;
  const sleepTarget  = profileRes.data?.sleep_target_hours ?? 8;
  const weightHistory = weightRes.data ?? [];

  const dateLabel = new Date(today + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Daily Check-In
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
        </div>

        {/* Check-in form / score view */}
        <CheckinForm today={today} existing={checkin} sleepTarget={sleepTarget} />

        {/* Divider */}
        <div className="my-8 border-t border-zinc-800" />

        {/* Weight tracker */}
        <WeightTracker today={today} history={weightHistory} />
      </div>
    </div>
  );
}
