import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AVATAR_COMPETITION } from "../data/avatar-competition";
import { ParticipantBadge } from "./ParticipantBadge";

export interface RegistrationSuccessProps {
  participantId: string | null;
  participantName: string;
  email: string;
  whatsappNumber: string;
  payuTxnId: string;
  registrationRef?: string;
  paymentAmount: string;
  paymentStatus: string;
  verifySignature?: string | null;
  registeredAt?: string | null;
  onOpenVerify?: (participantId: string) => void;
  onBackToRoom?: () => void;
}

class BadgeErrorBoundary extends React.Component<
  { onRetry: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { onRetry: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-white/12 bg-[#090c14] p-6 text-center text-white">
          <p className="text-lg font-bold">
            Your pre-registration is confirmed and your Participant ID is active.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#ef233c] px-4 py-2.5 text-xs font-bold text-white"
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>Retry Badge Preview</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function RegistrationSuccess({
  participantId,
  participantName,
  payuTxnId,
  paymentAmount,
  paymentStatus,
  verifySignature,
  registeredAt,
  onOpenVerify,
  onBackToRoom,
}: RegistrationSuccessProps) {
  const isVerifiedPaid = paymentStatus === "SUCCESS" && Boolean(participantId);
  const badgeContainerRef = useRef<HTMLDivElement>(null);
  const [badgeKey, setBadgeKey] = useState(0);

  const formattedTimestamp = registeredAt
    ? new Date(registeredAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const handleViewBadge = () => {
    badgeContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      data-testid="registration-success-card"
      className="mx-auto max-w-5xl rounded-3xl border border-white/12 bg-[#0d111b] p-6 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.75)] sm:p-10 font-jakarta"
    >
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div>
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 250, damping: 18 }}
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            >
              <CheckCircle2 size={30} aria-hidden="true" />
            </motion.div>
            <div>
              <span className="inline-flex items-center rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                Pre-Registration Confirmed
              </span>
              <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                YOU&apos;RE IN!
              </h3>
            </div>
          </div>

          <p className="mt-4 text-base leading-relaxed text-[#cbd5e1] sm:text-lg">
            Welcome to AI Hackathon, <strong className="text-white">{participantName || "Builder"}</strong>. Your official digital credential is ready below.
          </p>

          {/* Registration Details */}
          <dl className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {isVerifiedPaid && participantId && (
              <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4">
                <dt className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Participant Number
                </dt>
                <dd
                  data-testid="confirmed-participant-id"
                  className="mt-1 font-mono text-lg font-extrabold text-white"
                >
                  {participantId}
                </dd>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-[#07090e] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                Payment Amount
              </dt>
              <dd className="mt-1 text-lg font-extrabold text-white">
                ₹499{" "}
                <span className="text-xs font-medium text-[#94a3b8]">
                  (₹{paymentAmount || "499.00"})
                </span>
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#07090e] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                Payment Status
              </dt>
              <dd className="mt-1 text-base font-extrabold text-emerald-400">
                {paymentStatus}
              </dd>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#07090e] p-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
                Timestamp
              </dt>
              <dd className="mt-1 text-sm font-bold text-white">
                {formattedTimestamp}
              </dd>
            </div>
          </dl>

          {payuTxnId && (
            <p className="mt-3 text-xs font-medium text-[#94a3b8]">
              Transaction Reference: <span className="font-mono text-white">{payuTxnId}</span>
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {isVerifiedPaid && participantId && (
              <button
                type="button"
                onClick={handleViewBadge}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ef233c] px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(239,35,60,0.35)] transition-colors hover:bg-[#d90429]"
              >
                <Award size={17} aria-hidden="true" />
                <span>View &amp; Download Pass</span>
              </button>
            )}

            {onBackToRoom && (
              <button
                type="button"
                onClick={onBackToRoom}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/[0.09]"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Back to abuzarcode.in</span>
              </button>
            )}
          </div>

          {isVerifiedPaid && participantId && onOpenVerify && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onOpenVerify(participantId)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#94a3b8] underline decoration-white/25 underline-offset-4 hover:text-white"
              >
                <ShieldCheck size={14} className="text-emerald-400" aria-hidden="true" />
                <span>Open Public Verification Page</span>
                <ExternalLink size={12} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Digital Participant Credential */}
        {isVerifiedPaid && participantId ? (
          <div ref={badgeContainerRef} className="flex justify-center">
            <BadgeErrorBoundary onRetry={() => setBadgeKey((k) => k + 1)}>
              <ParticipantBadge
                key={badgeKey}
                participantId={participantId}
                participantName={participantName}
                status="VERIFIED"
                verifySignature={verifySignature}
                registeredAt={registeredAt}
              />
            </BadgeErrorBoundary>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
