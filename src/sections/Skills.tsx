import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { skillCategories, skills, skillsByCategory } from "../data/skills";
import { projectById } from "../data/projects";
import type { Skill, SkillLevel } from "../data/types";
import { Rise, SectionIndex } from "../components/animations/Reveal";

const LEVEL: Record<SkillLevel, { label: string; dot: string }> = {
  core: { label: "Daily driver", dot: "bg-accent" },
  working: { label: "Shipped with it", dot: "bg-silver" },
  familiar: { label: "Familiar", dot: "border border-silver/60 bg-transparent" },
};

export function Skills() {
  const [selected, setSelected] = useState<Skill>(skills[0]);
  const used = (selected.projects ?? []).map(projectById).filter(Boolean);

  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="shell">
        <SectionIndex n="04" label="Skills" />
        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <Rise>
            <h2 id="skills-title" className="h-section">
              Tools I <span className="serif-accent text-silver">reach for.</span>
            </h2>
          </Rise>
          <Rise delay={0.1}>
            <ul className="flex flex-wrap gap-4 text-[12.5px] text-muted" aria-label="Legend">
              {(Object.keys(LEVEL) as SkillLevel[]).map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${LEVEL[l].dot}`} aria-hidden="true" />
                  {LEVEL[l].label}
                </li>
              ))}
            </ul>
          </Rise>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Rise className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {skillCategories.map((cat) => (
              <div key={cat} className="bg-bg-2/90 p-5 sm:p-6">
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{cat}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {skillsByCategory(cat).map((s) => {
                    const on = s.name === selected.name;
                    return (
                      <li key={s.name}>
                        <button
                          type="button"
                          onClick={() => setSelected(s)}
                          aria-pressed={on}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                            on
                              ? "border-accent/70 bg-accent/12 text-ink"
                              : "border-line-2 text-ink-2 hover:border-silver/40 hover:text-ink"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${LEVEL[s.level].dot}`} aria-hidden="true" />
                          {s.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </Rise>

          <Rise delay={0.1} className="lg:sticky lg:top-28 lg:self-start">
            <div className="hud p-7" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                    <span className={`h-2 w-2 rounded-full ${LEVEL[selected.level].dot}`} aria-hidden="true" />
                    {selected.category} · {LEVEL[selected.level].label}
                  </p>
                  <h3 className="mt-4 text-4xl tracking-tight">{selected.name}</h3>
                  <p className="lead mt-4">{selected.plain}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">{selected.context}</p>
                  {used.length > 0 && (
                    <div className="mt-6 border-t border-line pt-5">
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Used in</p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {used.map((p) => (
                          <li key={p!.id} className="chip">
                            {p!.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-3 px-1 text-[12.5px] text-faint">Pick any skill to see where I've actually used it.</p>
          </Rise>
        </div>
      </div>
    </section>
  );
}
