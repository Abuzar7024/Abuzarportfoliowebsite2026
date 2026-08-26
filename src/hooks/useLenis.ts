import { useEffect } from "react";
import Lenis from "lenis";
import { useIsFinePointer, usePrefersReducedMotion } from "./useMediaQuery";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/** Smooth, inertial scrolling on desktop pointers. Disabled for touch and reduced-motion users. */
export function useLenis(enabled = true) {
  const fine = useIsFinePointer();
  const reduced = usePrefersReducedMotion();
  const on = enabled && fine && !reduced;

  useEffect(() => {
    if (!on) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    window.__lenis = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete window.__lenis;
    };
  }, [on]);
}
