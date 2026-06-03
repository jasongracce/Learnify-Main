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
    '77777777-7777-7777-8777-777777777774',
    'แหล่งข้อมูลฟิสิกส์ที่ตรวจสอบแล้ว: แรงโน้มถ่วงและวัตถุที่ตก',
    'Physics',
    'Grade 10-11',
    'th',
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
    '77777777-7777-7777-8777-777777777775',
    'แหล่งข้อมูลฟิสิกส์ที่ตรวจสอบแล้ว: การเคลื่อนที่แบบโพรเจกไทล์',
    'Physics',
    'Grade 10-11',
    'th',
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
    '77777777-7777-7777-8777-777777777776',
    'แหล่งข้อมูลฟิสิกส์ที่ตรวจสอบแล้ว: แรงและการเคลื่อนที่',
    'Physics',
    'Grade 10-11',
    'th',
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
    '88888888-8888-8888-8888-888888888807',
    '77777777-7777-7777-8777-777777777774',
    1,
    'แรงโน้มถ่วงคือแรงดึงดูดระหว่างวัตถุที่มีมวล ใกล้โลก แรงโน้มถ่วงดึงวัตถุลงด้านล่างและทำให้วัตถุที่ตกมีความเร่งลงด้านล่างเกือบคงที่ประมาณ 9.8 เมตรต่อวินาทียกกำลังสอง เมื่อแรงต้านอากาศมีน้อย',
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
    '88888888-8888-8888-8888-888888888808',
    '77777777-7777-7777-8777-777777777774',
    2,
    'สนามแรงโน้มถ่วงที่แรงขึ้นหมายถึงความเร่งลงด้านล่างที่มากขึ้น วัตถุไม่ใช่แค่เริ่มต้นที่ตำแหน่งต่ำลง แต่ความเร็วลงด้านล่างของวัตถุจะเปลี่ยนแปลงมากขึ้นในแต่ละวินาทีขณะที่ตก',
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
    '88888888-8888-8888-8888-888888888809',
    '77777777-7777-7777-8777-777777777775',
    1,
    'การเคลื่อนที่แบบโพรเจกไทล์เข้าใจได้โดยแยกการเคลื่อนที่แนวนอนและแนวดิ่งออกจากกัน วัตถุยังคงเคลื่อนที่แนวนอนต่อไป ขณะที่แรงโน้มถ่วงเปลี่ยนการเคลื่อนที่แนวดิ่งให้ลงด้านล่าง',
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
    '88888888-8888-8888-8888-888888888810',
    '77777777-7777-7777-8777-777777777775',
    2,
    'ในแบบจำลองอย่างง่ายที่ไม่มีแรงต้านอากาศ แรงโน้มถ่วงกระทำในแนวดิ่ง แรงโน้มถ่วงไม่ได้เปลี่ยนความเร็วแนวนอนโดยตรง การรวมกันของการเคลื่อนที่แนวนอนกับความเร่งแนวดิ่งจึงทำให้เกิดเส้นทางโค้ง',
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
    '88888888-8888-8888-8888-888888888811',
    '77777777-7777-7777-8777-777777777776',
    1,
    'แรงคือการผลักหรือดึง แรงลัพธ์คือผลรวมของแรงทั้งหมดที่กระทำต่อวัตถุหลังพิจารณาทิศทางของแรงแต่ละแรง',
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
    '88888888-8888-8888-8888-888888888812',
    '77777777-7777-7777-8777-777777777776',
    2,
    'เมื่อแรงต่าง ๆ สมดุลกัน แรงลัพธ์จะเป็นศูนย์และวัตถุจะไม่มีความเร่ง เมื่อแรงไม่สมดุล วัตถุจะมีความเร่งไปในทิศทางของแรงลัพธ์ การเคลื่อนที่จึงเปลี่ยนแปลง',
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
