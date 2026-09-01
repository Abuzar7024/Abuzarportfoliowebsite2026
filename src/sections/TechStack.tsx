import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { skillCategories, skills } from "../data/skills";
import type { Skill, SkillCategory } from "../data/types";
import { projectById } from "../data/projects";
import { FadeIn, SectionHead } from "../components/Reveal";
import { CodeWindow, Tok } from "../components/CodeWindow";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

const FILES: Record<SkillCategory, string> = {
  Mobile: "mobile.dart",
  "AI & Computer Vision": "vision.py",
  "State Management": "state.dart",
  Frontend: "frontend.tsx",
  "Backend & Cloud": "backend.ts",
  Architecture: "architecture.md",
  Tools: "tools.sh",
};

function Chip({ skill, active, onClick }: { skill: Skill; active: boolean; onClick: () => void }) {
  const uses = skill.projects?.length ?? 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[12.5px] transition-colors duration-300 ${active ? "border-accent bg-accent text-white" : skill.core ? "border-line-2 bg-white/[0.05] text-ink hover:border-accent/70" : "border-line bg-white/[0.02] text-ink-2 hover:border-line-2 hover:text-ink"}`}
    >
      {skill.core && <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-accent"}`} aria-hidden="true" />}
      {skill.name}
      {uses > 0 && <span className={`text-[11px] ${active ? "text-white/80" : "text-muted"}`}>×{uses}</span>}
    </button>
  );
}

export function TechStack() {
  const [tab, setTab] = useState<SkillCategory>(skillCategories[0].id);
  const [selected, setSelected] = useState<Skill | null>(null);
  const reduced = usePrefersReducedMotion();
  const list = useMemo(() => skills.filter((s) => s.category === tab).sort((a, b) => Number(!!b.core) - Number(!!a.core)), [tab]);
  const cat = skillCategories.find((c) => c.id === tab)!;
  const coreCount = list.filter((s) => s.core).length;
  const open = selected && selected.category === tab ? selected : null;

  return (
    <section id="stack" className="section !pt-0" aria-labelledby="stack-title">
      <div className="container-x">
        <SectionHead id="stack-title" label="Skills" title="Skills with receipts." text="Tap any technology to see the real projects it shipped in — no made-up proficiency bars. Red dots mark my core stack." />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-12">
          {/* explorer (desktop only — phones use the tab strip) */}
          <FadeIn className="hidden lg:col-span-4 lg:block">
            <CodeWindow file="explorer" meta={`${skills.length} technologies`} className="h-full">
              <ul className="p-2">
                {skillCategories.map((c) => {
                  const n = skills.filter((s) => s.category === c.id);
                  const active = c.id === tab;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setTab(c.id);
                          setSelected(null);
                        }}
                        aria-current={active ? "true" : undefined}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-white/[0.07] text-ink" : "text-ink-2 hover:bg-white/[0.04] hover:text-ink"}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : "bg-muted/50"}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[13px]">{FILES[c.id]}</span>
                          <span className="block truncate text-[12px] text-muted">{c.id}</span>
                        </span>
                        <span className="font-mono text-[11px] text-muted">{n.length}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </CodeWindow>
          </FadeIn>

          {/* editor */}
          <FadeIn delay={0.08} className="col-span-1 lg:col-span-8">
            <CodeWindow file={FILES[tab]} tabs={skillCategories.map((c) => ({ id: c.id, label: FILES[c.id] }))} activeTab={tab} onTab={(id) => { setTab(id as SkillCategory); setSelected(null); }} meta={`${list.length} items · ${coreCount} core`} className="h-full" bodyClassName="p-5 sm:p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={tab} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <p className="font-mono text-[13px]">
                    <Tok.cm>{"// "}{cat.blurb}</Tok.cm>
                  </p>
                  <p className="mt-1 font-mono text-[13px]">
                    <Tok.kw>export const</Tok.kw> <Tok.fn>{tab.replace(/[^A-Za-z]/g, "").toLowerCase()}</Tok.fn> <Tok.p>= [</Tok.p>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 pl-4">
                    {list.map((s) => (
                      <Chip key={s.name} skill={s} active={open?.name === s.name} onClick={() => setSelected(open?.name === s.name ? null : s)} />
                    ))}
                  </div>
                  <p className="mt-3 font-mono text-[13px]">
                    <Tok.p>];</Tok.p>
                  </p>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div key={open.name} initial={reduced ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduced ? undefined : { opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/[0.06] p-4">
                          <p className="font-mono text-[12px] text-accent">
                            {"/** "}
                            {open.name}
                            {open.core ? " · core" : ""}
                            {" */"}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-ink-2">{open.context}</p>
                          {open.projects && open.projects.length > 0 && (
                            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Used in">
                              {open.projects.map((pid) => {
                                const p = projectById(pid);
                                return p ? (
                                  <li key={pid} className="chip !px-2.5 !text-[11px]">
                                    {p.title}
                                  </li>
                                ) : null;
                              })}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!open && <p className="mt-5 font-mono text-[12px] text-muted">{"// tap a chip to read where it was used"}</p>}
                </motion.div>
              </AnimatePresence>
            </CodeWindow>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
