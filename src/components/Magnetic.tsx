import React, { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useIsFinePointer, usePrefersReducedMotion } from "../hooks/useMediaQuery";

interface MagneticProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

/** Wraps any element so it gently follows the pointer while hovered. No-op on touch / reduced motion. */
export function Magnetic({ children, strength = 0.32, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useIsFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} className={`inline-block ${className ?? ""}`} style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.div>
  );
}
