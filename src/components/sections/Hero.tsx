import React from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowDownRight } from "lucide-react";
import { profile } from "../../data/profile";
import { MaskLines, Rise } from "../animations/Reveal";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

const STACK = ["Flutter", "Dart", "AI Integration", "Riverpod", "Firebase", "Computer Vision"];

/**
 * Full-screen cinematic opening. The 3D ecosystem sits behind this in a fixed
 * layer (see App), so the hero itself is pure typography and parallaxes away
 * on scroll to hand the stage to the node field.
 */
export function Hero({ reveal }: { reveal: MotionValue<number> }) {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Type lifts and dissolves as the field takes over.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] items-end pb-[clamp(3rem,9vh,6rem)] pt-32"
      aria-labelledby="hero-title"
    >
      <motion.div style={{ y, opacity }} className="shell w-full">
        {/* eyebrow */}
        <Rise className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            {profile.availability}
          </span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-muted sm:inline">
            {profile.location}
          </span>
        </Rise>

        {/* name */}
        <h1 id="hero-title" className="mt-7 flex flex-col">
          <span className="sr-only">
            {profile.name} — {profile.roleLine}
          </span>
          <MaskLines
            aria-hidden="true"
            lines={["ABUZAR", "KHAN"]}
            className="display block"
            delay={0.12}
            stagger={0.1}
          />
        </h1>

        {/* role + supporting line */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <Rise delay={0.4} className="lg:col-span-6">
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-accent">
              Flutter Developer
              <span className="mx-2 text-muted">/</span>
              <span className="text-ink-2">Mobile Application Developer</span>
            </p>
            <p className="t-body measure mt-5">{profile.headline}</p>
          </Rise>

          <Rise delay={0.55} className="lg:col-span-6 lg:justify-self-end">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 lg:justify-end">
              {STACK.map((t) => (
                <li key={t} className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 lg:justify-end">
              <a href="#work" className="btn-primary" data-cursor="View">
                Selected Work
              </a>
              <a href="#contact" className="btn-ghost">
                Get in touch
              </a>
            </div>
          </Rise>
        </div>

        {/* scroll cue */}
        <Rise delay={0.8} className="mt-14 flex items-center gap-3 text-muted">
          <motion.span
            aria-hidden="true"
            animate={reduced ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDownRight size={16} className="text-accent" />
          </motion.span>
          <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Scroll to explore</span>
        </Rise>
      </motion.div>
    </section>
  );
}
