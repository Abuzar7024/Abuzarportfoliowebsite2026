import React, { useEffect, useRef } from "react";
import { useIsFinePointer, usePrefersReducedMotion } from "../hooks/useMediaQuery";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, summary, [data-cursor]";

/**
 * Premium custom cursor + a soft red light that follows the pointer (fine-pointer devices only).
 * Disabled on touch devices and when reduced motion is preferred.
 */
export function Cursor() {
  const fine = useIsFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("has-custom-cursor");
      return;
    }
    const html = document.documentElement;
    html.classList.add("has-custom-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let lx = x;
    let ly = y;
    let raf = 0;
    let visible = false;

    const setState = (state: string) => {
      ring.current?.setAttribute("data-state", state);
      dot.current?.setAttribute("data-state", state === "hidden" ? "hidden" : "");
    };

    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      lx += (x - lx) * 0.08;
      ly += (y - ly) * 0.08;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (light.current) light.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!visible) {
        visible = true;
        setState("");
      }
    };
    const onOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== "function") return;
      const labelled = target.closest<HTMLElement>("[data-cursor]");
      if (labelled && labelled.dataset.cursor) {
        if (label.current) label.current.textContent = labelled.dataset.cursor;
        setState("label");
        return;
      }
      if (target.closest(INTERACTIVE)) {
        setState("link");
        return;
      }
      setState("");
    };
    const onLeave = () => {
      visible = false;
      setState("hidden");
    };
    const onEnter = () => {
      visible = true;
      setState("");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    setState("hidden");

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      html.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={light} className="cursor-light" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" data-state="hidden" />
      <div ref={ring} className="cursor-ring" aria-hidden="true" data-state="hidden">
        <span ref={label} />
      </div>
    </>
  );
}
