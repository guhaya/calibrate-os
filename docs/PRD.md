# CALIBRATE OS — Product Requirements Document (PRD)

---

## Product Overview

CALIBRATE OS is a Human Performance Operating System. It unifies the four pillars of human performance — **Training, Nutrition, Recovery, and Health Metrics** — into a single platform and uses AI to synthesize them into a personalized daily brief and actionable recommendations.

The core loop is:
1. **Log** — capture what happened (sleep, training, food, metrics)
2. **Analyze** — the system builds a real-time picture of the user's state
3. **Recommend** — AI generates a personalized daily brief and prioritized actions
4. **Improve** — user acts, outcomes are tracked, model improves

---

## MVP Scope

The MVP answers one question for the user every morning: **"What is my performance state today and what should I do about it?"**

MVP includes:
- User onboarding with goal-setting and baseline profile
- Daily check-in (subjective readiness: sleep quality, energy, mood, soreness)
- Training log (manual workout entry with type, duration, effort)
- Nutrition log (meals with macro targets)
- Recovery dashboard (readiness score derived from check-in inputs)
- AI Daily Brief (one personalized recommendation block per day)
- Performance dashboard (7-day and 30-day trend view)

MVP excludes:
- Wearable integrations (post-MVP)
- Social features
- Coaching marketplace
- Advanced bloodwork / lab tracking
- Custom programming builder
- Mobile native app (web-first)

---

## User Stories

### Onboarding

- As a new user, I want to set my primary goal (e.g., build strength, improve endurance, lose body fat, improve energy) so the system knows what to optimize for.
- As a new user, I want to enter my baseline profile (age, weight, height, training history, sleep target) so CALIBRATE has context for my recommendations.
- As a new user, I want a brief explanation of how CALIBRATE works so I understand what to do each day.

### Daily Check-In

- As a user, I want to complete a 60-second morning check-in that captures how I slept and how I feel so CALIBRATE can assess my readiness for the day.
- As a user, I want to see my readiness score after check-in so I immediately know whether today is a green, yellow, or red performance day.
- As a user, I want to log my sleep duration and quality in a simple, fast way (no long forms).

### Training

- As a user, I want to log a completed workout (type, duration, perceived effort on a 1–10 scale) so my training load is tracked.
- As a user, I want to see my weekly training load so I can understand if I am under- or over-training.
- As a user, I want CALIBRATE to flag if I am accumulating too much fatigue based on recent training load and recovery scores.

### Nutrition

- As a user, I want to log my meals with estimated macros (protein, carbs, fat, calories) so my fueling is tracked.
- As a user, I want to see my daily macro targets vs actuals so I know if I'm on track.
- As a user, I want CALIBRATE to adjust my calorie and protein targets dynamically based on whether today is a training day or rest day.

### AI Daily Brief

- As a user, I want to receive a personalized daily brief every morning that tells me: my readiness score, the recommended training intensity for today, a nutrition focus for the day, and one recovery action.
- As a user, I want AI recommendations that feel specific to me, not generic fitness advice.
- As a user, I want to be able to dismiss or accept a recommendation so the system learns my preferences.

### Dashboard

- As a user, I want to see a 7-day performance overview (readiness trend, training load, nutrition adherence) so I can spot patterns.
- As a user, I want to see my progress toward my primary goal so I stay motivated.

---

## Features

### F1 — User Profile & Onboarding
- Multi-step onboarding flow capturing: goal, age, weight, height, training frequency, primary sport/activity, sleep target
- Goal types: Strength, Endurance, Body Composition, General Health, Energy & Cognition
- Baseline readiness calibration (first 7 days used to establish personal benchmarks)

### F2 — Daily Check-In
- Morning check-in: sleep hours, sleep quality (1–5), energy level (1–5), muscle soreness (1–5), stress level (1–5), mood (1–5)
- Readiness Score calculated from weighted inputs (0–100)
- Color-coded readiness status: Green (80–100), Yellow (50–79), Red (0–49)
- Check-in reminder notification (configurable time)

### F3 — Training Log
- Log workout: activity type, duration (minutes), perceived effort (RPE 1–10), optional notes
- Activity types: Strength, Running, Cycling, Swimming, HIIT, Yoga/Mobility, Sport, Other
- Acute:Chronic Workload Ratio (ACWR) calculated from rolling 7-day vs 28-day load
- Weekly volume summary by category

### F4 — Nutrition Log
- Log meal: name, meal time (breakfast/lunch/dinner/snack), calories, protein (g), carbs (g), fat (g)
- Daily macro totals vs targets
- Training day vs rest day macro targets (different calorie and protein splits)
- Hydration tracking (glasses of water)

### F5 — AI Daily Brief
- Generated once per day after check-in is completed
- Sections: Readiness summary, Training recommendation (intensity + type), Nutrition focus, Recovery action
- Powered by Claude API with user context injected as structured prompt
- User can mark brief as "helpful" or "not relevant" for feedback loop

### F6 — Performance Dashboard
- Readiness trend (7-day sparkline)
- Training load chart (7-day and 28-day rolling)
- Nutrition adherence (% of days meeting protein target)
- Goal progress indicator
- Streak counter (consecutive days with completed check-in)

### F7 — Notifications & Reminders
- Daily check-in reminder (morning, user-set time)
- "You haven't logged today" nudge (afternoon)
- Weekly performance summary (Sunday evening)

---

## Success Metrics

| Metric | MVP Target (90 days post-launch) |
|--------|----------------------------------|
| Weekly Performance Loop Completion Rate | > 40% of active users |
| 30-day Retention | > 35% |
| AI Daily Brief Open Rate | > 60% |
| AI Recommendation Acceptance Rate | > 45% |
| Average Daily Active Sessions | > 1.5 per user |
| NPS | > 40 |
| Time to Complete Daily Check-In | < 90 seconds |
