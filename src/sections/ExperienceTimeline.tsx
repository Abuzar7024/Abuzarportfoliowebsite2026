import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { GitCommitHorizontal, GraduationCap, MapPin } from "lucide-react";
import { education, experience } from "../data/experience";
import type { Experience } from "../data/types";
import { FadeIn, SectionHead } from "../components/Reveal";
import { CodeWindow } from "../components/CodeWindow";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Commit({ item, index, total }: { item: Experience; index: number; total: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const active = useInView(ref, { margin: "-35% 0px -45% 0px" });
  const current = item.end === null;
  return (
    <li ref={ref} className="relative grid grid-cols-[2.5rem_1fr] gap-x-3 sm:grid-cols-[3.5rem_1fr]">
      {/* graph */}
      <div className="relative flex justify-center" aria-hidden="true">
        <motion.span className="relative z-10 mt-6 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-bg" animate={{ borderColor: active ? "#ff2b3d" : "rgba(255,255,255,0.22)", scale: active ? 1.15 : 1 }} transition={{ duration: 0.4 }}>
          {current && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/40" />}
        </motion.span>
      </div>
      <div className={`mb-6 rounded-[var(--radius-lg)] border p-5 transition-colors duration-500 sm:p-6 ${active ? "border-accent/40 bg-accent/[0.03]" : "border-line bg-white/[0.015]"}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px]">
          <span className="text-accent">{current ? "HEAD →" : `#${String(total - index).padStart(2, "0")}`}</span>
          <span className="text-muted">{item.period}</span>
          <span className="hidden text-muted sm:inline">·</span>
          <span className="inline-flex items-center gap-1 text-muted">
            <MapPin size={11} /> {item.location}
          </span>
          {current && <span className="chip chip-accent !py-0 !text-[11px]">current</span>}
        </div>
        <h3 className="mt-3 font-mono text-[15px] font-semibold text-ink sm:text-base">
          <span className="text-[#82e0aa]">feat</span>
          <span className="text-muted">(</span>
          <span className="text-[#ffb38a]">{slug(item.company)}</span>
          <span className="text-muted">)</span>: {item.role}
        </h3>
        <p className="mt-1.5 font-display text-xl font-bold tracking-tight">{item.company}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{item.summary}</p>
        <ul className="mt-4 space-y-1.5">
          {item.bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-sm text-ink-2">
              <span className="mt-[2px] font-mono text-success">+</span>
              {b}
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
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
  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <div className="container-x">
        <SectionHead id="experience-title" label="Experience" title="Three companies, one trajectory: shipping." text="From web foundations to leading Flutter delivery, to enterprise mobile and computer vision at Ebani Tech — read it like a git log." />

        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-12">
          <FadeIn className="lg:col-span-8">
            <CodeWindow file="git log --oneline --graph" meta={`${experience.length} roles`} bodyClassName="p-4 sm:p-6">
              <div className="relative">
                <div className="absolute bottom-6 left-[19px] top-6 w-px bg-line sm:left-[27px]" aria-hidden="true" />
                <ol>
                  {experience.map((item, i) => (
                    <Commit key={item.id} item={item} index={i} total={experience.length} />
                  ))}
                </ol>
                <p className="flex items-center gap-2 pl-12 font-mono text-[12px] text-muted sm:pl-16">
                  <GitCommitHorizontal size={14} /> initial commit · Bhopal, India
                </p>
              </div>
            </CodeWindow>
          </FadeIn>

          <FadeIn delay={0.08} className="lg:col-span-4">
            <CodeWindow file="education.md" meta="2 entries" className="h-full" bodyClassName="divide-y divide-line">
              {education.map((e) => (
                <div key={e.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="icon-tile" aria-hidden="true">
                      <GraduationCap size={16} />
                    </span>
                    <span className="chip !text-[11px]">{e.status}</span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold leading-snug">{e.degree}</h3>
                  <p className="mt-1.5 text-sm text-ink-2">{e.school}</p>
                  <p className="mt-2 font-mono text-[12px] text-muted">
                    {e.years} · {e.location}
                  </p>
                </div>
              ))}
              <div className="p-5">
                <p className="font-mono text-[12px] text-muted">{"// always learning: AI on-device, Three.js, product design"}</p>
              </div>
            </CodeWindow>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
