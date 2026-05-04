# Learnify MVP Product & Technical Architecture

Last updated: 2026-05-02  
Purpose: Use this file as the working product and engineering specification for building the Learnify MVP with Codex.

---

## 0. Product Summary

Learnify is a bilingual Thai/English AI-powered learning platform for Thai students. It helps students learn through visual interactive lessons, quizzes, Lumi-powered explanations, personalized learning plans, and performance insights.

The existing `https://learnify.academy` survey/about website is the public entry point for early users. Milestone 1 login, signup, waitlist, and the eventual student learning app should be launched from that public site, with the product app deployed separately and linked from the public navigation.

Learnify is being built for both:

1. Hult Prize pitch/demo needs
2. Real student usage

Because of this, the MVP must be split into two tracks:

- **Demo MVP:** polished, impressive, visually complete, useful for pitch and validation
- **Real User MVP:** stable, safe, simple, usable by actual students

Access model update:

- The beta/MVP is not open to arbitrary authenticated demo users.
- Beta access is only for people who have already signed up for the waitlist or are added to the waitlist in Supabase.
- Existing Supabase waitlist data is the source of truth for early beta eligibility.
- Pitch/demo presentation can still show the product flow, but real MVP usage should be waitlist-gated.

The product should be web and mobile from the beginning, but web should be the main engineering foundation and mobile should use shared logic where possible.

---

## 1. Core Product Vision

Learnify's core loop:

```txt
Learn 竊・Quiz 竊・Mistake 竊・Lumi Insight 竊・Recommended Lesson 竊・Improve
```

The most important product promise:

> Learnify does not just teach content. It detects what a student misunderstands, explains why, and recommends what to learn next.

---

## 2. Target Users

### Primary MVP Users

1. Thai high school students
2. Thai middle school students
3. General students who need help understanding school subjects
4. Teachers/professionals who verify content

### Initial Subject Focus

Start with:

```txt
Physics
```

Learnify should later expand into:

- Chemistry
- Biology
- Math
- English
- Economics
- Other Thai school curriculum subjects

### Initial Physics Module Recommendation

Start with:

```txt
Gravity, Motion, and Forces
```

This is ideal because it supports:

- Visual simulations
- Motion diagrams
- Quizzes
- Graphs
- Lumi explanations
- Interactive learning blocks

---

## 3. MVP Scope

The user requested the MVP to include:

1. Interactive lessons
2. Quizzes
3. Lumi-powered chat
4. Personalized learning plans
5. Performance analytics
6. Signup/waitlist
7. Teacher/professional verification
8. Curriculum-based topic browsing
9. Thai/English bilingual support

This is a large scope. Therefore, split the build into phases.

---

## 4. MVP Build Phases

## Phase 1: Demo MVP

Goal: Create a polished product experience that can be shown to Hult Prize judges, early users, and potential partners.

Build:

- Landing page
- Waitlist/survey flow connected to existing Supabase waitlist data
- Waitlist-gated login/signup shell
- One Physics course
- 3窶・ interactive Physics lessons
- Quiz flow
- Lumi chat UI
- Lumi Insights dashboard
- Performance analytics mock/real hybrid
- Thai/English language toggle
- Teacher verification concept page

The Demo MVP should feel complete even if some systems are partially mocked. Real beta access should remain limited to users who are already on the Supabase waitlist.

---

## Phase 2: Real User MVP

Goal: Let students use the product for real learning.

Build:

- Real account system
- Course browsing
- Lesson player
- Quiz attempts
- Progress tracking
- Skill mastery tracking
- Lumi Insights from real quiz data
- RAG-powered Lumi chat
- Teacher review workflow
- Published lesson workflow

---

## Phase 3: Expansion

Goal: Add more subjects and scale.

Build:

- More Physics modules
- Chemistry
- Biology
- Math
- Full teacher dashboard
- Classrooms
- Assignments
- Parent reports
- School admin tools
- Payments/subscriptions

