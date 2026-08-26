import { useEffect, useState, type RefObject } from "react";

/** Tracks whether an element is (roughly) on screen. Used to pause canvases offscreen. */
export function useInViewport<T extends Element>(ref: RefObject<T | null>, rootMargin = "15%"): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting);
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
