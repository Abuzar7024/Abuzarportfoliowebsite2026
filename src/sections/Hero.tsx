import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useTransform, type MotionValue } from "motion/react";
import { ArrowDown, ArrowUpRight, Download, Github, Linkedin, Mail, Move3D } from "lucide-react";
import { profile } from "../data/profile";
import { experience, yearsOfExperience } from "../data/experience";
import { projects } from "../data/projects";
import { Magnetic } from "../components/Magnetic";
import { scrollToSection } from "../lib/scroll";
import { usePrefersReducedMotion, useIsFinePointer } from "../hooks/useMediaQuery";
import type { MonolithControls } from "../three/Monolith";

const EASE = [0.16, 1, 0.3, 1] as const;
const WORDS = ["Flutter apps", "React Native apps", "React web platforms", "AI-powered products"];

const BADGES = [
  { label: "Flutter · Dart", x: "8%", y: "16%", delay: 0 },
  { label: "React · React Native", x: "70%", y: "10%", delay: 0.8 },
  { label: "Firebase · REST", x: "74%", y: "78%", delay: 1.6 },
  { label: "Computer Vision", x: "6%", y: "76%", delay: 2.4 },
];

/** Cycling word with a masked slide — the one moving element in the copy. */
function Cycle() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2600);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <motion.span layout transition={{ layout: { type: "spring", stiffness: 260, damping: 30 } }} className="relative inline-flex overflow-hidden align-baseline font-semibold">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={WORDS[i]} className="whitespace-nowrap text-ink" initial={reduced ? false : { y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? undefined : { y: "-100%", opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

/**
 * Hero: words on the left, the interactive signature object on the right (fixed scene layer).
 * The right column is the interaction surface: drag to spin, click to pulse, hover to energise.
 */
export function Hero({ progress, controls }: { progress: MotionValue<number>; controls: MonolithControls }) {
  const reduced = usePrefersReducedMotion();
  const fine = useIsFinePointer();
  const y = useTransform(progress, [0, 1], [0, -60]);
  const opacity = useTransform(progress, [0, 0.6], [1, 0]);
  const years = yearsOfExperience();
  const companies = new Set(experience.map((e) => e.company)).size;
  const drag = useRef<{ x: number; t: number } | null>(null);
  const [hint, setHint] = useState(true);

  const fade = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const now = performance.now();
    const dx = e.clientX - drag.current.x;
    const dtMs = Math.max(8, now - drag.current.t);
    controls.spin.set(controls.spin.get() + (dx / dtMs) * 0.9);
    drag.current = { x: e.clientX, t: now };
    setHint(false);
  };
  const onUp = () => {
    drag.current = null;
  };
  const onClick = () => {
    controls.pulse.set(1);
    animate(controls.pulse, 0, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    setHint(false);
  };

  return (
    <section id="home" className="relative min-h-[100svh]" aria-labelledby="hero-title">
      <motion.div className="container-x grid min-h-[100svh] grid-cols-1 items-center gap-8 pb-14 pt-[46svh] lg:grid-cols-12 lg:pb-20 lg:pt-28" style={reduced ? undefined : { y, opacity }}>
        <div className="lg:col-span-6">
          <motion.p {...fade(0.05)} className="label">
            {profile.availability}
          </motion.p>

          <h1 id="hero-title" className="h1 mt-5">
            <motion.span {...fade(0.15)} className="glitch block" data-text="Abuzar Khan">
              Abuzar Khan
            </motion.span>
            <motion.span {...fade(0.25)} className="mt-2 block text-[0.58em] font-semibold text-muted">
              Software Developer · Mobile &amp; Web
            </motion.span>
          </h1>

          <motion.p {...fade(0.4)} className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-2">
            I build <Cycle /> that actually ship — from Flutter apps used by government and healthcare teams to AI‑powered signage and modern web experiences.
          </motion.p>

          <motion.div {...fade(0.55)} className="mt-8 flex flex-wrap items-center gap-3">
            <Magnetic>
              <button type="button" onClick={() => scrollToSection("work", 72)} className="btn-primary" data-cursor="View">
                View projects <ArrowDown size={15} />
              </button>
            </Magnetic>
            <a href={profile.links.resumePdf} download="Abuzar-Khan-Resume.pdf" className="btn-ghost" data-cursor="PDF">
              Download resume <Download size={15} />
            </a>
            <button type="button" onClick={() => scrollToSection("contact", 72)} className="btn-link px-2">
              Contact <ArrowUpRight size={15} />
            </button>
          </motion.div>

          <motion.div {...fade(0.75)} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-6">
            <dl className="flex items-center gap-7">
              {[
                { v: `${years}+`, l: "years" },
                { v: String(projects.length), l: "case studies" },
                { v: String(companies), l: "companies" },
              ].map((s) => (
                <div key={s.l} className="flex items-baseline gap-1.5">
                  <dd className="font-display text-2xl font-bold leading-none text-ink">{s.v}</dd>
                  <dt className="text-xs text-muted">{s.l}</dt>
                </div>
              ))}
            </dl>
            <div className="flex items-center gap-2 sm:ml-auto">
              {[
                { href: profile.links.github, Icon: Github, label: "GitHub" },
                { href: profile.links.linkedin, Icon: Linkedin, label: "LinkedIn" },
                { href: `mailto:${profile.email}`, Icon: Mail, label: "Email" },
              ].map(({ href, Icon, label }) => (
                <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} aria-label={label} className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:border-accent/60 hover:text-accent">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* interaction surface for the object (desktop column) */}
        <div className="relative hidden h-[70vh] min-h-[420px] lg:col-span-6 lg:block">
          <div
            className="absolute inset-0 touch-none select-none"
            style={{ cursor: fine ? "grab" : undefined }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={onUp}
            onPointerEnter={() => controls.hover.set(1)}
            onMouseLeave={() => controls.hover.set(0)}
            onClick={onClick}
            role="img"
            aria-label="Interactive 3D crystal — drag to spin, click to pulse"
            data-cursor="Drag"
          />
          {/* floating tech badges with parallax */}
          {BADGES.map((b) => (
            <motion.span
              key={b.label}
              className="glass pointer-events-none absolute rounded-full px-3 py-1.5 font-mono text-[11px] text-ink-2"
              style={{ left: b.x, top: b.y }}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: [0, -8, 0] }}
              transition={reduced ? { duration: 0.6 } : { opacity: { delay: 1.2 + b.delay * 0.3, duration: 0.6 }, y: { delay: b.delay, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
              aria-hidden="true"
            >
              {b.label}
            </motion.span>
          ))}
          <AnimatePresence>
            {hint && (
              <motion.p className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.6 }}>
                <Move3D size={13} /> drag to spin · click to pulse
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* phone interaction surface: the top band where the object sits */}
      <div
        className="absolute inset-x-0 top-0 h-[44svh] touch-pan-y lg:hidden"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={onClick}
        aria-hidden="true"
      />
    </section>
  );
}
