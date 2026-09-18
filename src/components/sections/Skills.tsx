import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { skillCategories, skills } from "../../data/skills";
import type { Skill, SkillCategory, SkillLevel } from "../../data/types";
import { projects } from "../../data/projects";
import { Rise, SectionIndex } from "../animations/Reveal";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

const LEVEL_LABEL: Record<SkillLevel, string> = {
  core: "Daily",
  working: "Shipped with",
  familiar: "Familiar",
};

const CATEGORY_NOTE: Record<SkillCategory, string> = {
  Mobile: "The apps themselves — one codebase, both platforms.",
  "State Management": "Keeping what is on screen in step with the data behind it.",
  Backend: "Accounts, stored data, live updates and the APIs in between.",
  Integrations: "Taking money, and the billing rules around it.",
  "AI & Computer Vision": "Camera-driven features, integrated into the app layer.",
  Web: "Interfaces, dashboards and this site.",
  Tools: "How the work gets built, reviewed and shipped.",
};

/**
 * Technology universe. Hovering (or focusing) a technology lights up the
 * projects it was actually used in, drawing the relationship between the
 * toolkit and the shipped work. Pure DOM + Motion so it stays fast and
 * accessible on every tier — no WebGL cost for a reading section.
 */
export function Skills() {
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Project id -> title, for the linked panel.
  const titleById = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p) => m.set(p.id, p.title));
    return m;
  }, []);

  const linked = activeSkill?.projects ?? [];

  return (
    <section ref={sectionRef} id="skills" className="section" aria-labelledby="skills-title">
      <div className="shell">
        <SectionIndex n="04" label="Technology" />
        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Rise>
            <h2 id="skills-title" className="t-h2 measure-tight">
              The toolkit, and where it was used.
            </h2>
          </Rise>
          <Rise delay={0.1}>
            <p className="t-body measure max-w-[38ch] lg:text-right">
              Hover or focus any technology to see which products it shipped in.
            </p>
          </Rise>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-12">
          {/* the universe */}
          <div className="lg:col-span-8">
            <div className="space-y-10">
              {skillCategories.map((cat) => {
                const group = skills.filter((s) => s.category === cat);
                if (!group.length) return null;
                return (
                  <Rise key={cat}>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{cat}</h3>
                      <p className="text-[12.5px] text-muted">{CATEGORY_NOTE[cat]}</p>
                    </div>

                    <ul className="mt-4 flex flex-wrap gap-2.5">
                      {group.map((s) => {
                        const isActive = activeSkill?.name === s.name;
                        const isDimmed = !!activeSkill && !isActive;
                        return (
                          <li key={s.name}>
                            <motion.button
                              type="button"
                              onMouseEnter={() => setActiveSkill(s)}
                              onFocus={() => setActiveSkill(s)}
                              onClick={() => setActiveSkill(isActive ? null : s)}
                              aria-pressed={isActive}
                              aria-describedby="skill-detail"
                              animate={{ opacity: isDimmed ? 0.35 : 1 }}
                              transition={{ duration: 0.3 }}
                              className={`slab inline-flex items-center gap-2 px-3.5 py-2 text-[13.5px] transition-colors ${
                                isActive
                                  ? "border-accent/70 bg-accent/10 text-ink"
                                  : "text-ink-2 hover:border-line-2 hover:text-ink"
                              }`}
                            >
                              {s.level === "core" && (
                                <span
                                  aria-hidden="true"
                                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                                />
                              )}
                              {s.name}
                            </motion.button>
                          </li>
                        );
                      })}
                    </ul>
                  </Rise>
                );
              })}
            </div>

            <Rise className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-muted">
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                Used daily in production
              </span>
              <span>{skills.length} technologies</span>
            </Rise>
          </div>

          {/* linked detail */}
          <div className="lg:col-span-4">
            <div
              id="skill-detail"
              aria-live="polite"
              className="slab min-h-[15rem] p-6 sm:p-7 lg:sticky lg:top-28"
            >
              <AnimatePresence mode="wait" initial={false}>
                {activeSkill ? (
                  <motion.div
                    key={activeSkill.name}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="t-h3">{activeSkill.name}</h3>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent">
                        {LEVEL_LABEL[activeSkill.level]}
                      </span>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{activeSkill.plain}</p>
                    <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{activeSkill.context}</p>

                    {linked.length > 0 && (
                      <>
                        <div className="rule my-6" />
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
                          Used in
                        </p>
                        <ul className="mt-3 space-y-2">
                          {linked.map((id, i) => (
                            <motion.li
                              key={id}
                              initial={reduced ? false : { opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: i * 0.045 }}
                              className="flex items-center gap-2.5 text-[14px] text-ink-2"
                            >
                              <span aria-hidden="true" className="h-px w-4 bg-accent" />
                              {titleById.get(id) ?? id}
                            </motion.li>
                          ))}
                        </ul>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.p
                    key="idle"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    className="text-[14px] leading-relaxed text-muted"
                  >
                    Select a technology to see what it was used to build.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