---

## 5. Explicit Non-Goals for MVP

Do not build these in the first MVP unless absolutely necessary:

- Full classroom management
- Assignment submission system
- Parent dashboard
- School admin dashboard
- Complex teacher analytics
- Leaderboards
- Advanced gamification
- Payment system
- Mobile-only custom experience
- Full custom CMS
- Full AI lesson builder UI
- Complex textbook licensing workflow

Instead, build a simple teacher/professional content review portal.

---

## 6. Product Experience

## Lesson Style

Learnify lessons should feel like:

```txt
Brilliant.org-inspired + Learnify warm visual identity
```

Lessons should be:

- Mostly visual
- Text-based where needed
- Quiz-driven
- Interactive
- Short and focused
- Supported by Lumi

Avoid long textbook-style pages.

---

## 7. Lesson Format

Each lesson should be rendered from structured JSON.

A lesson should be made of blocks:

```txt
Lesson
 笏懌楳笏 Intro text
 笏懌楳笏 Visual block
 笏懌楳笏 Interactive simulation
 笏懌楳笏 Guided question
 笏懌楳笏 Short explanation
 笏懌楳笏 Quiz block
 笏懌楳笏 Lumi hint
 笏懌楳笏 Feedback
 笏披楳笏 Next recommendation
```

### Example Lesson JSON

```json
{
  "id": "lesson_gravity_intro",
  "title_en": "What is Gravity?",
  "title_th": "犹≒ｸ｣犧・ｹもｸ吭ｹ霞ｸ｡犧籾ｹ謂ｸｧ犧・ｸ・ｸｷ犧ｭ犧ｭ犧ｰ犹・ｸ｣?",
  "subject": "Physics",
  "grade_level": "Grade 10-11",
  "blocks": [
    {
      "type": "text",
      "content_en": "Gravity is a force that pulls objects toward each other.",
      "content_th": "犹≒ｸ｣犧・ｹもｸ吭ｹ霞ｸ｡犧籾ｹ謂ｸｧ犧・ｸ・ｸｷ犧ｭ犹≒ｸ｣犧・ｸ伶ｸｵ犹謂ｸ扉ｸｶ犧・ｸｧ犧ｱ犧歩ｸ籾ｸｸ犹犧もｹ霞ｸｲ犧ｫ犧ｲ犧≒ｸｱ犧・
    },
    {
      "type": "visual",
      "visual_type": "falling-object-diagram"
    },
    {
      "type": "simulation",
      "simulation_type": "gravity-slider"
    },
    {
      "type": "multiple_choice",
      "question_id": "q_gravity_001"
    },
    {
      "type": "lumi_hint",
      "hint_type": "conceptual_explanation"
    }
  ]
}
```

---

## 8. First Demo Course

## Course: Physics Foundations

### Module 1: Motion, Gravity, and Forces

Recommended lessons:

1. What is motion?
2. Speed vs velocity
3. Acceleration
4. Gravity and falling objects
5. Projectile motion
6. Forces and Newton's laws

For the first demo, build at least:

1. Gravity and falling objects
2. Projectile motion
3. Forces and motion

---

## 9. Lumi Product Requirements

Lumi is Learnify's AI learning assistant.

### MVP Lumi Features

Lumi should:

1. Explain concepts
2. Recommend lessons
3. Create personalized learning plans
4. Chat with students
5. Motivate students after mistakes

### Lumi Modes

```txt
Lumi Chat
Lumi Insights
Lumi Quiz Feedback
Lumi Study Plan
Lumi Lesson Recommendation
```

---

## 10. Lumi Chat Requirements

Lumi Chat should be available:

- Inside lessons
- On the dashboard

Initial behavior:

- Student asks a question
- Lumi retrieves relevant verified content
- Lumi checks student's current lesson and weak skills
- Lumi responds in Thai or English
- Lumi keeps answer friendly, clear, and age-appropriate

