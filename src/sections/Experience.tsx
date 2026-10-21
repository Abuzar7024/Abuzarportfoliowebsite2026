import React, { useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { education, experience } from "../data/experience";
import { Rise, SectionIndex } from "../components/animations/Reveal";

const VISIBLE_BULLETS = 3;

function Role({ role, index }: { role: (typeof experience)[number]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const current = role.end === null;
  const bullets = expanded ? role.bullets : role.bullets.slice(0, VISIBLE_BULLETS);
  const hidden = role.bullets.length - VISIBLE_BULLETS;

  return (
    <Rise as="li" delay={index * 0.05} className="relative pl-9 sm:pl-12">
      {/* Timeline node: the current role carries the signal. */}
      <span aria-hidden="true" className="absolute left-0 top-2 grid h-[18px] w-[18px] place-items-center">
        {current ? (
          <span className="signal-dot" />
        ) : (
          <span className="h-2 w-2 rounded-full border border-silver/70 bg-bg" />
        )}
      </span>

      <div className="frost p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div>
            <h3 className="text-2xl tracking-tight">{role.company}</h3>
            <p className="mt-1 text-[15px] text-ink-2">{role.role}</p>
          </div>
          <div className="text-left font-mono text-[11.5px] uppercase tracking-[0.14em] text-muted sm:text-right">
            <p className={current ? "text-accent-ink" : undefined}>{role.period}</p>
            <p className="mt-1">{role.location}</p>
          </div>
        </div>

        <p className="mt-5 leading-relaxed text-ink-2">{role.plain}</p>

        <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted" id={`bullets-${role.id}`}>
          {bullets.map((b) => (
            <li key={b} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.6em] h-px w-3 shrink-0 bg-silver/50" />
              {b}
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`bullets-${role.id}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-silver transition-colors hover:text-ink"
          >
            {expanded ? "Show less" : `Show ${hidden} more`}
            <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        )}

        <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Technologies">
          {role.tech.map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Rise>
  );
}

export function Experience() {
  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <div className="shell">
        <SectionIndex n="02" label="Experience" />
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Rise>
              <h2 id="experience-title" className="h-section">
                Where I've <span className="serif-accent text-silver">worked.</span>
              </h2>
            </Rise>
            <Rise delay={0.1}>
              <p className="lead mt-6">
                Three teams, one thread: taking apps from first screen to the App Store and Google Play, then keeping
                them fast once real people arrive.
              </p>
            </Rise>

            <Rise delay={0.15} className="mt-10">
              <h3 className="eyebrow">
                <GraduationCap size={14} aria-hidden="true" />
                Education
              </h3>
              <ul className="mt-4 space-y-3">
                {education.map((e) => (
                  <li key={e.id} className="frost-solid p-5">
                    <p className="font-medium text-ink">{e.degree}</p>
                    <p className="mt-1 text-sm text-muted">
                      {e.school} · {e.location}
                    </p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                      {e.years} · {e.status}
                    </p>
                  </li>
                ))}
              </ul>
            </Rise>
          </div>

          <ol className="relative space-y-6">
            <span aria-hidden="true" className="absolute bottom-6 left-[8.5px] top-4 w-px bg-gradient-to-b from-accent/60 via-line-2 to-transparent" />
            {experience.map((role, i) => (
              <Role key={role.id} role={role} index={i} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
