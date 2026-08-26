import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { profile } from "../data/profile";
import { scrollToSection } from "../lib/scroll";
import { useScrollLock } from "../hooks/useScrollLock";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

export const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "stack", label: "Skills" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
];

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center rounded-xl border border-white/10 bg-bg-2" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size * 0.6} height={size * 0.6}>
        <path d="M32 12 14 50h9l3.4-8.5h11.2L41 50h9L32 12zm0 12.6 3.9 10H28.1l3.9-10z" fill="#ff2b3d" />
      </svg>
    </span>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const firstLink = useRef<HTMLButtonElement>(null);
  useScrollLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = ["home", ...NAV_ITEMS.map((n) => n.id)];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.1, 0.25] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => firstLink.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    setTimeout(() => scrollToSection(id, 72), open ? 100 : 0);
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to content
      </a>

      <motion.div className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent" style={{ scaleX: progress }} aria-hidden="true" />

      <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${scrolled ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent"}`}>
        <div className="container-x flex h-[72px] items-center justify-between gap-4">
          <motion.button type="button" onClick={() => go("home")} className="flex items-center gap-3 rounded-full" aria-label="Back to top" initial={reduced ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
            <LogoMark />
            <span className="text-sm font-semibold tracking-tight text-ink">{profile.name}</span>
          </motion.button>

          <motion.nav aria-label="Primary" className="hidden items-center gap-1 lg:flex" initial={reduced ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.id;
              return (
                <button key={item.id} type="button" onClick={() => go(item.id)} aria-current={isActive ? "location" : undefined} className={`relative rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${isActive ? "text-ink" : "text-muted hover:text-ink"}`}>
                  {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white/[0.07]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </motion.nav>

          <motion.div className="flex items-center gap-2" initial={reduced ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}>
            <a href={`mailto:${profile.email}`} className="btn-primary hidden !min-h-0 !px-4 !py-2 text-[13px] sm:inline-flex" data-cursor="Mail">
              Hire me <ArrowUpRight size={14} />
            </a>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="site-menu" aria-label={open ? "Close menu" : "Open menu"} className="glass flex h-11 w-11 items-center justify-center rounded-full text-ink lg:hidden">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </motion.div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div id="site-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-40 flex flex-col bg-bg/95 backdrop-blur-2xl lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="container-x flex flex-1 flex-col justify-center gap-1 pt-24 pb-10">
              {[{ id: "home", label: "Home" }, ...NAV_ITEMS].map((item, i) => (
                <motion.button key={item.id} ref={i === 0 ? firstLink : undefined} type="button" onClick={() => go(item.id)} className={`flex items-center justify-between border-b border-line py-4 text-left font-display text-2xl font-bold tracking-tight ${active === item.id ? "text-accent" : "text-ink"}`} initial={reduced ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 + i * 0.04 }}>
                  {item.label}
                  <span className="font-mono text-xs text-muted">0{i + 1}</span>
                </motion.button>
              ))}
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  GitHub
                </a>
                <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  LinkedIn
                </a>
                <a href={`mailto:${profile.email}`} className="btn-primary">
                  Email me
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
