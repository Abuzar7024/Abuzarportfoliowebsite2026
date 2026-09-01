import React from "react";
import { ArrowUp, Github, Linkedin, Mail } from "lucide-react";
import { profile } from "../data/profile";
import { NAV_ITEMS, LogoMark } from "../components/Navbar";
import { scrollToSection } from "../lib/scroll";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line" role="contentinfo">
      <div className="container-x py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="font-display text-base font-bold">{profile.name}</p>
                <p className="text-sm text-muted">{profile.roleLine}</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-2">
              This site is itself a project: React, TypeScript, Three.js and Motion — with WebGL detection, reduced-motion support and a print-ready vector resume.{" "}
              <a href={profile.links.portfolioRepo} target="_blank" rel="noopener noreferrer" className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
                Read the source.
              </a>
            </p>
            <div className="mt-6 flex gap-2">
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:border-accent/60 hover:text-accent">
                <Github size={16} />
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:border-accent/60 hover:text-accent">
                <Linkedin size={16} />
              </a>
              <a href={`mailto:${profile.email}`} aria-label="Email" className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink-2 hover:border-accent/60 hover:text-accent">
                <Mail size={16} />
              </a>
            </div>
          </div>
          <nav aria-label="Footer" className="lg:col-span-3">
            <p className="mono-label mb-4">Navigate</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-1">
              {[{ id: "home", label: "Home" }, ...NAV_ITEMS].map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => scrollToSection(n.id, 72)} className="text-sm text-ink-2 transition-colors hover:text-accent">
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="lg:col-span-3">
            <p className="mono-label mb-4">Built with</p>
            <ul className="flex flex-wrap gap-2">
              {["React 19", "TypeScript", "Three.js", "Motion", "Tailwind v4", "Vite"].map((t) => (
                <li key={t} className="chip">
                  {t}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => scrollToSection("home")} className="btn-ghost mt-8 !min-h-0 !px-4 !py-2 text-xs">
              Back to top <ArrowUp size={13} />
            </button>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {profile.name}. All rights reserved.
          </span>
          <span className="font-mono text-[11px]">build v2.1.0 · react 19 · three.js · vite</span>
        </div>
      </div>
    </footer>
  );
}
