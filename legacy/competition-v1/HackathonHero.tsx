import React, { Suspense, lazy } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { AVATAR_COMPETITION } from "../data/avatar-competition";

const LazyHeroThreeScene = lazy(() => import("./HeroThreeScene"));

function HeroThreeFallback() {
  return (
    <div
      className="relative flex h-[300px] w-full items-center justify-center sm:h-[360px] lg:h-[420px]"
      aria-hidden="true"
    >
      <div className="h-56 w-56 rounded-full bg-gradient-to-tr from-[#ef233c]/25 via-[#38bdf8]/15 to-transparent blur-2xl" />
      <svg viewBox="0 0 240 240" className="absolute h-56 w-56">
        <polygon
          points="120,20 206,70 206,170 120,220 34,170 34,70"
          fill="none"
          stroke="#ef233c"
          strokeWidth="1.5"
          strokeOpacity="0.65"
        />
        <polygon
          points="120,48 182,84 182,156 120,192 58,156 58,84"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeDasharray="5 5"
          strokeOpacity="0.55"
        />
        <circle cx="120" cy="120" r="18" fill="#ef233c" fillOpacity="0.85" />
      </svg>
    </div>
  );
}

export interface HackathonHeroProps {
  onJoinClick: () => void;
}

export function HackathonHero({ onJoinClick }: HackathonHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="hackathon-hero-heading"
      className="relative w-full overflow-hidden border-b border-white/[0.07] bg-[#07090e] pt-10 pb-16 sm:pt-16 sm:pb-24 font-jakarta"
    >
      {/* Subtle Futuristic Ambient Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/4 h-[440px] w-[440px] rounded-full bg-[#ef233c]/12 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-10 h-[360px] w-[360px] rounded-full bg-[#38bdf8]/10 blur-[120px]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
          {/* Left Column: Bold Typography + Key Metrics + Single Animated CTA */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-left"
          >
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ef233c]/35 bg-[#ef233c]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#ff4d63]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ef233c]" aria-hidden="true" />
              <span>{AVATAR_COMPETITION.campaignBadge}</span>
            </div>

            {/* Headline */}
            <h1
              id="hackathon-hero-heading"
              className="mt-5 text-[clamp(3rem,6.8vw,5.6rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-white"
            >
              AI HACKATHON
            </h1>

            {/* Supporting Text */}
            <p className="mt-4 bg-gradient-to-r from-white via-[#e2e8f0] to-[#38bdf8] bg-clip-text text-[clamp(1.35rem,2.5vw,2.1rem)] font-extrabold tracking-[-0.02em] text-transparent">
              BUILD WITH AI. COMPETE. WIN.
            </p>

            {/* Short Description */}
            <p className="mt-3 max-w-xl text-[17px] font-medium leading-[1.6] text-[#94a3b8] sm:text-[18px]">
              A competition for builders, developers and AI enthusiasts.
            </p>

            {/* Key Facts Strip */}
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-md"
              >
                <div className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  ₹499
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
                  ₹499 pre-registration
                </div>
              </motion.div>

              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-md"
              >
                <div className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  5,000
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
                  Target: 5,000 participants
                </div>
              </motion.div>

              <motion.div
                whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                className="rounded-2xl border border-[#ef233c]/30 bg-gradient-to-br from-[#ef233c]/12 to-white/[0.02] px-4 py-4 backdrop-blur-md"
              >
                <div className="text-2xl font-extrabold tracking-tight text-[#ff4d63] sm:text-3xl">
                  ₹9,10,000
                </div>
                <div className="mt-1 text-xs font-semibold leading-snug text-[#cbd5e1]">
                  Cash &amp; voucher prize value, excluding Claude subscriptions
                </div>
              </motion.div>
            </div>

            {/* Single Animated PRE-REGISTER Button */}
            <div className="mt-8 flex flex-col items-stretch sm:flex-row sm:items-center sm:gap-5">
              <motion.button
                type="button"
                onClick={onJoinClick}
                data-testid="hero-join-cta"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#ef233c] px-9 py-4.5 text-[16px] font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_0_38px_rgba(239,35,60,0.45)] transition-colors hover:bg-[#d90429]"
              >
                <Sparkles size={18} aria-hidden="true" />
                <span>PRE-REGISTER</span>
                <ArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </motion.button>

              <span className="mt-3 text-xs font-medium text-[#94a3b8] sm:mt-0">
                Instant verified digital pass · PayU secured
              </span>
            </div>
          </motion.div>

          {/* Right Column: Interactive Three.js 3D Neural Core */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center"
          >
            <Suspense fallback={<HeroThreeFallback />}>
              <LazyHeroThreeScene />
            </Suspense>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
