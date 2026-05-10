create extension if not exists pgcrypto;

create table if not exists public.beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  response_id text,
  created_at timestamptz not null default now()
);

alter table public.beta_signups
  add column if not exists email_normalized text;

update public.beta_signups
set email_normalized = lower(btrim(email))
where email_normalized is null
  and email is not null;

create index if not exists beta_signups_email_normalized_idx
  on public.beta_signups (email_normalized);

alter table public.beta_signups enable row level security;

insert into public.beta_signups (email, response_id, email_normalized)
select email_normalized, null, email_normalized
from public.waitlist_signups
where email_normalized is not null
on conflict do nothing;

insert into public.courses (
  id,
  slug,
  title_en,
  title_th,
  subject,
  grade_level,
  description_en,
  description_th,
  status
)
values (
  '11111111-1111-1111-8111-111111111111',
  'physics-foundations',
  'Physics Foundations',
  'Physics Foundations',
  'Physics',
  'Grade 10-11',
  'A visual first module about motion, gravity, and forces for the private beta.',
  'A visual first module about motion, gravity, and forces for the private beta.',
  'published'
)
on conflict (slug) do update set
  title_en = excluded.title_en,
  title_th = excluded.title_th,
  subject = excluded.subject,
  grade_level = excluded.grade_level,
  description_en = excluded.description_en,
  description_th = excluded.description_th,
  status = excluded.status;

insert into public.modules (
  id,
  slug,
  course_id,
  title_en,
  title_th,
  description_en,
  description_th,
  order_index
)
values (
  '22222222-2222-2222-8222-222222222222',
  'motion-gravity-forces',
  '11111111-1111-1111-8111-111111111111',
  'Motion, Gravity, and Forces',
  'Motion, Gravity, and Forces',
  'Learn why objects fall, how projectiles move, and how forces change motion.',
  'Learn why objects fall, how projectiles move, and how forces change motion.',
  1
)
on conflict (slug) do update set
  course_id = excluded.course_id,
  title_en = excluded.title_en,
  title_th = excluded.title_th,
  description_en = excluded.description_en,
  description_th = excluded.description_th,
  order_index = excluded.order_index;

insert into public.skills (
  id,
  slug,
  subject,
  title_en,
  title_th,
  description_en,
  description_th
)
values
  (
    '33333333-3333-3333-8333-333333333331',
    'gravitational-acceleration',
    'Physics',
    'Gravitational acceleration',
    'Gravitational acceleration',
    'Understand how stronger gravity changes the acceleration of falling objects.',
    'Understand how stronger gravity changes the acceleration of falling objects.'
  ),
  (
    '33333333-3333-3333-8333-333333333332',
    'projectile-components',
    'Physics',
    'Projectile motion components',
    'Projectile motion components',
    'Separate horizontal and vertical motion when studying projectiles.',
    'Separate horizontal and vertical motion when studying projectiles.'
  ),
  (
    '33333333-3333-3333-8333-333333333333',
    'net-force',
    'Physics',
    'Net force and motion',
    'Net force and motion',
    'Connect unbalanced forces with changes in an object''s motion.',
    'Connect unbalanced forces with changes in an object''s motion.'
  )
on conflict (slug) do update set
  subject = excluded.subject,
  title_en = excluded.title_en,
  title_th = excluded.title_th,
  description_en = excluded.description_en,
  description_th = excluded.description_th;

insert into public.lessons (
  id,
  slug,
  module_id,
  title_en,
  title_th,
  summary_en,
  summary_th,
  difficulty,
  estimated_minutes,
  status,
  order_index,
  published_at
)
values
  (
    '44444444-4444-4444-8444-444444444441',
    'gravity-and-falling-objects',
    '22222222-2222-2222-8222-222222222222',
    'Gravity and Falling Objects',
    'Gravity and Falling Objects',
    'Use a gravity slider to see how falling acceleration changes.',
    'Use a gravity slider to see how falling acceleration changes.',
    'beginner',
    8,
    'published',
    1,
    now()
  ),
  (
    '44444444-4444-4444-8444-444444444442',
    'projectile-motion',
    '22222222-2222-2222-8222-222222222222',
    'Projectile Motion',
    'Projectile Motion',
    'Separate horizontal motion from vertical motion to understand curved paths.',
    'Separate horizontal motion from vertical motion to understand curved paths.',
    'beginner',
    10,
    'published',
    2,
    now()
  ),
  (
    '44444444-4444-4444-8444-444444444443',
    'forces-and-motion',
    '22222222-2222-2222-8222-222222222222',
    'Forces and Motion',
    'Forces and Motion',
    'Connect force arrows with acceleration and changes in motion.',
    'Connect force arrows with acceleration and changes in motion.',
    'beginner',
    10,
    'published',
    3,
    now()
  )
