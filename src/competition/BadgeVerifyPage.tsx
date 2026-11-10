import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { AVATAR_COMPETITION } from "../data/avatar-competition";
import { ParticipantBadge } from "./ParticipantBadge";

interface VerificationResult {
  ok: boolean;
  verified: boolean;
  edition?: string;
  competition?: string;
  participantId?: string;
  participantName?: string;
  status?: "VERIFIED";
  profileCompleted?: boolean;
  registeredAt?: string;
  error?: string;
}

export function BadgeVerifyPage({
  participantId: initialId,
  onNavigateCompetition,
  onBackToRoom,
}: {
  participantId: string;
  onNavigateCompetition: () => void;
  onBackToRoom: () => void;
}) {
  const [lookupId, setLookupId] = useState(initialId.toUpperCase());
  const [activeId, setActiveId] = useState(initialId.toUpperCase());
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    setLookupId(initialId.toUpperCase());
    setActiveId(initialId.toUpperCase());
  }, [initialId]);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!activeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const sig = params.get("sig") || "";
        if (window.location.search || window.location.hash) {
          window.history.replaceState({}, "", window.location.pathname);
        }
        const isNewPass = /^AIH-[RT]-\d{6}$/i.test(activeId);
        const endpoint = isNewPass
          ? `/api/hackathon/verify?id=${encodeURIComponent(activeId)}`
          : `/api/avatar/verify?id=${encodeURIComponent(activeId)}${
              sig ? `&sig=${encodeURIComponent(sig)}` : ""
            }`;
        const res = await fetch(endpoint);
        const data = (await res.json()) as VerificationResult;
        if (!cancelled) setResult(data);
      } catch {
        if (!cancelled) {
          setResult({
            ok: false,
            verified: false,
            participantId: activeId,
            error: "Unable to reach the verification service right now.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupId.trim().toUpperCase();
    if (!cleaned) return;
    window.history.pushState({}, "", `/competition/verify/${encodeURIComponent(cleaned)}`);
    setActiveId(cleaned);
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-x-hidden overflow-y-auto bg-[#f7f6f2] text-[#0c0d10] scrollbar-thin">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-black/[0.08] bg-[#f7f6f2]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-3 px-4 py-3.5 sm:px-8 lg:px-12">
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateCompetition}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2 font-display text-xs font-bold text-[#0c0d10] transition-colors hover:bg-[#0c0d10] hover:text-white sm:text-sm"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>AVATAR</span>
            </button>
            <button
              type="button"
              onClick={onBackToRoom}
              className="hidden rounded-full border border-black/15 bg-white px-4 py-2 font-display text-xs font-bold text-[#3a3e47] transition-colors hover:bg-black/5 hover:text-[#0c0d10] sm:inline-flex sm:text-sm"
            >
              3D Office
            </button>
          </div>
          <div className="flex min-w-0 items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[#e3262e]">
            <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />
            <span className="truncate">Official Credential Verification</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e3262e]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#e3262e]">
            <Trophy size={14} aria-hidden="true" />
            <span>{AVATAR_COMPETITION.name} · Verification Portal</span>
          </span>
          <h1 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-tight tracking-[-0.035em] text-[#0c0d10]">
            PARTICIPANT BADGE VERIFICATION
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#4b4f58]">
            Verify any official {AVATAR_COMPETITION.name} participant credential. Personal contact details (email and WhatsApp) are strictly kept private.
          </p>
        </div>

        {/* Search / Verify Another ID */}
        <form onSubmit={onSearch} className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value.toUpperCase())}
            placeholder="Enter ID (e.g. AIH-2026-000001)"
            aria-label="Participant ID"
            className="w-full flex-1 rounded-2xl border border-black/15 bg-white px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[#0c0d10] placeholder:text-[#8b909a] focus:border-[#e3262e] focus:outline-none focus:ring-4 focus:ring-[#e3262e]/15"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#e3262e] px-6 py-3.5 font-display text-sm font-bold text-white transition-colors hover:bg-[#c81920]"
          >
            <Search size={16} aria-hidden="true" />
            <span>Verify</span>
          </button>
        </form>

        {/* Verification Result */}
        <div className="mt-10">
          {loading ? (
            <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-[2rem] border border-black/10 bg-white p-8 text-center">
              <Loader2 size={32} className="animate-spin text-[#e3262e]" aria-hidden="true" />
              <p className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-[#0c0d10]">
                Verifying credential {activeId}…
              </p>
            </div>
          ) : result?.verified && result.participantId ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="rounded-[2rem] border border-black/12 bg-white p-6 shadow-[0_24px_60px_-24px_rgba(12,13,16,0.1)] sm:p-9">
                <div className="flex items-center gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#15803d]/10 text-[#15803d]">
                    <CheckCircle2 size={24} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <span className="block font-mono text-xs font-bold uppercase tracking-wider text-[#15803d]">
                      Authentic Registration Confirmed
                    </span>
                    <h2 className="truncate font-display text-2xl font-bold text-[#0c0d10] sm:text-3xl">
                      {result.participantName}
                    </h2>
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-black/10 pt-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-[#f7f6f2] p-4">
                    <dt className="font-mono text-xs font-bold uppercase tracking-wider text-[#525660]">
                      Participant ID
                    </dt>
                    <dd className="mt-1 font-mono text-lg font-bold text-[#0c0d10]">
                      {result.participantId}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-[#f7f6f2] p-4">
                    <dt className="font-mono text-xs font-bold uppercase tracking-wider text-[#525660]">
                      Verification Status
                    </dt>
                    <dd className="mt-1 font-mono text-lg font-bold text-[#15803d]">
                      {result.status}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-[#f7f6f2] p-4">
                    <dt className="font-mono text-xs font-bold uppercase tracking-wider text-[#525660]">
                      Competition
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#0c0d10]">
                      {result.competition || `${AVATAR_COMPETITION.name} — ${AVATAR_COMPETITION.subtitle}`}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-[#f7f6f2] p-4">
                    <dt className="font-mono text-xs font-bold uppercase tracking-wider text-[#525660]">
                      Verified Timestamp
                    </dt>
                    <dd className="mt-1 font-mono text-sm font-medium text-[#3a3e47]">
                      {result.registeredAt
                        ? new Date(result.registeredAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Verified"}
                    </dd>
                  </div>
                </dl>

                <p className="mt-6 rounded-2xl border border-black/10 bg-[#f7f6f2] p-4 text-xs leading-relaxed text-[#525660] sm:text-sm">
                  <strong>Privacy Protection:</strong> Personal contact details (email address and WhatsApp number) are never exposed on public verification pages.
                </p>
              </div>

              <div className="rounded-[2rem] bg-[#0c0d10] p-6">
                <ParticipantBadge
                  participantId={result.participantId}
                  participantName={result.participantName || "Official Participant"}
                  status="VERIFIED"
                  registeredAt={result.registeredAt}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-lg rounded-[2rem] border border-black/12 bg-white p-8 text-center shadow-lg"
            >
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e3262e]/10 text-[#e3262e]">
                <ShieldAlert size={28} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-[#0c0d10]">
                Credential Not Found ({activeId || "Unknown"})
              </h2>
              <p className="mt-2 text-base text-[#4b4f58]">
                {result?.error ||
                  "No verified AVATAR registration matches this Participant ID. Please check the ID and try again."}
              </p>
              <button
                type="button"
                onClick={onNavigateCompetition}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#e3262e] px-7 py-3.5 font-display text-base font-bold text-white transition-colors hover:bg-[#c81920]"
              >
                Join AVATAR
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