### Lumi Chat Input Context

Each Lumi chat request should include:

```ts
type LumiChatInput = {
  userId: string
  message: string
  language: "en" | "th"
  currentLessonId?: string
  currentCourseId?: string
  recentMistakes?: StudentMistake[]
  weakSkills?: SkillMastery[]
}
```

### Lumi Chat Output

```ts
type LumiChatOutput = {
  answer: string
  relatedLessons?: string[]
  suggestedNextAction?: string
  confidence?: "low" | "medium" | "high"
  sources?: RetrievedContextSource[]
}
```

---

## 11. Lumi Insights Requirements

Lumi Insights should appear after quizzes and on the dashboard.

It should show:

- Strong topics
- Weak topics
- Mistakes made
- Recommended next lesson
- Short study plan
- Motivational message

Example:

```txt
You are improving in:
- Understanding gravity
- Reading simple motion diagrams

You should review:
- Acceleration
- Projectile motion

Recommended next:
- Try "Projectile Motion Basics"
- Complete 5 practice questions
```

---

## 12. Content System

Learnify should use a RAG-based content pipeline.

Goal:

> Feed curriculum/content into a RAG pipeline, generate course and lesson structures, then have teachers/professionals verify content before publishing.

---

## 13. RAG Pipeline

```txt
Curriculum / Textbook / Teacher Notes
        竊・Document Upload
        竊・Chunking
        竊・Embedding Generation
        竊・Vector Storage
        竊・Course/Lesson Draft Generation
        竊・Teacher Review
        竊・Approved Lessons
        竊・Published Learnify Content
        竊・Lumi Chat + Student Learning
```

### RAG Sources

Initial sources:

1. Your own lesson notes
2. Thai curriculum documents
3. Teacher-created notes

Later sources:

1. Textbooks
2. Past exam papers
3. Public educational resources
4. School-specific materials

---

## 14. Teacher/Professional Verification

The MVP should include a teacher/professional verification workflow, not full classrooms.

### Content Status Flow

```txt
draft 竊・in_review 竊・approved 竊・published
```

### Teacher Review Actions

Teachers/professionals can:

- View draft lesson
- View AI-generated quiz questions
- Approve lesson
- Reject lesson
- Request changes
- Add review comments

---

## 15. Bilingual Support

Learnify must support Thai and English from day one.

Use:

```txt
next-intl for web
i18n-compatible shared message structure
```

### Recommended Web Routes

```txt
/en
/th
/en/app/dashboard
/th/app/dashboard
/en/app/courses
/th/app/courses
/en/app/lessons/[lessonId]
/th/app/lessons/[lessonId]
```

### Language Requirements

Store user preference:

```ts
language_preference: "en" | "th"
```

For content tables, store bilingual fields:

```txt
title_en
title_th
description_en
description_th
content_en
content_th
```

For flexible JSON content, use:

```json
{
  "content_en": "...",
  "content_th": "..."
}
```

---

## 16. Account System

MVP account requirements:

1. Email/password signup
2. Google login
3. Waitlist/signup form
4. Waitlist-gated beta access using existing Supabase waitlist records

Use Supabase Auth. Do not create authenticated demo users. A student should only receive beta/MVP access if their email exists in the waitlist data or they successfully join the waitlist.

### User Roles

```txt
student
teacher
admin
```

---

## 17. Data to Track

Track:

1. Quiz score
2. Wrong answers
3. Time spent
4. Topic mastery
5. Streak
6. Weaknesses
7. Completed lessons
8. Lumi recommendations

---

## 18. Dashboard Requirements

The student dashboard should show:

1. Recent performance
2. Lumi Insights
3. Recommended next lesson
4. Subject progress
5. Streak
6. Confidence level

Do not include leaderboard in MVP.

---

## 19. Recommended Tech Stack

## Frontend Web