on conflict (slug) do update set
  module_id = excluded.module_id,
  title_en = excluded.title_en,
  title_th = excluded.title_th,
  summary_en = excluded.summary_en,
  summary_th = excluded.summary_th,
  difficulty = excluded.difficulty,
  estimated_minutes = excluded.estimated_minutes,
  status = excluded.status,
  order_index = excluded.order_index,
  published_at = excluded.published_at;

insert into public.lesson_blocks (
  id,
  slug,
  lesson_id,
  type,
  order_index,
  content_json
)
values
  (
    '55555555-5555-5555-8555-555555555501',
    'gravity-intro',
    '44444444-4444-4444-8444-444444444441',
    'text',
    1,
    '{"content_en":"Gravity is a force that pulls objects toward each other. Near Earth, it pulls objects downward and makes falling objects accelerate.","content_th":"Gravity is a force that pulls objects toward each other. Near Earth, it pulls objects downward and makes falling objects accelerate."}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555502',
    'gravity-visual',
    '44444444-4444-4444-8444-444444444441',
    'visual',
    2,
    '{"visual_type":"falling-object-diagram","title_en":"A falling object speeds up as gravity pulls downward.","title_th":"A falling object speeds up as gravity pulls downward."}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555503',
    'gravity-slider',
    '44444444-4444-4444-8444-444444444441',
    'simulation',
    3,
    '{"simulation_type":"gravity-slider","config":{"minGravity":2,"maxGravity":16,"defaultGravity":9.8}}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555504',
    'gravity-question',
    '44444444-4444-4444-8444-444444444441',
    'multiple_choice',
    4,
    '{"question_id":"q-gravity-001"}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555505',
    'gravity-lumi-hint',
    '44444444-4444-4444-8444-444444444441',
    'lumi_hint',
    5,
    '{"hint_type":"conceptual_explanation"}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555506',
    'gravity-next',
    '44444444-4444-4444-8444-444444444441',
    'next_lesson',
    6,
    '{"lesson_slug":"projectile-motion"}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555507',
    'projectile-intro',
    '44444444-4444-4444-8444-444444444442',
    'text',
    1,
    '{"content_en":"A projectile moves forward while gravity pulls it downward. These two motions combine into a curved path.","content_th":"A projectile moves forward while gravity pulls it downward. These two motions combine into a curved path."}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555508',
    'projectile-sim',
    '44444444-4444-4444-8444-444444444442',
    'simulation',
    2,
    '{"simulation_type":"projectile-motion"}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555509',
    'projectile-question',
    '44444444-4444-4444-8444-444444444442',
    'multiple_choice',
    3,
    '{"question_id":"q-projectile-001"}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555510',
    'force-intro',
    '44444444-4444-4444-8444-444444444443',
    'text',
    1,
    '{"content_en":"Forces can change how an object moves. When forces do not balance, the object accelerates in the direction of the net force.","content_th":"Forces can change how an object moves. When forces do not balance, the object accelerates in the direction of the net force."}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555511',
    'force-visual',
    '44444444-4444-4444-8444-444444444443',
    'visual',
    2,
    '{"visual_type":"force-diagram","title_en":"Unbalanced force changes motion.","title_th":"Unbalanced force changes motion."}'::jsonb
  ),
  (
    '55555555-5555-5555-8555-555555555512',
    'force-question',
    '44444444-4444-4444-8444-444444444443',
    'multiple_choice',
    3,
    '{"question_id":"q-force-001"}'::jsonb
  )
on conflict (lesson_id, slug) do update set
  type = excluded.type,
  order_index = excluded.order_index,
  content_json = excluded.content_json;

