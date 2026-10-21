import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, X } from "lucide-react";
import type { Project, ProjectLink } from "../data/types";
import { useScrollLock } from "../hooks/useScrollLock";

export const LINK_LABEL: Record<ProjectLink["kind"], string> = {
  live: "Open",
  website: "Visit",
  appstore: "App Store",
  playstore: "Google Play",
  github: "Source",
};

export const hostOf = (href: string) => href.replace(/^https?:\/\//, "").replace(/\/$/, "");

const EASE = [0.16, 1, 0.3, 1] as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Ticks({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-[15px] leading-relaxed text-ink-2">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <Check size={15} className="mt-1 shrink-0 text-accent-ink" aria-hidden="true" />
          {t}
        </li>
      ))}
    </ul>
  );
}

/** The full write-up for one project; used by the dialog and the computer's Projects app. */
export function ProjectDetails({ project, titleId }: { project: Project; titleId?: string }) {
  const primary = project.links.find((l) => l.primary) ?? project.links[0];
  return (
    <>
      <h2 id={titleId} className="font-brand text-[clamp(1.75rem,5vw,2.75rem)] leading-tight tracking-wide">
        {project.title.toUpperCase()}
      </h2>
      <p className="lead mt-3">{project.tagline}</p>
      <p className="mt-3 font-mono text-[12px] text-muted">
        {project.role}
        {project.period ? ` · ${project.period}` : ""}
      </p>

      {project.links.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={l === primary ? "btn-primary" : "btn-ghost"}
            >
              {l.kind === "website" || l.kind === "live" ? `${LINK_LABEL[l.kind]} ${hostOf(l.href)}` : LINK_LABEL[l.kind]}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
      {primary?.note && <p className="mt-2 text-[12px] text-faint">{primary.note}</p>}

      <div className="mt-8 space-y-7">
        <Block title="Overview">
          <p className="leading-relaxed text-ink-2">{project.overview}</p>
        </Block>
        {(project.problem || project.solution) && (
          <div className="grid gap-7 sm:grid-cols-2">
            {project.problem && (
              <Block title="The problem">
                <p className="text-[15px] leading-relaxed text-muted">{project.problem}</p>
              </Block>
            )}
            {project.solution && (
              <Block title="The solution">
                <p className="text-[15px] leading-relaxed text-muted">{project.solution}</p>
              </Block>
            )}
          </div>
        )}
        <Block title="What I did">
          <Ticks items={project.contribution} />
        </Block>
        <Block title="Key features">
          <ul className="flex flex-wrap gap-2">
            {project.features.map((f) => (
              <li key={f} className="rounded-lg border border-line bg-bg/50 px-3 py-1.5 text-[13px] text-ink-2">
                {f}
              </li>
            ))}
          </ul>
        </Block>
        <Block title="Tech">
          <ul className="flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
          {project.techNote && <p className="mt-3 text-[13px] leading-relaxed text-faint">{project.techNote}</p>}
        </Block>
        {project.verifiedNote && <p className="text-[12px] text-faint">{project.verifiedNote}</p>}
      </div>
    </>
  );
}

/**
 * Full project details, opened from a project card. Esc closes, ←/→ step
 * through the list, focus returns to the card that opened it.
 */
export function ProjectDialog({
  project,
  index,
  total,
  onClose,
  onStep,
}: {
  project: Project;
  index: number;
  total: number;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}) {
  useScrollLock(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [project.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <button
        type="button"
        aria-label="Close project details"
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-[#0b0c0e]/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-dialog-title"
        className="hud relative flex max-h-[92svh] w-full max-w-3xl flex-col !rounded-b-none sm:!rounded-2xl"
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{ background: "linear-gradient(180deg, #202328, #18191d)" }}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            <span className="text-accent-ink">{String(index + 1).padStart(2, "0")}</span> / {String(total).padStart(2, "0")} ·{" "}
            {project.category}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStep(-1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink-2 transition-colors hover:text-ink"
              aria-label="Previous project"
            >
              <ArrowLeft size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink-2 transition-colors hover:text-ink"
              aria-label="Next project"
            >
              <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink transition-colors hover:border-accent/60"
              aria-label="Close"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div ref={bodyRef} className="scrollbar-thin overflow-y-auto overscroll-contain px-6 pb-8 pt-7 sm:px-8">
          <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <ProjectDetails project={project} titleId="project-dialog-title" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
