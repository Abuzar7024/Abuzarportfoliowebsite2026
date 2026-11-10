import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, Trophy } from "lucide-react";

const PRIZE_CARDS = [
  {
    rank: "1ST",
    amount: "₹5,00,000",
    subtitle: "Champion Cash Prize",
    accent: "from-[#ef233c]/25 via-[#0f1422] to-[#0b0e18]",
    border: "border-[#ef233c]/50 shadow-[0_20px_60px_-20px_rgba(239,35,60,0.35)]",
    badgeColor: "bg-[#ef233c] text-white",
  },
  {
    rank: "2ND",
    amount: "₹3,00,000",
    subtitle: "First Runner-Up Cash Prize",
    accent: "from-[#38bdf8]/15 via-[#0f1422] to-[#0b0e18]",
    border: "border-white/12",
    badgeColor: "bg-white/10 text-white",
  },
  {
    rank: "3RD",
    amount: "₹1,00,000",
    extra: "+ ₹10,000 AMAZON GIFT VOUCHER",
    subtitle: "Second Runner-Up Package",
    accent: "from-[#818cf8]/15 via-[#0f1422] to-[#0b0e18]",
    border: "border-white/12",
    badgeColor: "bg-white/10 text-white",
  },
];

export function PrizeCards() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="prizes"
      aria-labelledby="prizes-heading"
      className="w-full border-b border-white/[0.07] bg-[#07090e] py-16 sm:py-24 font-jakarta"
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#ef233c]">
              <Trophy size={14} aria-hidden="true" />
              <span>CHAMPIONSHIP REWARDS</span>
            </span>
            <h2
              id="prizes-heading"
              className="mt-2 text-[clamp(2rem,4vw,3.1rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-white"
            >
              PRIZES BUILT FOR TOP BUILDERS
            </h2>
          </div>

          <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#cbd5e1]">
            ₹9,10,000 Cash &amp; Voucher Pool + 100× Claude
          </div>
        </div>

        {/* Three Minimal Animated Prize Cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
          {PRIZE_CARDS.map((card, idx) => (
            <motion.div
              key={card.rank}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={prefersReducedMotion ? undefined : { y: -6 }}
              className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-7 sm:p-8 ${card.accent} ${card.border}`}
            >
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-3.5 py-1 font-mono text-xs font-extrabold uppercase tracking-[0.14em] ${card.badgeColor}`}
                >
                  {card.rank}
                </span>

                <p className="mt-6 text-[clamp(2.35rem,3.8vw,3.25rem)] font-extrabold leading-none tracking-[-0.035em] text-white">
                  {card.amount}
                </p>

                {card.extra && (
                  <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.06em] text-[#38bdf8]">
                    {card.extra}
                  </p>
                )}
              </div>

              <div className="mt-8 border-t border-white/10 pt-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
                {card.subtitle}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visually Attractive Section: TOP 100 PERFORMERS */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-6 relative overflow-hidden rounded-3xl border border-[#38bdf8]/35 bg-gradient-to-r from-[#0d1829] via-[#0f1422] to-[#1a1025] p-7 shadow-[0_20px_60px_-20px_rgba(56,189,248,0.2)] sm:p-10"
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/12 px-3.5 py-1 font-mono text-xs font-extrabold uppercase tracking-[0.14em] text-[#38bdf8]">
                <Sparkles size={13} aria-hidden="true" />
                <span>TOP 100 PERFORMERS</span>
              </span>
              <h3 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
                One month of Claude subscription each.
              </h3>
              <p className="mt-2 text-sm font-medium text-[#94a3b8] sm:text-base">
                Provided by our organising team for the top 100 eligible builders.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/12 bg-white/[0.04] px-6 py-4 text-left md:text-right">
              <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#38bdf8]">
                BONUS REWARD TIER
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                100 × CLAUDE
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
