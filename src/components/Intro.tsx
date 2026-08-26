import React from "react";
import { motion, type MotionValue, useTransform } from "motion/react";
import { profile } from "../data/profile";

/**
 * Opening: darkness → a thin red light line → the object beneath is lit by a sweeping light → the site.
 * The object itself is rendered by the fixed scene layer, which then moves into the hero.
 */
export function Intro({ reveal, onSkip, reduced }: { reveal: MotionValue<number>; onSkip: () => void; reduced: boolean }) {
  const line = useTransform(reveal, [0, 0.3, 1], [0, 1, 1]);
  const lineOpacity = useTransform(reveal, [0, 0.15, 0.85, 1], [0, 1, 0.9, 0]);
  const pct = useTransform(reveal, (v) => String(Math.round(v * 100)).padStart(3, "0"));

  return (
    <motion.div
      className="fixed inset-0 z-[4] cursor-pointer"
      role="status"
      aria-live="polite"
      aria-label="Opening"
      onClick={onSkip}
      initial="show"
      animate="show"
      exit="exit"
      variants={{ show: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } } }}
    >
      <div className="absolute inset-0 bg-bg" />
      {/* the light line the object appears from */}
      <motion.div className="absolute left-1/2 top-1/2 h-[2px] w-[min(78vw,820px)] -translate-x-1/2 -translate-y-1/2 origin-center bg-accent" style={{ scaleX: line, opacity: lineOpacity, boxShadow: "0 0 24px rgba(255,43,61,0.9), 0 0 90px 10px rgba(255,43,61,0.35)" }} />
      <motion.div className="absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ opacity: useTransform(reveal, [0, 0.4, 1], [0, 0.6, 0.45]), background: "radial-gradient(circle, rgba(255,43,61,0.28), transparent 65%)", filter: "blur(28px)" }} />

      <motion.div className="pointer-events-none absolute inset-0 z-[7]" variants={{ show: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.2 } } }}>
        <div className="container-x flex items-center justify-between pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          <span>{profile.name}</span>
          <span className="hidden sm:inline">Portfolio · 2026</span>
        </div>
        <motion.div className="container-x absolute inset-x-0 bottom-8 flex items-end justify-between gap-6" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.6, duration: 0.8 }}>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{profile.name}</p>
            <p className="mt-1.5 text-sm text-muted">{profile.title} — Mobile &amp; Web · Product Builder</p>
          </div>
          <div className="text-right">
            <motion.p className="font-mono text-2xl text-ink sm:text-3xl">{pct}</motion.p>
            <p className="mt-1 hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:block">Click to skip</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
