import React, { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { Download, Maximize2, Printer, X } from "lucide-react";
import { profile } from "../../data/profile";
import { experience, education } from "../../data/experience";
import { skills } from "../../data/skills";
import { featuredProjects } from "../../data/projects";
import { ResumeDocument } from "../ResumeDocument";
import { Rise, SectionIndex } from "../animations/Reveal";
import { usePrefersReducedMotion, useIsFinePointer } from "../../hooks/useMediaQuery";
import { useScrollLock } from "../../hooks/useScrollLock";

/** Quick-read summary of what is inside the document. */
const SUMMARY = [
  { k: "Experience", v: `${experience.length} roles` },
  { k: "Skills", v: `${skills.length} technologies` },
  { k: "Projects", v: `${featuredProjects.length} featured` },
  { k: "Education", v: `${education.length} entries` },
];

/**
 * Interactive resume: a real, tilting preview of the actual printable
 * document, expandable to full screen, with print and download paths.
 */
export function Resume() {
  const reduced = usePrefersReducedMotion();
  const fine = useIsFinePointer();
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pointer-driven tilt on the paper.
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const transform = useMotionTemplate`perspective(1600px) rotateX(${rx}deg) rotateY(${ry}deg)`;

  const onMove = (e: React.MouseEvent) => {
    if (!fine || reduced || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 9);
    rx.set(-py * 7);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const print = () => {
    document.body.classList.add("print-resume");
    window.print();
    window.setTimeout(() => document.body.classList.remove("print-resume"), 500);
  };

  useScrollLock(expanded);

  React.useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <section id="resume" className="section" aria-labelledby="resume-title">
      <div className="shell">
        <SectionIndex n="06" label="Resume" />

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <Rise>
              <h2 id="resume-title" className="t-h2 measure-tight">
                The whole thing, on one page.
              </h2>
            </Rise>
            <Rise delay={0.12}>
              <p className="t-body measure mt-6">
                Experience, skills, projects and education — the same document you can print or
                download, previewed live.
              </p>
            </Rise>

            <Rise delay={0.2}>
              <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-6">
                {SUMMARY.map((s) => (
                  <div key={s.k}>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{s.k}</dt>
                    <dd className="mt-1.5 font-display text-[19px] font-bold text-ink">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </Rise>

            <Rise delay={0.3} className="mt-10 flex flex-wrap gap-3">
              <a href={profile.links.resumePdf} download className="btn-primary" data-cursor="Save">
                <Download size={15} /> Download resume
              </a>
              <button type="button" onClick={print} className="btn-ghost">
                <Printer size={15} /> Print
              </button>
            </Rise>
          </div>

          {/* live preview */}
          <div className="lg:col-span-7">
            <Rise delay={0.15}>
              <motion.div
                ref={cardRef}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                style={{ transform: reduced ? undefined : transform }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-[3px] border border-line bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]">
                  {/* scaled-down real document, kept inside the column */}
                  <div className="pointer-events-none w-full origin-top-left" style={{ transform: "scale(0.92)", width: "108.695%" }}>
                    <ResumeDocument />
                  </div>
                  {/* fade so the crop reads as intentional */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="btn-ghost absolute bottom-4 left-1/2 -translate-x-1/2"
                  data-cursor="Open"
                >
                  <Maximize2 size={14} /> Read full resume
                </button>
              </motion.div>
            </Rise>
          </div>
        </div>
      </div>

      {/* full-screen reader */}
      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full resume"
          className="fixed inset-0 z-[90] flex flex-col bg-bg/95 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-[var(--gutter)] py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              {profile.name} — Resume
            </p>
            <div className="flex gap-2">
              <a href={profile.links.resumePdf} download className="btn-ghost !min-h-10 !px-4 !py-2">
                <Download size={14} /> Download
              </a>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="btn-ghost !min-h-10 !px-4 !py-2"
                aria-label="Close resume"
              >
                Close <X size={14} />
              </button>
            </div>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain p-[var(--gutter)]">
            <div className="mx-auto w-full max-w-[52rem] overflow-hidden rounded-[3px] bg-white shadow-2xl">
              <ResumeDocument />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
