import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Menu, X } from "lucide-react";
import type { HackathonContent } from "../shared/hackathon-content";
import { navigate } from "./lib";

export const ACCENT = "#d6281f";
export const PORTFOLIO_URL = "https://abuzarcode.in/";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 bg-[#d6281f] px-5 py-3 sm:px-6 sm:py-3.5 text-[14px] sm:text-[15px] font-bold text-white transition-colors hover:bg-[#b81f17] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6281f] disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 border border-[#15181d] bg-white px-5 py-3 sm:px-6 sm:py-3.5 text-[14px] sm:text-[15px] font-bold text-[#15181d] transition-colors hover:bg-[#15181d] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15181d] disabled:opacity-50";
export const inputCls =
  "w-full min-w-0 border border-[#bdb8ab] bg-white px-3.5 py-3 text-[16px] text-[#15181d] placeholder:text-[#8b877b] focus:border-[#15181d] focus:outline-none focus:ring-2 focus:ring-[#15181d]/15";
export const labelCls = "mb-1.5 block text-[13px] font-bold text-[#15181d]";

export function Link({ to, className, children, onClick }: { to: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11.5px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-[#d6281f]">{children}</p>;
}

export function SectionHead({ no, kicker, title, children }: { no?: string; kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="grid gap-3 border-t-2 border-[#15181d] pt-5 lg:grid-cols-[220px_1fr] lg:gap-10 xl:grid-cols-[260px_1fr]">
      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5b584f]">
        {no && <span className="mr-2 text-[#d6281f]">{no}</span>}
        {kicker}
      </div>
      <div className="min-w-0">
        <h2 className="text-[clamp(1.75rem,3.6vw,3rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-[#15181d]">{title}</h2>
        {children && <div className="mt-3 max-w-4xl text-[16px] sm:text-[17px] leading-[1.65] text-[#3d3b35]">{children}</div>}
      </div>
    </header>
  );
}

/** Photograph slot. Shows the configured image, or a clearly labelled placeholder. */
export function ImageSlot({ src, label, className = "" }: { src?: string; label: string; className?: string }) {
  if (src) {
    return <img src={src} alt={label} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div
      role="img"
      aria-label={`Photo placeholder: ${label}`}
      className={`flex h-full w-full items-end bg-[#e4e0d4] p-4 ${className}`}
      style={{ backgroundImage: "repeating-linear-gradient(135deg, rgba(21,24,29,0.05) 0 10px, transparent 10px 20px)" }}
    >
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">Photo to be added · {label}</span>
    </div>
  );
}

const NAV = [
  { label: "About", href: "#about" },
  { label: "Challenges", href: "#challenges" },
  { label: "Prizes", href: "#prizes" },
  { label: "Schedule", href: "#schedule" },
  { label: "FAQs", href: "#faqs" },
  { label: "Contact", href: "#contact" },
];

function scrollToId(id: string) {
  const el = document.getElementById(id.replace("#", ""));
  el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
}

export function SiteHeader({ settings, onHome }: { settings: HackathonContent["settings"]; onHome: boolean; onBackToRoom?: () => void }) {
  const [open, setOpen] = useState(false);
  const go = (href: string) => {
    setOpen(false);
    if (onHome) scrollToId(href);
    else {
      navigate("/competition");
      setTimeout(() => scrollToId(href), 120);
    }
  };
  return (
    <>
      <div className="w-full bg-[#15181d] px-3 py-1.5 text-center font-mono text-[10.5px] sm:text-[11.5px] tracking-wide text-[#d8d4c8]">
        <span className="font-bold text-[#ff4d42]">PRE-REGISTRATIONS ARE NOW OPEN!</span>
        <span className="hidden sm:inline"> · {settings.eventName.toUpperCase()} — {settings.editionLabel} · {settings.location}</span>
      </div>
      <header className="sticky top-0 z-40 w-full border-b border-[#15181d] bg-[#f6f4ef]/95 backdrop-blur">
        <div className="flex h-14 w-full items-center justify-between gap-2 px-3 sm:h-15 sm:gap-4 sm:px-6 lg:px-10 xl:px-14">
          {/* Compact, proportionate AVATAR Navbar Brand Logo */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/competition"
              data-testid="navbar-logo"
              className="group flex shrink-0 items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <span
                aria-hidden="true"
                className="grid h-6 w-6 shrink-0 place-items-center border border-[#15181d] bg-[#15181d] font-mono text-[11px] font-extrabold leading-none text-white transition-colors group-hover:border-[#d6281f] group-hover:bg-[#d6281f]"
              >
                A
              </span>
              <span className="flex flex-col justify-center leading-none">
                <span className="text-[15px] font-extrabold leading-none tracking-[-0.03em] text-[#15181d] sm:text-[16px]">
                  {settings.eventName.toUpperCase()}
                </span>
                <span className="mt-0.5 hidden font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] text-[#5b584f] sm:block">
                  {settings.editionLabel}
                </span>
              </span>
            </Link>

            <a
              href={PORTFOLIO_URL}
              data-testid="back-to-portfolio-btn"
              className="inline-flex shrink-0 items-center gap-1.5 border border-[#15181d] bg-white px-2.5 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#15181d] transition-colors hover:bg-[#15181d] hover:text-white sm:px-3 sm:py-1.5 sm:text-[11px]"
            >
              <ArrowLeft size={12} aria-hidden="true" className="shrink-0" />
              <span>Back to Portfolio</span>
            </a>
          </div>

          {/* Primary Navigation Links */}
          <nav aria-label="Primary" className="hidden items-center gap-4 xl:gap-6 lg:flex">
            {NAV.map((n) => (
              <button
                key={n.href}
                type="button"
                onClick={() => go(n.href)}
                className="whitespace-nowrap text-[13.5px] font-semibold text-[#3d3b35] transition-colors hover:text-[#d6281f]"
              >
                {n.label}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Link
              to="/competition/status"
              className="hidden whitespace-nowrap border border-[#15181d] bg-white px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[#15181d] transition-colors hover:bg-[#15181d] hover:text-white md:inline-flex"
            >
              HACKATHON STATUS
            </Link>
            <Link
              to="/competition/register"
              className={`${btnPrimary} !px-3 !py-1.5 !text-[12.5px] sm:!px-4 sm:!py-2 sm:!text-[13.5px] whitespace-nowrap`}
            >
              Pre-Register Now
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="grid h-9 w-9 shrink-0 place-items-center border border-[#15181d] bg-white text-[#15181d] lg:hidden"
            >
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Compact Mobile & Tablet Navigation Drawer */}
        {open && (
          <nav aria-label="Mobile" className="border-t border-[#15181d] bg-[#f6f4ef] px-4 pb-5 pt-2 lg:hidden">
            <div className="grid grid-cols-2 gap-x-4 border-b border-[#d9d5c9] pb-2 sm:grid-cols-3">
              {NAV.map((n) => (
                <button
                  key={n.href}
                  type="button"
                  onClick={() => go(n.href)}
                  className="py-2.5 text-left text-[15px] font-semibold text-[#15181d] hover:text-[#d6281f]"
                >
                  {n.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
              <Link
                to="/competition/status"
                className="inline-flex items-center justify-center border border-[#15181d] bg-white px-4 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#15181d] transition-colors hover:bg-[#15181d] hover:text-white"
                onClick={() => setOpen(false)}
              >
                HACKATHON STATUS
              </Link>
              <Link
                to="/competition/register"
                className={`${btnPrimary} !py-2.5 !text-[13.5px]`}
                onClick={() => setOpen(false)}
              >
                Pre-Register Now
              </Link>
              <a
                href={PORTFOLIO_URL}
                data-testid="mobile-back-to-portfolio-btn"
                className="inline-flex items-center justify-center gap-2 border border-[#15181d] bg-[#15181d] px-4 py-2.5 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#d6281f]"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span>Back to Portfolio</span>
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

export function SiteFooter({ content }: { content: HackathonContent; onBackToRoom?: () => void }) {
  const s = content.settings;
  const links: [string, string][] = [
    ["Terms and Conditions", "/competition/policy/terms"],
    ["Privacy Policy", "/competition/policy/privacy"],
    ["Refund and Cancellation", "/competition/policy/refund"],
    ["Code of Conduct", "/competition/policy/conduct"],
    ["Participant Eligibility", "/competition/policy/eligibility"],
    ["Payment and Registration", "/competition/policy/payment"],
    ["Contact and Grievance", "/competition/policy/contact"],
  ];
  return (
    <footer id="contact" className="w-full border-t-2 border-[#15181d] bg-[#15181d] text-[#d8d4c8]">
      <div className="grid w-full gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-10 lg:py-14 xl:px-14">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center border border-white/30 bg-[#d6281f] font-mono text-[11px] font-extrabold text-white">
              A
            </span>
            <p className="text-[18px] font-extrabold tracking-[-0.02em] text-white">{s.eventName.toUpperCase()}</p>
          </div>
          <p className="mt-1.5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-[#a8a498]">{s.editionLabel}</p>
          <p className="mt-4 text-[15px] leading-relaxed">{s.location}</p>
          <p className="mt-1 text-[15px] leading-relaxed">Dates: {s.dateText}</p>
          <p className="text-[15px] leading-relaxed">Venue: {s.venueText}</p>
          <div className="mt-5">
            <a
              href={PORTFOLIO_URL}
              className="inline-flex items-center gap-2 border border-white/30 bg-white/10 px-3.5 py-2 font-mono text-[11.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-[#15181d]"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              Back to Portfolio
            </a>
          </div>
        </div>
        <div>
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-white">Policies &amp; Quick Links</p>
          <ul className="mt-4 space-y-2 text-[15px]">
            <li>
              <Link to="/competition/status" className="font-semibold text-[#ff6b5e] hover:text-white hover:underline">
                Hackathon Status
              </Link>
            </li>
            {links.map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="hover:text-white hover:underline">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-white">Contact</p>
          <p className="mt-4 break-words text-[15px] leading-relaxed">
            {s.contactEmail ? <a className="underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> : "Contact email to be announced."}
          </p>
          {s.contactPhone && <p className="text-[15px]">{s.contactPhone}</p>}
          <p className="mt-3 text-[14px] leading-relaxed text-[#a8a498]">{s.grievanceText}</p>
          <a
            href={PORTFOLIO_URL}
            className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-white hover:underline"
          >
            Organised by abuzarcode.in <ArrowRight size={14} />
          </a>
        </div>
      </div>
      <div className="border-t border-white/15 px-4 py-4 text-center font-mono text-[11px] sm:text-[11.5px] text-[#a8a498]">
        Proposed prizes are not guaranteed until officially confirmed. Amazon and Anthropic are not event partners.
      </div>
    </footer>
  );
}
