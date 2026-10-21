import React from "react";
import { ArrowUp, Gamepad2, Github, Linkedin, Mail } from "lucide-react";
import { profile } from "../data/profile";
import { NAV_ITEMS } from "../components/Nav";
import { scrollToSection } from "../lib/scroll";

export function Footer({ onPlay }: { onPlay: () => void }) {
  const year = new Date().getFullYear();
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <footer className="relative border-t border-line bg-bg/80 backdrop-blur-xl">
      <div className="shell grid gap-10 py-14 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-16">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">
            {profile.name}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {profile.roleLine}. Designed and built by me with React, TypeScript and Three.js.
          </p>
          <button
            type="button"
            onClick={onPlay}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-dashed border-line-2 px-3.5 py-2 text-[13px] text-ink-2 transition-colors hover:border-accent/60 hover:text-ink"
          >
            <Gamepad2 size={14} aria-hidden="true" />
            Play Signal Run — the offline game
          </button>
        </div>

        <nav aria-label="Footer">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Sections</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-1">
            {NAV_ITEMS.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={go(n.id)} className="text-muted transition-colors hover:text-ink">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Elsewhere</p>
          <ul className="mt-4 flex gap-2">
            {[
              { href: `mailto:${profile.email}`, label: "Email", Icon: Mail },
              { href: profile.links.linkedin, label: "LinkedIn", Icon: Linkedin },
              { href: profile.links.github, label: "GitHub", Icon: Github },
            ].map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line-2 text-ink-2 transition-colors hover:border-silver/50 hover:text-ink"
                >
                  <Icon size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-4 border-t border-line pb-16 pt-6 text-[12.5px] text-faint">
        <p>© {year} {profile.name}. All rights reserved.</p>
        <a href="#top" onClick={go("top")} className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
          Back to top
          <ArrowUp size={13} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}
