import { useEffect } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";

export interface PointerValues {
  /** Normalised -1..1 across the viewport (x right, y down). */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Spring-smoothed versions. */
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  /** Normalised for 3D space: x right, y *up* (Three.js convention). Spring-smoothed. */
  nx: MotionValue<number>;
  ny: MotionValue<number>;
  /** 1 while a mouse is present and moving over the page, 0 otherwise. */
  active: MotionValue<number>;
}

/** Shared, normalised pointer position. Cheap: one listener per consumer. */
export function usePointer(enabled = true, stiffness = 60, damping = 20): PointerValues {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const active = useMotionValue(0);
  const sx = useSpring(x, { stiffness, damping, mass: 0.8 });
  const sy = useSpring(y, { stiffness, damping, mass: 0.8 });
  // Y is negated so positive is up, matching world space in the 3D scenes.
  const nx = useSpring(x, { stiffness: 90, damping: 24, mass: 0.6 });
  const nyRaw = useMotionValue(0);
  const ny = useSpring(nyRaw, { stiffness: 90, damping: 24, mass: 0.6 });

  useEffect(() => {
    if (!enabled) {
      active.set(0);
      return;
    }
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      const px = (e.clientX / window.innerWidth) * 2 - 1;
      const py = (e.clientY / window.innerHeight) * 2 - 1;
      x.set(px);
      y.set(py);
      nyRaw.set(-py);
      active.set(1);
      // Let the field settle back once the pointer stops moving.
      clearTimeout(idle);
      idle = setTimeout(() => active.set(0), 2200);
    };
    const onLeave = () => active.set(0);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      clearTimeout(idle);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y, nyRaw, active]);

  return { x, y, sx, sy, nx, ny, active };
}
