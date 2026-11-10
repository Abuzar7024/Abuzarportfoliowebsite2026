import React, { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { EVENT_STATUS_LABELS, type EventStatusLabel } from "../shared/hackathon-content";
import { HackathonPassCard, type PassMemberData } from "./HackathonPass";
import type { ContentResponse } from "./lib";
import { Kicker, Link, btnPrimary, btnSecondary, inputCls } from "./ui";

interface VerifyPassResponse {
  ok: boolean;
  verified: boolean;
  participantId?: string;
  participantName?: string;
  status?: string;
  registeredAt?: string;
  error?: string;
  pass?: PassMemberData;
}

function getEffectiveEventStatus(
  configured: EventStatusLabel | undefined,
  registrationOpen: boolean
): EventStatusLabel {
  if (!registrationOpen && (configured === "Pre-Registrations Open" || configured === "Registrations Open" || !configured)) {
    return "Registrations Closed";
  }
  return configured && EVENT_STATUS_LABELS.includes(configured) ? configured : "Pre-Registrations Open";
}

function statusPillClasses(label: string, active: boolean): string {
  if (!active) {
    return "border border-[#bdb8ab] bg-[#f6f4ef] text-[#6b685e]";
  }
  if (label === "Registrations Closed") {
    return "border-2 border-[#15181d] bg-[#15181d] text-white";
  }
  if (label === "Coming Soon") {
    return "border-2 border-[#15181d] bg-[#9a6a00] text-white";
  }
  if (label === "Event Completed") {
    return "border-2 border-[#15181d] bg-[#3d3b35] text-white";
  }
  if (label === "Event Live") {
    return "border-2 border-[#15181d] bg-[#157a3a] text-white";
  }
  return "border-2 border-[#15181d] bg-[#d6281f] text-white";
}

export function StatusPage({ data }: { data: ContentResponse }) {
  const { content, registration, stats, announcements, reload } = data;
  const s = content.settings;

  const effectiveEventStatus = getEffectiveEventStatus(s.eventStatus, registration.open);
  const preRegStatus = registration.open
    ? s.preRegistrationStatus || "Pre-Registrations Open"
    : "Registrations Closed";
  const officialRegStatus = registration.open
    ? s.officialRegistrationStatus || "Pre-Registrations Open"
    : "Registrations Closed";

  const confirmedTeams = stats?.confirmedTeams ?? 0;
  const confirmedParticipants = stats?.confirmedParticipants ?? 0;

  // Optional public pass/registration lookup without login
  const [lookupCode, setLookupCode] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupResult, setLookupResult] = useState<VerifyPassResponse | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupCode.trim().toUpperCase();
    if (!cleaned) return;
    setLookupBusy(true);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/hackathon/verify?id=${encodeURIComponent(cleaned)}`);
      const json = (await res.json()) as VerifyPassResponse;
      setLookupResult(json);
    } catch {
      setLookupResult({
        ok: false,
        verified: false,
        participantId: cleaned,
        error: "Could not reach the verification service. Please try again.",
      });
    } finally {
      setLookupBusy(false);
    }
  };

  return (
    <div data-testid="hackathon-status-page" className="w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-10 xl:px-14">
      {/* Top Header Banner */}
      <header className="border-2 border-[#15181d] bg-[#15181d] p-5 text-white sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 border border-white/25 bg-[#d6281f] px-3 py-1.5 font-mono text-[11px] sm:text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-white">
            <Sparkles size={13} aria-hidden="true" className="shrink-0" />
            <span data-testid="status-current-indicator">{effectiveEventStatus}</span>
          </div>
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 border border-white/25 bg-white/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#d8d4c8] transition-colors hover:bg-white hover:text-[#15181d]"
          >
            <RefreshCw size={13} aria-hidden="true" />
            Refresh Live Status
          </button>
        </div>

        <p className="mt-5 font-mono text-[11.5px] sm:text-[12px] font-bold uppercase tracking-[0.18em] text-[#ff6b5e]">
          PUBLIC HACKATHON STATUS PORTAL · NO LOGIN REQUIRED
        </p>
        <h1 className="mt-2 text-[clamp(1.85rem,4.5vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.035em] text-white">
          AVATAR – DESIGN. BUILD. SELL. IN ONE DAY.
        </h1>
        <p className="mt-3 max-w-3xl text-[15.5px] sm:text-[16px] leading-relaxed text-[#d8d4c8]">
          Live event status, registration availability, confirmed team and participant counts, key dates, and official announcements for AVATAR.
        </p>

        {registration.open && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/competition/register" className={`${btnPrimary} w-full sm:w-auto`}>
              Pre-Register Now <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#ff6b5e]">
              PRE-REGISTRATIONS ARE NOW OPEN!
            </span>
          </div>
        )}
      </header>

      {/* Supported Event Status Indicators Bar */}
      <section aria-label="Event status indicators" className="mt-8 border border-[#15181d] bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Kicker>Live Event Status Indicator</Kicker>
          <span className="font-mono text-[11px] text-[#5b584f]">
            Updated dynamically from organiser configuration
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {EVENT_STATUS_LABELS.map((label) => {
            const isActive = effectiveEventStatus === label;
            return (
              <div
                key={label}
                data-testid={`status-pill-${label.toLowerCase().replace(/\s+/g, "-")}`}
                aria-current={isActive ? "true" : undefined}
                className={`flex items-center justify-center gap-2 px-3 py-3 text-center font-mono text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider transition-all ${statusPillClasses(
                  label,
                  isActive
                )}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    isActive ? "bg-white animate-pulse" : "bg-[#bdb8ab]"
                  }`}
                />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Primary Status & Metrics Grid */}
      <section aria-label="Hackathon status details" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[#15181d] bg-white p-5">
          <div className="flex items-center justify-between text-[#d6281f]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
              Pre-Registration Status
            </span>
            <Sparkles size={16} aria-hidden="true" />
          </div>
          <p className="mt-2 text-[20px] font-extrabold leading-tight text-[#15181d]" data-testid="status-prereg">
            {preRegStatus}
          </p>
          <p className="mt-1 text-[13px] text-[#5b584f]">
            {registration.open ? "PRE-REGISTRATIONS ARE NOW OPEN!" : registration.reason ?? "Currently closed"}
          </p>
        </div>

        <div className="border border-[#15181d] bg-white p-5">
          <div className="flex items-center justify-between text-[#157a3a]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
              Official Registration Status
            </span>
            <CheckCircle2 size={16} aria-hidden="true" />
          </div>
          <p className="mt-2 text-[20px] font-extrabold leading-tight text-[#15181d]" data-testid="status-official-reg">
            {officialRegStatus}
          </p>
          <p className="mt-1 text-[13px] text-[#5b584f]">
            Solo builders &amp; teams of 1–{Math.min(s.maxTeamSize || 15, 15)} members
          </p>
        </div>

        <div className="border border-[#15181d] bg-white p-5">
          <div className="flex items-center justify-between text-[#15181d]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b584f]">
              Event Status
            </span>
            <Activity size={16} className="text-[#d6281f]" aria-hidden="true" />
          </div>
          <p className="mt-2 text-[20px] font-extrabold leading-tight text-[#d6281f]" data-testid="status-event">
            {effectiveEventStatus}
          </p>
          <p className="mt-1 text-[13px] text-[#5b584f]">
            1-Day Challenge · DESIGN. BUILD. SELL.
          </p>
        </div>

        <div className="border border-[#15181d] bg-white p-5">
          <div className="flex items-center justify-between text-[#15181d]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b584f]">
              Registration Deadline
            </span>
            <Clock size={16} className="text-[#d6281f]" aria-hidden="true" />
          </div>
          <p className="mt-2 text-[18px] font-extrabold leading-tight text-[#15181d]" data-testid="status-deadline">
            {s.registrationDeadlineText || "Open now · To be announced"}
          </p>
          <p className="mt-1 text-[13px] text-[#5b584f]">
            Register early to secure your team spot
          </p>
        </div>

        <div className="border border-[#15181d] bg-white p-5">
          <div className="flex items-center justify-between text-[#15181d]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b584f]">
              Hackathon Date
            </span>
            <Calendar size={16} className="text-[#d6281f]" aria-hidden="true" />
          </div>
          <p className="mt-2 text-[18px] font-extrabold leading-tight text-[#15181d]" data-testid="status-date">
            {s.dateText || "To be announced"}
          </p>
          <p className="mt-1 text-[13px] text-[#5b584f]">
            Location: {s.location}
          </p>
        </div>

        <div className="border border-[#15181d] bg-white p-5">
          <div className="flex items-center justify-between text-[#15181d]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b584f]">
              Total Registered Teams
            </span>
            <Users size={16} className="text-[#d6281f]" aria-hidden="true" />
          </div>
          <p className="mt-2 font-mono text-[30px] font-extrabold leading-none text-[#15181d]" data-testid="status-total-teams">
            {confirmedTeams.toLocaleString("en-IN")}
          </p>
          <p className="mt-1.5 text-[13px] text-[#5b584f]">
            Verified &amp; confirmed teams
          </p>
        </div>

        <div className="border border-[#15181d] bg-white p-5 sm:col-span-2">
          <div className="flex items-center justify-between text-[#15181d]">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b584f]">
              Total Registered Participants
            </span>
            <Users size={16} className="text-[#157a3a]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
            <p className="font-mono text-[32px] font-extrabold leading-none text-[#15181d]" data-testid="status-total-participants">
              {confirmedParticipants.toLocaleString("en-IN")}
            </p>
            <p className="text-[13.5px] font-semibold text-[#3d3b35]">
              Confirmed builders with official AVATAR passes issued
            </p>
          </div>
        </div>
      </section>

      {/* Important Announcements Section */}
      <section aria-label="Important announcements" className="mt-10 border-t-2 border-[#15181d] pt-8">
        <div className="flex items-center gap-2.5">
          <Bell size={18} className="text-[#d6281f]" aria-hidden="true" />
          <Kicker>Important Announcements</Kicker>
        </div>
        <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em] text-[#15181d]">
          Official Updates &amp; Announcements
        </h2>

        <div className="mt-5 space-y-4">
          {announcements.length > 0 ? (
            announcements.map((a) => (
              <article key={a.id} className="border border-[#15181d] bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[18px] font-extrabold text-[#15181d]">{a.title}</h3>
                  <span className="font-mono text-[11.5px] font-semibold text-[#5b584f]">
                    {new Date(a.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-[15.5px] leading-relaxed text-[#3d3b35]">{a.body}</p>
              </article>
            ))
          ) : (
            <article className="border border-[#15181d] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#d6281f] px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-wider text-white">
                  Official Update
                </span>
                <span className="font-mono text-[11.5px] font-semibold text-[#5b584f]">Live</span>
              </div>
              <h3 className="mt-2 text-[19px] font-extrabold text-[#15181d]">
                PRE-REGISTRATIONS ARE NOW OPEN! — AVATAR (DESIGN. BUILD. SELL. IN ONE DAY.)
              </h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-[#3d3b35]">
                Pre-registrations for AVATAR are officially open for solo builders and teams of up to 15 members. Register your team and complete PayU payment verification to immediately receive your official AVATAR Participant Pass.
              </p>
            </article>
          )}
        </div>
      </section>

      {/* Public Registration & Pass Status Lookup (No Sign-In Needed) */}
      <section aria-label="Check participant pass status" className="mt-12 border-t-2 border-[#15181d] pt-8">
        <Kicker>Instant Pass &amp; Registration Verification</Kicker>
        <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em] text-[#15181d]">
          Check Your Registration or Download Your Pass
        </h2>
        <p className="mt-1 max-w-2xl text-[15.5px] text-[#3d3b35]">
          Already registered? Enter your Registration ID (e.g. <code className="font-mono font-bold">AIH-R-000001</code>) or Team ID (e.g. <code className="font-mono font-bold">AIH-T-000001</code>) to verify your status and download your official AVATAR pass — no sign-in required.
        </p>

        <form onSubmit={handleLookup} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
            placeholder="Enter Registration ID or Team ID (e.g. AIH-R-000001)"
            aria-label="Registration ID or Team ID"
            className={`${inputCls} font-mono font-bold uppercase`}
          />
          <button type="submit" disabled={lookupBusy || !lookupCode.trim()} className={`${btnPrimary} shrink-0`}>
            {lookupBusy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
            <span>Check Status</span>
          </button>
        </form>

        {lookupResult && (
          <div className="mt-6">
            {lookupResult.verified && lookupResult.pass ? (
              <div className="border-2 border-[#15181d] bg-white p-6">
                <div className="flex items-center gap-2 text-[#157a3a]">
                  <CheckCircle2 size={20} aria-hidden="true" />
                  <span className="font-mono text-[12px] font-bold uppercase tracking-wider">
                    Registration Verified · Official Pass Active
                  </span>
                </div>
                <p className="mt-1 text-[16px] font-bold text-[#15181d]">{lookupResult.participantName}</p>
                <div className="mt-6">
                  <HackathonPassCard pass={lookupResult.pass} />
                </div>
              </div>
            ) : (
              <div role="alert" className="flex items-start gap-3 border-l-4 border-[#d6281f] bg-white p-4">
                <ShieldAlert size={20} className="mt-0.5 shrink-0 text-[#d6281f]" aria-hidden="true" />
                <div>
                  <p className="text-[15px] font-bold text-[#15181d]">
                    No confirmed registration found for &quot;{lookupResult.participantId}&quot;
                  </p>
                  <p className="mt-1 text-[14px] text-[#3d3b35]">
                    {lookupResult.error ?? "Please check your Registration ID or Team ID and try again."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
