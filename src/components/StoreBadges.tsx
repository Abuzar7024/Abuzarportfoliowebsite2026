import React from "react";
import { Apple, ExternalLink, Github, Globe, Play } from "lucide-react";
import type { ProjectLink } from "../data/types";

const ICON: Record<ProjectLink["kind"], React.ComponentType<{ size?: number }>> = {
  appstore: Apple,
  playstore: Play,
  live: ExternalLink,
  website: Globe,
  github: Github,
};

/** Vector store / live badges for a project's links. */
export function StoreBadges({ links, className = "", compact = false }: { links: ProjectLink[]; className?: string; compact?: boolean }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Available on">
      {links.map((l) => {
        const Icon = ICON[l.kind];
        return (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-2 rounded-lg border border-line bg-white/[0.04] font-medium text-ink transition-colors hover:border-accent/60 hover:bg-accent/10 ${compact ? "px-2.5 py-1.5 text-[12px]" : "px-3 py-2 text-[13px]"}`}
              data-cursor="Open"
            >
              <Icon size={compact ? 13 : 15} />
              {l.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
