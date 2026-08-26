export function scrollToSection(id: string, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  const lenis = window.__lenis;
  if (lenis && !reduce) {
    lenis.scrollTo(top, { duration: 1.4, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

export function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}
