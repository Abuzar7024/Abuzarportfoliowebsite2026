import React from "react";
import { education } from "../../data/experience";
import { Rise, SectionIndex, Stagger, StaggerItem } from "../animations/Reveal";

/** Deliberately minimal: education is context, not the headline. */
export function Education() {
  return (
    <section id="education" className="section-tight" aria-labelledby="edu-title">
      <div className="shell">
        <SectionIndex n="05" label="Education" />
        <Rise className="mt-8">
          <h2 id="edu-title" className="t-h2 measure-tight">
            Education.
          </h2>
        </Rise>

        <Stagger as="ul" className="mt-10 border-t border-line">
          {education.map((e) => (
            <StaggerItem as="li" key={e.id}>
              <div className="grid grid-cols-1 items-baseline gap-2 border-b border-line py-7 sm:grid-cols-12 sm:gap-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent sm:col-span-3">
                  {e.years}
                </p>
                <div className="sm:col-span-6">
                  <h3 className="t-h3">{e.degree}</h3>
                  <p className="mt-1.5 text-[14px] text-ink-2">{e.school}</p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                    {e.location}
                  </p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted sm:col-span-3 sm:text-right">
                  {e.status}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
