import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

const EASE = [0.16, 1, 0.3, 1] as const;

interface FadeInProps extends React.ComponentProps<typeof motion.div> {
  delay?: number;
  amount?: number;
  once?: boolean;
  y?: number;
}

export function FadeIn({ children, delay = 0, amount = 0.25, once = true, y = 22, ...rest }: FadeInProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once, amount }} transition={{ duration: 0.7, ease: EASE, delay }} {...rest}>
      {children}
    </motion.div>
  );
}

/** Consistent section header: label, title, optional description — left aligned, comfortable widths. */
export function SectionHead({ label, title, text, id, actions }: { label: string; title: string; text?: string; id?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <FadeIn className="max-w-2xl">
        <p className="label">{label}</p>
        <h2 id={id} className="h2 caret mt-3">
          {title}
        </h2>
        {text && <p className="lead mt-4 max-w-xl">{text}</p>}
      </FadeIn>
      {actions && (
        <FadeIn delay={0.1} className="flex shrink-0 flex-wrap gap-3">
          {actions}
        </FadeIn>
      )}
    </div>
  );
}

/** Animated number that counts up when in view. */
export function Counter({ value, suffix = "", prefix = "", duration = 1.2, className = "" }: { value: number; suffix?: string; prefix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {n}
      {suffix}
    </span>
  );
}

/** Draws an SVG path when scrolled into view. */
export function DrawPath({ d, className = "", stroke = "currentColor", strokeWidth = 1.5, delay = 0 }: { d: string; className?: string; stroke?: string; strokeWidth?: number; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" className={className} initial={reduced ? { pathLength: 1 } : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.4, ease: "easeInOut", delay }} />
  );
}
