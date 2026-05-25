insert into public.rag_documents (
  id,
  title,
  subject,
  grade_level,
  language,
  source_type,
  status,
  verified,
  metadata
)
values
  (
    '77777777-7777-7777-8777-777777777771',
    'Verified Physics RAG: Gravity and Falling Objects',
    'Physics',
    'Grade 10-11',
    'en',
    'learnify_verified_seed',
    'processed',
    true,
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "gravity-and-falling-objects",
      "content_owner": "learnify",
      "verification_status": "verified"
    }'::jsonb
  ),
  (
    '77777777-7777-7777-8777-777777777772',
    'Verified Physics RAG: Projectile Motion',
    'Physics',
    'Grade 10-11',
    'en',
    'learnify_verified_seed',
    'processed',
    true,
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "projectile-motion",
      "content_owner": "learnify",
      "verification_status": "verified"
    }'::jsonb
  ),
  (
    '77777777-7777-7777-8777-777777777773',
    'Verified Physics RAG: Forces and Motion',
    'Physics',
    'Grade 10-11',
    'en',
    'learnify_verified_seed',
    'processed',
    true,
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "forces-and-motion",
      "content_owner": "learnify",
      "verification_status": "verified"
    }'::jsonb
  )
on conflict (id) do update set
  title = excluded.title,
  subject = excluded.subject,
  grade_level = excluded.grade_level,
  language = excluded.language,
  source_type = excluded.source_type,
  status = excluded.status,
  verified = excluded.verified,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.rag_chunks (
  id,
  document_id,
  chunk_index,
  content,
  metadata,
  verified
)
values
  (
    '88888888-8888-8888-8888-888888888801',
    '77777777-7777-7777-8777-777777777771',
    1,
    'Gravity is an attractive force between objects with mass. Near Earth, gravity pulls objects downward and gives falling objects a nearly constant downward acceleration of about 9.8 meters per second squared when air resistance is small.',
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "gravity-and-falling-objects",
      "skill_slug": "gravitational-acceleration",
      "source_slug": "gravity-concept"
    }'::jsonb,
    true
  ),
  (
    '88888888-8888-8888-8888-888888888802',
    '77777777-7777-7777-8777-777777777771',
    2,
    'A stronger gravitational field means a larger downward acceleration. The object does not simply start lower; its downward velocity changes by a larger amount each second while it falls.',
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "gravity-and-falling-objects",
      "skill_slug": "gravitational-acceleration",
      "source_slug": "stronger-gravity"
    }'::jsonb,
    true
  ),
  (
    '88888888-8888-8888-8888-888888888803',
    '77777777-7777-7777-8777-777777777772',
    1,
    'Projectile motion can be understood by separating horizontal and vertical motion. The object keeps moving horizontally while gravity changes the vertical motion downward.',
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "projectile-motion",
      "skill_slug": "projectile-components",
      "source_slug": "projectile-components"
    }'::jsonb,
    true
  ),
  (
    '88888888-8888-8888-8888-888888888804',
    '77777777-7777-7777-8777-777777777772',
    2,
    'In the simple model without air resistance, gravity acts vertically. It does not directly change the horizontal velocity, so the combination of horizontal motion and vertical acceleration creates a curved path.',
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "projectile-motion",
      "skill_slug": "projectile-components",
      "source_slug": "projectile-gravity"
    }'::jsonb,
    true
  ),
  (
    '88888888-8888-8888-8888-888888888805',
    '77777777-7777-7777-8777-777777777773',
    1,
    'A force is a push or pull. The net force is the combined effect of all forces acting on an object after their directions are considered.',
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "forces-and-motion",
      "skill_slug": "net-force",
      "source_slug": "net-force"
    }'::jsonb,
    true
  ),
  (
    '88888888-8888-8888-8888-888888888806',
    '77777777-7777-7777-8777-777777777773',
    2,
    'When forces are balanced, the net force is zero and the object does not accelerate. When forces are unbalanced, the object accelerates in the direction of the net force, so its motion changes.',
    '{
      "course_slug": "physics-foundations",
      "module_slug": "motion-gravity-forces",
      "lesson_slug": "forces-and-motion",
      "skill_slug": "net-force",
      "source_slug": "balanced-unbalanced-forces"
    }'::jsonb,
    true
  )
on conflict (document_id, chunk_index) do update set
  id = excluded.id,
  content = excluded.content,
  metadata = excluded.metadata,
  verified = excluded.verified,
  updated_at = now();
