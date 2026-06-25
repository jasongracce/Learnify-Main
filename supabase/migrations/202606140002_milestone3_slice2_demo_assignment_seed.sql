-- =============================================================================
-- Milestone 3 Slice 2 demo assignment seed
-- =============================================================================

insert into public.classroom_assignments (
  id,
  school_id,
  classroom_id,
  created_by,
  title_en,
  title_th,
  description_en,
  description_th,
  assignment_type,
  status,
  total_points,
  due_at,
  published_at
)
select
  '10000000-0000-4000-8000-000000000601',
  c.school_id,
  c.id,
  null,
  'Gravity Checkpoint',
  'จุดตรวจเรื่องแรงโน้มถ่วง',
  'Complete the gravity lesson, answer two quick questions, and submit a short reflection.',
  'เรียนบทเรียนเรื่องแรงโน้มถ่วง ตอบคำถามสั้น ๆ สองข้อ และส่งการสะท้อนความเข้าใจ',
  'mixed',
  'published',
  4,
  now() + interval '7 days',
  now()
from public.classrooms c
where c.slug = 'physics-6a-2026-demo'
limit 1
on conflict (id) do update set
  title_en = excluded.title_en,
  title_th = excluded.title_th,
  description_en = excluded.description_en,
  description_th = excluded.description_th,
  assignment_type = excluded.assignment_type,
  status = excluded.status,
  total_points = excluded.total_points,
  due_at = excluded.due_at,
  published_at = excluded.published_at;

insert into public.assignment_items (
  id,
  assignment_id,
  item_type,
  order_index,
  title_en,
  title_th,
  instructions_en,
  instructions_th,
  lesson_id,
  points,
  required,
  settings
)
select
  '10000000-0000-4000-8000-000000000611',
  '10000000-0000-4000-8000-000000000601',
  'learnify_lesson',
  0,
  'Review: Gravity and Falling Objects',
  'ทบทวน: แรงโน้มถ่วงและวัตถุที่ตก',
  'Open the Learnify lesson and complete the interactive blocks.',
  'เปิดบทเรียน Learnify และทำบล็อกแบบโต้ตอบให้เสร็จ',
  l.id,
  0,
  true,
  '{"lesson_slug":"gravity-and-falling-objects"}'::jsonb
from public.lessons l
where l.slug = 'gravity-and-falling-objects'
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  title_en = excluded.title_en,
  title_th = excluded.title_th,
  instructions_en = excluded.instructions_en,
  instructions_th = excluded.instructions_th,
  settings = excluded.settings;

insert into public.assignment_items (
  id,
  assignment_id,
  item_type,
  order_index,
  title_en,
  title_th,
  instructions_en,
  instructions_th,
  lesson_id,
  points,
  required,
  settings
)
values
  (
    '10000000-0000-4000-8000-000000000612',
    '10000000-0000-4000-8000-000000000601',
    'quiz',
    1,
    'Gravity Quick Check',
    'เช็กความเข้าใจเรื่องแรงโน้มถ่วง',
    'Answer both questions. Each question is worth two points.',
    'ตอบคำถามทั้งสองข้อ ข้อละสองคะแนน',
    null,
    4,
    true,
    '{"max_attempts":2}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000613',
    '10000000-0000-4000-8000-000000000601',
    'manual_submission',
    2,
    'Reflection',
    'สะท้อนความเข้าใจ',
    'In two or three sentences, explain why gravity changes how fast an object falls.',
    'เขียนสองหรือสามประโยคเพื่ออธิบายว่าแรงโน้มถ่วงทำให้ความเร็วของวัตถุที่ตกเปลี่ยนไปอย่างไร',
    null,
    0,
    true,
    '{}'::jsonb
  )
on conflict (id) do update set
  title_en = excluded.title_en,
  title_th = excluded.title_th,
  instructions_en = excluded.instructions_en,
  instructions_th = excluded.instructions_th,
  points = excluded.points,
  required = excluded.required,
  settings = excluded.settings;

insert into public.assignment_quiz_questions (
  id,
  assignment_item_id,
  question_type,
  order_index,
  prompt_en,
  prompt_th,
  options_json,
  correct_answer,
  explanation_en,
  explanation_th,
  points,
  max_attempts
)
values
  (
    '10000000-0000-4000-8000-000000000621',
    '10000000-0000-4000-8000-000000000612',
    'multiple_choice',
    0,
    'If gravity becomes stronger, what happens to a falling object''s acceleration?',
    'ถ้าแรงโน้มถ่วงแรงขึ้น ความเร่งของวัตถุที่ตกจะเป็นอย่างไร',
    '[{"id":"a","label_en":"It decreases","label_th":"ลดลง"},{"id":"b","label_en":"It increases","label_th":"เพิ่มขึ้น"},{"id":"c","label_en":"It becomes zero","label_th":"กลายเป็นศูนย์"},{"id":"d","label_en":"It stays exactly the same everywhere","label_th":"เท่าเดิมทุกที่"}]'::jsonb,
    '{"option_id":"b"}'::jsonb,
    'Stronger gravity creates greater downward acceleration.',
    'แรงโน้มถ่วงที่แรงขึ้นทำให้เกิดความเร่งลงด้านล่างมากขึ้น',
    2,
    2
  ),
  (
    '10000000-0000-4000-8000-000000000622',
    '10000000-0000-4000-8000-000000000612',
    'true_false',
    1,
    'Two objects can fall with the same acceleration even if their masses are different, when air resistance is ignored.',
    'วัตถุสองชิ้นสามารถตกด้วยความเร่งเท่ากันได้แม้มวลต่างกัน ถ้าไม่คิดแรงต้านอากาศ',
    null,
    '{"value":true}'::jsonb,
    'Ignoring air resistance, gravitational acceleration does not depend on mass.',
    'เมื่อไม่คิดแรงต้านอากาศ ความเร่งจากแรงโน้มถ่วงไม่ขึ้นกับมวล',
    2,
    2
  )
on conflict (id) do update set
  prompt_en = excluded.prompt_en,
  prompt_th = excluded.prompt_th,
  options_json = excluded.options_json,
  correct_answer = excluded.correct_answer,
  explanation_en = excluded.explanation_en,
  explanation_th = excluded.explanation_th,
  points = excluded.points,
  max_attempts = excluded.max_attempts;
