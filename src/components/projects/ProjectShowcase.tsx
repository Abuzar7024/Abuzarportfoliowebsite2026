import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "../../data/types";
import type { RenderProfile } from "../../hooks/useDeviceTier";
import { DeviceFigure } from "../DeviceFigure";
import { MaskLines, Rise } from "../animations/Reveal";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

/**
 * A full-bleed project act. Each one owns a screenful: large index numeral,
 * editorial type on one side, a live 3D device on the other. The device
 * parallaxes and tilts as the act scrolls through, so the showcase reads as a
 * camera move rather than a list of cards.
 */
export function ProjectShowcase({
  project,
  index,
  profile,
  onOpen,
}: {
  project: Project;
  index: number;
  profile: RenderProfile;
  onOpen: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Camera-like move: the device drifts up and rotates a few degrees across the act.
  const deviceY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["14%", "-14%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [4.5, -4.5]);
  const numeralY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["30%", "-30%"]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.4, 0.15]);

  // Alternate which side the device sits on.
  const flipped = index % 2 === 1;

  return (
    <section
      ref={ref}
      className="relative py-[clamp(4rem,10vh,8rem)]"
      aria-labelledby={`showcase-${project.id}`}
    >
      {/* per-project ambient wash - the environment evolves project to project */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          opacity: glow,
          background: `radial-gradient(60rem 40rem at ${flipped ? "15%" : "85%"} 40%, ${project.accent}22, transparent 65%)`,
        }}
      />

      <div className="shell">
        <div
          className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14 ${
            flipped ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          {/* copy */}
          <div className="lg:col-span-6">
            <div className="flex items-baseline gap-4">
              <motion.span
                aria-hidden="true"
                style={{ y: numeralY }}
                className="font-display text-[clamp(3rem,7vw,6rem)] font-extrabold leading-none tracking-tighter text-white/[0.07]"
              >
                {String(index + 1).padStart(2, "0")}
              </motion.span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                {project.category}
              </span>
            </div>

            <h3 id={`showcase-${project.id}`} className="mt-2">
              <MaskLines lines={[project.title]} lineClassName="t-h1" />
            </h3>

            <Rise delay={0.12}>
              <p className="t-body measure mt-6">{project.tagline}</p>
            </Rise>

            {project.facets && (
              <Rise delay={0.2}>
                <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                  {project.facets.map((f) => (
                    <li key={f} className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                      {f}
                    </li>
                  ))}
                </ul>
              </Rise>
            )}

            <Rise delay={0.28}>
              <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                {project.tech.slice(0, 5).map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
            </Rise>

            <Rise delay={0.36} className="mt-9">
              <button type="button" onClick={onOpen} className="btn-primary" data-cursor="View" data-project-open={project.id}>
                View case study <ArrowUpRight size={15} />
              </button>
            </Rise>
          </div>

          {/* device */}
          <div className="lg:col-span-6">
            <motion.div
              style={{ y: deviceY, rotate }}
              className="relative mx-auto h-[clamp(20rem,46vh,32rem)] w-full max-w-[34rem]"
            >
              <DeviceFigure
                project={project}
                profile={profile}
                className="absolute inset-0"
                highTierOnly
                scale={project.device === "phone" ? 1 : 0.95}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