```txt
Next.js 15
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
TanStack Query
Zustand
next-intl
```

## Frontend Mobile

```txt
React Native
Expo
Expo Router
NativeWind
Supabase client
```

## Backend

```txt
Supabase Auth
Supabase Postgres
Supabase Storage
Supabase pgvector
Next.js Route Handlers
Vercel
```

## AI

```txt
OpenAI API or Claude API
RAG over verified curriculum content
Structured JSON outputs
Supabase pgvector for vector search
Teacher review before publishing
```

---

## 20. Monorepo Structure

Use a monorepo.

```txt
learnify/
 笏懌楳笏 apps/
 笏・  笏懌楳笏 web/
 笏・  笏披楳笏 mobile/
 笏懌楳笏 packages/
 笏・  笏懌楳笏 shared/
 笏・  笏懌楳笏 database/
 笏・  笏懌楳笏 ai/
 笏・  笏懌楳笏 config/
 笏・  笏披楳笏 design-tokens/
 笏懌楳笏 supabase/
 笏・  笏懌楳笏 migrations/
 笏・  笏披楳笏 seed/
 笏懌楳笏 docs/
 笏・  笏懌楳笏 PRODUCT.md
 笏・  笏懌楳笏 ARCHITECTURE.md
 笏・  笏披楳笏 ROADMAP.md
 笏懌楳笏 package.json
 笏懌楳笏 turbo.json
 笏披楳笏 README.md
```

### apps/web

Next.js web app.

Contains:

```txt
Landing page
Auth pages
Student dashboard
Lesson player
Quiz flow
Lumi chat
Teacher review portal
Admin content tools
```

### apps/mobile

Expo mobile app.

Contains:

```txt
Home
Courses
Lesson player
Quiz
Lumi chat
Insights
Profile
```

Do not build teacher/admin flows on mobile first.

### packages/shared

Contains:

```txt
Shared TypeScript types
Validation schemas
Constants
Skill models
Course models
Utility functions
```

### packages/database

Contains:

```txt
Supabase generated types
Database helper functions
Query functions
Repository-style data access
```

### packages/ai

Contains:

```txt
RAG retrieval logic
Prompt templates
Lumi functions
Course generation functions
Quiz generation functions
Study plan generation
```

### packages/design-tokens

Contains:

```txt
Colors
Spacing
Typography
Border radius
Shadow tokens
Brand tokens
```

---

## 21. Web Route Architecture

```txt
/
```

Landing page

```txt
/waitlist
```

Waitlist/survey

```txt
/auth/login
/auth/signup
```

Authentication

```txt
/app/dashboard
```

Student dashboard

```txt
/app/courses
```

Course browsing

```txt
/app/courses/[courseId]
```

Course overview

```txt
/app/lessons/[lessonId]
```

Interactive lesson player

```txt
/app/quiz/[lessonId]
```

Quiz flow

```txt
/app/lumi
```

Lumi chat

```txt
/app/insights
```

Lumi Insights

```txt
/app/review
```

Teacher review portal

```txt
/admin/content
```

Admin content management

---

## 22. Mobile Screen Architecture

```txt
/(tabs)/home
/(tabs)/courses
/(tabs)/lumi
/(tabs)/insights
/(tabs)/profile
/lesson/[lessonId]
/quiz/[lessonId]
/course/[courseId]
```

---

## 23. Database Architecture

Use Supabase Postgres.

---

## 23.1 profiles

