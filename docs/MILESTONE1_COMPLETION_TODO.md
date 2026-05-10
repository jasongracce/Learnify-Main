# Milestone 1 Completion Todo

Last updated: 2026-05-07

Milestone 1 target:

```txt
Landing page + Supabase waitlist gate + auth + dashboard + one interactive Physics course/module + embedded question blocks + persisted progress + rule-based Lumi chat and insights.
```

## Remaining Completion Tasks

1. Apply Supabase migrations to the real project.
   - `202605040001_milestone1_foundation.sql`
   - `202605040002_beta_gate_and_physics_seed.sql`
   - `202605060001_clean_thai_physics_seed.sql`

2. Run a manual end-to-end beta test with a real beta-approved Supabase user.
   - Log in or sign up.
   - Open the dashboard.
   - Open the Physics course.
   - Complete a lesson block.
   - Submit a wrong answer and confirm Lumi feedback appears.
   - Submit the correct answer and confirm progress saves.
   - Refresh the lesson and confirm completed blocks still show as saved.
   - Confirm dashboard and insights update.
   - Send a Lumi chat message and confirm conversation/message rows save.

3. Fix any live database mismatches.
   - Lesson slugs.
   - Block slugs.
   - Question IDs/slugs.
   - Skill IDs.
   - Published status and RLS behavior.

4. Polish the lesson flow.
   - Clearer continue-next-incomplete-block behavior.
   - Stronger completed-state styling.
   - Better projectile and force interactions.
   - Optional lesson-level "Ask Lumi" entry point with current lesson context.

5. Improve rule-based Lumi enough for Milestone 1.
   - Add a few answer variations.
   - Pass current lesson context from lesson entry points.
   - Add more prompt patterns.
   - Avoid repeating the exact same response.

6. Confirm deployment readiness.
   - `.env.example` and Vercel env vars.
   - Supabase Auth redirect URLs.
   - Google Auth configuration.
   - `NEXT_PUBLIC_APP_URL`.
   - `NEXT_PUBLIC_MARKETING_URL`.

7. Commit a stable Milestone 1 foundation checkpoint.
