import React from "react";
import { ArrowRight, MapPin, Smartphone, Sparkles, Globe, ShieldCheck } from "lucide-react";
import { profile } from "../data/profile";
import { experience, yearsOfExperience } from "../data/experience";
import { projects } from "../data/projects";
import { Counter, FadeIn, SectionHead } from "../components/Reveal";

const BUILD_ICONS = [Smartphone, Globe, Sparkles, ShieldCheck];

/** Plain-language "how a project runs" strip — no jargon, just the five steps a client experiences. */
function HowIWork() {
  const steps = profile.approach;
  return (
    <FadeIn className="mt-6">
      <div className="card p-6 sm:p-8">
        <p className="label">How working with me goes</p>
        <h3 className="h3 mt-2">From first conversation to a live app</h3>
        <ol className="mt-7 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.step} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-accent/40 bg-accent/10 text-[13px] font-bold text-accent" style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)" }}>
                  {i + 1}
                </span>
                <p className="font-display text-base font-bold">{s.step}</p>
                {i < steps.length - 1 && <ArrowRight size={14} className="ml-auto hidden text-muted lg:block" aria-hidden="true" />}
              </div>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </FadeIn>
  );
}

export function About() {
  const years = yearsOfExperience();
  const companies = new Set(experience.map((e) => e.company)).size;

  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container-x">
        <SectionHead
          id="about-title"
          label="About me"
          title="I turn ideas into apps people actually use."
          text="I'm a mobile and web developer. My apps are live on the App Store and Google Play, used by government departments, hospitals, home-service teams and retail brands."
        />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-12">
          {/* who I am */}
          <FadeIn className="lg:col-span-5">
            <div className="card hud h-full overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={profile.photo} alt={`${profile.name}`} width={640} height={480} className="h-full w-full object-cover object-[50%_25%]" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-2 via-transparent to-transparent" aria-hidden="true" />
                <span className="chip chip-accent absolute left-4 top-4 !py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" /> Available for work
                </span>
              </div>
              <div className="p-6">
                <h3 className="h3">{profile.name}</h3>
                <p className="mt-1.5 text-sm text-ink-2">
                  {experience[0].role} at {experience[0].company}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                  <MapPin size={12} /> {profile.location} · happy to work remotely
                </p>
                <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5">
                  {[
                    { v: years, s: "+", l: "years building apps" },
                    { v: projects.length, s: "", l: "products shipped" },
                    { v: companies, s: "", l: "companies" },
                  ].map((x) => (
                    <div key={x.l}>
                      <dd className="font-display text-2xl font-bold leading-none text-ink">
                        <Counter value={x.v} suffix={x.s} />
                      </dd>
                      <dt className="mt-1.5 text-[12px] leading-tight text-muted">{x.l}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </FadeIn>

          {/* what I do */}
          <div className="lg:col-span-7">
            <FadeIn className="card p-6 sm:p-8">
              <p className="text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">
                I build the apps and websites businesses run on — the kind people open every day without thinking about the code behind them. That means a booking app that shows your plumber arriving in real time, a hospital system that never freezes on a busy morning, or a screen in a mall that changes what it shows based on who's standing in front of it.
              </p>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">
                I look after the whole journey: the design, the app itself, the connection to your systems, and getting it approved and published on the App Store and Google Play.
              </p>
            </FadeIn>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profile.whatIBuild.map((w, i) => {
                const Icon = BUILD_ICONS[i % BUILD_ICONS.length];
                return (
                  <FadeIn key={w.label} delay={i * 0.05} className="card card-hover p-5">
                    <span className="icon-tile">
                      <Icon size={18} />
                    </span>
                    <h4 className="mt-4 font-display text-base font-bold">{w.label}</h4>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{w.text}</p>
                  </FadeIn>
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {profile.philosophy.map((p, i) => (
                <FadeIn key={p.title} delay={i * 0.05} className="card p-5">
                  <p className="font-mono text-[11px] text-accent">0{i + 1}</p>
                  <h4 className="mt-2.5 font-display text-base font-bold leading-snug">{p.title}</h4>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">{p.text}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        <HowIWork />
      </div>
    </section>
  );
}
