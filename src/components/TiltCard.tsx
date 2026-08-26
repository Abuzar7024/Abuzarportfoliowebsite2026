import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useIsFinePointer, usePrefersReducedMotion } from "../hooks/useMediaQuery";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  glare?: boolean;
  className?: string;
}

/** Pointer-driven 3D tilt with a subtle glare. Disabled on touch and reduced-motion. */
export function TiltCard({ children, max = 7, glare = true, className = "", ...rest }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useIsFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });
  const glareBg = useMotionTemplate`radial-gradient(600px circle at ${gx}% ${gy}%, rgba(255,255,255,0.09), transparent 45%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <div className="perspective-1000" {...rest}>
      <motion.div ref={ref} className={`preserve-3d relative ${className}`} style={{ rotateX: srx, rotateY: sry }} onPointerMove={onMove} onPointerLeave={reset}>
        {children}
        {glare && enabled && <motion.div className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glareBg }} aria-hidden="true" />}
      </motion.div>
    </div>
  );
}
