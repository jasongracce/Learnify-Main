# Learnify MVP Architecture

Last updated: 2026-05-03

This document records the current architecture decisions for the Learnify MVP. `docs/PRODUCT.md` remains the product source of truth. This file translates that product direction into implementation choices.

## 1. Product Build Target

The first milestone is a private beta web MVP:

```txt
Landing page
-> Supabase waitlist gate
-> Auth
-> Student dashboard
-> One interactive Physics course/module
-> Embedded lesson questions
-> Rule-based Lumi chat and insights
-> Persisted progress and attempts
```

The MVP is not open to arbitrary authenticated demo users. Beta access is controlled by existing Supabase waitlist data.

## 2. Platform

Build web first with a mobile-ready architecture.

Initial apps and packages:

```txt
apps/web
packages/shared
packages/core
packages/database
packages/design-tokens
supabase
docs
```

Later packages/apps:

```txt
apps/mobile
packages/ai
packages/config
```

Mobile will eventually use the same product APIs as web. It should use Supabase directly only for auth/session handling.

## 3. Framework And Tooling

Use:

```txt
Next.js
React
TypeScript strict mode
Tailwind CSS
pnpm workspaces
ESLint
Prettier
Vitest for targeted logic tests
Playwright after the first UI flow exists
```

Do not add Turborepo in milestone 1. Start with plain `pnpm` workspaces and add Turborepo later only if orchestration or build caching becomes useful.

Use Tailwind and custom components first. Add shadcn/ui selectively later only where it helps.

Use CSS transitions first. Add Framer Motion later for richer Brilliant-style lesson interactions if needed.

## 4. Deployment

Use GitHub and Vercel from the start.

Recommended flow:

```txt
main branch -> production deploy
feature branch / PR -> preview deploy
```

Vercel should deploy `apps/web`. Supabase Auth redirect URLs must include local development and the production domain.

The existing public survey/about website at `https://learnify.academy` is the marketing entry point. Do not replace it during milestone 1. Deploy this repo as the Learnify product app and link to it from the public site.

Recommended domain split:

```txt
https://learnify.academy
-> public survey/about/landing website

https://app.learnify.academy
-> this Next.js product app
```

Public site link targets:

```txt
Login -> https://app.learnify.academy/login
Sign up / Join beta -> https://app.learnify.academy/signup
Student app -> https://app.learnify.academy/app
Waitlist -> https://app.learnify.academy/en/waitlist
```

The app also exposes locale-specific routes:

```txt
/en/auth/login
/th/auth/login
/en/auth/signup
/th/auth/signup
```

Use `NEXT_PUBLIC_MARKETING_URL=https://learnify.academy` so app navigation can return users to the public site.

## 5. Routing And Localization

Use bilingual routing from day one.

Routes should be locale-prefixed:

```txt
/en
/th
/en/waitlist
/th/waitlist
/en/auth/login
/th/auth/login
/en/auth/signup
/th/auth/signup
/en/app/dashboard
/th/app/dashboard
/en/app/courses
/th/app/courses
/en/app/courses/[courseSlug]
/th/app/courses/[courseSlug]
/en/app/lessons/[lessonSlug]
/th/app/lessons/[lessonSlug]
/en/app/insights
/th/app/insights
/en/app/admin/waitlist
/th/app/admin/waitlist
```

Use slugs in URLs and UUIDs internally.

Fetch bilingual records and select the display language in UI/core code:

```txt
title_en / title_th
description_en / description_th
content_en / content_th
```

Thai must be supported in milestone 1 for the full student-facing flow. Initial Thai content can be drafted during build but should receive human review before broader beta launch.

## 6. Access Model

Supabase waitlist data is the source of truth for beta eligibility.

Current Supabase source table:

```txt
public.beta_signups
```

This is the existing survey table from the public Learnify survey site. During the early beta, any normalized email found in `beta_signups.email` is treated as approved beta access. The richer `waitlist_signups` table can be added later when the app needs fields such as name, role, language, and explicit `beta_access`.

Rules:

```txt
Existing beta_signups email match
-> can sign up/sign in and access the app

New waitlist signup through the app
-> saved to beta_signups
-> considered approved during the early beta

No waitlist match
-> redirect to waitlist
```

All current waitlist users should be auto-approved during the first migration:

```sql
alter table waitlist_signups
add column if not exists beta_access boolean default false;

update waitlist_signups
set beta_access = true
where beta_access = false;
```