insert into public.questions (
  id,
  slug,
  lesson_id,
  skill_id,
  question_type,
  question_en,
  question_th,
  options_json,
  correct_answer,
  explanation_en,
  explanation_th,
  difficulty
)
values
  (
    '66666666-6666-6666-8666-666666666661',
    'q-gravity-001',
    '44444444-4444-4444-8444-444444444441',
    '33333333-3333-3333-8333-333333333331',
    'multiple_choice',
    'If gravity becomes stronger, what happens to a falling object''s acceleration?',
    'If gravity becomes stronger, what happens to a falling object''s acceleration?',
    '[{"id":"a","label_en":"It decreases","label_th":"It decreases"},{"id":"b","label_en":"It increases","label_th":"It increases"},{"id":"c","label_en":"It becomes zero","label_th":"It becomes zero"},{"id":"d","label_en":"It stays exactly the same everywhere","label_th":"It stays exactly the same everywhere"}]'::jsonb,
    '{"option_id":"b"}'::jsonb,
    'Stronger gravity means a larger downward acceleration, so the object speeds up faster as it falls.',
    'Stronger gravity means a larger downward acceleration, so the object speeds up faster as it falls.',
    'easy'
  ),
  (
    '66666666-6666-6666-8666-666666666662',
    'q-projectile-001',
    '44444444-4444-4444-8444-444444444442',
    '33333333-3333-3333-8333-333333333332',
    'multiple_choice',
    'In simple projectile motion, which direction does gravity affect directly?',
    'In simple projectile motion, which direction does gravity affect directly?',
    '[{"id":"a","label_en":"Horizontal only","label_th":"Horizontal only"},{"id":"b","label_en":"Vertical only","label_th":"Vertical only"},{"id":"c","label_en":"Neither direction","label_th":"Neither direction"},{"id":"d","label_en":"Only after the object lands","label_th":"Only after the object lands"}]'::jsonb,
    '{"option_id":"b"}'::jsonb,
    'Gravity pulls downward, so it directly changes the vertical motion while horizontal motion continues forward.',
    'Gravity pulls downward, so it directly changes the vertical motion while horizontal motion continues forward.',
    'easy'
  ),
  (
    '66666666-6666-6666-8666-666666666663',
    'q-force-001',
    '44444444-4444-4444-8444-444444444443',
    '33333333-3333-3333-8333-333333333333',
    'multiple_choice',
    'What usually happens when an object has an unbalanced force acting on it?',
    'What usually happens when an object has an unbalanced force acting on it?',
    '[{"id":"a","label_en":"Its motion changes","label_th":"Its motion changes"},{"id":"b","label_en":"It must stop immediately","label_th":"It must stop immediately"},{"id":"c","label_en":"Its mass disappears","label_th":"Its mass disappears"},{"id":"d","label_en":"Gravity turns off","label_th":"Gravity turns off"}]'::jsonb,
    '{"option_id":"a"}'::jsonb,
    'An unbalanced force changes motion by causing acceleration in the direction of the net force.',
    'An unbalanced force changes motion by causing acceleration in the direction of the net force.',
    'easy'
  )
on conflict (slug) do update set
  lesson_id = excluded.lesson_id,
  skill_id = excluded.skill_id,
  question_type = excluded.question_type,
  question_en = excluded.question_en,
  question_th = excluded.question_th,
  options_json = excluded.options_json,
  correct_answer = excluded.correct_answer,
  explanation_en = excluded.explanation_en,
  explanation_th = excluded.explanation_th,
  difficulty = excluded.difficulty;

insert into public.lesson_skills (lesson_id, skill_id)
values
  ('44444444-4444-4444-8444-444444444441', '33333333-3333-3333-8333-333333333331'),
  ('44444444-4444-4444-8444-444444444442', '33333333-3333-3333-8333-333333333332'),
  ('44444444-4444-4444-8444-444444444443', '33333333-3333-3333-8333-333333333333')
on conflict do nothing;

insert into public.lesson_prerequisites (lesson_id, prerequisite_lesson_id)
values
  ('44444444-4444-4444-8444-444444444442', '44444444-4444-4444-8444-444444444441'),
  ('44444444-4444-4444-8444-444444444443', '44444444-4444-4444-8444-444444444442')
on conflict do nothing;
