import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Menu, Orbit, X } from "lucide-react";
import { profile } from "../data/profile";
import { scrollToSection } from "../lib/scroll";
import { useScrollLock } from "../hooks/useScrollLock";

export const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
] as const;

/** Tracks which section is under the upper third of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const els = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

export function Nav({ motionOn, onToggleMotion }: { motionOn: boolean; onToggleMotion: () => void }) {
  const active = useActiveSection();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useScrollLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    // Let the sheet close (and the scroll lock release) before scrolling.
    setTimeout(() => scrollToSection(id), open ? 220 : 0);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <header
        className={`fixed z-[60] rounded-t-[18px] transition-[background,border-color,backdrop-filter] duration-300 sm:rounded-t-[22px] ${
          scrolled || open ? "border-b border-line bg-bg/75 backdrop-blur-xl" : "border-b border-transparent"
        }`}
        style={{ top: "var(--frame)", left: "var(--frame)", right: "var(--frame)" }}
      >
        <nav className="shell flex h-16 items-center justify-between gap-4" aria-label="Primary">
          <a href="#top" onClick={go("top")} className="group flex items-center gap-2.5" aria-label="Abuzar Khan, back to top">
            <span
              aria-hidden="true"
              className="relative grid h-8 w-8 place-items-center rounded-lg border border-line-2 bg-bg-2 font-brand text-[10px] text-silver transition-colors group-hover:border-accent/60"
            >
              AK
              <span className="absolute -bottom-px left-1/2 h-px w-3 -translate-x-1/2 bg-accent" />
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight">
              {profile.name}
              <span className="text-accent">.</span>
            </span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={go(n.id)}
                  aria-current={active === n.id ? "true" : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-[13.5px] transition-colors ${
                    active === n.id ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {active === n.id && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full border border-line-2 bg-white/[0.04]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  {n.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMotion}
              aria-pressed={motionOn}
              aria-label={motionOn ? "Pause 3D motion" : "Resume 3D motion"}
              title={motionOn ? "Pause 3D motion" : "Resume 3D motion"}
              className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
                motionOn ? "border-line-2 text-silver hover:text-ink" : "border-accent/50 text-accent-ink"
              }`}
            >
              <Orbit size={15} strokeWidth={1.75} className={motionOn ? "" : "opacity-60"} aria-hidden="true" />
            </button>
            <a
              href={profile.links.resumePdf}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost hidden !px-4 !py-2 sm:inline-flex"
            >
              <FileText size={14} aria-hidden="true" />
              Resume
            </a>
            <a href="#contact" onClick={go("contact")} className="btn-primary hidden !px-4 !py-2 md:inline-flex">
              Let's talk
            </a>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-line-2 text-ink md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[57] bg-bg/95 pt-24 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="shell flex flex-col">
              {NAV_ITEMS.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.3 }}
                  className="border-b border-line"
                >
                  <a href={`#${n.id}`} onClick={go(n.id)} className="flex items-baseline justify-between py-5">
                    <span className="font-display text-3xl font-semibold">{n.label}</span>
                    <span className="font-mono text-xs text-muted">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="shell mt-8 flex gap-3">
              <a href={profile.links.resumePdf} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1">
                <FileText size={14} aria-hidden="true" />
                Resume
              </a>
              <a href="#contact" onClick={go("contact")} className="btn-primary flex-1">
                Let's talk
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