Identity matching is exact email matching after normalization:

```txt
lower(trim(auth.users.email)) === lower(trim(waitlist_signups.email))
```

Admin access uses `profiles.role = 'admin'`. The first admin account is manually promoted in Supabase. Do not hardcode admin emails.

## 7. Security

Use Supabase RLS from the first migration.

Important rule: client code should not directly query sensitive gate/admin tables such as `waitlist_signups`. Use Next.js Route Handlers or server-side repository functions with the service role where needed.

Initial RLS direction:

```txt
waitlist_signups:
- public insert only if needed
- no public read
- admin read
- service-role server checks

profiles:
- users read/update own profile
- admins read all

student data:
- owner read/write

published learning content:
- readable by authenticated beta users
```

## 8. Backend Interface

Use Next.js Route Handlers as the main product/backend boundary. Use Server Components for simple page reads. Avoid Server Actions in milestone 1 unless there is a clear reason.

Initial API routes:

```txt
POST /api/waitlist
GET /api/access/status
GET /api/courses
GET /api/lessons/[lessonSlug]
POST /api/lessons/[lessonSlug]/blocks/[blockId]/complete
POST /api/questions/attempt
POST /api/lumi/chat
GET /api/lumi/insights
GET /api/admin/waitlist
```

These routes should be designed so a future mobile app can call the same product logic.

## 9. Package Boundaries

Use packages to reduce lock-in and keep business rules portable.

```txt
packages/shared:
- Zod schemas
- TypeScript types
- constants

packages/core:
- progress calculation
- mastery calculation
- recommendation rules
- answer checking
- rule-based Lumi responses
- streak calculation

packages/database:
- Supabase clients
- repository functions
- database-specific queries

packages/design-tokens:
- colors
- typography
- spacing
- radii
- shadows
```

App code should prefer repository/core functions:

```ts
checkWaitlistAccess(email)
getPublishedLesson(slug, userId)
submitQuestionAttempt(input)
calculateLessonProgress(input)
generateRuleBasedLumiResponse(input)
```

Avoid scattering direct `supabase.from(...)` queries through UI components.

Milestone 2 adds `packages/ai` for Anthropic, RAG, prompts, structured output validation, and safety checks.

## 10. State Management

Use a mix of React state, URL state, and server state. Do not use Zustand in milestone 1.

```txt
React state:
- quiz draft answers
- simulation sliders
- Lumi input text
- open/closed panels
- temporary UI state

URL state:
- locale
- courseSlug
- lessonSlug
- admin filters

Server state:
- auth session
- waitlist access
- profile
- lesson progress
- block progress
- question attempts
- skill mastery
- Lumi conversations/messages
```

Use TanStack Query for client-side async interactions such as quiz attempts, Lumi chat, dashboard refreshes, and admin waitlist filters. Avoid overusing it for simple Server Component reads.

## 11. Data Model Direction

Inspect the existing Supabase schema first, especially `waitlist_signups`, then create additive migrations only.

Core tables needed for milestone 1:

```txt
profiles
courses
modules
lessons
lesson_blocks
skills
lesson_skills
lesson_prerequisites
questions
lesson_block_progress
lesson_progress
question_attempts
student_skill_mastery
lumi_conversations
lumi_messages
waitlist_signups
```

Delay formal quiz session tables until standalone quizzes exist:

```txt
quiz_attempts
quiz_answers
```

Delay teacher review workflow UI, but include status fields now:

```txt
lessons.status = draft | in_review | approved | published
courses.status = draft | published | archived
```

Student-visible content must be published.

## 12. Lesson Architecture

Store lesson blocks separately.

```txt
lessons:
- id
- slug
- module_id
- title_en
- title_th
- difficulty
- estimated_minutes
- status
- order_index

lesson_blocks:
- id
- slug
- lesson_id
- type
- order_index
- content_json
- created_at
```

Question blocks reference the separate `questions` table:

```txt
lesson_blocks.type = "multiple_choice"
lesson_blocks.content_json.question_id -> questions.id
```

Block types for milestone 1:

```txt
text
visual
simulation
multiple_choice
lumi_hint
reflection
next_lesson
```

Use React + SVG/CSS for interactive simulations. Do not use Canvas, Three.js, or a physics engine in milestone 1.

Future Brilliant-style lessons should grow into a Learnify-specific lesson interaction system using React, SVG, Framer Motion when needed, Canvas for simulation-heavy blocks, D3 for graph-heavy blocks, and KaTeX for equations.

