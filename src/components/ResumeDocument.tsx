import React from "react";
import { profile } from "../data/profile";
import { education, experience } from "../data/experience";
import { skillCategories, skills } from "../data/skills";
import { projects } from "../data/projects";

/* Small inline vector icons so the resume stays self-contained and printable. */
const Icon = {
  mail: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2.1z" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d="M20.4 2H3.6A1.6 1.6 0 0 0 2 3.6v16.8A1.6 1.6 0 0 0 3.6 22h16.8a1.6 1.6 0 0 0 1.6-1.6V3.6A1.6 1.6 0 0 0 20.4 2zM8 19H5V9h3zM6.5 7.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zM19 19h-3v-4.9c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6V19h-3V9h2.9v1.4a3.2 3.2 0 0 1 2.8-1.6c3 0 3.6 2 3.6 4.6z" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  ),
};

const RESUME_PROJECT_IDS = ["digitopia", "ebani", "essonify", "tajneed", "sadeeq-user", "sadeeq-provider", "riayah"];

export function ResumeDocument({ siteUrl }: { siteUrl?: string }) {
  const site = siteUrl ?? "";
  const resumeProjects = RESUME_PROJECT_IDS.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as typeof projects;

  return (
    <article className="resume-paper mx-auto w-full max-w-[820px] rounded-lg p-7 sm:p-10" itemScope itemType="https://schema.org/Person" lang="en">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "var(--paper-line)" }}>
        <div>
          <h1 className="font-display text-[28px] font-bold leading-none sm:text-[34px]" itemProp="name">
            {profile.name}
          </h1>
          <p className="mt-2 text-[13px] font-semibold" style={{ color: "var(--paper-accent)" }} itemProp="jobTitle">
            {profile.title} · Flutter · React · Firebase
          </p>
        </div>
        <ul className="grid gap-1 text-[11px] sm:text-right" style={{ color: "var(--paper-ink-2)" }}>
          <li className="flex items-center gap-1.5 sm:justify-end">
            {Icon.mail}
            <a href={`mailto:${profile.email}`} itemProp="email">
              {profile.email}
            </a>
          </li>
          <li className="flex items-center gap-1.5 sm:justify-end">
            {Icon.phone}
            <a href={`https://wa.me/${profile.whatsapp}`} itemProp="telephone">
              {profile.phoneDisplay}
            </a>
          </li>
          <li className="flex items-center gap-1.5 sm:justify-end">
            {Icon.pin}
            <span itemProp="address">{profile.location}</span>
          </li>
          <li className="flex items-center gap-1.5 sm:justify-end">
            {Icon.linkedin}
            <a href={profile.links.linkedin} itemProp="sameAs">
              linkedin.com/in/abuzar-khan7024
            </a>
          </li>
          <li className="flex items-center gap-1.5 sm:justify-end">
            {Icon.github}
            <a href={profile.links.github} itemProp="sameAs">
              github.com/Abuzar7024
            </a>
          </li>
          {site && (
            <li className="flex items-center gap-1.5 sm:justify-end">
              {Icon.globe}
              <a href={site} itemProp="url">
                {site.replace(/^https?:\/\//, "")}
              </a>
            </li>
          )}
        </ul>
      </header>

      {/* Summary */}
      <section className="mt-5">
        <h2 className="r-h2">Summary</h2>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--paper-ink-2)" }} itemProp="description">
          {profile.summary}
        </p>
      </section>

      {/* Skills */}
      <section className="mt-5">
        <h2 className="r-h2">Skills</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {skillCategories.map((c) => (
            <div key={c.id} className="text-[11.5px]">
              <span className="font-semibold">{c.id}: </span>
              <span style={{ color: "var(--paper-ink-2)" }}>
                {skills
                  .filter((s) => s.category === c.id)
                  .map((s) => s.name)
                  .join(", ")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="mt-5">
        <h2 className="r-h2">Experience</h2>
        <div className="space-y-4">
          {experience.map((e) => (
            <div key={e.id} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 className="text-[13.5px] font-bold">
                  {e.role} · <span className="font-semibold" style={{ color: "var(--paper-accent)" }}>{e.company}</span>
                </h3>
                <p className="text-[11px] font-medium" style={{ color: "var(--paper-muted)" }}>
                  {e.period} · {e.location}
                </p>
              </div>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11.5px] leading-snug" style={{ color: "var(--paper-ink-2)" }}>
                {e.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mt-1.5 flex flex-wrap gap-1">
                {e.tech.map((t) => (
                  <span key={t} className="r-chip">
                    {t}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mt-5">
        <h2 className="r-h2">Projects</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {resumeProjects.map((p) => {
            const link = p.links.find((l) => l.primary) ?? p.links[0];
            return (
              <div key={p.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-[12.5px] font-bold">{p.title}</h3>
                  <span className="text-[10.5px]" style={{ color: "var(--paper-muted)" }}>
                    {p.role}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--paper-ink-2)" }}>
                  {p.tagline} {p.contribution[0]}
                </p>
                <p className="mt-1 text-[10.5px]">
                  <span style={{ color: "var(--paper-muted)" }}>{p.tech.slice(0, 5).join(" · ")}</span>
                  {link && (
                    <>
                      {" "}
                      · <a href={link.href}>{link.label}</a>
                    </>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Education */}
      <section className="mt-5">
        <h2 className="r-h2">Education</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {education.map((e) => (
            <div key={e.id}>
              <h3 className="text-[12.5px] font-bold">{e.degree}</h3>
              <p className="text-[11.5px]" style={{ color: "var(--paper-ink-2)" }}>
                {e.school} · {e.location}
              </p>
              <p className="text-[10.5px]" style={{ color: "var(--paper-muted)" }}>
                {e.years} · {e.status}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[10.5px]" style={{ borderColor: "var(--paper-line)", color: "var(--paper-muted)" }}>
        <span>{profile.availability}</span>
        <span>Vector resume generated from the portfolio's single data source.</span>
      </footer>
    </article>
  );
}
