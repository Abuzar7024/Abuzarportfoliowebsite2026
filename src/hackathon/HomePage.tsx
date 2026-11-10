import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ContentResponse } from "./lib";
import { ImageSlot, Kicker, Link, SectionHead, btnPrimary, btnSecondary } from "./ui";

function Fact({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-0 border-t border-[#15181d] py-3">
      <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5b584f]">{label}</dt>
      <dd className={`mt-1 break-words text-[15px] sm:text-[16px] font-bold ${highlight ? "text-[#d6281f]" : "text-[#15181d]"}`}>{value}</dd>
    </div>
  );
}

export function HomePage({ data }: { data: ContentResponse }) {
  const { content, registration, stats, announcements } = data;
  const s = content.settings;

  return (
    <>
      {/* Hero — Full Width Responsive */}
      <section className="w-full px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12 lg:px-10 xl:px-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <div
              data-testid="prereg-open-badge"
              className="inline-flex items-center gap-2 border border-[#15181d] bg-[#d6281f] px-3 py-1.5 font-mono text-[11px] sm:text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-white"
            >
              <Sparkles size={13} aria-hidden="true" className="shrink-0" />
              <span>PRE-REGISTRATIONS ARE NOW OPEN!</span>
            </div>
            <p className="mt-4 font-mono text-[12px] sm:text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#d6281f]">
              {s.eventName.toUpperCase()} · {s.location.split(",")[0]}
            </p>
            <h1 className="mt-2 text-[clamp(2.25rem,5.8vw,4.8rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-[#15181d]">
              {content.home.heroHeadline}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] sm:text-[18px] leading-[1.6] text-[#3d3b35]">{content.home.heroText}</p>
            <dl className="mt-7 grid grid-cols-1 gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
              <Fact label="Hackathon" value="AVATAR" />
              <Fact label="Tagline" value="DESIGN. BUILD. SELL. IN ONE DAY." />
              <Fact label="Status" value="PRE-REGISTRATIONS ARE NOW OPEN!" highlight />
              <Fact label="Location" value="Bhopal, India" />
              <Fact label="Participation" value="Hybrid (Online + Bhopal)" />
              <Fact label="Format" value={`Solo or teams (1–${s.maxTeamSize})`} />
            </dl>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/competition/register" className={btnPrimary}>
                Pre-Register Now <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <a href="#about" className={btnSecondary}>
                Explore the 1-Day Challenge
              </a>
              <Link to="/competition/status" className={btnSecondary}>
                View Hackathon Status
              </Link>
            </div>
            {!registration.open && (
              <p role="status" className="mt-4 max-w-2xl border-l-4 border-[#d6281f] bg-white px-4 py-3 text-[14px] text-[#3d3b35]">
                {registration.reason ?? "Registration has not opened yet."} You can still review the details below.
              </p>
            )}
          </div>
          <figure className="flex flex-col border border-[#15181d] bg-white">
            <div className="min-h-[260px] flex-1 overflow-hidden sm:min-h-[340px] lg:min-h-[460px]">
              <ImageSlot src={s.heroImageUrl} label="Builders collaborating at AVATAR — DESIGN. BUILD. SELL. IN ONE DAY." />
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-[#15181d] px-4 py-2.5 font-mono text-[10.5px] sm:text-[11px] uppercase tracking-[0.12em] text-[#5b584f]">
              <span>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</span>
              <span>Bhopal &amp; Online</span>
            </figcaption>
          </figure>
        </div>
        {registration.open && stats && stats.confirmedParticipants > 0 && (
          <p className="mt-10 border-t border-[#15181d] pt-4 font-mono text-[13px] text-[#3d3b35]">
            {stats.confirmedParticipants.toLocaleString("en-IN")} participants in {stats.confirmedTeams.toLocaleString("en-IN")} teams confirmed so far.
          </p>
        )}
      </section>

      {/* Prominent Pre-Registration Announcement Banner */}
      <section aria-label="Pre-registration announcement" className="w-full border-y-2 border-[#15181d] bg-[#15181d] text-white">
        <div className="flex w-full flex-col items-start justify-between gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center lg:px-10 xl:px-14">
          <div className="min-w-0">
            <p className="font-mono text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#ff4d42]">
              AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.
            </p>
            <h2 className="mt-1.5 text-[clamp(1.5rem,3.5vw,2.5rem)] font-extrabold tracking-[-0.03em] text-white">
              PRE-REGISTRATIONS ARE NOW OPEN!
            </h2>
            <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-[#d8d4c8]">
              Take an idea from zero to a real product in a single day — design the user experience, build the working AI prototype, and pitch or sell it live to the jury.
            </p>
          </div>
          <Link to="/competition/register" className={`${btnPrimary} w-full shrink-0 sm:w-auto`}>
            Secure Your Spot <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {announcements.length > 0 && (
        <section aria-label="Announcements" className="w-full border-b border-[#15181d] bg-white">
          <div className="w-full px-4 py-5 sm:px-6 lg:px-10 xl:px-14">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d6281f]">Latest announcement</p>
            <p className="mt-1 text-[16px] font-bold">{announcements[0].title}</p>
            <p className="text-[15px] text-[#3d3b35]">{announcements[0].body.slice(0, 220)}</p>
          </div>
        </section>
      )}

      {/* Overview */}
      <section id="about" className="w-full scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:px-14">
        <SectionHead no="01" kicker="Overview · AVATAR" title="DESIGN. BUILD. SELL. IN ONE DAY." />
        <dl className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["What it is", content.home.overviewWhat],
            ["Who can participate", content.home.overviewWho],
            ["How online participation works", content.home.overviewOnline],
            ["How physical participation works", content.home.overviewPhysical],
            ["What you will build", content.home.overviewBuild],
            ["What you gain", content.home.overviewGain],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-[#bdb8ab] py-5">
              <dt className="text-[17px] font-extrabold tracking-[-0.01em]">{t}</dt>
              <dd className="mt-2 text-[15.5px] sm:text-[16px] leading-[1.65] text-[#3d3b35]">{d}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <figure className="border border-[#15181d] bg-white">
            <div className="h-[220px] overflow-hidden sm:h-[290px] lg:h-[340px]">
              <ImageSlot src={s.mentorImageUrl} label="Technical mentoring session with engineering teams at AVATAR" />
            </div>
            <figcaption className="border-t border-[#15181d] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b584f]">
              01 · Product Design &amp; Architecture Reviews
            </figcaption>
          </figure>
          <figure className="border border-[#15181d] bg-white">
            <div className="h-[220px] overflow-hidden sm:h-[290px] lg:h-[340px]">
              <ImageSlot src={s.demoImageUrl} label="Teams pitching and selling working AI products to the jury" />
            </div>
            <figcaption className="border-t border-[#15181d] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b584f]">
              02 · Live Product Demonstrations &amp; Sales Pitch
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Participation */}
      <section className="w-full bg-[#15181d] text-[#e9e5d8]">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:px-14">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-[#ff6b5e]">02 Participation</p>
          <h2 className="mt-3 max-w-3xl text-[clamp(1.75rem,3.6vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">Two ways to take part in AVATAR.</h2>
          <div className="mt-8 grid gap-px bg-white/20 md:grid-cols-2">
            {[
              { t: "Online participation", items: ["Participate from anywhere in India.", "Design, build, and submit your product digitally.", "Pitch live to the evaluation panel online.", "Same one-day challenge rules and submission deadlines."] },
              { t: "Physical participation", items: [`Attend the ${s.physicalDurationText} AVATAR arena in Bhopal.`, "Design, build, and pitch alongside fellow builders.", "Direct access to mentors and product reviewers.", "Live stage presentations and networking, subject to venue capacity."] },
            ].map((c) => (
              <div key={c.t} className="bg-[#15181d] p-6 sm:p-9">
                <h3 className="text-[20px] sm:text-[22px] font-extrabold text-white">{c.t}</h3>
                <ul className="mt-4 space-y-3 text-[15.5px] sm:text-[16px] leading-[1.55]">
                  {c.items.map((i) => (
                    <li key={i} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-[2px] w-4 shrink-0 bg-[#ff6b5e]" />{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-4xl text-[14px] leading-relaxed text-[#a8a498]">
            Physical attendance is subject to venue capacity (about {s.expectedPhysicalAttendance.toLocaleString("en-IN")} places expected) and confirmation by the organisers.
          </p>
        </div>
      </section>

      {/* Challenges */}
      <section id="challenges" className="w-full scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:px-14">
        <SectionHead no="03" kicker="Challenges" title="Choose a problem worth solving.">
          Proposed tracks for AVATAR. Final challenge statements are announced on event morning.
        </SectionHead>
        <ol className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {content.tracks.map((t, i) => (
            <li key={t.id} className="flex gap-4 border-t border-[#bdb8ab] py-5">
              <span className="w-8 shrink-0 font-mono text-[13px] font-semibold text-[#d6281f]">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <h3 className="text-[17px] sm:text-[18px] font-extrabold tracking-[-0.01em]">{t.title}</h3>
                <p className="mt-1 text-[15px] leading-[1.6] text-[#3d3b35]">{t.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Prizes */}
      <section id="prizes" className="w-full scroll-mt-20 border-y border-[#15181d] bg-white">
        <div className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:px-14">
          <SectionHead no="04" kicker="Prizes" title="Proposed prize pool.">
            {content.prizes.notice}
          </SectionHead>
          <div className="mt-8">
            <div className="grid gap-px bg-[#15181d] md:grid-cols-3">
              {content.prizes.items.map((p) => (
                <div key={p.rank} className="flex flex-col justify-between bg-white p-6 sm:p-8">
                  <div>
                    <span className="font-mono text-[13px] font-semibold uppercase tracking-wider text-[#d6281f]">{p.rank}</span>
                    <h3 className="mt-1 text-[18px] font-extrabold text-[#15181d]">{p.title}</h3>
                    {p.extra && <p className="mt-1 text-[14px] font-semibold text-[#5b584f]">{p.extra}</p>}
                  </div>
                  <p className="mt-5 text-[clamp(1.9rem,3.6vw,2.75rem)] font-extrabold tracking-[-0.03em] text-[#15181d]">{p.amount}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border border-[#15181d] bg-[#f6f4ef] p-6">
              <h3 className="text-[17px] font-extrabold">{content.prizes.additional.title}</h3>
              <p className="mt-2 max-w-4xl text-[15px] leading-[1.65] text-[#3d3b35]">{content.prizes.additional.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section id="schedule" className="w-full scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:px-14">
        <SectionHead no="05" kicker="Schedule" title="One day. Design. Build. Sell.">
          {content.schedule.notice}
        </SectionHead>
        <div className="mt-8 grid gap-px bg-[#15181d] md:grid-cols-3">
          {content.schedule.days.map((d) => (
            <div key={d.day} className="bg-[#f6f4ef] p-6 sm:p-7">
              <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-[#d6281f]">{d.day}</p>
              <h3 className="mt-1 text-[19px] font-extrabold leading-tight">{d.title}</h3>
              <ul className="mt-4 space-y-2 text-[15px] text-[#3d3b35]">
                {d.items.map((i) => (
                  <li key={i} className="border-t border-[#d9d5c9] pt-2">{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <figure className="mt-8 border border-[#15181d] bg-white">
          <div className="h-[220px] overflow-hidden sm:h-[320px] lg:h-[380px]">
            <ImageSlot src={s.secondaryImageUrl} label="AVATAR 1-day physical build and pitch floor in Bhopal" />
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-[#15181d] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b584f]">
            <span>1-Day Build &amp; Pitch Arena · Bhopal, Madhya Pradesh</span>
            <span>DESIGN · BUILD · SELL</span>
          </figcaption>
        </figure>
      </section>

      {/* Registration CTA */}
      <section className="w-full bg-[#d6281f] text-white">
        <div className="grid w-full gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 xl:px-14">
          <div className="min-w-0">
            <p className="font-mono text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.18em] text-white/85">
              AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.
            </p>
            <h2 className="mt-2 text-[clamp(1.85rem,4.5vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.03em]">
              PRE-REGISTRATIONS ARE NOW OPEN!
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-white/90">
              Turn an idea into a real product in one day — design it, build it, and sell it to the jury. Register solo or with your team and receive your official AVATAR participant pass upon verification.
            </p>
            <Link to="/competition/register" className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3.5 text-[15px] font-bold text-[#15181d] transition-colors hover:bg-[#15181d] hover:text-white sm:w-auto">
              Pre-Register Now <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="self-start border border-white/35 bg-[#15181d]/25 p-5 sm:p-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">
              The 1-Day AVATAR Format
            </p>
            <ol className="mt-4 space-y-3 text-[15px]">
              <li className="border-b border-white/20 pb-3">
                <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-white/80">01 · DESIGN</span>
                <p className="mt-0.5 font-bold">Define the problem, user flow &amp; product architecture</p>
              </li>
              <li className="border-b border-white/20 pb-3">
                <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-white/80">02 · BUILD</span>
                <p className="mt-0.5 font-bold">Ship a functional, deployed AI product prototype</p>
              </li>
              <li>
                <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-white/80">03 · SELL</span>
                <p className="mt-0.5 font-bold">Demonstrate live value &amp; pitch to the evaluation jury</p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faqs" className="w-full scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:px-14">
        <SectionHead no="06" kicker="FAQs" title="Questions, answered." />
        <div className="mt-8 grid gap-x-10 lg:grid-cols-2">
          {content.faqs.map((f) => (
            <details key={f.question} className="group border-t border-[#15181d] py-4 last:border-b lg:[&:nth-last-child(-n+2)]:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] sm:text-[17px] font-bold">
                <span>{f.question}</span>
                <span aria-hidden="true" className="shrink-0 font-mono text-[20px] text-[#d6281f] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[15.5px] sm:text-[16px] leading-[1.65] text-[#3d3b35]">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
