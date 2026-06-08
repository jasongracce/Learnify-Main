"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Language = "en" | "th";

export type Translations = {
  nav: { about: string; features: string; pricing: string; survey: string };
  joinWaitlist: string;
  login: string;
  languageLabel: string;
  hero: {
    badge: string;
    headlinePrefix: string;
    rotating: string[];
    description: string;
    answerSurvey: string;
    seeFeatures: string;
    beta: string;
  };
  cards: {
    smartStudy: { label: string; title: string; description: string };
    multiSubject: { label: string; title: string; description: string };
    liveSupport: { label: string; title: string; description: string };
    studySystem: { label: string; title: string; description: string };
  };
  pillars: {
    active: string;
    localised: string;
    personalized: string;
    ai: string;
  };
  features: {
    active: {
      number: string;
      title: string;
      description: string;
    };
    localised: {
      number: string;
      title: string;
      description: string;
    };
    personalized: {
      number: string;
      title: string;
      description: string;
    };
    ai: {
      number: string;
      title: string;
      description: string;
    };
  };
  pricing: {
    title: string;
    subtitle: string;
    billingSuffix: string;
    tiers: {
      free: { badge: string; price: string; tagline: string };
      pro: { badge: string; price: string; tagline: string };
      ultra: { badge: string; price: string; tagline: string };
    };
    features: {
      activeLearning: string;
      unlimitedLearning: string;
      weeklyLumi: string;
      unlimitedLumi: string;
      noAds: string;
      personalizedPaths: string;
      everythingInPro: string;
      advancedAnalytics: string;
      earlyAccess: string;
    };
    cta: string;
  };
  survey: {
    eyebrow: string;
    headline: string;
    subtitle: string;
    cta: string;
  };
  surveyPage: {
    meta: { title: string; backToHome: string };
    progress: { stepLabel: string };
    nav: { back: string; next: string; submit: string; submitting: string };
    welcome: {
      greetingPrefix: string;
      greetingTitle: string;
      nameQuestion: string;
      namePlaceholder: string;
      getStarted: string;
      emailQuestion: string;
      emailPlaceholder: string;
      emailContinue: string;
      emailInvalid: string;
      thanksLine1: string;
      thanksLine2: string;
      letsGetStarted: string;
    };
    step1: {
      eyebrow: string;
      headline: string;
      q1: { label: string; placeholder: string };
      q2: {
        label: string;
        options: {
          daily: string;
          severalTimesWeek: string;
          weekly: string;
          rarely: string;
          never: string;
        };
      };
      q3: {
        label: string;
        options: {
          homework: string;
          examPrep: string;
          newTopics: string;
          language: string;
          curiosity: string;
          other: string;
        };
        otherPlaceholder: string;
      };
    };
    step2: {
      eyebrow: string;
      headline: string;
      q4: {
        label: string;
        options: {
          curriculum: string;
          ads: string;
          expensive: string;
          lowQuality: string;
          boring: string;
          noPersonalization: string;
          hardInThai: string;
          other: string;
        };
        otherPlaceholder: string;
      };
      q5: { label: string; minLabel: string; maxLabel: string };
      q6: { label: string; placeholder: string };
    };
    step3: {
      eyebrow: string;
      headline: string;
      blurb: string;
      q7: { label: string; minLabel: string; maxLabel: string };
      q8: {
        label: string;
        options: {
          lumi: string;
          activeLearning: string;
          thaiCurriculum: string;
          personalized: string;
          stats: string;
          none: string;
          other: string;
        };
        otherPlaceholder: string;
      };
      q9: {
        label: string;
        options: {
          price: string;
          parents: string;
          alreadyHave: string;
          dontTrustAi: string;
          noDevice: string;
          nothing: string;
          other: string;
        };
        otherPlaceholder: string;
      };
      q10: { label: string; placeholder: string };
    };
    thankYou: {
      heading: string;
      body: string;
      backToHome: string;
    };
    errors: {
      submitFailed: string;
      rateLimited: string;
    };
  };
};

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      about: "About",
      features: "Features",
      pricing: "Pricing",
      survey: "Survey",
    },
    joinWaitlist: "Join Waitlist",
    login: "Log in",
    languageLabel: "EN",
    hero: {
      badge: "Smarter study starts here",
      headlinePrefix: "Are you ready to",
      rotating: [
        "learn smarter?",
        "stay focused?",
        "ask better questions?",
        "study with clarity?",
      ],
      description:
        "Learnify helps students study with more focus, ask better questions, and build real understanding without the usual overwhelm.",
      answerSurvey: "Start now",
      seeFeatures: "See Features",
      beta: "Beta Test soon...",
    },
    cards: {
      smartStudy: {
        label: "SMART STUDY",
        title: "Learn in Flow",
        description: "Focused study sessions that keep momentum high.",
      },
      multiSubject: {
        label: "MULTI-SUBJECT",
        title: "Everything Together",
        description: "Notes, quizzes, and revision in one place.",
      },
      liveSupport: {
        label: "LIVE SUPPORT",
        title: "Instant Clarity",
        description: "Ask questions and get guided help instantly.",
      },
      studySystem: {
        label: "STUDY SYSTEM",
        title: "Smarter Progress",
        description: "Track weak spots and revise with structure.",
      },
    },
    pillars: {
      active: "Active Learning",
      localised: "Localised Curriculum",
      personalized: "Personalized Learning",
      ai: "AI Powered",
    },
    features: {
      active: {
        number: "01.",
        title: "Active Learning",
        description:
          "Learnify makes you a participant, not a spectator. Every lesson opens with a question — you answer first, then unpack the concept behind it. This retrieval-first approach strengthens memory and turns passive reading into real understanding.",
      },
      localised: {
        number: "02.",
        title: "Localised Curriculum",
        description:
          "Every subject is rebuilt for where you actually learn. Examples use local context, questions match your national curriculum, and explanations respect the way your teachers already frame the material. Learnify plans on launching in Thailand first.",
      },
      personalized: {
        number: "03.",
        title: "Personalized Learning",
        description:
          "Learnify adapts to the way you learn. It tracks where you get stuck, the time of day you focus best, and the pacing that actually works for your brain — then reshapes every session around it. No two students ever see the same path.",
      },
      ai: {
        number: "04.",
        title: "AI Powered with Lumi",
        description:
          "Meet Lumi — Learnify's Socratic study companion. Instead of handing you answers, Lumi guides you with the right questions, one step at a time, so you actually learn how to solve the next problem on your own.",
      },
    },
    pricing: {
      title: "Pricing plans",
      subtitle: "Choose the right plan for your needs.",
      billingSuffix: "THB/mo",
      tiers: {
        free: { badge: "Free", price: "0", tagline: "For getting started" },
        pro: { badge: "PRO", price: "149", tagline: "For serious learners" },
        ultra: { badge: "ULTRA", price: "249", tagline: "For going all out" },
      },
      features: {
        activeLearning: "Active Learning Lessons",
        unlimitedLearning: "Unlimited Learning",
        weeklyLumi: "150 Lumi Messages a week",
        unlimitedLumi: "Unlimited Lumi Messages",
        noAds: "No ads",
        personalizedPaths: "Personalized Learning Paths",
        everythingInPro: "Everything in Pro",
        advancedAnalytics: "Advanced Analytics",
        earlyAccess: "Early access to new features",
      },
      cta: "Coming Soon",
    },
    survey: {
      eyebrow: "BETA LAUNCHING SOON",
      headline: "Help shape Learnify's launch",
      subtitle:
        "Take our short survey and tell us what you need from a learning platform built for Thai students. Every answer helps us build the beta right.",
      cta: "Answer Survey",
    },
    surveyPage: {
      meta: {
        title: "Learnify Survey",
        backToHome: "← Back to home",
      },
      progress: { stepLabel: "Step {current} of {total}" },
      nav: {
        back: "← Back",
        next: "Next →",
        submit: "Submit",
        submitting: "Submitting…",
      },
      welcome: {
        greetingPrefix: "Welcome to the",
        greetingTitle: "Learnify Survey",
        nameQuestion: "What's your name?",
        namePlaceholder: "Your name",
        getStarted: "Get Started →",
        emailQuestion: "What's your email?",
        emailPlaceholder: "you@example.com",
        emailContinue: "Continue →",
        emailInvalid: "Please enter a valid email.",
        thanksLine1: "Hey {name}! Thanks for partaking in the",
        thanksLine2: "Learnify Survey!",
        letsGetStarted: "Let's get started!",
      },
      step1: {
        eyebrow: "CURRENT TOOLS",
        headline: "What do you use now?",
        q1: {
          label: "Which digital learning tools do you currently use?",
          placeholder: "e.g. Khan Academy, YouTube, QANDA…",
        },
        q2: {
          label: "How often do you use them?",
          options: {
            daily: "Daily",
            severalTimesWeek: "Several times a week",
            weekly: "Weekly",
            rarely: "Rarely",
            never: "Never",
          },
        },
        q3: {
          label: "What do you mainly use them for?",
          options: {
            homework: "School homework",
            examPrep: "Exam prep (O-NET / TGAT / TCAS)",
            newTopics: "Learning new topics",
            language: "Language learning",
            curiosity: "General curiosity",
            other: "Other",
          },
          otherPlaceholder: "Tell us more",
        },
      },
      step2: {
        eyebrow: "PAIN POINTS",
        headline: "What's missing?",
        q4: {
          label: "Biggest frustration with your current tools?",
          options: {
            curriculum: "Content doesn't match Thai curriculum",
            ads: "Too many ads",
            expensive: "Too expensive",
            lowQuality: "Low-quality content",
            boring: "Boring / not engaging",
            noPersonalization: "No personalization",
            hardInThai: "Hard to follow in Thai",
            other: "Other",
          },
          otherPlaceholder: "Tell us more",
        },
        q5: {
          label: "How well do they match the Thai curriculum?",
          minLabel: "Not at all",
          maxLabel: "Perfectly",
        },
        q6: {
          label: "What do you wish existed that doesn't?",
          placeholder: "Tell us anything you've been wanting",
        },
      },
      step3: {
        eyebrow: "LEARNIFY",
        headline: "What do you think?",
        blurb:
          "Learnify is a Thai-first learning platform built for high-school students — active lessons, Lumi (an AI tutor), and personalized paths that follow the Thai curriculum.",
        q7: {
          label: "How likely are you to try Learnify?",
          minLabel: "Not likely",
          maxLabel: "Definitely will try",
        },
        q8: {
          label: "Which feature excites you most?",
          options: {
            lumi: "AI tutor (Lumi)",
            activeLearning: "Active learning / quiz-based lessons",
            thaiCurriculum: "Thai curriculum focus",
            personalized: "Personalized learning paths",
            stats: "Progress stats",
            none: "None",
            other: "Other",
          },
          otherPlaceholder: "Tell us more",
        },
        q9: {
          label: "What would stop you from using it?",
          options: {
            price: "Price",
            parents: "Parents wouldn't pay",
            alreadyHave: "I already have something similar",
            dontTrustAi: "Don't trust AI for learning",
            noDevice: "Don't have reliable device/wifi",
            nothing: "Nothing",
            other: "Other",
          },
          otherPlaceholder: "Tell us more",
        },
        q10: {
          label: "Anything else we should know?",
          placeholder: "Open mic — say anything",
        },
      },
      thankYou: {
        heading: "Thanks, {name} — you're helping us build Learnify",
        body: "We'll email you when the beta opens.",
        backToHome: "← Back to home",
      },
      errors: {
        submitFailed: "Couldn't submit — please try again.",
        rateLimited:
          "Too many submissions from this network — please try again later.",
      },
    },
  },
  th: {
    nav: {
      about: "เกี่ยวกับ",
      features: "ฟีเจอร์",
      pricing: "ราคา",
      survey: "แบบสอบถาม",
    },
    joinWaitlist: "ลงชื่อรอทดลอง",
    login: "เข้าสู่ระบบ",
    languageLabel: "TH",
    hero: {
      badge: "เรียนให้ดีขึ้น เริ่มที่นี่",
      headlinePrefix: "พร้อมแล้วหรือยังที่จะ",
      rotating: [
        "เรียนอย่างมีประสิทธิภาพ?",
        "จดจ่อได้ดีขึ้น?",
        "ตั้งคำถามได้อย่างมีคุณภาพ?",
        "เข้าใจจริง ไม่ใช่แค่จำ?",
      ],
      description:
        "Learnify ช่วยทุกคนเรียนได้อย่างมีสมาธิ ถามคำถามได้อย่างมีคุณภาพ และเข้าใจอย่างแจ่มแจ้ง โดยไม่สับสนหลงทาง",
      answerSurvey: "เริ่มเลย",
      seeFeatures: "ดูฟีเจอร์",
      beta: "เวอร์ชั่นทดลองจะมาเร็วๆนี้",
    },
    cards: {
      smartStudy: {
        label: "เรียนให้ดีขึ้น",
        title: "เรียนอย่างลื่นไหล",
        description: "มีสมาธิเรียนได้อย่างไม่สะดุด",
      },
      multiSubject: {
        label: "มีหลายวิชา",
        title: "ทุกอย่างรวมอยู่ในที่เดียว",
        description: "โน้ต แบบทดสอบ และทบทวนได้ทั้งหมดที่นี่ ไม่ต้องเปลี่ยนแอป",
      },
      liveSupport: {
        label: "คอยช่วยเสมอ",
        title: "ไม่ปล่อยให้งง",
        description: "ถามปุ๊บ ช่วยปั๊บ พาหาคำตอบไปพร้อมกัน",
      },
      studySystem: {
        label: "เรียนเป็นระบบ",
        title: "ก้าวหน้าอย่างชาญฉลาด",
        description: "รู้จุดอ่อนตัวเองและทบทวนตามเค้าโครงที่เราออกแบบให้",
      },
    },
    pillars: {
      active: "การเรียนรู้เชิงรุก",
      localised: "หลักสูตรตามแต่ละประเทศ",
      personalized: "ออกแบบให้เข้ากับเฉพาะบุคคล",
      ai: "มี AI ขับเคลื่อน",
    },
    features: {
      active: {
        number: "01.",
        title: "การเรียนรู้เชิงรุก",
        description:
          "Learnify ให้คุณมีส่วนร่วมในการเรียน ไม่ใช่เพียงดูหน้าจอ เราเปิดด้วยคำถาม - ลองพยายามตอบดูก่อน, แล้วเราจะมาทำความเข้าใจกันว่าทำไมคุณถึงถูกหรือผิด วิธีการดึงความรู้ออกมาใช้ก่อนนี้ช่วยเสริมความจำและเปลี่ยนจากการรับข้อมูลเข้าไปตรงๆ สู้ความเข้าใจจริง",
      },
      localised: {
        number: "02.",
        title: "หลักสูตรตามแต่ละประเทศ",
        description:
          "ทุกวิชาถูกเรียงโครงสร้างขึ้นใหม่ให้เข้ากับบทเรียนที่คุณเรียนจริง ตัวอย่างต่างๆใช้บริบทใกล้ตัว คำถามตรงกับหลักสูตรของประเทศ และคำอธิบายตามวิธีที่คุณครูที่โรงเรียนสอน เราวางแผนเปิดตัวที่ประเทศไทยเป็นที่แรก",
      },
      personalized: {
        number: "03.",
        title: "ออกแบบการเรียนให้เข้ากับเฉพาะบุคคล",
        description:
          "Learnify จะปรับให้เข้ากับวิธีการเรียนของคุณ โดยติดตามจุดที่คุณติดขัด ช่วงเวลาที่คุณสามารถจดจ่อได้ดีที่สุด และจังหวะความเร็วที่เหมาะกับคุณจริงๆ แล้วเราจะปรับบทเรียนให้คอยช่วยหนุนคุณ เส้นทางของทุกคนจะแตกต่าง และเป็นของตัวเอง ไม่ได้คัดลอกจากใคร",
      },
      ai: {
        number: "04.",
        title: "มี Lumi AI คอยช่วยเสมอ",
        description:
          "พบกับ ลูมิ เพื่อนคู่คิดการเรียนแบบโสกราตีสของ Learnify (แนวคิดหรือวิธีการที่เน้น \"การตั้งคำถาม\") ลูมิอาจจะไม่บอกคำตอบทันที แต่อย่ากังวล เค้าจะนำทางคุณด้วยคำถามชวนคิดทีละขั้น เพื่อให้คุณเรียนรู้วิธีแก้โจทย์ต่อไปได้ด้วยตัวเอง",
      },
    },
    pricing: {
      title: "แผนราคา",
      subtitle: "เลือกแผนที่เหมาะกับคุณ",
      billingSuffix: "บาท/เดือน",
      tiers: {
        free: { badge: "ฟรี", price: "0", tagline: "สำหรับผู้เริ่มต้น" },
        pro: { badge: "โปร", price: "149", tagline: "ต้องการเรียนจริงจัง" },
        ultra: { badge: "อัลตร้า", price: "249", tagline: "ต้องการทุ่มสุดตัว" },
      },
      features: {
        activeLearning: "การเรียนรู้เชิงรุก",
        unlimitedLearning: "เรียนได้ไม่จำกัด",
        weeklyLumi: "แชทกับลูมิ 150 ข้อความ ต่อสัปดาห์",
        unlimitedLumi: "แชทกับลูมิไม่จำกัด",
        noAds: "ไม่มีโฆษณา",
        personalizedPaths: "ออกแบบเส้นทางการเรียนให้เข้ากับเฉพาะบุคคล",
        everythingInPro: "ได้ทุกอย่างในแผนโปร",
        advancedAnalytics: "วิเคราะห์ข้อมูลขั้นสูง",
        earlyAccess: "เข้าถึงฟีเจอร์ใหม่ก่อนใคร",
      },
      cta: "เร็วๆ นี้",
    },
    survey: {
      eyebrow: "เราจะเปิดตัวทดลองให้ใช้เร็วๆ นี้",
      headline: "ช่วยเราพัฒนา Learnify ให้ตรงใจคุณและพร้อมสำหรับการเปิดตัว",
      subtitle:
        "ตอบแบบสอบถามสั้นๆ แล้วบอกเราว่าคุณต้องการอะไรจากแพลตฟอร์มการเรียนที่สร้างมาเพื่อนักเรียนไทย ทุกคำตอบช่วยให้เราพัฒนาตัวทดลอง (เบต้า) แก้ปัญหาของคุณได้ตรงจุด",
      cta: "ตอบแบบสอบถาม",
    },
    surveyPage: {
      meta: {
        title: "แบบสอบถาม Learnify",
        backToHome: "← กลับหน้าแรก",
      },
      progress: { stepLabel: "ขั้นที่ {current} จาก {total}" },
      nav: {
        back: "← ย้อนกลับ",
        next: "ถัดไป →",
        submit: "ส่งคำตอบ",
        submitting: "กำลังส่ง…",
      },
      welcome: {
        greetingPrefix: "ยินดีต้อนรับสู่",
        greetingTitle: "แบบสอบถาม Learnify",
        nameQuestion: "คุณชื่ออะไร?",
        namePlaceholder: "ชื่อของคุณ",
        getStarted: "เริ่มต้น →",
        emailQuestion: "โปรดใส่อีเมลของคุณ",
        emailPlaceholder: "you@example.com",
        emailContinue: "ต่อไป →",
        emailInvalid: "กรุณากรอกอีเมลที่ถูกต้อง",
        thanksLine1: "สวัสดี {name}! ขอบคุณที่ร่วมทำ",
        thanksLine2: "Learnify Survey!",
        letsGetStarted: "เริ่มกันเลย!",
      },
      step1: {
        eyebrow: "เครื่องมือปัจจุบัน",
        headline: "ตอนนี้คุณใช้อะไรอยู่?",
        q1: {
          label: "คุณใช้เครื่องมือการเรียนรู้ดิจิทัลอะไรอยู่ในตอนนี้?",
          placeholder: "เช่น Khan Academy, YouTube, QANDA…",
        },
        q2: {
          label: "ใช้บ่อยแค่ไหน?",
          options: {
            daily: "ทุกวัน",
            severalTimesWeek: "หลายครั้งต่อสัปดาห์",
            weekly: "สัปดาห์ละครั้ง",
            rarely: "นานๆ ครั้ง",
            never: "ไม่ได้ใช้",
          },
        },
        q3: {
          label: "ส่วนใหญ่ใช้เพื่ออะไร?",
          options: {
            homework: "การบ้าน",
            examPrep: "เตรียมสอบ (O-NET / TGAT / TCAS)",
            newTopics: "เรียนเรื่องใหม่ๆ",
            language: "ภาษา",
            curiosity: "ความอยากรู้ทั่วไป",
            other: "อื่นๆ",
          },
          otherPlaceholder: "บอกเพิ่มเติม",
        },
      },
      step2: {
        eyebrow: "ปัญหาที่เจอ",
        headline: "ขาดอะไรไปบ้าง?",
        q4: {
          label: "อะไรที่คุณยังไม่พอใจที่สุดกับเครื่องมือหรือแอปที่ใช้อยู่?",
          options: {
            curriculum: "เนื้อหาไม่ตรงหลักสูตรไทย",
            ads: "โฆษณาเยอะเกินไป",
            expensive: "แพงเกินไป",
            lowQuality: "เนื้อหาคุณภาพต่ำ",
            boring: "น่าเบื่อ / ไม่น่าสนใจ",
            noPersonalization: "ไม่มีการปรับให้เข้ากับแต่ละบุคคล",
            hardInThai: "ยากที่จะเข้าใจเนื้อหาที่เป็นภาษาต่างประเทศ",
            other: "อื่นๆ",
          },
          otherPlaceholder: "บอกเพิ่มเติม",
        },
        q5: {
          label: "เครื่องมือปัจจุบันตรงกับหลักสูตรไทยดีแค่ไหน?",
          minLabel: "ไม่ตรงเลย",
          maxLabel: "ตรงเป๊ะ",
        },
        q6: {
          label: "อยากให้มีอะไรที่ตอนนี้ยังไม่มี?",
          placeholder: "บอกสิ่งที่คุณอยากได้",
        },
      },
      step3: {
        eyebrow: "LEARNIFY",
        headline: "คิดยังไงกับ Learnify?",
        blurb:
          "Learnify คือแพลตฟอร์มการเรียนรู้ที่สร้างเพื่อคนไทยโดยเฉพาะ — บทเรียนแบบเชิงรุก Lumi (AI ติวเตอร์) และเส้นทางการเรียนที่ปรับให้เหมาะกับแต่ละคนตามหลักสูตรไทย",
        q7: {
          label: "มีแนวโน้มจะลอง Learnify แค่ไหน?",
          minLabel: "ไม่น่าจะลอง",
          maxLabel: "ลองแน่ๆ",
        },
        q8: {
          label: "ฟีเจอร์ไหนที่จะทำให้คุณสนใจอยากใช้ที่สุด?",
          options: {
            lumi: "AI ติวเตอร์ (Lumi)",
            activeLearning: "Active Learning / บทเรียนแบบมีโจทย์",
            thaiCurriculum: "เน้นหลักสูตรไทย",
            personalized: "ออกแบบเส้นทางการเรียนเฉพาะบุคคล",
            stats: "ติดตามสถิติ",
            none: "ไม่มีเลย",
            other: "อื่นๆ",
          },
          otherPlaceholder: "บอกเพิ่มเติม",
        },
        q9: {
          label: "อะไรที่อาจทำให้คุณไม่ใช้ Learnify?",
          options: {
            price: "ราคา",
            parents: "ผู้ปกครองไม่ช่วยจ่าย",
            alreadyHave: "มีอะไรคล้ายๆ อยู่แล้ว",
            dontTrustAi: "ไม่ไว้ใจ AI ในการเรียน",
            noDevice: "ไม่มีอุปกรณ์หรืออินเทอร์เน็ตที่ดี",
            nothing: "ไม่มีเลย",
            other: "อื่นๆ",
          },
          otherPlaceholder: "บอกเพิ่มเติม",
        },
        q10: {
          label: "อยากบอกอะไรเราอีก?",
          placeholder: "บอกอะไรก็ได้เลย",
        },
      },
      thankYou: {
        heading: "ขอบคุณ {name} — คุณช่วยเราสร้าง Learnify",
        body: "เราจะส่งอีเมลให้ตอนเบต้าเปิด",
        backToHome: "← กลับหน้าแรก",
      },
      errors: {
        submitFailed: "ส่งไม่สำเร็จ — ลองอีกครั้ง",
        rateLimited:
          "มีการส่งแบบสอบถามจากเครือข่ายนี้บ่อยเกินไป กรุณาลองใหม่ภายหลัง",
      },
    },
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const LANGUAGE_STORAGE_KEY = "learnify-lang";

function detectInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "th") return saved;
  } catch {
    // localStorage may be unavailable (e.g. private mode); fall through to device detection
  }
  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);
  return candidates.some((l) => l.toLowerCase().startsWith("th")) ? "th" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const detected = detectInitialLanguage();
    // Post-mount detection is required to avoid SSR hydration mismatch —
    // the server cannot read navigator.language, so first render must be "en"
    // and we reconcile to the detected value once on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (detected !== "en") setLanguageState(detected);
    document.documentElement.lang = detected;
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
    document.documentElement.lang = lang;
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: translations[language] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
