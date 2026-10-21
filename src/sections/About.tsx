import React from "react";
import { LayoutDashboard, Plug, ScanFace, Smartphone } from "lucide-react";
import { profile } from "../data/profile";
import { experience, yearsOfExperience } from "../data/experience";
import { Rise, SectionIndex, Stagger, StaggerItem } from "../components/animations/Reveal";

const BUILD_ICONS = [Smartphone, LayoutDashboard, ScanFace, Plug];

/** A HUD-style identity card: the facts a recruiter scans for, at a glance. */
function IdentityPanel() {
  const current = experience.find((e) => e.end === null);
  const rows = [
    ["Name", profile.name],
    ["Role", profile.title],
    ["Now", current ? `${current.company}` : "—"],
    ["Base", profile.location],
    ["Exp.", `${yearsOfExperience()}+ years`],
    ["Stack", "Flutter · Dart · Riverpod · Firebase"],
  ];
  return (
    <div className="hud bg-grid p-6 sm:p-7">
      {/* Slow scan line sweeping the card. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl motion-reduce:hidden">
        <span className="absolute inset-x-0 top-0 h-16 animate-[scan_6s_linear_infinite] bg-gradient-to-b from-transparent via-silver/[0.06] to-transparent" />
      </span>
      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
        <span>ID // AK-{new Date().getFullYear()}</span>
        <span className="flex items-center gap-2 text-accent-ink">
          <span className="signal-dot" aria-hidden="true" />
          Online
        </span>
      </div>

      <div className="mt-8 flex items-center gap-5">
        <div aria-hidden="true" className="relative grid h-20 w-20 shrink-0 place-items-center">
          <svg viewBox="0 0 80 80" className="absolute inset-0 animate-[spin_18s_linear_infinite] motion-reduce:animate-none">
            <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(201,207,216,0.35)" strokeWidth="1" strokeDasharray="3 5" />
            <path d="M40 2a38 38 0 0 1 38 38" fill="none" stroke="#e3262e" strokeWidth="1.5" />
          </svg>
          <span className="text-chrome font-brand text-xl">AK</span>
        </div>
        <div className="min-w-0">
          <p className="font-brand text-lg tracking-wide text-ink">{profile.name.toUpperCase()}</p>
          <p className="mt-1 text-sm text-muted">{profile.roleLine}</p>
        </div>
      </div>

      <dl className="mt-8 divide-y divide-line border-y border-line font-mono text-[12.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 py-2.5">
            <dt className="uppercase tracking-[0.14em] text-faint">{k}</dt>
            <dd className="truncate text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        <span className="text-accent-ink">&gt;</span> {profile.availability}
      </p>
    </div>
  );
}

export function About() {
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="shell">
        <SectionIndex n="01" label="About" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <Rise className="w-full">
            <IdentityPanel />
          </Rise>

          <div>
            <Rise>
              <h2 id="about-title" className="h-section">
                I build apps that people <span className="serif-accent text-silver">use every day.</span>
              </h2>
            </Rise>
            <Rise delay={0.1}>
              <p className="lead mt-7">{profile.intro}</p>
            </Rise>
            <Rise delay={0.15}>
              <p className="mt-5 leading-relaxed text-muted">{profile.summary}</p>
            </Rise>

            <Stagger as="ul" className="mt-10 grid gap-3 sm:grid-cols-2">
              {profile.whatIBuild.map((item, i) => {
                const Icon = BUILD_ICONS[i % BUILD_ICONS.length];
                return (
                  <StaggerItem as="li" key={item.label} className="frost-solid group p-5 transition-colors hover:border-line-2">
                    <Icon size={18} strokeWidth={1.6} className="text-silver transition-colors group-hover:text-accent-ink" aria-hidden="true" />
                    <h3 className="mt-4 text-[17px] tracking-tight">{item.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.text}</p>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </div>

        <Stagger as="ul" className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {profile.philosophy.map((p, i) => (
            <StaggerItem as="li" key={p.title} className="bg-bg-2/90 p-7">
              <span className="font-mono text-[11px] text-accent-ink">0{i + 1}</span>
              <h3 className="mt-3 text-xl tracking-tight">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
