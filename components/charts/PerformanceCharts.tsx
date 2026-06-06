"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";

type TimeRange = 7 | 30 | 90;

export type PerformanceChartData = {
  weightLogs:    { date: string; weight_kg: number | null }[];
  calibrations:  { date: string; score: number }[];
  nutritionLogs: { date: string; protein_g: number | null }[];
  workoutDates:  string[];
  proteinTarget: number | null;
  trainingTarget: number;
  today:         string;
};

function getCutoff(today: string, range: TimeRange): string {
  const d = new Date(today + "T12:00:00");
  d.setDate(d.getDate() - range + 1);
  return d.toISOString().split("T")[0];
}

function allDatesInRange(from: string, to: string): string[] {
  const result: string[] = [];
  const cur = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  while (cur <= end) {
    result.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function fmtDate(dateStr: string, range: TimeRange): string {
  const d = new Date(dateStr + "T12:00:00");
  if (range === 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  color: "#f4f4f5",
  fontSize: 12,
  padding: "6px 10px",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-zinc-700">
      No data yet for this period
    </div>
  );
}

const TICK = { fill: "#71717a", fontSize: 11 };
const AXIS = { tickLine: false, axisLine: false } as const;
const CHART_H = 140;

export default function PerformanceCharts({
  weightLogs,
  calibrations,
  nutritionLogs,
  workoutDates,
  proteinTarget,
  today,
}: PerformanceChartData) {
  const [range, setRange] = useState<TimeRange>(30);
  const cutoff = getCutoff(today, range);
  const xInterval = range === 7 ? 0 : range === 30 ? 4 : 14;

  // ── Weight ────────────────────────────────────────────────────────────────
  const weightData = useMemo(
    () =>
      weightLogs
        .filter((w) => w.date >= cutoff && w.weight_kg !== null)
        .map((w) => ({ date: w.date, weight: w.weight_kg as number }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [weightLogs, cutoff]
  );

  // ── Calibration ───────────────────────────────────────────────────────────
  const calibData = useMemo(
    () =>
      calibrations
        .filter((c) => c.date >= cutoff)
        .map((c) => ({ date: c.date, score: c.score }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [calibrations, cutoff]
  );

  // ── Nutrition — aggregate protein by date, fill gaps with 0 ──────────────
  const nutritionData = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const log of nutritionLogs) {
      if (log.date < cutoff) continue;
      byDate[log.date] = (byDate[log.date] ?? 0) + (log.protein_g ?? 0);
    }
    return allDatesInRange(cutoff, today).map((date) => ({
      date,
      protein: Math.round(byDate[date] ?? 0),
    }));
  }, [nutritionLogs, cutoff, today]);

  // ── Training — binary 0/1 per day ─────────────────────────────────────────
  const trainingData = useMemo(() => {
    const set = new Set(workoutDates.filter((d) => d >= cutoff));
    return allDatesInRange(cutoff, today).map((date) => ({
      date,
      trained: set.has(date) ? 1 : 0,
    }));
  }, [workoutDates, cutoff, today]);

  const barSize = range === 7 ? 14 : range === 30 ? 6 : 3;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Performance Trends</h2>
        <div className="flex gap-1 rounded-lg border border-zinc-800 p-0.5">
          {([7, 30, 90] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-emerald-400 text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Weight Trend */}
        <ChartCard title="Weight Trend">
          {weightData.length < 2 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  {...AXIS}
                  dataKey="date"
                  tick={TICK}
                  interval={xInterval}
                  tickFormatter={(d) => fmtDate(String(d), range)}
                />
                <YAxis
                  {...AXIS}
                  tick={TICK}
                  domain={["auto", "auto"]}
                  width={36}
                  tickFormatter={(v) => String(v)}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "#a1a1aa" }}
                  labelFormatter={(label) => fmtDate(String(label ?? ""), range)}
                  formatter={(value) => [`${Number(value)} kg`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#34d399" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Calibration Score */}
        <ChartCard title="Calibration Score">
          {calibData.length < 2 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <LineChart data={calibData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  {...AXIS}
                  dataKey="date"
                  tick={TICK}
                  interval={xInterval}
                  tickFormatter={(d) => fmtDate(String(d), range)}
                />
                <YAxis
                  {...AXIS}
                  tick={TICK}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  width={30}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "#a1a1aa" }}
                  labelFormatter={(label) => fmtDate(String(label ?? ""), range)}
                  formatter={(value) => [`${Number(value)} / 100`, "Score"]}
                />
                <ReferenceLine y={80} stroke="#3f3f46" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={range === 7}
                  activeDot={{ r: 4, fill: "#34d399" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Nutrition Compliance */}
        <ChartCard title="Daily Protein">
          {nutritionData.every((d) => d.protein === 0) ? (
            <EmptyState />
          ) : (
            <>
              {proteinTarget && (
                <p className="mb-1.5 text-[10px] text-zinc-600">
                  <span className="mr-1 inline-block h-0.5 w-3 bg-amber-500 align-middle" />
                  {proteinTarget}g target
                </p>
              )}
              <ResponsiveContainer width="100%" height={CHART_H}>
                <BarChart data={nutritionData} barSize={barSize}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    {...AXIS}
                    dataKey="date"
                    tick={TICK}
                    interval={xInterval}
                    tickFormatter={(d) => fmtDate(String(d), range)}
                  />
                  <YAxis
                    {...AXIS}
                    tick={TICK}
                    width={36}
                  />
                  {proteinTarget && (
                    <ReferenceLine y={proteinTarget} stroke="#f59e0b" strokeDasharray="4 4" />
                  )}
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: "#a1a1aa" }}
                    labelFormatter={(label) => fmtDate(String(label ?? ""), range)}
                    formatter={(value) => [`${Number(value)}g`, "Protein"]}
                  />
                  <Bar dataKey="protein" radius={[2, 2, 0, 0]}>
                    {nutritionData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          proteinTarget && entry.protein >= proteinTarget
                            ? "#34d399"
                            : entry.protein > 0
                            ? "#059669"
                            : "#27272a"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </ChartCard>

        {/* Training Activity */}
        <ChartCard title="Training Activity">
          {trainingData.every((d) => d.trained === 0) ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={trainingData} barSize={barSize}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  {...AXIS}
                  dataKey="date"
                  tick={TICK}
                  interval={xInterval}
                  tickFormatter={(d) => fmtDate(String(d), range)}
                />
                <YAxis
                  {...AXIS}
                  tick={TICK}
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(v) => (v === 1 ? "✓" : "")}
                  width={20}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "#a1a1aa" }}
                  labelFormatter={(label) => fmtDate(String(label ?? ""), range)}
                  formatter={(value) => [Number(value) === 1 ? "Trained" : "Rest day", ""]}
                />
                <Bar dataKey="trained" radius={[2, 2, 0, 0]}>
                  {trainingData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.trained === 1 ? "#34d399" : "#27272a"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>
    </div>
  );
}
