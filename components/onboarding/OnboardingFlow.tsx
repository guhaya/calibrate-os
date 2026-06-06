"use client";

import { useState, useActionState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Activity,
  Flame,
  Heart,
  Zap,
  Check,
  CheckCircle,
} from "lucide-react";
import { saveOnboarding, type OnboardingState } from "@/app/actions/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  full_name: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  primary_goal: string;
  training_days_per_week: string;
  primary_activity: string;
};

type StepProps = {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const GOALS = [
  { value: "strength",          label: "Build Strength",   desc: "Get stronger and build muscle",          icon: Dumbbell },
  { value: "endurance",         label: "Endurance",        desc: "Run farther and last longer",            icon: Activity },
  { value: "body_composition",  label: "Body Composition", desc: "Lose fat while keeping muscle",          icon: Flame    },
  { value: "general_health",    label: "General Health",   desc: "Feel better and move well every day",    icon: Heart    },
  { value: "energy_cognition",  label: "Energy & Focus",   desc: "Optimise energy and mental performance", icon: Zap      },
];

const GENDERS = [
  { value: "male",              label: "Male"              },
  { value: "female",            label: "Female"            },
  { value: "other",             label: "Other"             },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const ACTIVITIES = [
  "Weightlifting",
  "Running",
  "Cycling",
  "Swimming",
  "CrossFit / HIIT",
  "Yoga / Mobility",
  "Team Sports",
  "Martial Arts",
  "Other",
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
      {children}
    </span>
  );
}

function Input({
  type = "text", value, onChange, placeholder, min, max,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-emerald-400 focus:outline-none"
    />
  );
}

function Buttons({
  onBack, onNext, nextLabel = "Continue", nextDisabled = false, showBack = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="mt-8 flex gap-3">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function StepWelcome({ data, onChange, onNext }: StepProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
        CALIBRATE OS
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
        Let&apos;s build your performance profile.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Takes about 60 seconds. We use this to personalise your daily brief
        and recommendations.
      </p>

      <div className="mt-10 flex flex-col gap-1.5">
        <Label>Your name</Label>
        <Input
          value={data.full_name}
          onChange={(v) => onChange("full_name", v)}
          placeholder="Alex Johnson"
        />
      </div>

      <Buttons
        showBack={false}
        onNext={onNext}
        nextLabel="Get started"
        nextDisabled={data.full_name.trim().length === 0}
      />
    </div>
  );
}

function StepAboutYou({ data, onChange, onNext, onBack }: StepProps) {
  const age = parseInt(data.age, 10);
  const ageValid = !isNaN(age) && age >= 16 && age <= 100;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">About you</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Used to calibrate your baselines and nutrition targets.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label>Gender</Label>
          <div className="grid grid-cols-2 gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => onChange("gender", g.value)}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  data.gender === g.value
                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Age</Label>
          <Input
            type="number"
            value={data.age}
            onChange={(v) => onChange("age", v)}
            placeholder="28"
            min="16"
            max="100"
          />
        </div>
      </div>

      <Buttons onBack={onBack} onNext={onNext} nextDisabled={!data.gender || !ageValid} />
    </div>
  );
}

function StepBodyMetrics({ data, onChange, onNext, onBack }: StepProps) {
  const h = parseFloat(data.height_cm);
  const w = parseFloat(data.weight_kg);
  const valid = h >= 100 && h <= 250 && w >= 30 && w <= 300;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Body metrics
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Used to calculate your energy needs and nutrition targets.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label>Height (cm)</Label>
          <Input
            type="number"
            value={data.height_cm}
            onChange={(v) => onChange("height_cm", v)}
            placeholder="175"
            min="100"
            max="250"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            value={data.weight_kg}
            onChange={(v) => onChange("weight_kg", v)}
            placeholder="75"
            min="30"
            max="300"
          />
        </div>
      </div>

      <Buttons onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </div>
  );
}