Stores all users.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('student', 'teacher', 'admin')) default 'student',
  display_name text,
  language_preference text check (language_preference in ('en', 'th')) default 'en',
  grade_level text,
  school_name text,
  created_at timestamptz default now()
);
```

---

## 23.2 courses

```sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_th text,
  subject text not null,
  grade_level text,
  description_en text,
  description_th text,
  status text check (status in ('draft', 'published', 'archived')) default 'draft',
  created_at timestamptz default now()
);
```

---

## 23.3 modules

```sql
create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title_en text not null,
  title_th text,
  description_en text,
  description_th text,
  order_index integer not null default 0,
  created_at timestamptz default now()
);
```

---

## 23.4 lessons

```sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  title_en text not null,
  title_th text,
  content_json jsonb not null default '{}',
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  estimated_minutes integer default 10,
  status text check (status in ('draft', 'in_review', 'approved', 'published')) default 'draft',
  created_by_ai boolean default false,
  reviewed_by uuid references profiles(id),
  published_at timestamptz,
  created_at timestamptz default now()
);
```

---

## 23.5 skills

```sql
create table skills (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  title_en text not null,
  title_th text,
  description_en text,
  description_th text,
  created_at timestamptz default now()
);
```

---

## 23.6 questions

```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  skill_id uuid references skills(id),
  question_type text check (question_type in ('multiple_choice', 'short_answer', 'true_false')) default 'multiple_choice',
  question_en text not null,
  question_th text,
  options_json jsonb,
  correct_answer jsonb not null,
  explanation_en text,
  explanation_th text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) default 'easy',
  created_at timestamptz default now()
);
```

---

## 23.7 quiz_attempts

```sql
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  score numeric,
  total_questions integer,
  correct_questions integer,
  time_spent_seconds integer,
  created_at timestamptz default now()
);
```

---

## 23.8 quiz_answers

```sql
create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references quiz_attempts(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  selected_answer jsonb,
  is_correct boolean,
  time_spent_seconds integer,
  created_at timestamptz default now()
);
```

---

## 23.9 student_skill_mastery

```sql
create table student_skill_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  mastery_score numeric default 0,
  confidence_level text check (confidence_level in ('low', 'medium', 'high')) default 'low',
  last_practiced_at timestamptz,
  updated_at timestamptz default now(),
  unique (user_id, skill_id)
);
```

---

## 23.10 lesson_progress

```sql
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  status text check (status in ('not_started', 'in_progress', 'completed')) default 'not_started',
  progress_percent integer default 0,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique (user_id, lesson_id)
);
```

---

## 23.11 lumi_conversations

```sql
create table lumi_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id),
  course_id uuid references courses(id),
  language text check (language in ('en', 'th')) default 'en',
  title text,
  created_at timestamptz default now()
);
```

---

## 23.12 lumi_messages

```sql
create table lumi_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references lumi_conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')) not null,
  message text not null,
  retrieved_context_ids jsonb,
  created_at timestamptz default now()
);
```

---

## 23.13 rag_documents

```sql
create table rag_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  grade_level text,
  language text check (language in ('en', 'th')) default 'en',
  source_type text,
  uploaded_by uuid references profiles(id),
  status text check (status in ('uploaded', 'processed', 'failed')) default 'uploaded',
  created_at timestamptz default now()
);
```

---

## 23.14 rag_chunks

Enable pgvector first.

```sql
create extension if not exists vector;
```

Then create chunks.

```sql
create table rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references rag_documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  verified boolean default false,
  created_at timestamptz default now()
);
```

Note: embedding dimension depends on the embedding model. Adjust `vector(1536)` if using another model.

---

## 23.15 teacher_reviews

```sql
create table teacher_reviews (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  teacher_id uuid references profiles(id),
  status text check (status in ('approved', 'rejected', 'needs_changes')) not null,
  comments text,
  created_at timestamptz default now()
);
```

---

## 23.16 waitlist_signups

```sql
create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  role text,
  grade_level text,
  preferred_language text check (preferred_language in ('en', 'th')) default 'en',
  interest_reason text,
  created_at timestamptz default now()
);
```

---

## 24. API Route Architecture

Use Next.js Route Handlers.

### Auth

Handled mostly by Supabase Auth.

### Course APIs

```txt
GET /api/courses
GET /api/courses/[courseId]
GET /api/lessons/[lessonId]
```

### Quiz APIs

```txt
POST /api/quiz/submit
GET /api/quiz/attempts
GET /api/quiz/attempts/[attemptId]
```

### Lumi APIs

```txt
POST /api/lumi/chat
POST /api/lumi/insights
POST /api/lumi/recommend
POST /api/lumi/study-plan
```

### RAG APIs

```txt
POST /api/rag/upload
POST /api/rag/process
POST /api/rag/retrieve
```

### Content Generation APIs

```txt
POST /api/ai/generate-course-outline
POST /api/ai/generate-lesson-draft
POST /api/ai/generate-quiz-questions
```

### Teacher Review APIs

```txt
GET /api/review/lessons
POST /api/review/lessons/[lessonId]/approve
POST /api/review/lessons/[lessonId]/reject
POST /api/review/lessons/[lessonId]/request-changes
```

### Waitlist APIs

```txt
POST /api/waitlist
```

---

## 25. Shared Types

Create shared types in:

```txt
packages/shared/src/types
```

Example:

```ts
export type Language = "en" | "th"

