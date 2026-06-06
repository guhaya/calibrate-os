# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

CALIBRATE OS is a Human Performance Operating System. It unifies training, nutrition, recovery, and health metrics into a single platform and uses AI (Claude) to generate a personalized daily brief and performance recommendations.

Full documentation lives in `docs/`:
- `docs/VISION.md` — mission, target users, north star metric
- `docs/PRD.md` — MVP scope, user stories, features, success metrics
- `docs/DATABASE.md` — full schema, relationships, RLS patterns, scaling strategy
- `docs/CLAUDE.md` — **read this before writing any code** — tech stack, coding standards, architecture rules, UI standards

## Stack at a Glance

Next.js 15 (App Router) · TypeScript strict · Supabase (Postgres + Auth) · Tailwind CSS v4 · shadcn/ui · Anthropic Claude API · Vercel

## Commands

```bash
npm run dev        # start dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit — run before marking any task done
npm run lint       # eslint

supabase start                                              # local Supabase stack
supabase db push                                           # apply migrations to remote
supabase gen types typescript --local > types/database.ts  # regenerate DB types after schema changes
```

## Critical Rules

1. Read `docs/CLAUDE.md` before writing any code — it defines the architecture, file naming, and UI standards for this project.
2. `types/database.ts` is auto-generated — never hand-edit it.
3. Migration files in `supabase/migrations/` are append-only — never edit an existing migration.
4. The Anthropic API key and Supabase service role key are server-only — never expose to the client.
5. All AI brief generation goes through `lib/ai/generateBrief.ts` — not scattered API calls.
