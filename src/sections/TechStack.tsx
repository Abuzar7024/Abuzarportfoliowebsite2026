import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Boxes, Cloud, Eye, Layers, Monitor, Smartphone, Wrench, type LucideIcon } from "lucide-react";
import { skillCategories, skills } from "../data/skills";
import type { Skill, SkillCategory } from "../data/types";
import { projectById } from "../data/projects";
import { FadeIn, SectionHead } from "../components/Reveal";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

/** Plain-English headings so a non-technical reader knows what each group is for. */
const META: Record<SkillCategory, { Icon: LucideIcon; plain: string; why: string }> = {
  Mobile: { Icon: Smartphone, plain: "Phone apps", why: "The apps themselves — one build that works on both iPhone and Android." },
  "AI & Computer Vision": { Icon: Eye, plain: "Smart camera features", why: "Apps that can see: try clothes on with the camera, recognise faces, read what's in a photo." },
  "State Management": { Icon: Layers, plain: "Keeping apps fast", why: "The plumbing that stops apps freezing or losing your place when they get busy." },
  Frontend: { Icon: Monitor, plain: "Websites & dashboards", why: "What you see and click on in a browser — including this site." },
  "Backend & Cloud": { Icon: Cloud, plain: "Data, logins & notifications", why: "Accounts, saved data, push notifications and live maps — the parts that connect everything." },
  Architecture: { Icon: Boxes, plain: "Built to last", why: "Structuring code so new features are cheap to add and nothing breaks later." },
  Tools: { Icon: Wrench, plain: "Day-to-day tools", why: "What I work in every day to build, test and ship." },
};

function Chip({ skill, active, onClick }: { skill: Skill; active: boolean; onClick: () => void }) {
  const uses = skill.projects?.length ?? 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] transition-colors duration-300 ${active ? "border-accent bg-accent text-white" : skill.core ? "border-line-2 bg-white/[0.05] text-ink hover:border-accent/70" : "border-line bg-white/[0.02] text-ink-2 hover:border-line-2 hover:text-ink"}`}
    >
      {skill.core && <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-accent"}`} aria-hidden="true" />}
      {skill.name}
      {uses > 0 && <span className={`font-mono text-[11px] ${active ? "text-white/80" : "text-muted"}`}>{uses} {uses === 1 ? "app" : "apps"}</span>}
    </button>
  );
}

function Group({ id, index, selected, onSelect }: { id: SkillCategory; index: number; selected: Skill | null; onSelect: (s: Skill | null) => void }) {
  const { Icon, plain, why } = META[id];
  const list = useMemo(() => skills.filter((s) => s.category === id).sort((a, b) => Number(!!b.core) - Number(!!a.core)), [id]);
  const open = selected && selected.category === id ? selected : null;
  const reduced = usePrefersReducedMotion();
  const span = index === 0 ? "lg:col-span-6" : index === 1 ? "lg:col-span-6" : index === 6 ? "lg:col-span-12" : "lg:col-span-4";

  return (
    <FadeIn delay={index * 0.04} className={`col-span-1 ${span}`} amount={0.15}>
      <div className={`card card-hover flex h-full flex-col p-5 sm:p-6 ${index === 0 ? "hud" : ""}`}>
        <div className="flex items-start gap-3">
          <span className="icon-tile">
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold leading-tight">{plain}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{why}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {list.map((s) => (
            <Chip key={s.name} skill={s} active={open?.name === s.name} onClick={() => onSelect(open?.name === s.name ? null : s)} />
          ))}
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div key={open.name} initial={reduced ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduced ? undefined : { opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <div className="mt-5 border-l-2 border-accent bg-accent/[0.05] p-4">
                <p className="text-sm font-semibold text-ink">{open.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{open.context}</p>
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
      </div>
    </FadeIn>
  );
}

export function TechStack() {
  const [selected, setSelected] = useState<Skill | null>(null);
  return (
    <section id="stack" className="section !pt-0" aria-labelledby="stack-title">
      <div className="container-x">
        <SectionHead
          id="stack-title"
          label="What I work with"
          title="The toolkit behind the apps."
          text="Grouped by what each one actually does for you. Tap any name to see which of my live apps it was used in — no invented ratings, just real work."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-12 lg:gap-5">
          {skillCategories.map((c, i) => (
            <Group key={c.id} id={c.id} index={i} selected={selected} onSelect={setSelected} />
          ))}
        </div>
      </div>
    </section>
  );
}