export type UserRole = "student" | "teacher" | "admin"

export type LessonStatus = "draft" | "in_review" | "approved" | "published"

export type LessonBlock =
  | TextBlock
  | VisualBlock
  | SimulationBlock
  | MultipleChoiceBlock
  | LumiHintBlock
  | ReflectionBlock
  | NextLessonBlock

export type TextBlock = {
  type: "text"
  content_en: string
  content_th?: string
}

export type VisualBlock = {
  type: "visual"
  visual_type: string
  title_en?: string
  title_th?: string
}

export type SimulationBlock = {
  type: "simulation"
  simulation_type: "gravity-slider" | "projectile-motion" | "force-diagram"
  config?: Record<string, unknown>
}

export type MultipleChoiceBlock = {
  type: "multiple_choice"
  question_id: string
}

export type LumiHintBlock = {
  type: "lumi_hint"
  hint_type: "conceptual_explanation" | "mistake_feedback" | "next_step"
}

export type ReflectionBlock = {
  type: "reflection"
  prompt_en: string
  prompt_th?: string
}

export type NextLessonBlock = {
  type: "next_lesson"
  lesson_id: string
}
```

---

## 26. Lesson Renderer Requirements

Create a lesson renderer that maps block types to components.

```tsx
function LessonRenderer({ blocks, language }: Props) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return <TextBlock block={block} language={language} />
          case "visual":
            return <VisualBlock block={block} />
          case "simulation":
            return <SimulationBlock block={block} />
          case "multiple_choice":
            return <MultipleChoiceBlock questionId={block.question_id} />
          case "lumi_hint":
            return <LumiHintBlock block={block} />
          case "reflection":
            return <ReflectionBlock block={block} language={language} />
          case "next_lesson":
            return <NextLessonBlock lessonId={block.lesson_id} />
          default:
            return null
        }
      })}
    </>
  )
}
```

---

## 27. AI Function Architecture

Do not build Lumi as one giant AI function.

Create separate AI functions:

```txt
generateCourseOutline()
generateLessonDraft()
generateQuizQuestions()
generateLumiExplanation()
generateLumiInsights()
generateStudyPlan()
recommendNextLesson()
chatWithLumi()
retrieveRelevantChunks()
```

Each function should have:

- Separate prompt
- Separate input schema
- Separate output schema
- Logging
- Error handling
- Rate limiting

---

## 28. RAG Retrieval Logic

Basic retrieval flow:

```txt
User message
   竊・Detect language
   竊・Get current lesson/course context
   竊・Get student weak skills
   竊・Embed user query
   竊・Search rag_chunks
   竊・Filter for verified/published content
   竊・Pass context to Lumi prompt
   竊・Return answer