## 13. Lesson Progress

Track both block-level and lesson-level progress from the start.

Progress rolls up like this:

```txt
completed blocks
-> lesson progress percent
-> module/chapter progress percent
-> course progress percent
```

Each block has equal weight until there is a clear product reason to add weighting.

Completion rules:

```txt
text/explanation:
- click Next to complete

visual:
- click Next to complete

simulation:
- required interaction
- then click Next

lumi_hint:
- open/read
- then click Next

question/quiz block:
- submit answer
- complete only when correct
- wrong answers trigger Lumi feedback and retry
```

Question blocks allow unlimited retries, but every attempt is recorded.

## 14. Assessment And Mastery

Use `question_attempts` in milestone 1 because questions are embedded in lessons.

Each submitted answer creates a row:

```txt
user_id
lesson_id
block_id
question_id
selected_answer
is_correct
attempt_number
time_spent_seconds
created_at
```

Mastery scoring details can be refined later. Initial direction:

```txt
first attempt correct:
- increase mastery

first attempt wrong:
- mark skill as weak / lower confidence

eventually correct:
- complete block and record recovery

extra retries:
- track struggle without repeated harsh penalties
```

Use:

```txt
lesson_skills = what a lesson teaches
questions.skill_id = what a question assesses
student_skill_mastery = how the student is doing
```

## 15. Dashboard And Recommendations

Include a simple student dashboard in milestone 1.

Dashboard should show:

```txt
continue learning
recommended next lesson
recent score / recent activity
weak skill
skill mastery
Lumi Insight
simple streak
```

Milestone 1 computes dashboard/module/course aggregates live from raw progress rows. Add stored aggregate rows later as usage grows.

Recommendation priority:

```txt
1. Continue current incomplete lesson
2. If weak skill exists, recommend a lesson mapped to that skill
3. Otherwise recommend next lesson by order_index
4. If prerequisites are incomplete, recommend prerequisite first
```

Include simple lesson prerequisites from the start:

```txt
lesson_prerequisites:
- lesson_id
- prerequisite_lesson_id
```

## 16. Lumi

Milestone 1 Lumi is functional but rule-based and lesson-scoped.

Milestone 1 supports:

```txt
lesson-aware Lumi chat panel
suggested prompts
answers from seeded lesson/question/skill data
mistake-specific help after wrong answers
Thai/English templates
saved conversations/messages in Supabase
deterministic Lumi Insights
```

Do not ship open-ended AI chat in milestone 1.

Milestone 2:

```txt
Anthropic-powered Lumi Chat
verified content retrieval
RAG
conversation history
rate limiting
sources
structured output validation
safety checks
```

## 17. Content And Seeds

Milestone 1 uses seed files only for content authoring. Admin content tools come later.

Seed one course/module:

```txt
Course:
Physics Foundations

Module:
Motion, Gravity, and Forces

Lessons:
1. Gravity and Falling Objects
2. Projectile Motion
3. Forces and Motion
```

Use TypeScript seed data with stable slugs and typed content:

```txt
supabase/seed/physics-foundations.ts
```

Raw SQL is acceptable for migrations, but JSON-heavy bilingual lesson content should live in typed seed data.

## 18. Testing

Use targeted tests from the start.

Vitest should cover:

```txt
waitlist access decisions
Zod schema validation
answer correctness
question attempt numbering
lesson progress calculation
mastery update rules
recommendation rules
rule-based Lumi response selection
streak calculation
```

Add Playwright after the first full UI flow exists:

```txt
login/access gate
dashboard
lesson block progression
question retry
Lumi feedback
insights
```

## 19. Portability Note

Supabase is the MVP backend. Learnify may later move to AWS/RDS or another backend as scale and product needs change.

To keep that future migration possible:

```txt
- keep product logic in packages/core
- keep database access in packages/database repositories
- keep Supabase implementation details out of UI components
- validate inputs/outputs with shared Zod schemas
- design API routes as reusable product boundaries for web and mobile
```

Do not prematurely abstract every database detail. The goal is practical portability, not generic infrastructure.

## 20. Open Setup Notes

Before live beta testing, complete these setup tasks:

- Apply the milestone Supabase migration and seed data so the live project has `profiles`, published course/lesson tables, progress tables, question attempts, skill mastery, and Lumi tables.
- Configure Google Auth in Supabase Auth, including local and production callback URLs for `/auth/callback`.
