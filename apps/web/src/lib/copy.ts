import type { Locale } from "@learnify/shared"

type Copy = {
  nav: {
    waitlist: string
    login: string
    signup: string
    dashboard: string
    courses: string
    lumi: string
    insights: string
    logout: string
    language: string
  }
  home: {
    title: string
    intro: string
    primary: string
    secondary: string
    course: string
    lesson: string
    detail: string
  }
  waitlist: {
    title: string
    body: string
    email: string
    name: string
    role: string
    gradeLevel: string
    interestReason: string
    submit: string
    saving: string
    successPending: string
    successApproved: string
    error: string
  }
  auth: {
    loginTitle: string
    signupTitle: string
    body: string
    subtitle: string
    source: string
    waitlist: string
    google: string
    or: string
    submit: string
    submitLogin: string
    submitting: string
    email: string
    haveAccount: string
    noAccount: string
  }
  dashboard: {
    title: string
    body: string
    continueLearning: string
    nextLesson: string
    weakSkill: string
    insight: string
    recentPractice: string
  }
  insights: {
    title: string
    body: string
    lumiInsight: string
    recommendedAction: string
    recentPractice: string
    recentPracticeBody: string
    noPractice: string
    skillToReview: string
  }
  courses: {
    title: string
    body: string
    module: string
    lessons: string
    start: string
  }
  lesson: {
    backToCourse: string
    minutes: string
    question: string
    checkAnswer: string
    correct: string
    retry: string
    lumi: string
    askLumi: string
    askLumiBody: string
    nextLesson: string
    blocksSaved: (completed: number, total: number) => string
    saved: string
    saving: string
    continue: string
    gravity: string
    simulationHint: string
    lumiHint: string
  }
  lumi: {
    title: string
    body: string
    input: string
    send: string
    sending: string
    error: string
    relatedLesson: string
    starterPrompts: string[]
  }
}

