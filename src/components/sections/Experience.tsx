import React from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { experience } from "../../data/experience";
import type { Experience as ExperienceItem } from "../../data/types";
import { Rise, SectionIndex } from "../animations/Reveal";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

function Entry({ item, index }: { item: ExperienceItem; index: number }) {
  const current = item.end === null;
  return (
    <li className="relative grid grid-cols-1 gap-6 pl-10 lg:grid-cols-12 lg:gap-10 lg:pl-16">
      {/* node on the spine */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-2 flex h-3 w-3 -translate-x-[5px] items-center justify-center rounded-full border ${
          current ? "border-accent bg-accent" : "border-line-2 bg-bg-2"
        } lg:left-1.5`}
      >
        {current && <span className="absolute h-3 w-3 animate-ping rounded-full bg-accent opacity-50" />}
      </span>

      {/* meta */}
      <div className="lg:col-span-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{item.period}</p>
        <h3 className="t-h3 mt-3">{item.company}</h3>
        <p className="mt-1.5 text-[14px] text-ink-2">{item.role}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{item.location}</p>
      </div>

      {/* detail */}
      <div className="lg:col-span-8">
        <p className="t-body measure">{item.summary}</p>
        <ul className="mt-6 space-y-3">
          {item.bullets.map((b) => (
            <li key={b} className="flex gap-3.5 text-[14.5px] leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-accent/60" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
          {item.tech.map((t) => (
            <li key={t} className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Vertical timeline with a scroll-driven accent spine. */
export function Experience() {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const raw = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const scaleY = useSpring(raw, { stiffness: 80, damping: 26, mass: 0.6 });

  return (
    <section id="experience" className="section" aria-labelledby="exp-title">
      <div className="shell">
        <SectionIndex n="02" label="Experience" />
        <Rise className="mt-8">
          <h2 id="exp-title" className="t-h2 measure-tight">
            Where I have built things.
          </h2>
        </Rise>

        <div ref={ref} className="relative mt-14 lg:mt-20">
          {/* spine */}
          <span aria-hidden="true" className="absolute bottom-0 left-1 top-0 w-px bg-line lg:left-2.5" />
          <motion.span
            aria-hidden="true"
            style={{ scaleY: reduced ? 1 : scaleY }}
            className="absolute bottom-0 left-1 top-0 w-px origin-top bg-accent lg:left-2.5"
          />

          <ol className="space-y-16 lg:space-y-24">
            {experience.map((item, i) => (
              <Entry key={item.id} item={item} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
