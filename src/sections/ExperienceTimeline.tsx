import React, { useRef } from "react";
import { motion, useInView, useScroll, useSpring } from "motion/react";
import { Briefcase, Calendar, GraduationCap, MapPin } from "lucide-react";
import { education, experience } from "../data/experience";
import type { Experience } from "../data/types";
import { FadeIn, SectionHead } from "../components/Reveal";

function Role({ item, index, total }: { item: Experience; index: number; total: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const active = useInView(ref, { margin: "-35% 0px -45% 0px" });
  const current = item.end === null;
  return (
    <li ref={ref} className="relative grid grid-cols-[2.25rem_1fr] gap-x-4 sm:grid-cols-[3rem_1fr]">
      <div className="relative flex justify-center" aria-hidden="true">
        <motion.span className="relative z-10 mt-6 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-bg" animate={{ borderColor: active ? "#ff2b3d" : "rgba(255,255,255,0.22)", scale: active ? 1.15 : 1 }} transition={{ duration: 0.4 }}>
          {current && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/40" />}
        </motion.span>
      </div>
      <div className={`mb-6 card p-5 transition-colors duration-500 sm:p-6 ${active ? "!border-accent/40" : ""}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {current && (
            <span className="chip chip-accent !py-0.5 !text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" /> Current role
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
            <Calendar size={12} /> {item.period}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
            <MapPin size={12} /> {item.location}
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{item.company}</h3>
            <p className="mt-1 text-[15px] font-semibold text-accent">{item.role}</p>
          </div>
          <span className="icon-tile" aria-hidden="true">
            <Briefcase size={16} />
          </span>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{item.plain}</p>

        <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted">What I did there</p>
        <ul className="mt-2.5 space-y-2">
          {item.bullets.map((b) => (
            <li key={b} className="flex gap-3 text-[14.5px] leading-relaxed text-ink-2">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {b}
            </li>
          ))}
        </ul>

        <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Tools used">
          {item.tech.map((t) => (
            <li key={t} className="chip !px-2.5 !text-[11px]">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function ExperienceTimeline() {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 70%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.5 });

  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <div className="container-x">
        <SectionHead
          id="experience-title"
          label="Experience"
          title="Where I've worked, and what I delivered."
          text="Three companies in three years — moving from websites, to leading app delivery, to building the AI-powered products I work on today."
        />

        <div className="relative mt-10 lg:mt-14">
          <div className="absolute bottom-6 left-[17px] top-6 w-px bg-line sm:left-[23px]" aria-hidden="true">
            <motion.div className="absolute inset-x-0 top-0 h-full origin-top bg-accent" style={{ scaleY: line }} />
          </div>
          <ol ref={listRef}>
            {experience.map((item, i) => (
              <Role key={item.id} item={item} index={i} total={experience.length} />
            ))}
          </ol>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <FadeIn className="lg:col-span-4">
            <p className="label">Education</p>
            <h3 className="h3 mt-2">Where I studied</h3>
          </FadeIn>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
            {education.map((e, i) => (
              <FadeIn key={e.id} delay={i * 0.06} className="card card-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="icon-tile" aria-hidden="true">
                    <GraduationCap size={16} />
                  </span>
                  <span className="chip !text-[11px]">{e.status}</span>
                </div>
                <h4 className="mt-4 font-display text-base font-bold leading-snug">{e.degree}</h4>
                <p className="mt-1.5 text-sm text-ink-2">{e.school}</p>
                <p className="mt-2 text-[12.5px] text-muted">
                  {e.years} · {e.location}
                </p>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
