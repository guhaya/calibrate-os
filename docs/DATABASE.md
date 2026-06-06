# CALIBRATE OS — Database Design

Built on **Supabase (PostgreSQL)**. All tables use UUID primary keys, `created_at` and `updated_at` timestamps, and Row Level Security (RLS) — users can only read and write their own data.

---

## Tables

### `users`
Managed by Supabase Auth. Extended via `profiles`.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, from auth.users |
| email | text | Unique |
| created_at | timestamptz | |

---

### `profiles`
One row per user. Stores onboarding data and personal baselines.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, FK → users.id |
| full_name | text | |
| date_of_birth | date | |
| gender | text | male / female / other / prefer_not_to_say |
| weight_kg | numeric(5,2) | |
| height_cm | numeric(5,2) | |
| primary_goal | text | strength / endurance / body_composition / general_health / energy_cognition |
| training_days_per_week | int | 1–7 |
| primary_activity | text | e.g. running, lifting, cycling, crossfit |
| sleep_target_hours | numeric(3,1) | default 8.0 |
| onboarding_completed | boolean | default false |
| updated_at | timestamptz | |

---

### `daily_checkins`
One row per user per day. The heartbeat of the system.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| date | date | The calendar date of the check-in |
| sleep_hours | numeric(3,1) | e.g. 7.5 |
| sleep_quality | int | 1–5 |
| energy_level | int | 1–5 |
| muscle_soreness | int | 1–5 |
| stress_level | int | 1–5 |
| mood | int | 1–5 |
| readiness_score | int | 0–100, computed on insert |
| notes | text | Optional free text |
| created_at | timestamptz | |

Unique constraint: `(user_id, date)`

**Readiness Score Formula (v1):**
Weighted average of the five 1–5 inputs, normalized to 0–100.
- Sleep hours: normalized against user's `sleep_target_hours` (40% weight)
- Sleep quality: 20% weight
- Energy level: 20% weight
- Muscle soreness: inverted (5 = low soreness = good), 10% weight
- Stress level: inverted, 10% weight

---

### `training_sessions`
One row per logged workout.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| date | date | |
| activity_type | text | strength / running / cycling / swimming / hiit / yoga_mobility / sport / other |
| duration_minutes | int | |
| rpe | int | 1–10, Rate of Perceived Exertion |
| training_load | int | Computed: duration_minutes × rpe |
| notes | text | Optional |
| created_at | timestamptz | |

Index on `(user_id, date)` for load calculations.

---

### `nutrition_logs`
One row per meal entry.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| date | date | |
| meal_type | text | breakfast / lunch / dinner / snack |
| meal_name | text | e.g. "Chicken and rice" |
| calories | int | |
| protein_g | numeric(6,2) | |
| carbs_g | numeric(6,2) | |
| fat_g | numeric(6,2) | |
| water_ml | int | Optional, for hydration logging |
| created_at | timestamptz | |

Index on `(user_id, date)`.

---

### `nutrition_targets`
Daily macro targets per user. Recalculated when profile or goal changes.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| target_type | text | training_day / rest_day |
| calories | int | |
| protein_g | int | |
| carbs_g | int | |
| fat_g | int | |
| effective_from | date | Targets can change over time |
| created_at | timestamptz | |

---

### `ai_daily_briefs`
One row per user per day. Stores the AI-generated brief and feedback.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| date | date | |
| readiness_summary | text | |
| training_recommendation | text | |
| nutrition_focus | text | |
| recovery_action | text | |
| raw_prompt | text | The prompt sent to the AI (for debugging/auditing) |
| model_used | text | e.g. claude-sonnet-4-6 |
| feedback | text | helpful / not_relevant / null |
| generated_at | timestamptz | |

Unique constraint: `(user_id, date)`

---

### `goals`
Tracks the user's active goal and milestone progress.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| goal_type | text | Mirrors `profiles.primary_goal` |
| description | text | User-written goal statement |
| target_value | numeric | e.g. 80 (kg), 25 (min 5k), etc. |
| target_unit | text | e.g. kg, minutes, % body fat |
| target_date | date | Optional deadline |
| status | text | active / achieved / abandoned |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## Relationships

```
users (auth)
  └── profiles          (1:1)
  └── daily_checkins    (1:many)
  └── training_sessions (1:many)
  └── nutrition_logs    (1:many)
  └── nutrition_targets (1:many)
  └── ai_daily_briefs   (1:many)
  └── goals             (1:many)
```

All foreign keys reference `users.id` with `ON DELETE CASCADE`. Deleting a user removes all their data.

---

## Key Computed Values

These are calculated in application code (not stored columns) to stay flexible:

**Acute:Chronic Workload Ratio (ACWR)**
- Acute load = sum of `training_load` over last 7 days
- Chronic load = average weekly load over last 28 days
- ACWR = acute / chronic
- < 0.8: undertraining | 0.8–1.3: optimal | > 1.5: injury risk zone

**Weekly Training Volume**
- Sum of `duration_minutes` grouped by `activity_type` over rolling 7 days

**Nutrition Adherence Score**
- % of days in last 30 where `protein_g` logged ≥ 90% of `nutrition_targets.protein_g`

---

## Row Level Security (RLS) Policy Pattern

Every table follows the same RLS pattern:
```sql
-- Users can only select/insert/update/delete their own rows
CREATE POLICY "Users access own data" ON table_name
  USING (user_id = auth.uid());
```

Service-role key (used only server-side in API routes) bypasses RLS for admin operations.

---

## Future Scaling Strategy

### Phase 2 — Wearable Integrations
Add a `wearable_syncs` table to store raw data payloads from Apple Health, Garmin, WHOOP, and Oura. A background job normalizes payloads into `daily_checkins` and `training_sessions`, with a `source` column added to track origin (manual vs. device).

### Phase 3 — Time-Series Optimization
When daily check-in and training session tables exceed 10M rows, migrate to **TimescaleDB** (Supabase supports this extension). The `date` columns become hypertable time dimensions, enabling fast range queries and continuous aggregates for trend analytics.

### Phase 4 — Lab & Biomarker Tracking
New `lab_results` table for bloodwork entries (testosterone, cortisol, ferritin, Vitamin D, etc.) with `biomarker_type`, `value`, `unit`, `tested_at`. Linked to AI brief generation so bloodwork context can inform recommendations.

### Phase 5 — Team & Coaching
Introduce an `organizations` table and a `coach_athlete_relationships` table to enable coaches to view (read-only, RLS-permissioned) their athletes' dashboards. Multi-tenant architecture using Supabase's organization-level access controls.

### Caching Strategy
- Readiness scores: computed on check-in insert, stored — never recomputed
- ACWR and rolling load: computed on-demand for dashboard; cache in Redis/Upstash for users with high request frequency
- AI Daily Brief: generated once per day, stored in `ai_daily_briefs` — never regenerated unless user explicitly requests a refresh
