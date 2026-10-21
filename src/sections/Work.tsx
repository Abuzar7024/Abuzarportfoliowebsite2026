import React, { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import {
  BriefcaseBusiness,
  HeartPulse,
  Lock,
  MessagesSquare,
  MonitorPlay,
  Plus,
  ScanFace,
  Shirt,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { featuredProjects, otherProjects } from "../data/projects";
import type { Project } from "../data/types";
import { Rise, SectionIndex } from "../components/animations/Reveal";
import { ProjectDialog, hostOf } from "../components/ProjectDialog";
import { useIsFinePointer, usePrefersReducedMotion } from "../hooks/useMediaQuery";

const ICONS: Record<string, typeof MonitorPlay> = {
  digitopia: MonitorPlay,
  tajneed: ShieldCheck,
  essonify: Shirt,
  tryonretail: ScanFace,
  spoto: MessagesSquare,
  "sadeeq-user": Wrench,
  "sadeeq-provider": BriefcaseBusiness,
  riayah: HeartPulse,
};

const ALL = [...featuredProjects, ...otherProjects];

/** A square tile: just enough to recognise the project. Tapping opens the full details. */
function ProjectTile({ project, index, large, onOpen }: { project: Project; index: number; large: boolean; onOpen: () => void }) {
  const fine = useIsFinePointer();
  const reduced = usePrefersReducedMotion();
  const tiltable = fine && !reduced;
  const ref = useRef<HTMLButtonElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const Icon = ICONS[project.id] ?? MonitorPlay;
  const primary = project.links.find((l) => l.primary) ?? project.links[0];

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (tiltable) {
      rx.set((0.5 - py) * 8);
      ry.set((px - 0.5) * 10);
    }
  };

  return (
    <Rise delay={(index % 5) * 0.06} className="[perspective:1000px]">
      <motion.button
        ref={ref}
        type="button"
        onClick={onOpen}
        onPointerMove={onMove}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        style={tiltable ? { rotateX: rx, rotateY: ry } : undefined}
        aria-haspopup="dialog"
        aria-label={`${project.title}: ${project.category}. Show details`}
        className={`hud group relative flex w-full flex-col text-left transition-[border-color,box-shadow] duration-300 hover:border-line-2 hover:shadow-[0_30px_80px_-40px_rgba(227,38,46,0.45)] ${
          large ? "aspect-square p-6 sm:p-7" : "aspect-square p-5"
        }`}
      >
        {/* Decoration is clipped separately so the HUD corner brackets stay visible. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          {/* Signal-red spotlight that follows the pointer. */}
          <span
            className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "radial-gradient(20rem 14rem at var(--mx, 50%) var(--my, 0%), rgba(227,38,46,0.16), transparent 70%)" }}
          />
          {/* Oversized index number as texture. */}
          <span
            className={`absolute -bottom-[0.18em] -right-[0.06em] font-brand leading-none text-transparent transition-transform duration-500 group-hover:-translate-y-1 ${
              large ? "text-[9rem]" : "text-[5.5rem]"
            }`}
            style={{ WebkitTextStroke: "1px rgba(201,207,216,0.14)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </span>

        <div className="relative flex items-start justify-between">
          <span
            className={`grid place-items-center rounded-xl border border-line-2 bg-bg-3 text-silver transition-colors group-hover:border-accent/60 group-hover:text-accent-ink ${
              large ? "h-12 w-12" : "h-10 w-10"
            }`}
          >
            <Icon size={large ? 21 : 18} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className="font-mono text-[11px] text-faint">{String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="relative mt-auto">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{project.category}</p>
          <h3 className={`mt-2 tracking-tight ${large ? "text-[2rem] leading-none sm:text-4xl" : "text-xl"}`}>{project.title}</h3>
          {large && <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-muted">{project.tagline}</p>}
          <div className={`flex items-center justify-between gap-3 border-t border-line ${large ? "mt-5 pt-4" : "mt-3 pt-3"}`}>
            <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-faint">
              {primary ? <Lock size={10} aria-hidden="true" /> : null}
              <span className="truncate">{primary ? hostOf(primary.href) : "Private build"}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-ink-2 transition-colors group-hover:text-ink">
              {large && "Details"}
              <span className="grid h-6 w-6 place-items-center rounded-full border border-line-2 transition-[transform,border-color,background] duration-300 group-hover:rotate-90 group-hover:border-accent group-hover:bg-accent">
                <Plus size={13} aria-hidden="true" />
              </span>
            </span>
          </div>
        </div>
      </motion.button>
    </Rise>
  );
}

export function Work() {
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + ALL.length) % ALL.length)), []);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section id="work" className="section" aria-labelledby="work-title">
      {/* Giant background word, skewed like a title card. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-24 overflow-hidden">
        <p
          className="-rotate-[4deg] whitespace-nowrap text-center font-brand text-[clamp(5rem,19vw,17rem)] leading-none text-transparent"
          style={{ WebkitTextStroke: "1px rgba(201,207,216,0.07)" }}
        >
          WORK · WORK
        </p>
      </div>

      <div className="shell relative">
        <SectionIndex n="03" label="Work" />
        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <Rise>
            <h2 id="work-title" className="h-section">
              Selected <span className="serif-accent text-silver">projects.</span>
            </h2>
          </Rise>
          <Rise delay={0.1}>
            <p className="measure text-muted">Tap any project to see what it does, what I built, and where to try it.</p>
          </Rise>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((p, i) => (
            <ProjectTile key={p.id} project={p} index={i} large onOpen={() => setOpen(i)} />
          ))}
        </div>

        <Rise className="mt-16">
          <h3 className="eyebrow">Also shipped</h3>
        </Rise>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {otherProjects.map((p, i) => {
            const at = featuredProjects.length + i;
            return <ProjectTile key={p.id} project={p} index={at} large={false} onOpen={() => setOpen(at)} />;
          })}
        </div>
      </div>

      <AnimatePresence>
        {open !== null && (
          <ProjectDialog key="project-dialog" project={ALL[open]} index={open} total={ALL.length} onClose={close} onStep={step} />
        )}
      </AnimatePresence>
    </section>
  );
}