```

### Retrieval Constraints

Lumi should prioritize:

1. Current lesson content
2. Published Learnify lessons
3. Verified RAG chunks
4. Student weak skills
5. Recent quiz mistakes

Lumi should not rely on unverified draft content for student answers.

---

## 29. AI Safety Requirements

Lumi should:

- Be clear when unsure
- Avoid pretending unsupported information is verified
- Encourage students
- Avoid harsh or discouraging language
- Use age-appropriate explanations
- Use Thai/English based on user preference
- Ground answers in retrieved content when possible
- Avoid giving overconfident answers from unverified content

---

## 30. Performance Analytics Logic

Track student progress through:

```txt
quiz_attempts
quiz_answers
student_skill_mastery
lesson_progress
```

### Mastery Score Update

Simple MVP mastery logic:

```txt
If answer correct:
  increase skill mastery

If answer wrong:
  decrease or maintain skill mastery

If repeated correct:
  increase confidence level

If repeated wrong:
  mark as weak skill
```

Example scoring:

```txt
Correct answer: +10 mastery points
Wrong answer: -5 mastery points
Minimum: 0
Maximum: 100
```

Confidence:

```txt
0-39 = low
40-74 = medium
75-100 = high
```

---

## 31. Design System

Use Learnify's warm professional identity.

### Brand Style

```txt
Professional
Warm
Clean
Interactive
Not childish
No mascot
Subtle animations
Mastery-focused
```

### Colors

```txt
Page background: #FAF8F3
Card/sidebar: #F3F0E8
Main text: #2C2B28
Brand gold: #BA7517
Border: rgba(40,39,48,0.08)
```

### Typography

Use:

```txt
Clean sans-serif
Medium weight wordmark
Readable body text
Clear hierarchy
```

### Wordmark

```txt
LEARNIFY
Letter spacing: 0.1em
Font weight: 500
```

---

## 32. Web UI Components

Create components:

```txt
AppShell
Sidebar
TopNav
LanguageToggle
CourseCard
ModuleCard
LessonCard
LessonRenderer
QuizCard
AnswerOption
LumiChatPanel
LumiInsightsCard
ProgressRing
SkillMasteryBar
StreakCard
TeacherReviewCard
```

---

## 33. Mobile UI Components

Create mobile components:

```txt
MobileAppShell
BottomTabs
MobileCourseCard
MobileLessonCard
MobileQuizCard
MobileLumiChat
MobileInsightsCard
MobileProgressCard
```

Do not try to share web shadcn components directly with mobile.

Share:

- Types
- Logic
- Design tokens
- Constants
- API clients

Do not share:

- Web-only UI components
- shadcn components
- DOM-specific components

---

## 34. Suggested Development Order

Build in this exact order:

### Step 1: Project Setup

- Monorepo
- Next.js web app
- Expo mobile app
- Shared packages
- Supabase project
- Environment variables
- Basic CI

### Step 2: Design System

- Learnify colors
- Typography
- Cards
- Buttons
- Layout
- Mobile responsive shell

### Step 3: Landing + Waitlist

- Landing page
- Waitlist/survey form
- Store signups in Supabase

### Step 4: Auth

- Email/password
- Google login
- Profile creation
- Role support

### Step 5: Course/Lesson Data

- Create courses/modules/lessons tables
- Seed Physics course
- Seed 3 lessons
- Seed questions/skills

### Step 6: Lesson Player

- Dynamic lesson renderer
- Text blocks
- Visual blocks
- Simulation blocks
- Quiz blocks

### Step 7: Quiz Flow

- Multiple choice questions
- Submit attempt
- Save answers
- Calculate score
- Update mastery

### Step 8: Dashboard

- Recent performance
- Recommended next lesson
- Skill mastery
- Streak
- Lumi Insights card

### Step 9: Lumi Insights

- Generate insights based on quiz results
- Recommend weak skills
- Recommend next lesson

### Step 10: Lumi Chat

- Basic chat UI
- RAG retrieval
- Grounded answer generation
- Store conversation history

### Step 11: Teacher Review

- Review draft lessons
- Approve/reject/request changes
- Publish approved lessons

### Step 12: Mobile MVP

- Mobile home
- Course list
- Lesson player
- Quiz
- Lumi chat
- Insights

---

## 35. Hult Prize Demo Flow

The Hult demo should show this flow:

```txt
Landing page
   竊・Try demo lesson
   竊・Interactive Physics lesson
   竊・Quiz
   竊・Student makes mistake
   竊・Lumi explains mistake
   竊・Lumi Insights generates study plan
   竊・Student joins waitlist, or signs in if already waitlisted
