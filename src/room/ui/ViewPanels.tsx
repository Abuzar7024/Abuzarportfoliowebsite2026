import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Briefcase, Cpu, FileText, GraduationCap, Plus } from "lucide-react";
import { featuredProjects } from "../../data/projects";
import { education } from "../../data/experience";
import { actions, useRoom } from "../store";

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <motion.aside
      className="hud fixed bottom-24 left-3 right-3 z-30 p-5 sm:left-6 sm:right-auto sm:w-[22rem]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3 }}
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-brand text-sm tracking-wide">{title.toUpperCase()}</h2>
        <button type="button" onClick={actions.backToRoom} className="flex items-center gap-1.5 rounded-full border border-line-2 px-2.5 py-1 text-[12px] text-ink-2 hover:text-ink">
          <ArrowLeft size={12} aria-hidden="true" />
          Room
        </button>
      </div>
      <p className="mt-1 text-[13px] text-muted">{hint}</p>
      <div className="mt-4">{children}</div>
    </motion.aside>
  );
}

/** Readable, keyboard-friendly companions to the poster wall and the shelf views. */
export function ViewPanels() {
  const view = useRoom((s) => s.view);
  const arrived = useRoom((s) => s.arrived);
  return (
    <AnimatePresence>
      {view === "posters" && arrived && (
        <Panel key="posters" title="Project wall" hint="Tap a poster, or pick a project below. Drag to slide along the wall.">
          <ul className="space-y-2">
            {featuredProjects.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => actions.openPoster(p.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-line bg-bg/60 p-3 text-left transition-colors hover:border-line-2"
                >
                  <span className="font-mono text-[11px] text-accent-ink">0{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{p.title}</span>
                    <span className="block truncate text-[12px] text-muted">{p.category}</span>
                  </span>
                  <Plus size={14} className="text-muted transition-transform group-hover:rotate-90 group-hover:text-ink" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => actions.openApp("projects")} className="btn-ghost mt-3 w-full !py-2 text-[13px]">
            All projects on the computer
          </button>
        </Panel>
      )}
      {view === "shelf" && arrived && (
        <Panel key="shelf" title="Credentials" hint="Education on the wall; the tools I use on the shelf.">
          <ul className="space-y-2">
            {education.map((e) => (
              <li key={e.id} className="flex gap-3 rounded-xl border border-line bg-bg/60 p-3">
                <GraduationCap size={16} className="mt-0.5 shrink-0 text-silver" aria-hidden="true" />
                <span>
                  <span className="block text-[14px] font-medium text-ink">{e.degree}</span>
                  <span className="block text-[12px] text-muted">
                    {e.school} · {e.years} · {e.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { app: "skills" as const, label: "Skills", Icon: Cpu },
              { app: "experience" as const, label: "Work", Icon: Briefcase },
              { app: "resume" as const, label: "Resume", Icon: FileText },
            ].map(({ app, label, Icon }) => (
              <button key={app} type="button" onClick={() => actions.openApp(app)} className="btn-ghost !flex-col !gap-1 !rounded-xl !px-2 !py-2.5 text-[12px]">
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </Panel>
      )}
    </AnimatePresence>
  );
}
