import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Plus } from "lucide-react";
import { archiveProjects, featuredProjects } from "../../data/projects";
import type { Project } from "../../data/types";
import type { RenderProfile } from "../../hooks/useDeviceTier";
import { ProjectShowcase } from "../projects/ProjectShowcase";
import { Rise, SectionIndex, Stagger, StaggerItem } from "../animations/Reveal";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

/** Compact row for the archive - verified older work, kept but not competing for attention. */
function ArchiveRow({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <StaggerItem as="li">
      <button
        type="button"
        onClick={onOpen}
        data-cursor="View"
        className="group grid w-full grid-cols-1 items-baseline gap-2 border-t border-line py-6 text-left transition-colors hover:border-accent/50 sm:grid-cols-12 sm:gap-6"
      >
        <span className="t-h3 transition-colors group-hover:text-accent sm:col-span-4">{project.title}</span>
        <span className="text-[14px] leading-relaxed text-muted sm:col-span-6">{project.tagline}</span>
        <span className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:col-span-2 sm:justify-end">
          {project.category}
          <ArrowUpRight
            size={15}
            className="shrink-0 text-accent opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </span>
      </button>
    </StaggerItem>
  );
}

export function Work({ profile, onOpen }: { profile: RenderProfile; onOpen: (p: Project) => void }) {
  const [showArchive, setShowArchive] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <section id="work" className="section !pt-0" aria-labelledby="work-title">
      <div className="shell">
        <SectionIndex n="03" label="Selected Work" />
        <Rise className="mt-8">
          <h2 id="work-title" className="t-h2 measure-tight">
            Products I have built and shipped.
          </h2>
        </Rise>
      </div>

      {/* featured acts */}
      <div className="mt-6">
        {featuredProjects.map((p, i) => (
          <ProjectShowcase key={p.id} project={p} index={i} profile={profile} onOpen={() => onOpen(p)} />
        ))}
      </div>

      {/* archive */}
      <div className="shell mt-8">
        <div className="rule" />
        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <h3 className="t-h3">More selected work</h3>
          <button
            type="button"
            onClick={() => setShowArchive((v) => !v)}
            aria-expanded={showArchive}
            aria-controls="project-archive"
            className="btn-ghost"
          >
            <motion.span
              aria-hidden="true"
              animate={{ rotate: showArchive ? 45 : 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex"
            >
              <Plus size={15} />
            </motion.span>
            {showArchive ? "Hide" : `Show ${archiveProjects.length}`}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showArchive && (
            <motion.div
              id="project-archive"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <Stagger as="ul" className="mt-8 border-b border-line">
                {archiveProjects.map((p) => (
                  <ArchiveRow key={p.id} project={p} onOpen={() => onOpen(p)} />
                ))}
              </Stagger>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
