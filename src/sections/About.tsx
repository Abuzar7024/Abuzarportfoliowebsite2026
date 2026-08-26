import React from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { profile } from "../data/profile";
import { experience, yearsOfExperience } from "../data/experience";
import { projects } from "../data/projects";
import { FadeIn, SectionHead } from "../components/Reveal";
import { CodeWindow, Lines, Tok } from "../components/CodeWindow";

function Pipeline() {
  const steps = profile.approach;
  return (
    <FadeIn>
      <CodeWindow file="pipeline.yml" meta={`${steps.length} stages · always green`} className="mt-6">
        <ol className="grid gap-px bg-line sm:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.step} className="bg-bg-2 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted">stage {i + 1}</span>
                <CheckCircle2 size={14} className="text-success" aria-hidden="true" />
              </div>
              <p className="mt-3 font-mono text-[13px] font-semibold text-ink">{s.step.toLowerCase().replace(/ & /g, "-").replace(/\s+/g, "-")}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </CodeWindow>
    </FadeIn>
  );
}

export function About() {
  const years = yearsOfExperience();
  const companies = new Set(experience.map((e) => e.company)).size;

  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container-x">
        <SectionHead id="about-title" label="About" title="Engineering ability, product taste." text="A Flutter-first developer who ships production apps — and cares about how they look, feel and hold up over time." />

        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-12">
          {/* profile.json */}
          <FadeIn className="lg:col-span-5">
            <CodeWindow file="profile.json" meta="read-only" className="h-full">
              <div className="flex items-center gap-4 border-b border-line p-5">
                <img src={profile.photo} alt={`${profile.name} portrait`} width={64} height={64} className="h-16 w-16 rounded-xl object-cover object-[50%_25%] ring-1 ring-white/10" loading="lazy" decoding="async" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold">{profile.name}</p>
                  <p className="truncate text-sm text-ink-2">
                    {experience[0].role} · {experience[0].company}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={12} /> {profile.location}
                  </p>
                </div>
              </div>
              <div className="p-5">
                <Lines>
                  {[
                    <Tok.p>{"{"}</Tok.p>,
                    <>
                      {"  "}<Tok.key>"role"</Tok.key>: <Tok.str>"{profile.title}"</Tok.str>,
                    </>,
                    <>
                      {"  "}<Tok.key>"focus"</Tok.key>: [<Tok.str>"mobile"</Tok.str>, <Tok.str>"web"</Tok.str>, <Tok.str>"ai"</Tok.str>],
                    </>,
                    <>
                      {"  "}<Tok.key>"experience"</Tok.key>: <Tok.num>{years}</Tok.num> <Tok.cm>// years</Tok.cm>
                    </>,
                    <>
                      {"  "}<Tok.key>"caseStudies"</Tok.key>: <Tok.num>{projects.length}</Tok.num>,
                    </>,
                    <>
                      {"  "}<Tok.key>"companies"</Tok.key>: <Tok.num>{companies}</Tok.num>,
                    </>,
                    <>
                      {"  "}<Tok.key>"core"</Tok.key>: [<Tok.str>"Flutter"</Tok.str>, <Tok.str>"Dart"</Tok.str>, <Tok.str>"React"</Tok.str>, <Tok.str>"Firebase"</Tok.str>],
                    </>,
                    <>
                      {"  "}<Tok.key>"status"</Tok.key>: <Tok.str>"open to roles"</Tok.str>,
                    </>,
                    <>
                      {"  "}<Tok.key>"remote"</Tok.key>: <Tok.kw>true</Tok.kw>
                    </>,
                    <Tok.p>{"}"}</Tok.p>,
                  ]}
                </Lines>
              </div>
            </CodeWindow>
          </FadeIn>

          {/* about.md */}
          <FadeIn delay={0.08} className="lg:col-span-7">
            <CodeWindow file="about.md" meta="markdown" className="h-full" bodyClassName="p-6 sm:p-8">
              <p className="font-mono text-[13px] text-muted">
                <span className="text-accent">#</span> Summary
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2 sm:text-base">{profile.summary}</p>

              <p className="mt-7 font-mono text-[13px] text-muted">
                <span className="text-accent">##</span> What I build
              </p>
              <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {profile.whatIBuild.map((w) => (
                  <li key={w.label} className="flex gap-3 text-sm">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-ink">{w.label}</span> <span className="text-muted">— {w.text}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-7 font-mono text-[13px] text-muted">
                <span className="text-accent">##</span> Principles
              </p>
              <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                {profile.philosophy.map((p, i) => (
                  <li key={p.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
                    <p className="font-mono text-[11px] text-accent">0{i + 1}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{p.title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{p.text}</p>
                  </li>
                ))}
              </ol>

              <ul className="mt-7 flex flex-wrap gap-2">
                {profile.interests.map((i) => (
                  <li key={i} className="chip">
                    {i}
                  </li>
                ))}
              </ul>
            </CodeWindow>
          </FadeIn>
        </div>

        <Pipeline />
      </div>
    </section>
  );
}
