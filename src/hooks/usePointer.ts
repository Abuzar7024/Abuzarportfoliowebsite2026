import { useEffect } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";

export interface PointerValues {
  /** Normalised -1..1 across the viewport (x right, y down). */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Spring-smoothed versions. */
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}

/** Shared, normalised pointer position. Cheap: one listener per consumer. */
export function usePointer(enabled = true, stiffness = 60, damping = 20): PointerValues {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness, damping, mass: 0.8 });
  const sy = useSpring(y, { stiffness, damping, mass: 0.8 });

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      x.set(nx);
      y.set(ny);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, x, y]);

  return { x, y, sx, sy };
}
