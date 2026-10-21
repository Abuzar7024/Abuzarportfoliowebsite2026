import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowRight, FileText, MapPin } from "lucide-react";
import { profile } from "../data/profile";
import { experience, yearsOfExperience } from "../data/experience";
import { projects } from "../data/projects";
import { scrollToSection } from "../lib/scroll";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The name itself is rendered in 3D chrome by the background scene, sized to
 * the empty band in the middle of this section. When WebGL is unavailable
 * (`name3D` false) the same name is set in HTML type in that band instead.
 */
export function Hero({ name3D }: { name3D: boolean }) {
  const reduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  const lift = useTransform(scrollY, [0, 600], [0, -60]);
  const fade = useTransform(scrollY, [0, 450], [1, 0]);
  const current = experience.find((e) => e.end === null);
  // Everything with real product scope; this site itself does not count.
  const shipped = projects.filter((p) => p.id !== "portfolio-2026").length;

  const enter = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, delay, ease: EASE },
        };

  const facts = [
    { k: `${yearsOfExperience()}+ yrs`, v: "shipping production apps" },
    { k: `${shipped}`, v: "products built & maintained" },
    { k: current?.company ?? "", v: "where I work now" },
  ];

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col pb-12 pt-24 sm:pt-28" aria-labelledby="hero-title">
      <motion.div
        className="shell flex w-full flex-1 flex-col"
        style={reduced ? undefined : { y: lift, opacity: fade }}
      >
        <motion.div className="flex flex-wrap items-center justify-between gap-3" {...enter(0.1)}>
          <p className="eyebrow">
            <span className="signal-dot" aria-hidden="true" />
            <b>{profile.availability}</b>
          </p>
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-faint sm:block">
            Portfolio / {new Date().getFullYear()}
          </p>
        </motion.div>

        {/* The band the chrome name occupies. */}
        <div className="flex min-h-[28svh] flex-1 items-center justify-center py-8 sm:min-h-[34svh]">
          <h1 id="hero-title" className={name3D ? "sr-only" : "text-center font-brand leading-[1.05]"}>
            {name3D ? (
              `${profile.name}, ${profile.title}`
            ) : (
              <motion.span className="text-chrome block text-[clamp(2.4rem,9vw,7.5rem)]" {...enter(0.2)}>
                ABUZAR
                <br className="sm:hidden" /> KHAN
              </motion.span>
            )}
          </h1>
        </div>

        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <motion.p
              className="font-mono text-[12px] uppercase tracking-[0.22em] text-silver sm:text-[13px]"
              {...enter(0.5)}
            >
              <span className="text-accent-ink">//</span> {profile.roleLine}
            </motion.p>
            <motion.p className="lead measure mt-4" {...enter(0.6)}>
              {profile.headline.replace(/\.$/, "")} — <span className="serif-accent text-[1.15em] text-ink">built to ship.</span>
            </motion.p>
            <motion.div className="mt-7 flex flex-wrap items-center gap-3" {...enter(0.7)}>
              <a
                href="#work"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("work");
                }}
                className="btn-primary"
              >
                See my work
                <ArrowRight size={15} aria-hidden="true" />
              </a>
              <a href={profile.links.resumePdf} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <FileText size={15} aria-hidden="true" />
                Download resume
              </a>
              <span className="ml-1 inline-flex items-center gap-1.5 text-[13px] text-muted">
                <MapPin size={13} aria-hidden="true" />
                {profile.location}
              </span>
            </motion.div>
          </div>

          <motion.dl className="hud grid grid-cols-3 divide-x divide-line" {...enter(0.85)}>
            {facts.map((f) => (
              <div key={f.v} className="px-4 py-4 sm:px-5">
                <dt className="sr-only">{f.v}</dt>
                <dd className="font-display text-lg font-semibold tracking-tight text-ink sm:text-2xl">{f.k}</dd>
                <dd className="mt-1 text-[11.5px] leading-snug text-muted sm:text-xs">{f.v}</dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </motion.div>

      <motion.a
        href="#about"
        onClick={(e) => {
          e.preventDefault();
          scrollToSection("about");
        }}
        className="mx-auto mt-8 hidden items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted transition-colors hover:text-ink sm:flex"
        style={reduced ? undefined : { opacity: fade }}
      >
        Scroll to explore
        <motion.span
          animate={reduced ? undefined : { y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={14} aria-hidden="true" />
        </motion.span>
      </motion.a>
    </section>
  );
}
