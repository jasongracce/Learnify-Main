import type { Locale } from "@learnify/shared"

type Copy = {
  common: {
    confidence: {
      low: string
      medium: string
      high: string
    }
  }
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
    password: string
    haveAccount: string
    noAccount: string
    panelEyebrow: string
    panelTitle: string
    signupHeading: string
  }
  dashboard: {
    title: string
    body: string
    greeting: string
    continueLearning: string
    nextLesson: string
    weakSkill: string
    insight: string
    recentPractice: string
    labels: {
      courseProgress: string
      lessonsDone: string
      recentScore: string
      practiceStreak: string
      skillMastery: string
      minutes: string
      review: string
      practice: string
      streakUnit: (days: number) => string
      zeroProgress: string
      zeroScore: string
      zeroStreak: string
    }
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
    markRead: string
    markedRead: string
    saveError: string
    answerError: string
    gravity: string
    simulationHint: string
    lumiHint: string
  }
  lumi: {
    title: string
    subtitle: string
    body: string
    emptyTitle: string
    input: string
    send: string
    sending: string
    error: string
    next: string
    sources: string
    relatedLesson: string
    starterPrompts: string[]
  }
}

export const copy = {
  en: {
    common: {
      confidence: {
        low: "Needs review",
        medium: "Improving",
        high: "Strong",
      },
    },
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
      title: "Learnify.",
      intro:
        "A bilingual learning platform for Thai students, starting with interactive Physics lessons and Lumi-guided feedback.",
      primary: "Join the waitlist",
      secondary: "Open course",
      course: "Physics Foundations",
      lesson: "Gravity and Falling Objects",
      detail:
        "Interactive lessons, instant feedback on every question, and Lumi insights that show you exactly what to study next.",
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
      subtitle: "Join Learnify for smarter study",
      source:
        "Use this page as the destination for the Login button on learnify.academy.",
      waitlist: "Join the waitlist first",
      google: "Continue with Google",
      or: "or",
      submit: "Create account",
      submitLogin: "Log in",
      submitting: "Checking...",
      email: "Email",
      password: "Password",
      haveAccount: "Already have an account?",
      noAccount: "New to Learnify?",
      panelEyebrow: "Smarter study starts here",
      panelTitle: "Speed up your learning with Learnify",
      signupHeading: "Go Beyond",
    },
    dashboard: {
      title: "Dashboard",
      body: "Pick up where you left off and see what Lumi recommends next.",
      greeting: "Welcome back",
      continueLearning: "Continue learning",
      nextLesson: "Recommended next",
      weakSkill: "Skill to review",
      insight: "Lumi insight",
      recentPractice: "Recent practice",
      labels: {
        courseProgress: "Course progress",
        lessonsDone: "Lessons done",
        recentScore: "Recent score",
        practiceStreak: "Practice streak",
        skillMastery: "Skill mastery",
        minutes: "min",
        review: "Review",
        practice: "Practice",
        streakUnit: (days) => (days === 1 ? "day" : "days"),
        zeroProgress: "Start your first lesson to track progress.",
        zeroScore: "Answer your first question to see a score.",
        zeroStreak: "Start your streak today.",
      },
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
        "Interactive lessons with built-in questions, instant feedback, and Lumi by your side.",
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
      markRead: "Mark as read",
      markedRead: "Read",
      saveError: "Could not save progress.",
      answerError: "Could not save your answer.",
      gravity: "Gravity",
      simulationHint: "Interact with the simulation before continuing.",
      lumiHint:
        "If an answer feels confusing, focus on how gravity changes acceleration, not just speed at one moment.",
    },
    lumi: {
      title: "Lumi",
      subtitle: "Your study buddy",
      body: "Ask about the Physics module: gravity, projectile motion, or forces.",
      emptyTitle: "Hi, I'm Lumi",
      input: "Ask Lumi about Physics",
      send: "Send",
      sending: "Sending...",
      error: "Lumi could not respond. Try again.",
      next: "Next",
      sources: "Sources",
      relatedLesson: "Open related lesson",
      starterPrompts: [
        "Why does stronger gravity make things fall faster?",
        "How does net force change motion?",
        "Why does a projectile follow a curved path?",
      ],
    },
  },
  th: {
    common: {
      confidence: {
        low: "ควรทบทวน",
        medium: "กำลังพัฒนา",
        high: "แม่นยำ",
      },
    },
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
      title: "Learnify.",
      intro:
        "แพลตฟอร์มเรียนรู้สองภาษาไทยและอังกฤษ เริ่มจากบทเรียนฟิสิกส์แบบโต้ตอบพร้อมคำแนะนำจาก Lumi",
      primary: "เข้าร่วมรายชื่อรอ",
      secondary: "เปิดคอร์ส",
      course: "พื้นฐานฟิสิกส์",
      lesson: "แรงโน้มถ่วงและวัตถุที่ตก",
      detail:
        "บทเรียนแบบโต้ตอบ ผลตอบรับทันทีในทุกคำถาม และคำแนะนำจาก Lumi ว่าควรเรียนอะไรต่อ",
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
      subtitle: "เข้าร่วม Learnify เพื่อการเรียนที่ชาญฉลาด",
      source: "หน้านี้คือปลายทางของปุ่ม Login บน learnify.academy",
      waitlist: "เข้าร่วมรายชื่อรอก่อน",
      google: "ดำเนินการต่อด้วย Google",
      or: "หรือ",
      submit: "สร้างบัญชี",
      submitLogin: "เข้าสู่ระบบ",
      submitting: "กำลังตรวจสอบ...",
      email: "อีเมล",
      password: "รหัสผ่าน",
      haveAccount: "มีบัญชีอยู่แล้ว?",
      noAccount: "ยังไม่มีบัญชี?",
      panelEyebrow: "เริ่มเรียนให้ฉลาดขึ้นที่นี่",
      panelTitle: "เรียนรู้ได้เร็วขึ้นไปกับ Learnify",
      signupHeading: "ก้าวไปไกลกว่าเดิม",
    },
    dashboard: {
      title: "แดชบอร์ด",
      body: "เรียนต่อจากจุดที่ค้างไว้ และดูว่า Lumi แนะนำอะไรเป็นขั้นต่อไป",
      greeting: "ยินดีต้อนรับกลับ",
      continueLearning: "เรียนต่อ",
      nextLesson: "แนะนำถัดไป",
      weakSkill: "ทักษะที่ควรทบทวน",
      insight: "คำแนะนำจาก Lumi",
      recentPractice: "การฝึกล่าสุด",
      labels: {
        courseProgress: "ความคืบหน้าของคอร์ส",
        lessonsDone: "บทเรียนที่จบแล้ว",
        recentScore: "คะแนนล่าสุด",
        practiceStreak: "ฝึกต่อเนื่อง",
        skillMastery: "ความเข้าใจรายทักษะ",
        minutes: "นาที",
        review: "ทบทวน",
        practice: "ฝึกฝน",
        streakUnit: () => "วัน",
        zeroProgress: "เริ่มบทเรียนแรกเพื่อติดตามความคืบหน้า",
        zeroScore: "ตอบคำถามแรกเพื่อดูคะแนนของคุณ",
        zeroStreak: "เริ่มสถิติฝึกต่อเนื่องของคุณวันนี้",
      },
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
        "บทเรียนแบบโต้ตอบพร้อมคำถามในตัว ผลตอบรับทันที และ Lumi คอยช่วยข้างๆ คุณ",
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
      markRead: "อ่านจบแล้ว",
      markedRead: "อ่านแล้ว",
      saveError: "บันทึกความคืบหน้าไม่สำเร็จ",
      answerError: "บันทึกคำตอบไม่สำเร็จ",
      gravity: "แรงโน้มถ่วง",
      simulationHint: "ลองปรับการจำลองก่อนดำเนินการต่อ",
      lumiHint:
        "ถ้าคำตอบยังสับสน ให้ดูว่าแรงโน้มถ่วงเปลี่ยนความเร่งอย่างไร ไม่ใช่ดูแค่ความเร็วในช่วงเวลาเดียว",
    },
    lumi: {
      title: "Lumi",
      subtitle: "เพื่อนคู่คิดในการเรียนของคุณ",
      body: "ถามเกี่ยวกับฟิสิกส์: แรงโน้มถ่วง โพรเจกไทล์ หรือแรง",
      emptyTitle: "สวัสดี ฉันคือ Lumi",
      input: "ถาม Lumi เกี่ยวกับฟิสิกส์",
      send: "ส่ง",
      sending: "กำลังส่ง...",
      error: "Lumi ตอบไม่ได้ในตอนนี้ ลองอีกครั้ง",
      next: "ถัดไป",
      sources: "แหล่งอ้างอิง",
      relatedLesson: "เปิดบทเรียนที่เกี่ยวข้อง",
      starterPrompts: [
        "ทำไมแรงโน้มถ่วงที่มากขึ้นทำให้วัตถุตกเร็วขึ้น?",
        "แรงลัพธ์เปลี่ยนการเคลื่อนที่อย่างไร?",
        "ทำไมโพรเจกไทล์จึงเคลื่อนที่เป็นเส้นโค้ง?",
      ],
    },
  },
} satisfies Record<Locale, Copy>
