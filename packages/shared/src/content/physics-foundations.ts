import type {
  LearnifyCourse,
  LearnifyQuestion,
  LearnifySkill,
} from "../index"

export const physicsSkills: LearnifySkill[] = [
  {
    id: "skill-gravitational-acceleration",
    slug: "gravitational-acceleration",
    subject: "Physics",
    title_en: "Gravitational acceleration",
    title_th: "ความเร่งจากแรงโน้มถ่วง",
    description_en:
      "Understand how stronger gravity changes the acceleration of falling objects.",
    description_th:
      "เข้าใจว่าแรงโน้มถ่วงที่มากขึ้นทำให้ความเร่งของวัตถุที่ตกเปลี่ยนไปอย่างไร",
  },
  {
    id: "skill-projectile-components",
    slug: "projectile-components",
    subject: "Physics",
    title_en: "Projectile motion components",
    title_th: "องค์ประกอบของการเคลื่อนที่แบบโพรเจกไทล์",
    description_en:
      "Separate horizontal and vertical motion when studying projectiles.",
    description_th:
      "แยกการเคลื่อนที่แนวนอนและแนวตั้งเมื่อวิเคราะห์โพรเจกไทล์",
  },
  {
    id: "skill-net-force",
    slug: "net-force",
    subject: "Physics",
    title_en: "Net force and motion",
    title_th: "แรงลัพธ์และการเคลื่อนที่",
    description_en:
      "Connect unbalanced forces with changes in an object's motion.",
    description_th:
      "เชื่อมโยงแรงที่ไม่สมดุลกับการเปลี่ยนแปลงการเคลื่อนที่ของวัตถุ",
  },
]

export const physicsQuestions: LearnifyQuestion[] = [
  {
    id: "q-gravity-001",
    slug: "gravity-increases-acceleration",
    lesson_slug: "gravity-and-falling-objects",
    skill_id: "skill-gravitational-acceleration",
    question_en:
      "If gravity becomes stronger, what happens to a falling object's acceleration?",
    question_th:
      "ถ้าแรงโน้มถ่วงมากขึ้น ความเร่งของวัตถุที่กำลังตกจะเป็นอย่างไร",
    options: [
      { id: "a", label_en: "It decreases", label_th: "ลดลง" },
      { id: "b", label_en: "It increases", label_th: "เพิ่มขึ้น" },
      { id: "c", label_en: "It becomes zero", label_th: "กลายเป็นศูนย์" },
      {
        id: "d",
        label_en: "It stays exactly the same everywhere",
        label_th: "เท่าเดิมทุกที่เสมอ",
      },
    ],
    correct_option_id: "b",
    explanation_en:
      "Stronger gravity means a larger downward acceleration, so the object speeds up faster as it falls.",
    explanation_th:
      "แรงโน้มถ่วงที่มากขึ้นทำให้ความเร่งลงด้านล่างมากขึ้น วัตถุจึงเร็วขึ้นไวกว่าเดิมขณะตก",
    difficulty: "easy",
  },
  {
    id: "q-projectile-001",
    slug: "projectile-vertical-acceleration",
    lesson_slug: "projectile-motion",
    skill_id: "skill-projectile-components",
    question_en:
      "In simple projectile motion, which direction does gravity affect directly?",
    question_th:
      "ในการเคลื่อนที่แบบโพรเจกไทล์อย่างง่าย แรงโน้มถ่วงส่งผลโดยตรงในทิศใด",
    options: [
      { id: "a", label_en: "Horizontal only", label_th: "แนวนอนเท่านั้น" },
      { id: "b", label_en: "Vertical only", label_th: "แนวตั้งเท่านั้น" },
      { id: "c", label_en: "Neither direction", label_th: "ไม่ส่งผลทั้งสองทิศ" },
      { id: "d", label_en: "Only after the object lands", label_th: "หลังวัตถุตกถึงพื้นเท่านั้น" },
    ],
    correct_option_id: "b",
    explanation_en:
      "Gravity pulls downward, so it directly changes the vertical motion while horizontal motion continues forward.",
    explanation_th:
      "แรงโน้มถ่วงดึงลงด้านล่าง จึงเปลี่ยนการเคลื่อนที่แนวตั้งโดยตรง ส่วนแนวนอนยังเคลื่อนที่ต่อไป",
    difficulty: "easy",
  },
  {
    id: "q-force-001",
    slug: "unbalanced-force-motion",
    lesson_slug: "forces-and-motion",
    skill_id: "skill-net-force",
    question_en:
      "What usually happens when an object has an unbalanced force acting on it?",
    question_th:
      "โดยทั่วไปจะเกิดอะไรขึ้นเมื่อมีแรงไม่สมดุลกระทำต่อวัตถุ",
    options: [
      { id: "a", label_en: "Its motion changes", label_th: "การเคลื่อนที่เปลี่ยนไป" },
      { id: "b", label_en: "It must stop immediately", label_th: "ต้องหยุดทันที" },
      { id: "c", label_en: "Its mass disappears", label_th: "มวลหายไป" },
      { id: "d", label_en: "Gravity turns off", label_th: "แรงโน้มถ่วงหายไป" },
    ],
    correct_option_id: "a",
    explanation_en:
      "An unbalanced force changes motion by causing acceleration in the direction of the net force.",
    explanation_th:
      "แรงไม่สมดุลทำให้การเคลื่อนที่เปลี่ยน เพราะเกิดความเร่งในทิศของแรงลัพธ์",
    difficulty: "easy",
  },
]

