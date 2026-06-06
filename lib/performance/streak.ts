// Counts consecutive days ending today (or yesterday if today has no check-in).
export function computeStreak(dates: string[], today: string): number {
  if (dates.length === 0) return 0;

  const sorted = [...dates].sort((a, b) => b.localeCompare(a));

  // Allow streak to start from today OR yesterday (so an evening check-in yesterday
  // doesn't break a morning user's streak before they check in today)
  let cursor = sorted[0] === today ? today : (() => {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  let streak = 0;
  for (const date of sorted) {
    if (date === cursor) {
      streak++;
      const d = new Date(cursor + "T12:00:00");
      d.setDate(d.getDate() - 1);
      cursor = d.toISOString().split("T")[0];
    } else if (date < cursor) {
      break;
    }
  }

  return streak;
}
