update public.courses
set
  title_th = 'พื้นฐานฟิสิกส์',
  description_th = 'โมดูลแบบเห็นภาพเกี่ยวกับการเคลื่อนที่ แรงโน้มถ่วง และแรง สำหรับ private beta'
where slug = 'physics-foundations';

update public.modules
set
  title_th = 'การเคลื่อนที่ แรงโน้มถ่วง และแรง',
  description_th = 'เรียนรู้ว่าทำไมวัตถุจึงตก โพรเจกไทล์เคลื่อนที่อย่างไร และแรงเปลี่ยนการเคลื่อนที่ได้อย่างไร'
where slug = 'motion-gravity-forces';

update public.skills
set
  title_th = 'ความเร่งจากแรงโน้มถ่วง',
  description_th = 'เข้าใจว่าแรงโน้มถ่วงที่มากขึ้นเปลี่ยนความเร่งของวัตถุที่ตกอย่างไร'
where slug = 'gravitational-acceleration';

update public.skills
set
  title_th = 'องค์ประกอบของการเคลื่อนที่แบบโพรเจกไทล์',
  description_th = 'แยกการเคลื่อนที่แนวนอนและแนวดิ่งเมื่อศึกษาโพรเจกไทล์'
where slug = 'projectile-components';

update public.skills
set
  title_th = 'แรงลัพธ์และการเคลื่อนที่',
  description_th = 'เชื่อมโยงแรงที่ไม่สมดุลกับการเปลี่ยนแปลงการเคลื่อนที่ของวัตถุ'
where slug = 'net-force';

update public.lessons
set
  title_th = 'แรงโน้มถ่วงและวัตถุที่ตก',
  summary_th = 'ใช้แถบเลื่อนแรงโน้มถ่วงเพื่อดูว่าความเร่งของการตกเปลี่ยนไปอย่างไร'
where slug = 'gravity-and-falling-objects';

update public.lessons
set
  title_th = 'การเคลื่อนที่แบบโพรเจกไทล์',
  summary_th = 'แยกการเคลื่อนที่แนวนอนออกจากแนวดิ่งเพื่อเข้าใจเส้นทางโค้ง'
where slug = 'projectile-motion';

update public.lessons
set
  title_th = 'แรงและการเคลื่อนที่',
  summary_th = 'เชื่อมโยงลูกศรแรงกับความเร่งและการเปลี่ยนแปลงการเคลื่อนที่'
where slug = 'forces-and-motion';

update public.lesson_blocks
set content_json = jsonb_build_object(
  'content_en',
  'Gravity is a force that pulls objects toward each other. Near Earth, it pulls objects downward and makes falling objects accelerate.',
  'content_th',
  'แรงโน้มถ่วงคือแรงที่ดึงวัตถุเข้าหากัน ใกล้โลก แรงนี้ดึงวัตถุลงด้านล่างและทำให้วัตถุที่ตกมีความเร่ง'
)
where slug = 'gravity-intro';

update public.lesson_blocks
set content_json = jsonb_build_object(
  'visual_type',
  'falling-object-diagram',
  'title_en',
  'A falling object speeds up as gravity pulls downward.',
  'title_th',
  'วัตถุที่ตกจะเร็วขึ้นเมื่อแรงโน้มถ่วงดึงลงด้านล่าง'
)
where slug = 'gravity-visual';

update public.lesson_blocks
set content_json = jsonb_build_object(
  'content_en',
  'A projectile moves forward while gravity pulls it downward. These two motions combine into a curved path.',
  'content_th',
  'โพรเจกไทล์เคลื่อนที่ไปข้างหน้า ขณะที่แรงโน้มถ่วงดึงลงด้านล่าง การเคลื่อนที่สองส่วนนี้รวมกันเป็นเส้นทางโค้ง'
)
where slug = 'projectile-intro';

update public.lesson_blocks
set content_json = jsonb_build_object(
  'content_en',
  'Forces can change how an object moves. When forces do not balance, the object accelerates in the direction of the net force.',
  'content_th',
  'แรงสามารถเปลี่ยนการเคลื่อนที่ของวัตถุได้ เมื่อแรงไม่สมดุล วัตถุจะมีความเร่งไปในทิศทางของแรงลัพธ์'
)
where slug = 'force-intro';

update public.lesson_blocks
set content_json = jsonb_build_object(
  'visual_type',
  'force-diagram',
  'title_en',
  'Unbalanced force changes motion.',
  'title_th',
  'แรงที่ไม่สมดุลเปลี่ยนการเคลื่อนที่'
)
where slug = 'force-visual';

update public.questions
set
  question_th = 'ถ้าแรงโน้มถ่วงมากขึ้น ความเร่งของวัตถุที่ตกจะเป็นอย่างไร?',
  options_json = '[
    {"id":"a","label_en":"It decreases","label_th":"ลดลง"},
    {"id":"b","label_en":"It increases","label_th":"เพิ่มขึ้น"},
    {"id":"c","label_en":"It becomes zero","label_th":"กลายเป็นศูนย์"},
    {"id":"d","label_en":"It stays exactly the same everywhere","label_th":"เท่ากันทุกที่เสมอ"}
  ]'::jsonb,
  explanation_th = 'แรงโน้มถ่วงที่มากขึ้นหมายถึงความเร่งลงด้านล่างที่มากขึ้น วัตถุจึงเร็วขึ้นมากกว่าเดิมขณะที่ตก'
where slug = 'q-gravity-001';

update public.questions
set
  question_th = 'ในการเคลื่อนที่แบบโพรเจกไทล์อย่างง่าย แรงโน้มถ่วงส่งผลโดยตรงต่อทิศทางใด?',
  options_json = '[
    {"id":"a","label_en":"Horizontal only","label_th":"แนวนอนเท่านั้น"},
    {"id":"b","label_en":"Vertical only","label_th":"แนวดิ่งเท่านั้น"},
    {"id":"c","label_en":"Neither direction","label_th":"ไม่ใช่ทั้งสองทิศทาง"},
    {"id":"d","label_en":"Only after the object lands","label_th":"เฉพาะหลังจากวัตถุตกถึงพื้นแล้ว"}
  ]'::jsonb,
  explanation_th = 'แรงโน้มถ่วงดึงลงด้านล่าง จึงเปลี่ยนการเคลื่อนที่แนวดิ่งโดยตรง ขณะที่การเคลื่อนที่แนวนอนยังไปข้างหน้า'
where slug = 'q-projectile-001';

update public.questions
set
  question_th = 'โดยปกติจะเกิดอะไรขึ้นเมื่อมีแรงที่ไม่สมดุลกระทำต่อวัตถุ?',
  options_json = '[
    {"id":"a","label_en":"Its motion changes","label_th":"การเคลื่อนที่เปลี่ยนไป"},
    {"id":"b","label_en":"It must stop immediately","label_th":"ต้องหยุดทันที"},
    {"id":"c","label_en":"Its mass disappears","label_th":"มวลหายไป"},
    {"id":"d","label_en":"Gravity turns off","label_th":"แรงโน้มถ่วงหายไป"}
  ]'::jsonb,
  explanation_th = 'แรงที่ไม่สมดุลทำให้การเคลื่อนที่เปลี่ยนไป โดยทำให้วัตถุมีความเร่งในทิศทางของแรงลัพธ์'
where slug = 'q-force-001';