export const copy = {
  en: {
    nav: {
      waitlist: "Waitlist",
      login: "Log in",
      signup: "Sign up",
      dashboard: "Dashboard",
      courses: "Courses",
      lumi: "Lumi",
      insights: "Insights",
      logout: "Log out",
      language: "TH",
    },
    home: {
      title: "LEARNIFY",
      intro:
        "A bilingual learning platform for Thai students, starting with interactive Physics lessons and Lumi-guided feedback.",
      primary: "Join the waitlist",
      secondary: "Open course",
      course: "Physics Foundations",
      lesson: "Gravity and Falling Objects",
      detail:
        "Milestone 1 begins with a private beta gate, one course module, embedded questions, progress tracking, and rule-based Lumi insights.",
    },
    waitlist: {
      title: "Join the private beta waitlist",
      body:
        "Access is limited to students already approved through the Supabase waitlist gate.",
      email: "Email",
      name: "Name",
      role: "Role",
      gradeLevel: "Grade level",
      interestReason: "Why are you interested?",
      submit: "Join waitlist",
      saving: "Saving...",
      successPending:
        "You are on the waitlist. We will approve beta access from Supabase.",
      successApproved:
        "You are already approved for beta access. Use Login when auth is connected.",
      error: "Could not save your signup. Check the form and try again.",
    },
    auth: {
      loginTitle: "Log in",
      signupTitle: "Create account",
      body:
        "Use Google or your email to request beta access. Learnify checks the private beta list before opening the app.",
      subtitle: "Join the Learnify private beta. Smarter study, for free.",
      source:
        "Use this page as the destination for the Login button on learnify.academy.",
      waitlist: "Join the waitlist first",
      google: "Continue with Google",
      or: "or",
      submit: "Create account",
      submitLogin: "Log in",
      submitting: "Checking...",
      email: "Email",
      haveAccount: "Already have an account?",
      noAccount: "New to Learnify?",
    },
    dashboard: {
      title: "Student dashboard",
      body:
        "The first dashboard shows progress, weak skills, a next lesson, and Lumi insights from the Physics module.",
      continueLearning: "Continue learning",
      nextLesson: "Recommended next",
      weakSkill: "Skill to review",
      insight: "Lumi insight",
      recentPractice: "Recent practice",
    },
    insights: {
      title: "Insights",
      body:
        "Lumi turns recent answers and skill mastery into a focused next step.",
      lumiInsight: "Lumi insight",
      recommendedAction: "Recommended action",
      recentPractice: "Recent practice",
      recentPracticeBody: "Correct answers from your latest saved attempts.",
      noPractice: "Complete a lesson question to unlock recent practice.",
      skillToReview: "Skill to review",
    },
    courses: {
      title: "Courses",
      body:
        "The private beta starts with one published Physics course and a three-lesson module.",
      module: "Module",
      lessons: "Lessons",
      start: "Start lesson",
    },
    lesson: {
      backToCourse: "Back to course",
      minutes: "min",
      question: "Question",
      checkAnswer: "Check answer",
      correct: "Correct",
      retry: "Try again",
      lumi: "Lumi",
      askLumi: "Ask Lumi about this lesson",
      askLumiBody:
        "Ask a quick question and Lumi will keep the explanation tied to this lesson.",
      nextLesson: "Next lesson",
      blocksSaved: (completed, total) => `${completed}/${total} blocks saved`,
      saved: "Saved",
      saving: "Saving...",
      continue: "Continue",
      gravity: "Gravity",
      simulationHint: "Interact with the simulation before continuing.",
      lumiHint:
        "If an answer feels confusing, focus on how gravity changes acceleration, not just speed at one moment.",
    },
    lumi: {
      title: "Lumi",
      body: "Ask about the Physics module: gravity, projectile motion, or forces.",
      input: "Ask Lumi about Physics",
      send: "Send",
      sending: "Sending...",
      error: "Lumi could not respond. Try again.",
      relatedLesson: "Open related lesson",
      starterPrompts: [
        "Why does stronger gravity make things fall faster?",
        "How does net force change motion?",
        "Why does a projectile follow a curved path?",
      ],
    },
  },
  th: {
    nav: {
      waitlist: "รายชื่อรอ",
      login: "เข้าสู่ระบบ",
      signup: "สมัคร",
      dashboard: "แดชบอร์ด",
      courses: "คอร์ส",
      lumi: "Lumi",
      insights: "ข้อมูลเชิงลึก",
      logout: "ออกจากระบบ",
      language: "EN",
    },
    home: {
      title: "LEARNIFY",
      intro:
        "แพลตฟอร์มเรียนรู้สองภาษาไทยและอังกฤษ เริ่มจากบทเรียนฟิสิกส์แบบโต้ตอบพร้อมคำแนะนำจาก Lumi",
      primary: "เข้าร่วมรายชื่อรอ",
      secondary: "เปิดคอร์ส",
      course: "พื้นฐานฟิสิกส์",
      lesson: "แรงโน้มถ่วงและวัตถุที่ตก",
      detail:
        "Milestone 1 เริ่มจาก private beta gate หนึ่งโมดูลคอร์ส คำถามในบทเรียน การติดตามความก้าวหน้า และ Lumi insights แบบ rule-based",
    },
    waitlist: {
      title: "เข้าร่วมรายชื่อรอ private beta",
      body:
        "การเข้าใช้งานจำกัดเฉพาะผู้ที่ได้รับอนุมัติผ่านรายชื่อรอของ Supabase",
      email: "อีเมล",
      name: "ชื่อ",
      role: "บทบาท",
      gradeLevel: "ระดับชั้น",
      interestReason: "ทำไมคุณสนใจ Learnify?",
      submit: "เข้าร่วมรายชื่อรอ",
      saving: "กำลังบันทึก...",
      successPending:
        "คุณอยู่ในรายชื่อรอแล้ว เราจะอนุมัติ beta access จาก Supabase",
      successApproved:
        "คุณได้รับอนุมัติ beta access แล้ว ใช้หน้าเข้าสู่ระบบได้เมื่อ auth พร้อม",
      error: "บันทึกข้อมูลไม่สำเร็จ ตรวจแบบฟอร์มแล้วลองอีกครั้ง",
    },
    auth: {
      loginTitle: "เข้าสู่ระบบ",
      signupTitle: "สร้างบัญชี",
      body:
        "ใช้ Google หรืออีเมลเพื่อขอเข้า beta ระบบจะตรวจรายชื่อ beta ก่อนเปิดแอป",
      subtitle: "เข้าร่วม Learnify รุ่นเบต้า เรียนอย่างชาญฉลาด ฟรี",
      source: "หน้านี้คือปลายทางของปุ่ม Login บน learnify.academy",
      waitlist: "เข้าร่วมรายชื่อรอก่อน",
      google: "ดำเนินการต่อด้วย Google",
      or: "หรือ",
      submit: "สร้างบัญชี",
      submitLogin: "เข้าสู่ระบบ",
      submitting: "กำลังตรวจสอบ...",
      email: "อีเมล",
      haveAccount: "มีบัญชีอยู่แล้ว?",
      noAccount: "ยังไม่มีบัญชี?",
    },
    dashboard: {
      title: "แดชบอร์ดผู้เรียน",
      body:
        "แดชบอร์ดแรกจะแสดงความก้าวหน้า ทักษะที่อ่อน บทเรียนถัดไป และ Lumi insights จากโมดูลฟิสิกส์",
      continueLearning: "เรียนต่อ",
      nextLesson: "แนะนำถัดไป",
      weakSkill: "ทักษะที่ควรทบทวน",
      insight: "คำแนะนำจาก Lumi",
      recentPractice: "การฝึกล่าสุด",
    },
    insights: {
      title: "ข้อมูลเชิงลึก",
      body:
        "Lumi ใช้คำตอบล่าสุดและระดับความเข้าใจเพื่อแนะนำขั้นตอนถัดไป",
      lumiInsight: "คำแนะนำจาก Lumi",
      recommendedAction: "สิ่งที่ควรทำถัดไป",
      recentPractice: "การฝึกล่าสุด",
      recentPracticeBody: "คำตอบที่ถูกต้องจากความพยายามล่าสุดที่บันทึกไว้",
      noPractice: "ตอบคำถามในบทเรียนเพื่อดูการฝึกล่าสุด",
      skillToReview: "ทักษะที่ควรทบทวน",
    },
    courses: {
      title: "คอร์ส",
      body:
        "private beta เริ่มจากคอร์สฟิสิกส์หนึ่งคอร์สและโมดูลสามบทเรียน",
      module: "โมดูล",
      lessons: "บทเรียน",
      start: "เริ่มบทเรียน",
    },
    lesson: {
      backToCourse: "กลับไปที่คอร์ส",
      minutes: "นาที",
      question: "คำถาม",
      checkAnswer: "ตรวจคำตอบ",
      correct: "ถูกต้อง",
      retry: "ลองอีกครั้ง",
      lumi: "Lumi",
      askLumi: "ถาม Lumi เกี่ยวกับบทเรียนนี้",
      askLumiBody:
        "ถามคำถามสั้นๆ แล้ว Lumi จะอธิบายให้เชื่อมกับบทเรียนนี้",
      nextLesson: "บทเรียนถัดไป",
      blocksSaved: (completed, total) =>
        `บันทึกแล้ว ${completed}/${total} บล็อก`,
      saved: "บันทึกแล้ว",
      saving: "กำลังบันทึก...",
      continue: "ดำเนินการต่อ",
      gravity: "แรงโน้มถ่วง",
      simulationHint: "ลองปรับการจำลองก่อนดำเนินการต่อ",
      lumiHint:
        "ถ้าคำตอบยังสับสน ให้ดูว่าแรงโน้มถ่วงเปลี่ยนความเร่งอย่างไร ไม่ใช่ดูแค่ความเร็วในช่วงเวลาเดียว",
    },
    lumi: {
      title: "Lumi",
      body: "ถามเกี่ยวกับฟิสิกส์: แรงโน้มถ่วง โพรเจกไทล์ หรือแรง",
      input: "ถาม Lumi เกี่ยวกับฟิสิกส์",
      send: "ส่ง",
      sending: "กำลังส่ง...",
      error: "Lumi ตอบไม่ได้ในตอนนี้ ลองอีกครั้ง",
      relatedLesson: "เปิดบทเรียนที่เกี่ยวข้อง",
      starterPrompts: [
        "ทำไมแรงโน้มถ่วงที่มากขึ้นทำให้วัตถุตกเร็วขึ้น?",
        "แรงลัพธ์เปลี่ยนการเคลื่อนที่อย่างไร?",
        "ทำไมโพรเจกไทล์จึงเคลื่อนที่เป็นเส้นโค้ง?",
      ],
    },
  },
} satisfies Record<Locale, Copy>
