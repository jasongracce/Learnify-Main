"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.learnify.academy";
const LOGIN_URL = `${APP_URL}/login`;

function TextRotate({
  texts,
  rotationInterval = 2600,
  fadeDuration = 400,
  className = "",
}: {
  texts: string[];
  rotationInterval?: number;
  fadeDuration?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [prevTexts, setPrevTexts] = useState(texts);
  if (prevTexts !== texts) {
    setPrevTexts(texts);
    setIndex(0);
    setVisible(true);
  }

  useEffect(() => {
    if (texts.length === 0) return;

    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % texts.length);
        setVisible(true);
      }, fadeDuration);
    }, rotationInterval);

    return () => window.clearInterval(id);
  }, [texts, rotationInterval, fadeDuration]);

  return (
    <span
      className={`${className} ${visible ? "opacity-100" : "opacity-0"}`}
      style={{
        transitionProperty: "opacity",
        transitionDuration: `${fadeDuration}ms`,
        transitionTimingFunction: "ease-in-out",
      }}
    >
      {texts[index] ?? ""}
    </span>
  );
}

export default function Hero() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center text-center">
      {/* Pill badge */}
      <span className="animate-fade-in-up mb-6 inline-flex rounded-full border border-black/8 bg-white px-4 py-1.5 text-xs font-medium tracking-wide text-[#6b6b6b]">
        {t.hero.badge}
      </span>

      {/* Headline */}
      <h1 className="animate-fade-in-up animation-delay-100 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-[#1a1a1a] sm:text-5xl lg:text-6xl">
        {t.hero.headlinePrefix}{" "}
        <br />
        <span className="inline-block align-baseline text-black">
          <TextRotate
            texts={t.hero.rotating}
            rotationInterval={2600}
            className="inline-block leading-[1.1] pb-2"
          />
        </span>
      </h1>

      {/* Supporting text */}
      <p className="animate-fade-in-up animation-delay-200 mt-6 max-w-md text-base leading-relaxed text-[#888] sm:text-lg">
        {t.hero.description}
      </p>

      {/* CTA Buttons */}
      <div className="animate-fade-in-up animation-delay-300 mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <a
          href={LOGIN_URL}
          className="inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-7 py-3 text-sm font-medium text-white transition-all hover:scale-[1.03] hover:shadow-lg"
        >
          {t.hero.answerSurvey}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="ml-0.5"
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <a
          href="#features"
          className="inline-flex items-center rounded-full border border-[#d4d4d4] bg-white px-7 py-3 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#1a1a1a] hover:shadow-sm"
        >
          {t.hero.seeFeatures}
        </a>
      </div>

      {/* Beta badge */}
      <span className="animate-fade-in-up animation-delay-400 mt-6 text-xs font-medium tracking-wide text-[#bbb] italic">
        {t.hero.beta}
      </span>
    </div>
  );
}
