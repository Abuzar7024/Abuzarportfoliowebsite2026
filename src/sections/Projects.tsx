import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { compactProjects, flagshipProjects, largeProjects, projectById, projects } from "../data/projects";
import type { Project } from "../data/types";
import { useRenderProfile } from "../hooks/useDeviceTier";
import { DeviceFigure } from "../components/DeviceFigure";
import { DeviceFallback } from "../components/Fallbacks";
import { FadeIn, SectionHead } from "../components/Reveal";
import { TiltCard } from "../components/TiltCard";
import { StoreBadges } from "../components/StoreBadges";
import { ProjectDetail } from "./ProjectDetail";

const HASH_PREFIX = "#project=";

function readHash(): string | null {
  if (typeof window === "undefined") return null;
  const h = window.location.hash;
  return h.startsWith(HASH_PREFIX) ? decodeURIComponent(h.slice(HASH_PREFIX.length)) : null;
}

function CaseButton({ project, onOpen, className = "btn-primary", iconOnly = false }: { project: Project; onOpen: (p: Project) => void; className?: string; iconOnly?: boolean }) {
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(project);
      }}
      aria-label={`See details for ${project.title}`}
      data-cursor="Open"
    >
      {!iconOnly && "See details "}
      <ArrowUpRight size={iconOnly ? 18 : 15} />
    </button>
  );
}


/** Vector blueprint grid + accent glow behind a device. */
function Blueprint({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: `radial-gradient(70% 60% at 50% 60%, ${accent}22, transparent 70%)` }} />
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`bp-${accent.replace("#", "")}`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#bp-${accent.replace("#", "")})`} />
        <circle cx="50%" cy="58%" r="38%" fill="none" stroke={accent} strokeOpacity="0.5" strokeDasharray="4 8" />
        <circle cx="50%" cy="58%" r="26%" fill="none" stroke="rgba(255,255,255,0.35)" strokeDasharray="2 6" />
      </svg>
      <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">live preview</span>
    </div>
  );
}

function TechBar({ tech, accent }: { tech: string[]; accent: string }) {
  const palette = [accent, "#ffb38a", "#8fd3ff", "#c792ea", "#82e0aa", "#f5b942"];
  const shown = tech.slice(0, 6);
  return (
    <div aria-hidden="true">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {shown.map((t, i) => (
          <span key={t} className="h-full" style={{ width: `${100 / shown.length}%`, background: palette[i % palette.length], opacity: 0.9 - i * 0.08 }} />
        ))}
      </div>
    </div>
  );
}

function RepoBar({ project, index }: { project: Project; index: number }) {
  const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return (
    <div className="flex items-center gap-3 border-b border-line bg-white/[0.02] px-4 py-2.5 font-mono text-[12px]">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </span>
      <span className="min-w-0 flex-1 truncate text-ink-2">{project.title}</span>
      <span className="hidden text-muted sm:inline">{String(index + 1).padStart(2, "0")}</span>
      <span className="chip !py-0 !text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" /> live now
      </span>
    </div>
  );
}

