import React, { useRef } from "react";
import { motion, useInView, type Variants } from "motion/react";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise on enter. The workhorse reveal. */
export function Rise({
  children,
  delay = 0,
  y = 22,
  className,
  once = true,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
  as?: "div" | "section" | "li" | "article" | "header";
}) {
  const reduced = usePrefersReducedMotion();
  const M = motion[Tag] as typeof motion.div;
  return (
    <M
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.85, delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

/**
 * Editorial line reveal: each line slides up from behind a mask.
 * Pass an array of strings; each becomes its own masked line.
 */
export function MaskLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.085,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <span ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={`${line}-${i}`} className="clip-reveal">
          <motion.span
            className={`block ${lineClassName ?? ""}`}
            initial={reduced ? false : { y: "110%" }}
            animate={inView || reduced ? { y: "0%" } : undefined}
            transition={{ duration: 0.95, delay: delay + i * stagger, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Staggers its children on enter. Children should be <Stagger.Item>. */
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

export function Stagger({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "section";
}) {
  const reduced = usePrefersReducedMotion();
  const M = motion[Tag] as typeof motion.div;
  return (
    <M
      className={className}
      variants={reduced ? undefined : containerVariants}
      initial={reduced ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {children}
    </M>
  );
}

export function StaggerItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduced = usePrefersReducedMotion();
  const M = motion[Tag] as typeof motion.div;
  return (
    <M className={className} variants={reduced ? undefined : itemVariants}>
      {children}
    </M>
  );
}

/** Section index marker: 01 / WORK */
export function SectionIndex({ n, label, className = "" }: { n: string; label: string; className?: string }) {
  return (
    <Rise className={`sec-index ${className}`}>
      <b>{n}</b>
      <span aria-hidden="true" className="h-px w-8 bg-line-2" />
      <span>{label}</span>
    </Rise>
  );
}
