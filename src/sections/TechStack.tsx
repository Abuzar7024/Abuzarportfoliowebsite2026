import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Boxes, Check, Cloud, Eye, Layers, Monitor, Smartphone, Sparkles, Wrench, X, type LucideIcon } from "lucide-react";
import { skillCategories, skills } from "../data/skills";
import type { Skill, SkillCategory } from "../data/types";
import { projectById } from "../data/projects";
import { FadeIn, SectionHead } from "../components/Reveal";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

/** Plain-English headings so a non-technical reader knows what each group is for. */
const META: Record<SkillCategory, { Icon: LucideIcon; plain: string; why: string }> = {
  Mobile: { Icon: Smartphone, plain: "Phone apps", why: "One app that works on both iPhone and Android." },
  "AI & Computer Vision": { Icon: Eye, plain: "Smart camera features", why: "Apps that can see — try-on, face detection, reading photos." },
  Frontend: { Icon: Monitor, plain: "Websites & dashboards", why: "What you see and click on in a browser." },
  "Backend & Cloud": { Icon: Cloud, plain: "Data, logins & alerts", why: "Accounts, saved data, notifications and live maps." },
  "State Management": { Icon: Layers, plain: "Keeping apps fast", why: "Stops apps freezing or losing your place." },
  Architecture: { Icon: Boxes, plain: "Built to last", why: "So new features stay cheap and safe to add." },
  Tools: { Icon: Wrench, plain: "Day-to-day tools", why: "What I work in to build, test and ship." },
};

const ORDER: SkillCategory[] = ["Mobile", "AI & Computer Vision", "Frontend", "Backend & Cloud", "State Management", "Architecture", "Tools"];

/** One skill: name, plain-English line, and the apps it shipped in. */
function SkillCard({ skill, onOpen }: { skill: Skill; onOpen: () => void }) {
  const uses = skill.projects?.length ?? 0;
  return (
    <motion.button
      layout
      type="button"
      onClick={onOpen}
      className="card card-hover group relative flex h-full flex-col p-4 text-left"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${skill.name}: ${skill.plain}`}
    >
      {skill.core && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent" aria-label="Core skill">
          <Sparkles size={10} /> core
        </span>
      )}
      <p className="pr-12 font-display text-[15px] font-bold leading-tight text-ink transition-colors group-hover:text-accent">{skill.name}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{skill.plain}</p>
      <p className="mt-auto min-h-[1.1rem] pt-3 text-[11px] font-medium text-ink-2">
        {uses > 0 ? `Used in ${uses} ${uses === 1 ? "app" : "apps"}` : ""}
      </p>
    </motion.button>
  );
}

/** Detail sheet — opens under the grid on tap, so it works identically on phone and desktop. */
function Detail({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={reduced ? undefined : { opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="card hud mt-4 border-accent/40 bg-accent/[0.05] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold">{skill.name}</h3>
            <p className="mt-1 text-[14px] text-ink-2">{skill.plain}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:text-ink">
            <X size={15} />
          </button>
        </div>
        <p className="mt-4 flex gap-2.5 text-[14px] leading-relaxed text-ink-2">
          <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          {skill.context}
        </p>
        {skill.projects && skill.projects.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">Apps I used it in</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {skill.projects.map((pid) => {
                const p = projectById(pid);
                return p ? (
                  <li key={pid} className="chip !px-2.5 !text-[11px]">
                    {p.title}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function TechStack() {
  const [filter, setFilter] = useState<SkillCategory | "all">("all");
  const [open, setOpen] = useState<Skill | null>(null);

  const visible = useMemo(() => {
    const list = filter === "all" ? skills : skills.filter((s) => s.category === filter);
    return [...list].sort((a, b) => Number(!!b.core) - Number(!!a.core) || ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  }, [filter]);

  const coreCount = skills.filter((s) => s.core).length;

  return (
    <section id="stack" className="section !pt-0" aria-labelledby="stack-title">
      <div className="container-x">
        <SectionHead
          id="stack-title"
          label="What I work with"
          title="The toolkit behind the apps."
          text="Everything here is explained in plain English. Filter by what it does, or tap any card to see which of my live apps it was used in."
        />

        {/* filters */}
        <FadeIn className="mt-8 lg:mt-10">
          <div className="scrollbar-thin -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setOpen(null);
              }}
              aria-pressed={filter === "all"}
              className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors ${filter === "all" ? "border-accent bg-accent text-white" : "border-line bg-white/[0.03] text-ink-2 hover:border-line-2 hover:text-ink"}`}
            >
              Everything
              <span className={`font-mono text-[11px] ${filter === "all" ? "text-white/75" : "text-muted"}`}>{skills.length}</span>
            </button>
            {ORDER.map((id) => {
              const { Icon, plain } = META[id];
              const n = skills.filter((s) => s.category === id).length;
              const active = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setFilter(active ? "all" : id);
                    setOpen(null);
                  }}
                  aria-pressed={active}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors ${active ? "border-accent bg-accent text-white" : "border-line bg-white/[0.03] text-ink-2 hover:border-line-2 hover:text-ink"}`}
                >
                  <Icon size={14} aria-hidden="true" />
                  {plain}
                  <span className={`font-mono text-[11px] ${active ? "text-white/75" : "text-muted"}`}>{n}</span>
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* what this group is for */}
        <AnimatePresence mode="wait" initial={false}>
          {filter !== "all" && (
            <motion.p
              key={filter}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 text-[14px] text-muted"
            >
              {META[filter].why}
            </motion.p>
          )}
        </AnimatePresence>

        {/* grid */}
        <motion.div layout className="mt-6 grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          <AnimatePresence mode="popLayout">
            {visible.map((s) => (
              <SkillCard key={s.name} skill={s} onOpen={() => setOpen(open?.name === s.name ? null : s)} />
            ))}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence initial={false}>{open && <Detail key={open.name} skill={open} onClose={() => setOpen(null)} />}</AnimatePresence>

        <FadeIn className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} className="text-accent" aria-hidden="true" /> {coreCount} core skills I use daily
          </span>
          <span>{skills.length} technologies in total</span>
        </FadeIn>
      </div>
    </section>
  );
}
