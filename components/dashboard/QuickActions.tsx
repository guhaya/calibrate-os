import Link from "next/link";
import { ClipboardCheck, UtensilsCrossed, Dumbbell, Sparkles, Check } from "lucide-react";

type Action = {
  href:    string;
  icon:    React.ElementType;
  label:   string;
  sub:     string;
  done?:   boolean;
};

type Props = {
  checkedIn:         boolean;
  mealCount:         number;
  workoutsThisWeek:  number;
};

export default function QuickActions({ checkedIn, mealCount, workoutsThisWeek }: Props) {
  const actions: Action[] = [
    {
      href:  "/checkin",
      icon:  ClipboardCheck,
      label: "Check In",
      sub:   checkedIn ? "Done for today" : "Not done yet",
      done:  checkedIn,
    },
    {
      href:  "/nutrition",
      icon:  UtensilsCrossed,
      label: "Nutrition",
      sub:   mealCount > 0 ? `${mealCount} meal${mealCount === 1 ? "" : "s"} logged` : "Nothing logged",
      done:  mealCount > 0,
    },
    {
      href:  "/training",
      icon:  Dumbbell,
      label: "Training",
      sub:   workoutsThisWeek > 0
        ? `${workoutsThisWeek} workout${workoutsThisWeek === 1 ? "" : "s"} this week`
        : "Log a workout",
      done:  workoutsThisWeek > 0,
    },
    {
      href:  "/brief",
      icon:  Sparkles,
      label: "AI Brief",
      sub:   "Your daily brief",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map(({ href, icon: Icon, label, sub, done }) => (
        <Link
          key={href}
          href={href}
          className="group relative flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 transition-colors group-hover:bg-zinc-700">
              <Icon className="h-4 w-4 text-zinc-400" />
            </div>
            {done && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20">
                <Check className="h-3 w-3 text-emerald-400" />
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className={`mt-0.5 text-xs ${done ? "text-emerald-400" : "text-zinc-500"}`}>
              {sub}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
