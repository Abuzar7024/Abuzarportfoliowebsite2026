import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";
let previousPaddingRight = "";

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      previousPaddingRight = document.body.style.paddingRight;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
      window.__lenis?.stop();
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
        window.__lenis?.start();
      }
    };
  }, [locked]);
}
