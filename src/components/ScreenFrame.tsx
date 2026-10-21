import React, { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { scrollToSection } from "../lib/scroll";

const STOPS = [
  { id: "top", label: "Hello" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

/** Where each section starts, as a fraction of the total scroll distance. */
function useStopPositions() {
  const [pos, setPos] = useState<number[]>(() => STOPS.map((_, i) => i / (STOPS.length - 1)));
  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      setPos(
        STOPS.map(({ id }) => {
          const el = document.getElementById(id);
          if (!el) return 0;
          return Math.min(1, Math.max(0, (el.getBoundingClientRect().top + window.scrollY) / max));
        })
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return pos;
}

/**
 * The page sits inside a rounded "screen" bezel, with a ruler along the bottom
 * edge: one tick every few pixels, the sections labelled where they begin,
 * and a signal-red needle tracking scroll progress.
 */
export function ScreenFrame() {
  const { scrollYProgress } = useScroll();
  const left = useTransform(scrollYProgress, (v) => `${v * 100}%`);
  const pos = useStopPositions();
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let i = 0;
    pos.forEach((p, k) => {
      if (v >= p - 0.01) i = k;
    });
    setActive(i);
  });

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[58]">
        <div
          className="absolute rounded-[18px] border border-line sm:rounded-[22px]"
          style={{ inset: "var(--frame)", boxShadow: "0 0 0 100vmax #0b0c0e" }}
        />
      </div>

      <nav
        aria-label="Page timeline"
        className="fixed z-[59] hidden sm:block"
        style={{ left: "calc(var(--frame) + 2rem)", right: "calc(var(--frame) + 2rem)", bottom: "calc(var(--frame) + 0.75rem)" }}
      >
        <ol className="relative h-5">
          {STOPS.map((s, i) => (
            <li key={s.id} className="absolute bottom-0 -translate-x-1/2" style={{ left: `${pos[i] * 100}%` }}>
              <button
                type="button"
                onClick={() => scrollToSection(s.id)}
                aria-current={active === i ? "step" : undefined}
                className={`font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  active === i ? "text-ink" : "text-faint hover:text-ink-2"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ol>
        <div className="relative mt-1.5 h-2">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, rgba(200,210,225,0.28) 0 1px, transparent 1px 9px)",
              maskImage: "linear-gradient(to bottom, black 55%, transparent 55%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 55%)",
            }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute -top-1.5 bottom-0 w-px bg-accent shadow-[0_0_10px_rgba(227,38,46,0.9)]"
            style={{ left }}
          />
        </div>
      </nav>
    </>
  );
}
