import React from "react";
import { motion, useReducedMotion } from "motion/react";

export interface PreRegistrationProgressProps {
  confirmedCount: number | null;
  targetCount: number;
  loading: boolean;
  error: boolean;
}

export function PreRegistrationProgress({
  confirmedCount,
  targetCount = 5000,
  loading,
  error,
}: PreRegistrationProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeCount = confirmedCount !== null ? Math.max(0, confirmedCount) : 0;
  const remainingCount = Math.max(0, targetCount - safeCount);
  const rawPct = targetCount > 0 ? (safeCount / targetCount) * 100 : 0;
  const percentage = Math.min(100, Number(rawPct.toFixed(2)));
  const targetReached = safeCount >= targetCount;

  // Ensure a subtle visible glow sliver when > 0 so early registrations are clearly visible
  const visualFillWidth =
    safeCount === 0 ? "0%" : `${Math.max(2, Math.min(100, percentage))}%`;

  return (
    <section
      aria-labelledby="progress-goal-heading"
      data-testid="pre-registration-progress-section"
      className="w-full border-b border-white/[0.07] bg-[#090d16] py-14 sm:py-20 font-jakarta"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f1422] via-[#0b0f1a] to-[#12101b] p-6 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.65)] sm:p-10"
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#38bdf8]">
                <span className="h-2 w-2 animate-ping rounded-full bg-[#38bdf8]" aria-hidden="true" />
                <span>LIVE PRE-REGISTRATION TRACKER</span>
              </span>
              <h2
                id="progress-goal-heading"
                className="mt-2 text-[clamp(1.75rem,3.4vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white"
              >
                5,000 BUILDERS. ONE COMPETITION.
              </h2>
            </div>

            {/* Live Confirmed Count & Percentage */}
            <div className="shrink-0 lg:text-right">
              {loading ? (
                <div
                  data-testid="progress-loading-state"
                  className="inline-flex flex-col items-start lg:items-end"
                >
                  <div className="h-10 w-44 animate-pulse rounded-xl bg-white/10" />
                  <span className="mt-2 text-xs font-medium text-[#94a3b8]">
                    Syncing live count…
                  </span>
                </div>
              ) : error || confirmedCount === null ? (
                <div
                  data-testid="progress-unavailable-state"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-left lg:text-right"
                >
                  <p className="text-sm font-semibold text-white">
                    Live count temporarily unavailable
                  </p>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">
                    Target: {targetCount.toLocaleString("en-IN")} builders
                  </p>
                </div>
              ) : (
                <motion.div
                  key={safeCount}
                  initial={prefersReducedMotion ? false : { scale: 0.96, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <div
                    data-testid="progress-count-display"
                    className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-none tracking-[-0.03em] text-white"
                  >
                    <span>{safeCount.toLocaleString("en-IN")}</span>
                    <span className="mx-2 font-medium text-white/30">/</span>
                    <span className="text-[#94a3b8]">
                      {targetCount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8] sm:text-sm">
                    <span className="text-[#ef233c]">{percentage}%</span> confirmed ·{" "}
                    <span className="text-white">
                      {remainingCount.toLocaleString("en-IN")}
                    </span>{" "}
                    spots remaining
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Animated Gradient + Shimmer Progress Bar */}
          <div className="mt-7">
            <div
              role="progressbar"
              aria-label="Pre-registration goal progress"
              aria-valuemin={0}
              aria-valuemax={targetCount}
              aria-valuenow={confirmedCount ?? 0}
              className="relative h-5 w-full overflow-hidden rounded-full border border-white/10 bg-[#06080f] p-0.5 shadow-inner"
            >
              {!loading && !error && confirmedCount !== null && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: visualFillWidth }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-[#ef233c] via-[#ff4d63] to-[#38bdf8] shadow-[0_0_24px_rgba(239,35,60,0.65)]"
                >
                  {/* Animated Shimmer Sweep */}
                  {!prefersReducedMotion && (
                    <motion.div
                      animate={{ x: ["-100%", "220%"] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  )}
                </motion.div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#94a3b8]">
              <span>0 confirmed</span>
              {targetReached ? (
                <span className="font-bold text-emerald-400">
                  Target of 5,000 builders reached! Official dates announcing soon.
                </span>
              ) : (
                <span>
                  Official competition dates unlock once 5,000 builders are confirmed.
                </span>
              )}
              <span>5,000 goal</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