```

This flow clearly communicates Learnify's value. For real MVP/beta usage, signup and access should be gated against the Supabase waitlist.

---

## 36. First Demo Lesson Details

## Lesson: Gravity and Falling Objects

### Learning Goal

Students understand that gravity pulls objects downward and affects falling motion.

### Blocks

1. Intro text
2. Falling object visual
3. Gravity slider simulation
4. Question: "What happens when gravity increases?"
5. Explanation
6. Quiz
7. Lumi feedback
8. Next lesson recommendation

### Example Quiz

Question:

```txt
If gravity becomes stronger, what happens to a falling object's acceleration?
```

Options:

```txt
A. It decreases
B. It increases
C. It becomes zero
D. It stays exactly the same everywhere
```

Correct answer:

```txt
B. It increases
```

Skill:

```txt
Understanding gravitational acceleration
```

---

## 37. Environment Variables

Create environment files.

### apps/web/.env.local

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### apps/mobile/.env

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

---

## 38. Security Requirements

- Use Supabase Row Level Security
- Never expose service role key to client
- Validate all API inputs
- Rate-limit Lumi endpoints
- Require teacher/admin role for review endpoints
- Require published status for student-visible lessons
- Store only necessary student data
- Do not show unverified AI-generated content to students

---

## 39. Row Level Security Notes

Basic policy direction:

Students can:

- Read published courses
- Read published lessons
- Read their own quiz attempts
- Read/update their own profile
- Read their own Lumi conversations

Teachers can:

- Read lessons in review
- Create teacher reviews
- Approve/reject only if role is teacher/admin

Admins can:

- Manage all content

---

## 40. Codex Build Instruction

When using Codex, treat this file as the source of truth.

### General Codex Instruction

```txt
You are building Learnify, a bilingual Thai/English AI learning platform.

Follow docs/PRODUCT.md as the source of truth.

Build incrementally. Do not overbuild beyond the current phase.

Use TypeScript, strict types, clean components, and shared packages where appropriate.

Prefer simple working systems over complex abstractions.

The first goal is:
Landing page 竊・demo Physics lesson 竊・quiz 竊・Lumi Insights 竊・signup/waitlist.
```

### Coding Priorities

1. Working product flow
2. Clean data models
3. Reusable lesson renderer
4. Bilingual support
5. Quiz tracking
6. Lumi Insights
7. RAG-powered Lumi chat
8. Teacher review

---

## 41. Current Best First Milestone

The first milestone should be:

```txt
Landing page + Supabase waitlist gate + auth + one interactive Physics lesson + one quiz + Lumi Insights mock/real hybrid
```

This is the fastest path to something impressive and useful.

---

## 42. Success Criteria

The MVP is successful if:

1. A waitlisted student can sign up/sign in, or a new student can join the waitlist
2. A student can open a Physics lesson
3. A student can interact with visual content
4. A student can answer quiz questions
5. Learnify tracks the student's answer
6. Lumi explains mistakes
7. Lumi recommends what to study next
8. Dashboard shows progress and weak areas
9. Content can be reviewed before publishing
10. Thai/English support works

---

## 43. Final Product Principle

Always optimize Learnify around this moment:

```txt
A student gets something wrong, but instead of feeling lost, Lumi helps them understand exactly what to do next.
```

That is the core of Learnify.



