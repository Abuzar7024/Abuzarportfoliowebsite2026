import React, { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { Download, FileText, Printer } from "lucide-react";
import { profile } from "../data/profile";
import { ResumeDocument } from "../components/ResumeDocument";
import { FadeIn, SectionHead } from "../components/Reveal";
import { Magnetic } from "../components/Magnetic";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

export function printResume() {
  document.body.classList.add("print-resume");
  const cleanup = () => document.body.classList.remove("print-resume");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  // Safari does not always fire afterprint
  setTimeout(cleanup, 2000);
}

export function Resume() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 95%", "start 35%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 22, mass: 0.6 });
  const rotateX = useTransform(smooth, [0, 1], [18, 0]);
  const y = useTransform(smooth, [0, 1], [90, 0]);
  const scale = useTransform(smooth, [0, 1], [0.94, 1]);
  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) || undefined;

  return (
    <section id="resume" className="section overflow-hidden" aria-labelledby="resume-title">
      <div className="container-x">
        <SectionHead
          id="resume-title"
          label="Resume"
          title="The resume, as a vector document."
          text="Real HTML, SVG and text — crisp at any zoom, indexable by ATS systems, printable to A4 and exported as a PDF."
          actions={
            <>
              <Magnetic>
                <a href={profile.links.resumePdf} download="Abuzar-Khan-Resume.pdf" className="btn-primary" data-cursor="PDF">
                  <Download size={15} /> Download Resume
                </a>
              </Magnetic>
              <button type="button" onClick={printResume} className="btn-ghost no-print">
                <Printer size={15} /> Print
              </button>
              <a href={profile.links.resumePdf} target="_blank" rel="noopener noreferrer" className="btn-link px-2 no-print">
                <FileText size={15} /> Open PDF
              </a>
            </>
          }
        />

        <div ref={ref} className="perspective-1600 mt-10 lg:mt-14">
          <motion.div
            id="resume-print-root"
            className="preserve-3d origin-top"
            style={reduced ? undefined : { rotateX, y, scale }}
          >
            <div className="rounded-lg" style={{ boxShadow: "0 60px 120px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)" }}>
              <ResumeDocument siteUrl={siteUrl} />
            </div>
          </motion.div>
        </div>

        <FadeIn className="mt-8 text-center">
          <p className="text-xs text-muted">ATS-conscious layout · semantic headings · real text · no embedded screenshots</p>
        </FadeIn>
      </div>
    </section>
  );
}
