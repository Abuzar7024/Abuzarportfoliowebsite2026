import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Apple, ArrowLeft, ArrowRight, Check, ExternalLink, Github, Globe, Play, ShieldCheck, X } from "lucide-react";
import type { Project, ProjectLink } from "../data/types";
import { projects } from "../data/projects";
import { useRenderProfile } from "../hooks/useDeviceTier";
import { useScrollLock } from "../hooks/useScrollLock";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { DeviceFigure } from "../components/DeviceFigure";

const LINK_ICON: Record<ProjectLink["kind"], React.ComponentType<{ size?: number }>> = {
  live: ExternalLink,
  playstore: Play,
  appstore: Apple,
  github: Github,
  website: Globe,
};

function Block({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={wide ? "md:col-span-2" : ""} aria-label={title}>
      <h3 className="eyebrow">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it} className="flex gap-3 text-sm leading-relaxed text-ink-2">
          <Check size={15} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProjectDetail({ project, onClose, onNavigate }: { project: Project; onClose: () => void; onNavigate: (dir: 1 | -1) => void }) {
  const profile = useRenderProfile();
  const reduced = usePrefersReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** The card we expanded from — kept stable while navigating between projects so the close animation returns there. */
  const [originId] = useState(project.id);
  useScrollLock(true);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeRef.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(1);
      if (e.key === "ArrowLeft") onNavigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose, onNavigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [project.id]);

  const index = projects.findIndex((p) => p.id === project.id);
  const next = projects[(index + 1) % projects.length];
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const primary = project.links.find((l) => l.primary) ?? project.links[0];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] flex items-stretch justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`project-title-${project.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <motion.div className="absolute inset-0 bg-bg/90 backdrop-blur-2xl" onClick={onClose} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse at 70% 0%, ${project.accent}1f, transparent 55%)` }} aria-hidden="true" />

      <motion.div
        layoutId={`card-${originId}`}
        transition={{ type: "spring", stiffness: 300, damping: 34, mass: 0.8 }}
        className="relative m-0 flex w-full max-w-[1200px] flex-col overflow-hidden border-line bg-bg-2 sm:m-4 sm:rounded-[var(--radius-xl)] sm:border lg:m-6"
        style={{ boxShadow: "0 40px 120px -30px rgba(0,0,0,0.9)" }}
      >
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onNavigate(-1)} className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:text-ink" aria-label={`Previous project: ${prev.title}`}>
              <ArrowLeft size={16} />
            </button>
            <button type="button" onClick={() => onNavigate(1)} className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:text-ink" aria-label={`Next project: ${next.title}`}>
              <ArrowRight size={16} />
            </button>
            <span className="ml-2 hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted sm:inline">
              {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
            </span>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="glass flex h-10 items-center gap-2 rounded-full px-4 text-sm text-ink-2 hover:text-ink" aria-label="Close case study">
            Close <X size={16} />
          </button>
        </div>

        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain">
          {/* hero */}
          <div className="grid gap-6 px-5 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:px-12 lg:pt-12">
            <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="mono-label" style={{ color: project.accent }}>
                  {project.category}
                </span>
                {project.period && <span className="mono-label">{project.period}</span>}
              </div>
              <motion.h2 layoutId={project.id === originId ? `title-${project.id}` : undefined} id={`project-title-${project.id}`} className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {project.title}
              </motion.h2>
              <p className="lead mt-4">{project.tagline}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="mono-label">My role</dt>
                  <dd className="mt-1 text-ink">{project.role}</dd>
                </div>
                <div>
                  <dt className="mono-label">Platform</dt>
                  <dd className="mt-1 capitalize text-ink">{project.kind === "platform" ? "Web platform + devices" : project.kind}</dd>
                </div>
              </dl>
              <div className="mt-7 flex flex-wrap gap-3">
                {project.links.map((l) => {
                  const Icon = LINK_ICON[l.kind];
                  return (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={l.primary ? "btn-primary" : "btn-ghost"} data-cursor="Open" title={l.note}>
                      <Icon size={15} /> {l.label}
                    </a>
                  );
                })}
              </div>
              {primary?.note && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
                  <ShieldCheck size={12} /> {primary.note}
                </p>
              )}
            </motion.div>

            <motion.div
              className="relative min-h-[300px] sm:min-h-[380px] lg:min-h-[460px]"
              initial={reduced ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <DeviceFigure project={project} profile={profile} className="absolute inset-0" eager scale={project.device === "phone" ? 1.02 : 0.98} />
            </motion.div>
          </div>

          {/* body */}
          <motion.div
            className="grid gap-10 px-5 py-10 sm:px-8 md:grid-cols-2 lg:gap-x-14 lg:px-12 lg:py-14"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Block title="Overview" wide>
              <p className="max-w-3xl text-base leading-relaxed text-ink-2">{project.overview}</p>
            </Block>

            {project.problem && (
              <Block title="Problem">
                <p className="text-sm leading-relaxed text-ink-2">{project.problem}</p>
              </Block>
            )}
            {project.solution && (
              <Block title="Solution">
                <p className="text-sm leading-relaxed text-ink-2">{project.solution}</p>
              </Block>
            )}

            <Block title="My contribution" wide={!project.product}>
              <Bullets items={project.contribution} />
            </Block>

            {project.product && (
              <Block title="Product">
                <Bullets items={project.product} />
              </Block>
            )}

            <Block title="Key features">
              <ul className="grid gap-2 sm:grid-cols-2">
                {project.features.map((f) => (
                  <li key={f} className="rounded-xl border border-line bg-white/[0.02] px-3.5 py-2.5 text-sm text-ink-2">
                    {f}
                  </li>
                ))}
              </ul>
            </Block>

            <Block title="Technology">
              <ul className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li key={t} className="chip chip-accent">
                    {t}
                  </li>
                ))}
              </ul>
              {project.techNote && <p className="mt-3 text-xs leading-relaxed text-muted">{project.techNote}</p>}
            </Block>

            {project.highlights && (
              <Block title="Highlights" wide>
                <Bullets items={project.highlights} />
              </Block>
            )}

            {project.result && (
              <Block title="Result" wide>
                <p className="text-sm leading-relaxed text-ink-2">{project.result}</p>
              </Block>
            )}

            <div className="md:col-span-2">
              <div className="divider" />
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  {primary && (
                    <a href={primary.href} target="_blank" rel="noopener noreferrer" className="btn-primary" data-cursor="Open">
                      {primary.label} <ExternalLink size={14} />
                    </a>
                  )}
                  <button type="button" onClick={() => onNavigate(1)} className="btn-ghost">
                    Next: {next.title} <ArrowRight size={14} />
                  </button>
                </div>
                {project.verifiedNote && <p className="text-xs text-muted">{project.verifiedNote}</p>}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
