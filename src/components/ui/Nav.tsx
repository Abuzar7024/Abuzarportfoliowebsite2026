import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";
import { useScrollLock } from "../../hooks/useScrollLock";

const LINKS = [
  { n: "01", id: "about", label: "About" },
  { n: "02", id: "experience", label: "Experience" },
  { n: "03", id: "work", label: "Work" },
  { n: "04", id: "skills", label: "Skills" },
  { n: "05", id: "resume", label: "Resume" },
  { n: "06", id: "contact", label: "Contact" },
];

/** Smooth scroll that respects Lenis when it is running. */
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(el, { offset: -70 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Nav() {
  const [active, setActive] = useState<string>("about");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress, scrollY } = useScroll();

  useScrollLock(open);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Scroll-spy: the section occupying the upper third wins.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.05, 0.25, 0.5] }
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const onNav = (id: string) => {
    setOpen(false);
    // Let the lock release before scrolling so Lenis measures correctly.
    requestAnimationFrame(() => goTo(id));
  };

  return (
    <>
      {/* progress hairline */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-accent"
      />

      <header
        className={`fixed inset-x-0 top-0 z-[55] transition-colors duration-500 ${
          scrolled ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <nav className="shell flex h-16 items-center justify-between gap-4" aria-label="Primary">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onNav("top");
            }}
            className="group inline-flex items-center gap-2.5"
            aria-label="Abuzar Khan — back to top"
          >
            <span className="flex h-7 w-7 items-center justify-center border border-accent/60 font-mono text-[11px] font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-white">
              AK
            </span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted sm:inline">
              Abuzar Khan
            </span>
          </a>

          {/* desktop */}
          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const on = active === l.id;
              return (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNav(l.id);
                    }}
                    aria-current={on ? "true" : undefined}
                    className={`relative flex items-baseline gap-1.5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                      on ? "text-ink" : "text-muted hover:text-ink-2"
                    }`}
                  >
                    <span className={on ? "text-accent" : "text-muted/60"}>{l.n}</span>
                    {l.label}
                    {on && (
                      <motion.span
                        layoutId="nav-active"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-x-2 -bottom-0.5 h-px bg-accent"
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="glass flex h-10 w-10 items-center justify-center rounded-[3px] text-ink lg:hidden"
            aria-label="Open menu"
            aria-controls="site-menu"
            aria-expanded={open}
          >
            <Menu size={17} />
          </button>
        </nav>
      </header>

      {/* mobile: a deliberate full-screen index, not a shrunken desktop bar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            id="site-menu"
            className="fixed inset-0 z-[70] flex flex-col bg-bg lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="shell flex h-16 shrink-0 items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="glass flex h-10 w-10 items-center justify-center rounded-[3px] text-ink"
                aria-label="Close menu"
              >
                <X size={17} />
              </button>
            </div>

            <ul className="shell flex flex-1 flex-col justify-center gap-1 pb-16">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNav(l.id);
                    }}
                    className="flex items-baseline gap-4 border-b border-line py-4"
                  >
                    <span className="font-mono text-[11px] text-accent">{l.n}</span>
                    <span className="font-display text-[clamp(1.75rem,8vw,2.5rem)] font-bold tracking-tight text-ink">
                      {l.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