/** Featured project: a wide card with the 3D device on one side and the story on the other. */
function Featured({ project, index, onOpen }: { project: Project; index: number; onOpen: (p: Project) => void }) {
  const profile = useRenderProfile();
  const flip = index % 2 === 1;
  const live = project.links.find((l) => l.primary) ?? project.links[0];
  return (
    <FadeIn amount={0.2}>
      <motion.article layoutId={`card-${project.id}`} className="card card-hover hud cursor-pointer overflow-hidden" onClick={() => onOpen(project)} data-cursor="Open">
        <RepoBar project={project} index={index} />
        <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className={`relative min-h-[300px] sm:min-h-[380px] lg:col-span-7 lg:min-h-[460px] ${flip ? "lg:order-2" : ""}`}>
          <Blueprint accent={project.accent} />
          <DeviceFigure project={project} profile={profile} className="absolute inset-0" interactive highTierOnly scale={project.device === "phone" ? 1.05 : 0.98} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-2/90 to-transparent" aria-hidden="true" />
        </div>
        <div className={`flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 ${flip ? "lg:order-1" : ""}`}>
          <div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[11px] text-muted">{String(index + 1).padStart(2, "0")}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: project.accent }}>
                {project.category}
              </span>
            </p>
            <motion.h3 layoutId={`title-${project.id}`} className="mt-4 font-display text-[clamp(1.75rem,2.6vw,2.4rem)] font-bold leading-tight tracking-tight">
              {project.title}
            </motion.h3>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{project.tagline}</p>
            <p className="mt-2 text-sm text-muted">My role: {project.role}</p>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {project.features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-3 py-2.5 text-sm text-ink-2">
                  <span className="h-px w-4 shrink-0 bg-accent" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
              {project.tech.slice(0, 6).map((t) => (
                <li key={t} className="chip !px-2.5 !text-[11px]">
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <TechBar tech={project.tech} accent={project.accent} />
            </div>
            <StoreBadges links={project.links} className="mt-4" compact />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CaseButton project={project} onOpen={onOpen} />
            {live && (
              <a href={live.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="btn-ghost" data-cursor="Live">
                {live.label} <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
        </div>
      </motion.article>
    </FadeIn>
  );
}

function Card({ project, onOpen, delay }: { project: Project; onOpen: (p: Project) => void; delay: number }) {
  const profile = useRenderProfile();
  return (
    <FadeIn delay={delay} className="h-full">
      <TiltCard max={5} className="h-full">
        <motion.article layoutId={`card-${project.id}`} className="card card-hover group flex h-full cursor-pointer flex-col overflow-hidden" onClick={() => onOpen(project)} data-cursor="Open">
          <div className="relative h-72 overflow-hidden sm:h-80">
            <Blueprint accent={project.accent} />
            {profile.tier === "high" ? (
              <DeviceFigure project={project} profile={profile} className="absolute inset-0" interactive scale={0.9} />
            ) : (
              <div className="absolute inset-x-0 top-6 bottom-[-35%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-3">
                <DeviceFallback kind={project.device} screen={project.screen} accent={project.accent} className="h-full w-full" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-2 to-transparent" />
          </div>
          <div className="flex flex-1 flex-col p-6">
            <p className="flex items-center justify-between gap-3 font-mono text-[11px]">
              <span className="uppercase tracking-[0.12em]" style={{ color: project.accent }}>
                {project.category}
              </span>
              <span className="text-muted">{project.kind === "mobile" ? "phone app" : project.kind === "web" ? "website" : "platform"}</span>
            </p>
            <motion.h3 layoutId={`title-${project.id}`} className="mt-2 font-display text-xl font-bold tracking-tight">
              {project.title}
            </motion.h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{project.tagline}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
              {project.tech.slice(0, 4).map((t) => (
                <li key={t} className="chip !px-2.5 !text-[11px]">
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <TechBar tech={project.tech} accent={project.accent} />
            </div>
            <StoreBadges links={project.links.slice(0, 2)} className="mt-4" compact />
            <div className="mt-auto flex items-center justify-between pt-5">
              <span className="text-xs text-muted">{project.role}</span>
              <CaseButton project={project} onOpen={onOpen} className="btn-link" />
            </div>
          </div>
        </motion.article>
      </TiltCard>
    </FadeIn>
  );
}

function Compact({ project, onOpen }: { project: Project; onOpen: (p: Project) => void }) {
  return (
    <FadeIn>
      <motion.article layoutId={`card-${project.id}`} className="card card-hover grid grid-cols-1 cursor-pointer gap-4 p-6 lg:grid-cols-12 lg:items-center sm:p-7" onClick={() => onOpen(project)} data-cursor="Open">
        <div className="lg:col-span-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: project.accent }}>
            {project.category}
          </p>
          <motion.h3 layoutId={`title-${project.id}`} className="mt-2 font-display text-xl font-bold tracking-tight">
            {project.title}
          </motion.h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">{project.tagline}</p>
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
            {project.tech.slice(0, 6).map((t) => (
              <li key={t} className="chip !px-2.5 !text-[11px]">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-4 lg:justify-self-end">
          <CaseButton project={project} onOpen={onOpen} className="btn-ghost" />
        </div>
      </motion.article>
    </FadeIn>
  );
}

export function Projects() {
  const [activeId, setActiveId] = useState<string | null>(() => readHash());
  const active = activeId ? projectById(activeId) ?? null : null;

  const open = useCallback((p: Project) => {
    setActiveId(p.id);
    history.pushState({ project: p.id }, "", `${HASH_PREFIX}${p.id}`);
  }, []);
  const close = useCallback(() => {
    setActiveId(null);
    if (window.location.hash.startsWith(HASH_PREFIX)) history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);
  const navigate = useCallback((dir: 1 | -1) => {
    setActiveId((current) => {
      const idx = projects.findIndex((p) => p.id === current);
      const next = projects[(idx + dir + projects.length) % projects.length];
      history.replaceState({ project: next.id }, "", `${HASH_PREFIX}${next.id}`);
      return next.id;
    });
  }, []);

  useEffect(() => {
    const onPop = () => setActiveId(readHash());
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  return (
    <section id="work" className="section" aria-labelledby="work-title">
      <div className="container-x">
        <SectionHead id="work-title" label="My work" title="Real apps, real users." text="Every one of these is live right now — on the App Store, Google Play or the web. Tap any project to see what it does, what I built, and try it yourself." />

        <div className="mt-10 space-y-6 lg:mt-14">
          {flagshipProjects.map((p, i) => (
            <Featured key={p.id} project={p} index={i} onOpen={open} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {largeProjects.map((p, i) => (
            <Card key={p.id} project={p} onOpen={open} delay={i * 0.06} />
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {compactProjects.map((p) => (
            <Compact key={p.id} project={p} onOpen={open} />
          ))}
        </div>
      </div>

      <AnimatePresence>{active && <ProjectDetail key="project-detail" project={active} onClose={close} onNavigate={navigate} />}</AnimatePresence>
    </section>
  );
}
