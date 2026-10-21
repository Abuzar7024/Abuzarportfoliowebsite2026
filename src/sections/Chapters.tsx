import React, { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { yearsOfExperience } from "../data/experience";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

/**
 * Cinematic "chapter" scenes between sections: a full-screen sticky stage
 * whose giant type is driven by scroll position. Purely presentational: every
 * fact here is also stated in the regular sections, so the type is aria-hidden
 * apart from one readable sentence per chapter.
 */

/** Seeded scatter so letters land in the same "thrown" positions every visit. */
function scatter(i: number) {
  const r = (n: number) => {
    const x = Math.sin(i * 91.7 + n * 13.3) * 10000;
    return x - Math.floor(x);
  };
  return { x: (r(1) - 0.5) * 60, y: 120 + r(2) * 160, rot: (r(3) - 0.5) * 70 };
}

function TumbleLetter({ ch, i, progress }: { ch: string; i: number; progress: MotionValue<number> }) {
  const s = scatter(i);
  const start = 0.05 + i * 0.025;
  const end = start + 0.32;
  const x = useTransform(progress, [start, end], [`${s.x}%`, "0%"]);
  const y = useTransform(progress, [start, end], [`${s.y}%`, "0%"]);
  const rotate = useTransform(progress, [start, end], [s.rot, 0]);
  const opacity = useTransform(progress, [start, start + 0.12], [0, 1]);
  return (
    <motion.span className="inline-block will-change-transform" style={{ x, y, rotate, opacity }}>
      {ch === " " ? " " : ch}
    </motion.span>
  );
}

function Stage({ children, height = "220vh", label }: { children: (p: MotionValue<number>) => React.ReactNode; height?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <section ref={ref} className="relative" style={{ height }} aria-label={label}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">{children(scrollYProgress)}</div>
    </section>
  );
}

/** "HI, I'M ABUZAR." Letters tumble in from below and settle as you scroll. */
export function HelloChapter() {
  const reduced = usePrefersReducedMotion();
  const words = ["HI, I'M", "ABUZAR."];

  if (reduced) {
    return (
      <section className="flex min-h-[70svh] items-center justify-center" aria-label="Introduction">
        <p className="text-center font-brand text-[clamp(2.5rem,10vw,9rem)] leading-[1.05] text-ink">HI, I'M ABUZAR.</p>
      </section>
    );
  }

  return (
    <Stage label="Introduction">
      {(p) => <HelloStage progress={p} words={words} />}
    </Stage>
  );
}

function HelloStage({ progress, words }: { progress: MotionValue<number>; words: string[] }) {
  const sub = useTransform(progress, [0.55, 0.7], [0, 1]);
  const subY = useTransform(progress, [0.55, 0.7], [20, 0]);
  const exit = useTransform(progress, [0.88, 1], [1, 0]);
  // Letter index across both words, so the stagger runs continuously.
  const offsets = words.map((_, wi) => words.slice(0, wi).join("").length);
  return (
    <motion.div className="shell text-center" style={{ opacity: exit }}>
      <p className="sr-only">Hi, I'm Abuzar.</p>
      <div aria-hidden="true" className="font-brand text-[clamp(2.6rem,11vw,10rem)] leading-[1.02] tracking-[-0.01em]">
        {words.map((w, wi) => (
          <span key={w} className={`block ${wi === 1 ? "text-chrome" : "text-ink"}`}>
            {[...w].map((ch, ci) => (
              <TumbleLetter key={ci} ch={ch} i={offsets[wi] + ci} progress={progress} />
            ))}
          </span>
        ))}
      </div>
      <motion.p
        className="mx-auto mt-8 max-w-xl font-mono text-[12px] uppercase tracking-[0.22em] text-silver sm:text-[13px]"
        style={{ opacity: sub, y: subY }}
      >
        <span className="text-accent-ink">//</span> Flutter developer · apps people open every day
      </motion.p>
    </motion.div>
  );
}

/** "2+ YEARS." The number scales up from the dark with a signal-red underline. */
export function YearsChapter() {
  const reduced = usePrefersReducedMotion();
  const years = `${yearsOfExperience()}+`;

  if (reduced) {
    return (
      <section className="flex min-h-[70svh] flex-col items-center justify-center text-center" aria-label="Experience">
        <p className="font-brand text-[clamp(3rem,14vw,12rem)] leading-none text-ink">{years} YEARS.</p>
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.22em] text-silver">Still curious. Still shipping.</p>
      </section>
    );
  }

  return <Stage label="Experience" height="200vh">{(p) => <YearsStage progress={p} years={years} />}</Stage>;
}

function YearsStage({ progress, years }: { progress: MotionValue<number>; years: string }) {
  const scale = useTransform(progress, [0, 0.45], [0.55, 1]);
  const blur = useTransform(progress, [0, 0.35], ["blur(14px)", "blur(0px)"]);
  const opacity = useTransform(progress, [0, 0.25, 0.85, 1], [0, 1, 1, 0]);
  const line = useTransform(progress, [0.35, 0.6], [0, 1]);
  const sub = useTransform(progress, [0.5, 0.65], [0, 1]);
  const ghostX = useTransform(progress, [0, 1], ["10%", "-30%"]);

  return (
    <div className="relative w-full text-center">
      {/* A huge outline word drifting behind, like a title card. */}
      <motion.p
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 -rotate-[6deg] whitespace-nowrap font-brand text-[clamp(6rem,24vw,22rem)] leading-none text-transparent"
        style={{ x: ghostX, WebkitTextStroke: "1px rgba(201,207,216,0.08)" }}
      >
        SHIPPING SHIPPING
      </motion.p>
      <motion.div className="relative" style={{ opacity }}>
        <motion.p className="font-brand text-[clamp(3.2rem,15vw,13rem)] leading-none text-ink" style={{ scale, filter: blur }}>
          {years} <span className="text-chrome">YEARS</span>
          <span className="text-accent">.</span>
        </motion.p>
        <motion.span
          aria-hidden="true"
          className="mx-auto mt-6 block h-[3px] w-[min(60vw,34rem)] origin-left rounded-full bg-accent shadow-[0_0_24px_rgba(227,38,46,0.7)]"
          style={{ scaleX: line }}
        />
        <motion.p className="mt-7 font-mono text-[12px] uppercase tracking-[0.24em] text-silver sm:text-sm" style={{ opacity: sub }}>
          Still curious. Still shipping.
        </motion.p>
      </motion.div>
    </div>
  );
}
