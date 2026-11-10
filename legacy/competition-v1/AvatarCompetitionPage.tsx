import React, { useCallback, useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  LifeBuoy,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { AVATAR_COMPETITION } from "../data/avatar-competition";
import { HackathonHero } from "./HackathonHero";
import { PreRegistrationProgress } from "./PreRegistrationProgress";
import { PrizeCards } from "./PrizeCards";
import { RegistrationForm, type RegistrationFormValues } from "./RegistrationForm";
import { RegistrationSuccess } from "./RegistrationSuccess";

interface RegistrationState {
  registrationRef?: string;
  payuTxnId: string;
  participantId: string | null;
  participantName: string;
  email: string;
  whatsappNumber: string;
  paymentAmount: string;
  currency?: string;
  paymentStatus:
    | "CREATED"
    | "INITIATED"
    | "PENDING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELLED"
    | "EXPIRED"
    | "REFUND_PENDING"
    | "REFUNDED"
    | "NOT_APPLICABLE";
  registrationStatus: string;
  failureReason?: string | null;
  profileCompletionStatus: "PENDING" | "COMPLETED";
  emailNotificationStatus: string;
  badgeUrl: string | null;
  verifySignature: string | null;
  registrationTimestamp: string;
  paidAt: string | null;
  lastVerifiedAt?: string | null;
  termsVersion?: string | null;
  privacyVersion?: string | null;
  consentTimestamp?: string | null;
  consentStatus?: string | null;
  token?: string;
}

interface EmailJsPayload {
  serviceId: string;
  templateId: string;
  organiserParams: Record<string, string>;
  participantParams: Record<string, string>;
}

const STORAGE_KEY = "ai_hackathon_2026_active_registration";
const POLL_BACKOFF_DELAYS_MS = [3000, 5000, 8000, 13000, 21000];

function submitPayUCheckoutForm(actionUrl: string, fields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";
  for (const [k, v] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v ?? "";
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function formatReadableFailureReason(reason?: string | null): string {
  if (!reason) return "The payment gateway did not confirm completion for this transaction.";
  if (reason === "hash_mismatch") {
    return "Payment response signature validation failed. No charges were confirmed.";
  }
  if (reason === "amount_mismatch" || reason === "verification_mismatch") {
    return "Transaction amount or status verification did not match the required ₹499 pre-registration fee.";
  }
  if (reason === "currency_mismatch") {
    return "Transaction currency verification did not match INR.";
  }
  if (reason === "unknown_txnid") {
    return "Unrecognised transaction reference.";
  }
  return reason;
}

export function AvatarCompetitionPage({
  onBackToRoom,
  onOpenVerify,
  onOpenTerms,
}: {
  onBackToRoom: () => void;
  onOpenVerify: (participantId: string) => void;
  onOpenTerms?: (section?: "terms" | "privacy") => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [registration, setRegistration] = useState<RegistrationState | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<{
    status: "FAILED" | "PENDING" | "CANCELLED";
    reason?: string;
    txnid?: string;
  } | null>(null);
  const [showFailedScreen, setShowFailedScreen] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Live pre-registration progress bar state (from real DB)
  const [confirmedCount, setConfirmedCount] = useState<number | null>(null);
  const [targetCount, setTargetCount] = useState<number>(
    AVATAR_COMPETITION.registration.targetRegistrations
  );
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<boolean>(false);

  const prizesRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const registrationRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const emailAttemptedForTxn = useRef<Set<string>>(new Set());

  const scrollToSection = useCallback((el: HTMLElement | null) => {
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToRegistration = useCallback(() => {
    scrollToSection(registrationRef.current);
  }, [scrollToSection]);

  const fetchLiveProgressStats = useCallback(async () => {
    try {
      const res = await fetch("/api/avatar/stats", { credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        ok: boolean;
        confirmedCount?: number;
        targetCount?: number;
      };
      if (data.ok && typeof data.confirmedCount === "number") {
        setConfirmedCount(data.confirmedCount);
        if (typeof data.targetCount === "number") {
          setTargetCount(data.targetCount);
        }
        setStatsError(false);
      } else {
        setStatsError(true);
      }
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveProgressStats();
  }, [fetchLiveProgressStats]);

  const triggerClientEmailJsIfNeeded = useCallback(
    async (reg: RegistrationState, payload?: EmailJsPayload | null) => {
      if (!payload || !reg.payuTxnId) return;
      if (emailAttemptedForTxn.current.has(reg.payuTxnId)) return;
      emailAttemptedForTxn.current.add(reg.payuTxnId);

      if (reg.emailNotificationStatus === "SENT") return;

      const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "").trim();
      let organiserSent = false;
      let participantSent = false;

      if (publicKey) {
        try {
          await emailjs.send(
            payload.serviceId,
            payload.templateId,
            payload.organiserParams,
            { publicKey }
          );
          organiserSent = true;
        } catch {
          organiserSent = false;
        }

        try {
          await emailjs.send(
            payload.serviceId,
            payload.templateId,
            payload.participantParams,
            { publicKey }
          );
          participantSent = true;
        } catch {
          participantSent = false;
        }
      }

      try {
        await fetch("/api/avatar/confirm-emailjs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payuTxnId: reg.payuTxnId,
            organiserSent: String(organiserSent),
            participantSent: String(participantSent),
          }),
        });
      } catch {
        // Server background retry handles any network error
      }
    },
    []
  );

  const checkTransactionStatus = useCallback(
    async (opts?: { txnid?: string; token?: string; reconcile?: boolean; silent?: boolean }) => {
      if (!opts?.silent) setLoadingStatus(true);
      try {
        let targetTxnId = opts?.txnid || "";
        let targetToken = opts?.token || "";

        if (!targetTxnId) {
          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved) as { txnid?: string; token?: string };
              if (parsed?.txnid) {
                targetTxnId = parsed.txnid;
                targetToken = parsed.token || "";
              }
            }
          } catch {
            // Ignore storage errors
          }
        }

        const q = new URLSearchParams();
        if (targetTxnId) q.set("txnid", targetTxnId);
        if (targetToken) q.set("token", targetToken);
        if (opts?.reconcile) q.set("reconcile", "true");
        const queryStr = q.toString();

        const res = await fetch(
          `/api/avatar/status${queryStr ? `?${queryStr}` : ""}`,
          { credentials: "same-origin" }
        );
        const data = (await res.json()) as {
          ok: boolean;
          failureReason?: string;
          registration?: RegistrationState | null;
          emailjsPayload?: EmailJsPayload | null;
        };

        if (data.ok && data.registration) {
          const reg = data.registration;
          setRegistration(reg);

          if (reg.payuTxnId) {
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  txnid: reg.payuTxnId,
                  token: reg.token || targetToken,
                })
              );
            } catch {
              // Ignore
            }
          }

          if (reg.paymentStatus === "SUCCESS" || reg.paymentStatus === "NOT_APPLICABLE") {
            setPaymentBanner(null);
            setShowFailedScreen(false);
            fetchLiveProgressStats();
            if (reg.profileCompletionStatus === "COMPLETED") {
              triggerClientEmailJsIfNeeded(reg, data.emailjsPayload);
            }
            setTimeout(() => {
              registrationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 120);
          } else if (reg.paymentStatus === "PENDING") {
            setShowFailedScreen(false);
            setPaymentBanner({
              status: "PENDING",
              reason: data.failureReason || reg.failureReason || undefined,
              txnid: reg.payuTxnId,
            });
            setTimeout(() => {
              registrationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 120);
          } else if (
            reg.paymentStatus === "FAILED" ||
            reg.paymentStatus === "CANCELLED"
          ) {
            setShowFailedScreen(true);
            setPaymentBanner({
              status: reg.paymentStatus,
              reason: data.failureReason || reg.failureReason || undefined,
              txnid: reg.payuTxnId,
            });
            setTimeout(() => {
              registrationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 120);
          }
        }
      } catch {
        // Ignore offline status lookup errors
      } finally {
        if (!opts?.silent) setLoadingStatus(false);
      }
    },
    [triggerClientEmailJsIfNeeded, fetchLiveProgressStats]
  );

  // Restore session via HttpOnly cookie or localStorage on mount, and keep browser URL 100% clean
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTxnId = params.get("txnid") || "";
    const urlToken = params.get("token") || "";

    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    checkTransactionStatus({
      txnid: urlTxnId,
      token: urlToken,
      reconcile: true,
    });
  }, [checkTransactionStatus]);

  // Bounded exponential backoff polling when transaction is in PENDING state
  useEffect(() => {
    if (registration?.paymentStatus !== "PENDING") return;
    if (pollCount >= POLL_BACKOFF_DELAYS_MS.length) return;

    const delay = POLL_BACKOFF_DELAYS_MS[pollCount];
    const timer = window.setTimeout(async () => {
      await checkTransactionStatus({
        txnid: registration.payuTxnId,
        token: registration.token,
        reconcile: true,
        silent: true,
      });
      setPollCount((c) => c + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [registration?.paymentStatus, registration?.payuTxnId, registration?.token, pollCount, checkTransactionStatus]);

  const handleManualPendingRefresh = async () => {
    if (!registration?.payuTxnId || manualRefreshing) return;
    setManualRefreshing(true);
    try {
      await checkTransactionStatus({
        txnid: registration.payuTxnId,
        token: registration.token,
        reconcile: true,
        silent: true,
      });
      toast.info("Transaction status checked with payment gateway.");
    } finally {
      setManualRefreshing(false);
    }
  };

  const handleRecoverBadge = async (email: string, whatsappNumber: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/avatar/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, whatsappNumber }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        sessionToken?: string;
        registration?: RegistrationState;
      };
      if (!data.ok || !data.registration) {
        throw new Error(
          data.error ||
            "No confirmed paid registration was found matching that email and WhatsApp number."
        );
      }
      setRegistration(data.registration);
      setPaymentBanner(null);
      setShowFailedScreen(false);
      if (data.registration.payuTxnId) {
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              txnid: data.registration.payuTxnId,
              token: data.sessionToken || "",
            })
          );
        } catch {
          // Ignore storage errors
        }
      }
      toast.success("Your verified AI Hackathon pass has been recovered!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not recover badge.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegistrationSubmit = async (values: RegistrationFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const idempotencyKey = `IDEM-${values.email.toLowerCase()}-${Math.floor(Date.now() / 60000)}`;
      const res = await fetch("/api/avatar/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          whatsappNumber: values.whatsappNumber,
          termsAccepted: String(values.termsAccepted),
          termsVersion: values.termsVersion,
          privacyVersion: values.privacyVersion,
          idempotencyKey,
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        alreadyPaid?: boolean;
        reusedIdempotentOrder?: boolean;
        freePreRegistration?: boolean;
        sessionToken?: string;
        actionUrl?: string;
        fields?: Record<string, string>;
        registration?: RegistrationState;
        emailjsPayload?: EmailJsPayload;
      };

      if (!data.ok) {
        throw new Error(data.error || "Unable to process registration.");
      }

      if (data.alreadyPaid && data.registration) {
        setRegistration(data.registration);
        setPaymentBanner(null);
        setShowFailedScreen(false);
        fetchLiveProgressStats();
        toast.success("We found your existing confirmed AI Hackathon registration!");
        setSubmitting(false);
        return;
      }

      if (data.freePreRegistration && data.registration) {
        setRegistration(data.registration);
        setPaymentBanner(null);
        setShowFailedScreen(false);
        fetchLiveProgressStats();
        await triggerClientEmailJsIfNeeded(data.registration, data.emailjsPayload);
        toast.success("You're on the list! Your AI Hackathon pre-registration is confirmed.");
        setSubmitting(false);
        return;
      }

      if (!data.actionUrl || !data.fields) {
        throw new Error("Unable to initialize PayU checkout.");
      }

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            txnid: data.fields.txnid,
            token: data.sessionToken || "",
          })
        );
      } catch {
        // Ignore storage quota issues
      }

      submitPayUCheckoutForm(data.actionUrl, data.fields);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start registration.");
      setSubmitting(false);
    }
  };

  const handleOpenTerms = (section: "terms" | "privacy" = "terms") => {
    if (onOpenTerms) {
      onOpenTerms(section);
    } else if (typeof window !== "undefined") {
      window.location.href =
        section === "privacy"
          ? AVATAR_COMPETITION.privacyPath
          : AVATAR_COMPETITION.termsPath;
    }
  };

  const isRegistrationConfirmed =
    (registration?.paymentStatus === "SUCCESS" && Boolean(registration.participantId)) ||
    registration?.paymentStatus === "NOT_APPLICABLE";

  const isPaymentPending = registration?.paymentStatus === "PENDING";
  const isPaymentFailedOrCancelled =
    (registration?.paymentStatus === "FAILED" ||
      registration?.paymentStatus === "CANCELLED") &&
    showFailedScreen;

  return (
    <div
      data-testid="ai-hackathon-page"
      className="relative h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#07090e] text-[#f8fafc] font-jakarta selection:bg-[#ef233c] selection:text-white"
    >
      {/* Payment Processing Overlay */}
      {submitting && (
        <div
          role="status"
          aria-live="polite"
          data-testid="payment-processing-screen"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#07090e]/90 px-6 text-center backdrop-blur-xl"
        >
          <div className="mx-auto max-w-md rounded-3xl border border-white/15 bg-[#0d111b] p-8 shadow-2xl sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#ef233c] text-white shadow-[0_0_30px_rgba(239,35,60,0.5)]">
              <Loader2 size={28} className="animate-spin" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Connecting to PayU…
            </h2>
            <p className="mt-2 text-base text-[#94a3b8]">
              Preparing your secure ₹499 pre-registration checkout…
            </p>
          </div>
        </div>
      )}

      {/* ── 1. STICKY FUTURISTIC NAVIGATION ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07090e]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-18 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <a
              href="/competition"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.03em] text-white sm:text-xl"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ef233c] shadow-[0_0_12px_#ef233c]" />
              <span>{AVATAR_COMPETITION.name}</span>
            </a>
          </div>

          <div className="flex items-center gap-5 sm:gap-7">
            <nav aria-label="AI Hackathon Navigation" className="hidden items-center gap-7 md:flex">
              <button
                type="button"
                onClick={() => scrollToSection(prizesRef.current)}
                className="text-sm font-semibold text-[#94a3b8] transition-colors hover:text-white"
              >
                Prizes
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(stepsRef.current)}
                className="text-sm font-semibold text-[#94a3b8] transition-colors hover:text-white"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => scrollToSection(faqRef.current)}
                className="text-sm font-semibold text-[#94a3b8] transition-colors hover:text-white"
              >
                FAQ
              </button>
              <button
                type="button"
                onClick={onBackToRoom}
                className="text-sm font-semibold text-[#94a3b8] transition-colors hover:text-white"
              >
                3D Portfolio
              </button>
            </nav>

            <button
              type="button"
              onClick={scrollToRegistration}
              data-testid="nav-preregister-btn"
              className="inline-flex items-center justify-center rounded-xl bg-[#ef233c] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-white shadow-[0_0_24px_rgba(239,35,60,0.4)] transition-all hover:bg-[#d90429] sm:px-5 sm:text-sm"
            >
              Pre-Register
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ── SECTION 1: HERO (Three.js + Bold Typography) ── */}
        <HackathonHero onJoinClick={scrollToRegistration} />

        {/* ── SECTION 2: REGISTRATION PROGRESS (5,000 BUILDERS. ONE COMPETITION.) ── */}
        <PreRegistrationProgress
          confirmedCount={confirmedCount}
          targetCount={targetCount}
          loading={statsLoading}
          error={statsError}
        />

        {/* ── SECTION 3: PRIZES ── */}
        <section ref={prizesRef}>
          <PrizeCards />
        </section>

        {/* ── SECTION 4: HOW IT WORKS (3 Animated Steps) ── */}
        <section
          ref={stepsRef}
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="w-full border-b border-white/[0.07] bg-[#090d16] py-16 sm:py-24"
        >
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-[#38bdf8]">
                HOW IT WORKS
              </span>
              <h2
                id="how-it-works-heading"
                className="mt-2 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-white"
              >
                THREE SIMPLE STEPS.
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
              {AVATAR_COMPETITION.howToJoin.map((step, idx) => (
                <motion.div
                  key={step.step}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                  className="rounded-3xl border border-white/10 bg-[#0d121f] p-7 sm:p-8"
                >
                  <span className="inline-block font-mono text-xs font-extrabold uppercase tracking-[0.16em] text-[#ef233c]">
                    {step.title}
                  </span>
                  <p className="mt-4 text-base font-medium leading-relaxed text-[#cbd5e1] sm:text-lg">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: REGISTRATION & TRANSACTION STATUS ── */}
        <section
          ref={registrationRef}
          id="register"
          aria-labelledby="registration-heading"
          className="w-full border-b border-white/[0.07] bg-[#07090e] py-16 sm:py-24"
        >
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-left sm:text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-[#ef233c]">
                OFFICIAL PRE-REGISTRATION
              </span>
              <h2
                id="registration-heading"
                className="mt-2 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-white"
              >
                {isRegistrationConfirmed
                  ? "YOUR OFFICIAL PASS"
                  : isPaymentPending
                  ? "CONFIRMING YOUR PAYMENT"
                  : isPaymentFailedOrCancelled
                  ? "PAYMENT NOT COMPLETED"
                  : "SECURE YOUR SPOT."}
              </h2>
            </div>

            {loadingStatus ? (
              <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0d111b] p-12 text-center">
                <Loader2 size={32} className="animate-spin text-[#ef233c]" aria-hidden="true" />
                <p className="mt-4 text-lg font-bold text-white">
                  Verifying your transaction status…
                </p>
              </div>
            ) : isRegistrationConfirmed && registration ? (
              <RegistrationSuccess
                participantId={registration.participantId}
                participantName={registration.participantName}
                email={registration.email}
                whatsappNumber={registration.whatsappNumber}
                payuTxnId={registration.payuTxnId}
                registrationRef={registration.registrationRef}
                paymentAmount={registration.paymentAmount}
                paymentStatus={registration.paymentStatus}
                verifySignature={registration.verifySignature}
                registeredAt={registration.paidAt || registration.registrationTimestamp}
                onOpenVerify={onOpenVerify}
                onBackToRoom={onBackToRoom}
              />
            ) : isPaymentPending && registration ? (
              <div
                data-testid="payment-pending-screen"
                className="mx-auto max-w-2xl rounded-3xl border border-amber-500/40 bg-[#0d111b] p-6 shadow-xl sm:p-10"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-400">
                    <Clock size={28} aria-hidden="true" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                      Payment Status: PENDING
                    </span>
                    <h3 className="mt-1 text-2xl font-extrabold text-white">
                      WE&apos;RE CONFIRMING YOUR PAYMENT
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-base leading-relaxed text-[#cbd5e1]">
                  Your payment is awaiting confirmation from PayU / your bank. Please check status below before initiating another payment.
                </p>

                <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#07090e] p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                      Transaction Reference
                    </dt>
                    <dd className="mt-1 font-mono text-sm font-bold text-white">
                      {registration.payuTxnId}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#07090e] p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                      Amount
                    </dt>
                    <dd className="mt-1 text-base font-extrabold text-white">
                      ₹{registration.paymentAmount || "499.00"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleManualPendingRefresh}
                    disabled={manualRefreshing}
                    data-testid="refresh-pending-status-btn"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ef233c] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#d90429] disabled:opacity-60"
                  >
                    <RefreshCw
                      size={16}
                      className={manualRefreshing ? "animate-spin" : ""}
                      aria-hidden="true"
                    />
                    <span>
                      {manualRefreshing
                        ? "Checking Gateway…"
                        : "REFRESH TRANSACTION STATUS"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToRoom}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white hover:bg-white/[0.08]"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>RETURN TO WEBSITE</span>
                  </button>
                </div>
              </div>
            ) : isPaymentFailedOrCancelled && registration ? (
              <div
                data-testid="payment-failed-screen"
                className="mx-auto max-w-2xl rounded-3xl border border-[#ef233c]/40 bg-[#0d111b] p-6 shadow-2xl sm:p-10"
              >
                {/* Custom Vector Failure Illustration + Heading */}
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#ef233c]/40 bg-[#ef233c]/12">
                    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
                      <polygon
                        points="24,4 42,14 42,34 24,44 6,34 6,14"
                        fill="none"
                        stroke="#ef233c"
                        strokeWidth="2.5"
                      />
                      <line
                        x1="18"
                        y1="18"
                        x2="30"
                        y2="30"
                        stroke="#ff4d63"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                      <line
                        x1="30"
                        y1="18"
                        x2="18"
                        y2="30"
                        stroke="#ff4d63"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="inline-block rounded-full border border-[#ef233c]/40 bg-[#ef233c]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff4d63]">
                      Payment Status: {registration.paymentStatus}
                    </span>
                    <h3 className="mt-1.5 text-2xl font-extrabold text-white sm:text-3xl">
                      PAYMENT NOT COMPLETED
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-base leading-relaxed text-[#cbd5e1]">
                  Your ₹499 pre-registration payment was not completed. No participant pass was issued for this attempt. You can safely retry below.
                </p>

                <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[#07090e] p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                      Transaction Reference
                    </dt>
                    <dd className="mt-1 font-mono text-sm font-bold text-white">
                      {registration.payuTxnId || "N/A"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#07090e] p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                      Reason
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#cbd5e1]">
                      {formatReadableFailureReason(
                        paymentBanner?.reason || registration.failureReason
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFailedScreen(false)}
                    data-testid="try-again-payment-btn"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ef233c] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(239,35,60,0.35)] transition-colors hover:bg-[#d90429]"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    <span>TRY AGAIN</span>
                  </button>

                  <a
                    href="mailto:abuzarkhan@abuzarcode.in?subject=AI%20Hackathon%20Payment%20Support"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09]"
                  >
                    <LifeBuoy size={16} aria-hidden="true" />
                    <span>CONTACT SUPPORT</span>
                  </a>

                  <button
                    type="button"
                    onClick={onBackToRoom}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-transparent px-5 py-3.5 text-sm font-bold text-[#94a3b8] hover:text-white"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>RETURN TO WEBSITE</span>
                  </button>
                </div>
              </div>
            ) : (
              <RegistrationForm
                initialName={registration?.participantName || ""}
                initialEmail={registration?.email || ""}
                initialWhatsApp={registration?.whatsappNumber || ""}
                paymentBanner={paymentBanner}
                submitting={submitting}
                onSubmit={handleRegistrationSubmit}
                onRecoverBadge={handleRecoverBadge}
                onOpenTerms={handleOpenTerms}
              />
            )}
          </div>
        </section>

        {/* ── SECTION 6: FAQ (Clean Animated Accordion) ── */}
        <section
          ref={faqRef}
          id="faq"
          aria-labelledby="faq-heading"
          className="w-full border-b border-white/[0.07] bg-[#090d16] py-16 sm:py-24"
        >
          <div className="mx-auto w-full max-w-[820px] px-4 sm:px-6 lg:px-8">
            <div className="text-left sm:text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-[#ef233c]">
                FAQ
              </span>
              <h2
                id="faq-heading"
                className="mt-2 text-[clamp(2rem,4vw,2.85rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-white"
              >
                QUICK ANSWERS
              </h2>
            </div>

            <div className="mt-10 divide-y divide-white/10 rounded-3xl border border-white/10 bg-[#0d111b] px-6 sm:px-8">
              {AVATAR_COMPETITION.faqs.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={item.question} className="py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <span className="text-base font-bold text-white sm:text-lg">
                        {item.question}
                      </span>
                      <ChevronDown
                        size={19}
                        className={`shrink-0 text-[#94a3b8] transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#ef233c]" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 pr-6 text-sm leading-relaxed text-[#94a3b8] sm:text-base">
                        {item.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* ── MINIMAL FOOTER WITH LEGAL LINKS ── */}
      <footer className="w-full bg-[#07090e] py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-base font-extrabold tracking-tight text-white">
              {AVATAR_COMPETITION.name}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Organised through{" "}
              <button
                type="button"
                onClick={onBackToRoom}
                className="font-semibold text-white underline underline-offset-4 hover:text-[#ef233c]"
              >
                abuzarcode.in
              </button>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[#94a3b8] sm:text-sm">
            <a
              href={AVATAR_COMPETITION.termsPath}
              onClick={(e) => {
                e.preventDefault();
                handleOpenTerms("terms");
              }}
              className="hover:text-white"
            >
              Terms &amp; Conditions
            </a>
            <a
              href={AVATAR_COMPETITION.privacyPath}
              onClick={(e) => {
                e.preventDefault();
                handleOpenTerms("privacy");
              }}
              className="hover:text-white"
            >
              Privacy Policy
            </a>
            <button
              type="button"
              onClick={onBackToRoom}
              className="hover:text-white"
            >
              Portfolio Home
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