export const physicsFoundationsCourse: LearnifyCourse = {
  id: "course-physics-foundations",
  slug: "physics-foundations",
  title_en: "Physics Foundations",
  title_th: "พื้นฐานฟิสิกส์",
  subject: "Physics",
  grade_level: "Grade 10-11",
  description_en:
    "A visual first module about motion, gravity, and forces for the private beta.",
  description_th:
    "โมดูลเริ่มต้นแบบเห็นภาพเกี่ยวกับการเคลื่อนที่ แรงโน้มถ่วง และแรง สำหรับ private beta",
  status: "published",
  modules: [
    {
      id: "module-motion-gravity-forces",
      slug: "motion-gravity-forces",
      course_slug: "physics-foundations",
      title_en: "Motion, Gravity, and Forces",
      title_th: "การเคลื่อนที่ แรงโน้มถ่วง และแรง",
      description_en:
        "Learn why objects fall, how projectiles move, and how forces change motion.",
      description_th:
        "เรียนรู้ว่าทำไมวัตถุจึงตก โพรเจกไทล์เคลื่อนที่อย่างไร และแรงเปลี่ยนการเคลื่อนที่อย่างไร",
      order_index: 1,
      lessons: [
        {
          id: "lesson-gravity-and-falling-objects",
          slug: "gravity-and-falling-objects",
          module_slug: "motion-gravity-forces",
          title_en: "Gravity and Falling Objects",
          title_th: "แรงโน้มถ่วงและวัตถุที่ตก",
          summary_en:
            "Use a gravity slider to see how falling acceleration changes.",
          summary_th:
            "ใช้ตัวปรับแรงโน้มถ่วงเพื่อดูว่าความเร่งขณะตกเปลี่ยนไปอย่างไร",
          difficulty: "beginner",
          estimated_minutes: 8,
          status: "published",
          order_index: 1,
          skill_ids: ["skill-gravitational-acceleration"],
          prerequisite_lesson_slugs: [],
          blocks: [
            {
              id: "gravity-intro",
              type: "text",
              content_en:
                "Gravity is a force that pulls objects toward each other. Near Earth, it pulls objects downward and makes falling objects accelerate.",
              content_th:
                "แรงโน้มถ่วงคือแรงที่ดึงวัตถุเข้าหากัน ใกล้โลก แรงนี้ดึงวัตถุลงด้านล่างและทำให้วัตถุที่ตกมีความเร่ง",
            },
            {
              id: "gravity-visual",
              type: "visual",
              visual_type: "falling-object-diagram",
              title_en: "A falling object speeds up as gravity pulls downward.",
              title_th:
                "วัตถุที่ตกจะเร็วขึ้นเมื่อแรงโน้มถ่วงดึงลงด้านล่าง",
            },
            {
              id: "gravity-slider",
              type: "simulation",
              simulation_type: "gravity-slider",
              config: { minGravity: 2, maxGravity: 16, defaultGravity: 9.8 },
            },
            {
              id: "gravity-question",
              type: "multiple_choice",
              question_id: "q-gravity-001",
            },
            {
              id: "gravity-lumi-hint",
              type: "lumi_hint",
              hint_type: "conceptual_explanation",
            },
            {
              id: "gravity-next",
              type: "next_lesson",
              lesson_slug: "projectile-motion",
            },
          ],
        },
        {
          id: "lesson-projectile-motion",
          slug: "projectile-motion",
          module_slug: "motion-gravity-forces",
          title_en: "Projectile Motion",
          title_th: "การเคลื่อนที่แบบโพรเจกไทล์",
          summary_en:
            "Separate horizontal motion from vertical motion to understand curved paths.",
          summary_th:
            "แยกการเคลื่อนที่แนวนอนและแนวตั้งเพื่อเข้าใจเส้นทางโค้ง",
          difficulty: "beginner",
          estimated_minutes: 10,
          status: "published",
          order_index: 2,
          skill_ids: ["skill-projectile-components"],
          prerequisite_lesson_slugs: ["gravity-and-falling-objects"],
          blocks: [
            {
              id: "projectile-intro",
              type: "text",
              content_en:
                "A projectile moves forward while gravity pulls it downward. These two motions combine into a curved path.",
              content_th:
                "โพรเจกไทล์เคลื่อนที่ไปข้างหน้าในขณะที่แรงโน้มถ่วงดึงลงด้านล่าง การเคลื่อนที่สองส่วนนี้รวมกันเป็นเส้นทางโค้ง",
            },
            {
              id: "projectile-sim",
              type: "simulation",
              simulation_type: "projectile-motion",
            },
            {
              id: "projectile-question",
              type: "multiple_choice",
              question_id: "q-projectile-001",
            },
          ],
        },
        {
          id: "lesson-forces-and-motion",
          slug: "forces-and-motion",
          module_slug: "motion-gravity-forces",
          title_en: "Forces and Motion",
          title_th: "แรงและการเคลื่อนที่",
          summary_en:
            "Connect force arrows with acceleration and changes in motion.",
          summary_th:
            "เชื่อมโยงลูกศรแรงกับความเร่งและการเปลี่ยนแปลงการเคลื่อนที่",
          difficulty: "beginner",
          estimated_minutes: 10,
          status: "published",
          order_index: 3,
          skill_ids: ["skill-net-force"],
          prerequisite_lesson_slugs: ["projectile-motion"],
          blocks: [
            {
              id: "force-intro",
              type: "text",
              content_en:
                "Forces can change how an object moves. When forces do not balance, the object accelerates in the direction of the net force.",
              content_th:
                "แรงสามารถเปลี่ยนการเคลื่อนที่ของวัตถุได้ เมื่อแรงไม่สมดุล วัตถุจะมีความเร่งในทิศของแรงลัพธ์",
            },
            {
              id: "force-visual",
              type: "visual",
              visual_type: "force-diagram",
              title_en: "Unbalanced force changes motion.",
              title_th: "แรงไม่สมดุลเปลี่ยนการเคลื่อนที่",
            },
            {
              id: "force-question",
              type: "multiple_choice",
              question_id: "q-force-001",
            },
          ],
        },
      ],
    },
  ],
}

export const physicsContent = {
  course: physicsFoundationsCourse,
  skills: physicsSkills,
  questions: physicsQuestions,
}

export function getPhysicsLesson(lessonSlug: string) {
  return physicsFoundationsCourse.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.slug === lessonSlug)
}

export function getPhysicsQuestion(questionId: string) {
  return physicsQuestions.find((question) => question.id === questionId)
}