function StepGoal({ data, onChange, onNext, onBack }: StepProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        What are you training for?
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        This sets your primary optimisation target.
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {GOALS.map(({ value, label, desc, icon: Icon }) => {
          const active = data.primary_goal === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange("primary_goal", value)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                active ? "border-emerald-400 bg-emerald-400/10" : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <div className={`shrink-0 rounded-lg p-2 ${active ? "bg-emerald-400/20" : "bg-zinc-800"}`}>
                <Icon className={`h-5 w-5 ${active ? "text-emerald-400" : "text-zinc-400"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${active ? "text-white" : "text-zinc-300"}`}>
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
              </div>
              {active && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      <Buttons onBack={onBack} onNext={onNext} nextDisabled={!data.primary_goal} />
    </div>
  );
}

function StepActivity({ data, onChange, onNext, onBack }: StepProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Your training habits
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Helps us calculate your workload and recovery needs.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Label>Days per week you train</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const active = data.training_days_per_week === String(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange("training_days_per_week", String(d))}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    active
                      ? "bg-emerald-400 text-zinc-950"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Primary activity</Label>
          <select
            value={data.primary_activity}
            onChange={(e) => onChange("primary_activity", e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white transition-colors focus:border-emerald-400 focus:outline-none"
          >
            <option value="" disabled>
              Select your main activity…
            </option>
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Buttons onBack={onBack} onNext={onNext} nextDisabled={!data.primary_activity} />
    </div>
  );
}

function StepComplete({
  data,
  state,
  formAction,
  pending,
  onBack,
}: {
  data: FormData;
  state: OnboardingState;
  formAction: (payload: globalThis.FormData) => void;
  pending: boolean;
  onBack: () => void;
}) {
  const firstName = data.full_name.split(" ")[0] ?? data.full_name;

  return (
    <div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20">
        <CheckCircle className="h-6 w-6 text-emerald-400" />
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
        You&apos;re all set, {firstName}.
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        Here&apos;s how CALIBRATE OS works each day.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {[
          {
            n: "01",
            title: "Morning check-in",
            desc: "60 seconds. Rate your sleep, energy, and recovery.",
          },
          {
            n: "02",
            title: "Get your AI Daily Brief",
            desc: "CALIBRATE reads your state and tells you what to prioritise today.",
          },
          {
            n: "03",
            title: "Log training & nutrition",
            desc: "Track your workouts and meals. The system learns from every entry.",
          },
        ].map(({ n, title, desc }) => (
          <div key={n} className="flex gap-4 rounded-xl border border-zinc-800 p-4">
            <span className="mt-0.5 font-mono text-xs font-bold text-emerald-400">{n}</span>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {state?.error && (
        <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Hidden-input form — all data collected across previous steps */}
      <form action={formAction}>
        <input type="hidden" name="full_name"               value={data.full_name} />
        <input type="hidden" name="age"                     value={data.age} />
        <input type="hidden" name="gender"                  value={data.gender} />
        <input type="hidden" name="height_cm"               value={data.height_cm} />
        <input type="hidden" name="weight_kg"               value={data.weight_kg} />
        <input type="hidden" name="primary_goal"            value={data.primary_goal} />
        <input type="hidden" name="training_days_per_week"  value={data.training_days_per_week} />
        <input type="hidden" name="primary_activity"        value={data.primary_activity} />

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : "Start CALIBRATE OS"}
            {!pending && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5; // steps 1–5 collect data; step 0 = welcome, step 5 = complete

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    primary_goal: "",
    training_days_per_week: "4",
    primary_activity: "",
  });

  const [state, formAction, pending] = useActionState<OnboardingState, globalThis.FormData>(
    saveOnboarding,
    null
  );

  const update = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const stepProps: StepProps = { data: formData, onChange: update, onNext: next, onBack: back };

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-10 md:px-10">
      <div className="mx-auto w-full max-w-md">
        {/* Progress bar — visible on data-collection steps only */}
        {step >= 1 && step <= 4 && (
          <div className="mb-10">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Step {step} of {TOTAL_STEPS - 1}
              </span>
            </div>
            <div className="h-0.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-0.5 rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {step === 0 && <StepWelcome    {...stepProps} />}
        {step === 1 && <StepAboutYou   {...stepProps} />}
        {step === 2 && <StepBodyMetrics {...stepProps} />}
        {step === 3 && <StepGoal       {...stepProps} />}
        {step === 4 && <StepActivity   {...stepProps} />}
        {step === 5 && (
          <StepComplete
            data={formData}
            state={state}
            formAction={formAction}
            pending={pending}
            onBack={back}
          />
        )}
      </div>
    </div>
  );
}
