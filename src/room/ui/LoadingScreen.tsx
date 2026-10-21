import React from "react";
import { motion } from "motion/react";
import type { LoadStage } from "../RoomCanvas";

const STAGES: Record<LoadStage, { pct: number; label: string }> = {
  engine: { pct: 12, label: "Loading the 3D engine" },
  building: { pct: 48, label: "Building the room" },
  lighting: { pct: 82, label: "Switching on the city lights" },
  ready: { pct: 100, label: "Ready" },
};

/** Real stage-based progress: each step is reported by the scene as it happens. */
export function LoadingScreen({ stage }: { stage: LoadStage }) {
  const s = STAGES[stage];
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#101216] px-6"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      role="status"
      aria-live="polite"
    >
      <div className="relative grid h-24 w-24 place-items-center">
        <svg viewBox="0 0 96 96" className="absolute inset-0 animate-[spin_3s_linear_infinite] motion-reduce:animate-none" aria-hidden="true">
          <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(201,207,216,0.18)" strokeWidth="1.5" />
          <path d="M48 4a44 44 0 0 1 44 44" fill="none" stroke="#e3262e" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-chrome font-brand text-2xl">AK</span>
      </div>
      <p className="mt-8 font-brand text-sm tracking-[0.2em] text-ink">ABUZAR KHAN</p>
      <div className="mt-6 h-[3px] w-64 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div className="h-full rounded-full bg-accent shadow-[0_0_12px_rgba(227,38,46,0.8)]" animate={{ width: `${s.pct}%` }} transition={{ duration: 0.5 }} />
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        {s.label} · {s.pct}%
      </p>
    </motion.div>
  );
}
