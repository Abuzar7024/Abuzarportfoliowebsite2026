import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  KeyRound,
  Loader2,
  Lock,
} from "lucide-react";
import { DialCodePicker } from "../components/DialCodePicker";
import { AVATAR_COMPETITION } from "../data/avatar-competition";

const DEFAULT_DIAL = "+91";

export interface RegistrationFormValues {
  fullName: string;
  email: string;
  whatsappNumber: string;
  termsAccepted: boolean;
  termsVersion: string;
  privacyVersion: string;
}

export interface RegistrationFormProps {
  initialName?: string;
  initialEmail?: string;
  initialWhatsApp?: string;
  paymentBanner?: {
    status: "FAILED" | "PENDING" | "CANCELLED";
    reason?: string;
    txnid?: string;
  } | null;
  submitting: boolean;
  onSubmit: (values: RegistrationFormValues) => Promise<void>;
  onRecoverBadge?: (email: string, whatsappNumber: string) => Promise<void>;
  onOpenTerms?: (section?: "terms" | "privacy") => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RegistrationForm({
  initialName = "",
  initialEmail = "",
  initialWhatsApp = "",
  paymentBanner,
  submitting,
  onSubmit,
  onRecoverBadge,
  onOpenTerms,
}: RegistrationFormProps) {
  const [mode, setMode] = useState<"register" | "recover">("register");
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL);
  const [phoneLocal, setPhoneLocal] = useState(
    initialWhatsApp.replace(/^\+\d+\s*/, "")
  );
  // Mandatory unchecked checkbox by default
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleTermsLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    section: "terms" | "privacy"
  ) => {
    if (onOpenTerms) {
      e.preventDefault();
      onOpenTerms(section);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const digitsOnly = phoneLocal.replace(/\D/g, "");

    if (mode === "recover") {
      if (!EMAIL_RE.test(trimmedEmail)) {
        setFieldError("Please enter your registered email address.");
        return;
      }
      if (digitsOnly.length < 7 || digitsOnly.length > 14) {
        setFieldError("Please enter your registered WhatsApp number.");
        return;
      }
      if (onRecoverBadge) {
        await onRecoverBadge(trimmedEmail, `${dialCode}${digitsOnly}`);
      }
      return;
    }

    if (trimmedName.length < 2) {
      setFieldError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setFieldError("Please enter a valid email address.");
      return;
    }
    if (digitsOnly.length < 7 || digitsOnly.length > 14) {
      setFieldError("Please enter a valid WhatsApp phone number.");
      return;
    }
    if (!termsAccepted) {
      setFieldError(
        "Please read and accept the AI Hackathon Terms & Conditions and Privacy Policy before continuing."
      );
      return;
    }

    const fullWhatsApp = `${dialCode}${digitsOnly}`;
    await onSubmit({
      fullName: trimmedName,
      email: trimmedEmail,
      whatsappNumber: fullWhatsApp,
      termsAccepted: true,
      termsVersion: AVATAR_COMPETITION.registration.termsVersion,
      privacyVersion: AVATAR_COMPETITION.registration.privacyVersion,
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl font-jakarta">
      <div className="rounded-3xl border border-white/12 bg-[#0d111b] p-6 shadow-[0_28px_80px_-24px_rgba(0,0,0,0.75)] sm:p-10">
        {paymentBanner && (
          <div
            role="alert"
            data-testid={`payment-alert-${paymentBanner.status.toLowerCase()}`}
            className={`mb-7 rounded-2xl border p-4 sm:p-5 ${
              paymentBanner.status === "PENDING"
                ? "border-amber-500/40 bg-amber-500/10 text-white"
                : "border-[#ef233c]/40 bg-[#ef233c]/10 text-white"
            }`}
          >
            <div className="flex items-start gap-3">
              {paymentBanner.status === "PENDING" ? (
                <Clock size={20} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
              ) : (
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#ff4d63]" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1 text-sm leading-relaxed">
                <p className="font-bold text-white">
                  {paymentBanner.status === "PENDING"
                    ? "Payment Pending Bank Confirmation"
                    : paymentBanner.status === "CANCELLED"
                    ? "Payment Cancelled — No Charges Applied"
                    : "Payment Could Not Be Completed"}
                </p>
                <p className="mt-1 text-xs text-[#cbd5e1] sm:text-sm">
                  {paymentBanner.reason === "hash_mismatch"
                    ? "The payment signature could not be verified."
                    : paymentBanner.reason === "verification_mismatch" ||
                      paymentBanner.reason === "amount_mismatch"
                    ? "The transaction amount or gateway verification status did not match."
                    : paymentBanner.status === "PENDING"
                    ? "Your payment is awaiting confirmation from your bank."
                    : "Your checkout was not completed. You can retry below whenever you are ready."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header + Mode Switcher (Pre-Register vs Recover Existing Pass) */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.16em] text-[#ef233c]">
              {mode === "register" ? "OFFICIAL ENTRY" : "BADGE RECOVERY"}
            </span>
            <h3 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {mode === "register" ? "Pre-Register Now" : "Recover Your Badge"}
            </h3>
          </div>

          {AVATAR_COMPETITION.registration.requirePayment && mode === "register" && (
            <div className="shrink-0 rounded-2xl border border-[#ef233c]/35 bg-[#ef233c]/10 px-5 py-3 text-left sm:text-right">
              <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff4d63]">
                Pre-Registration Fee
              </span>
              <span
                data-testid="form-fee-amount"
                className="text-3xl font-extrabold text-white"
              >
                {AVATAR_COMPETITION.registration.feeFormatted}
              </span>
            </div>
          )}
        </div>

        {/* Mode Toggle Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#07090e] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setFieldError(null);
            }}
            data-testid="tab-new-registration"
            className={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
              mode === "register"
                ? "bg-[#ef233c] text-white shadow"
                : "text-[#94a3b8] hover:text-white"
            }`}
          >
            New Pre-Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("recover");
              setFieldError(null);
            }}
            data-testid="tab-recover-badge"
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
              mode === "recover"
                ? "bg-[#38bdf8] text-[#07090e] shadow"
                : "text-[#94a3b8] hover:text-white"
            }`}
          >
            <KeyRound size={13} aria-hidden="true" />
            <span>Already Registered?</span>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-5" noValidate>
          {mode === "register" && (
            <div>
              <label
                htmlFor="aih-full-name"
                className="mb-2 block text-sm font-bold text-white"
              >
                Full name
              </label>
              <input
                id="aih-full-name"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full rounded-2xl border border-white/15 bg-[#07090e] px-4 py-3.5 text-base font-medium text-white placeholder:text-[#64748b] transition-all focus:border-[#ef233c] focus:outline-none focus:ring-2 focus:ring-[#ef233c]/30"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="aih-email"
              className="mb-2 block text-sm font-bold text-white"
            >
              Email
            </label>
            <input
              id="aih-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/15 bg-[#07090e] px-4 py-3.5 text-base font-medium text-white placeholder:text-[#64748b] transition-all focus:border-[#ef233c] focus:outline-none focus:ring-2 focus:ring-[#ef233c]/30"
            />
          </div>

          <div>
            <label
              htmlFor="aih-whatsapp"
              className="mb-2 block text-sm font-bold text-white"
            >
              WhatsApp number
            </label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="flex items-center rounded-2xl border border-white/15 bg-[#07090e] px-1 text-white">
                <DialCodePicker value={dialCode} onChange={setDialCode} />
              </div>
              <input
                id="aih-whatsapp"
                name="whatsappNumber"
                type="tel"
                required
                autoComplete="tel-national"
                value={phoneLocal}
                onChange={(e) => setPhoneLocal(e.target.value)}
                placeholder="98765 43210"
                className="w-full flex-1 rounded-2xl border border-white/15 bg-[#07090e] px-4 py-3.5 text-base font-medium text-white placeholder:text-[#64748b] transition-all focus:border-[#ef233c] focus:outline-none focus:ring-2 focus:ring-[#ef233c]/30"
              />
            </div>
          </div>

          {mode === "register" && (
            <>
              {/* Mandatory Unchecked Consent Checkbox */}
              <div className="rounded-2xl border border-white/12 bg-[#07090e] p-4 sm:p-5">
                <label
                  htmlFor="aih-mandatory-consent"
                  className="flex cursor-pointer items-start gap-3.5 select-none"
                >
                  <input
                    id="aih-mandatory-consent"
                    name="termsAccepted"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setFieldError(null);
                    }}
                    data-testid="mandatory-consent-checkbox"
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-white/30 accent-[#ef233c] focus:ring-2 focus:ring-[#ef233c]"
                  />
                  <span className="text-sm leading-[1.6] text-[#cbd5e1] sm:text-[15px]">
                    I have read and agree to the AI Hackathon{" "}
                    <a
                      href={AVATAR_COMPETITION.termsPath}
                      onClick={(e) => handleTermsLinkClick(e, "terms")}
                      className="font-bold text-[#ff4d63] underline decoration-[#ff4d63]/40 underline-offset-4 hover:text-white"
                    >
                      Terms &amp; Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href={AVATAR_COMPETITION.privacyPath}
                      onClick={(e) => handleTermsLinkClick(e, "privacy")}
                      className="font-bold text-[#ff4d63] underline decoration-[#ff4d63]/40 underline-offset-4 hover:text-white"
                    >
                      Privacy Policy
                    </a>
                    . I understand that the pre-registration fee is ₹499 and that voluntary withdrawal or non-attendance does not ordinarily qualify for a refund, subject to applicable law.
                  </span>
                </label>
              </div>
            </>
          )}

          {fieldError && (
            <div
              role="alert"
              className="rounded-2xl border border-[#ef233c]/45 bg-[#ef233c]/15 px-4 py-3 text-sm font-semibold text-[#ff8090]"
            >
              {fieldError}
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || (mode === "register" && !termsAccepted)}
              data-testid="submit-registration-btn"
              className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#ef233c] px-8 py-4.5 text-base font-extrabold uppercase tracking-[0.06em] text-white shadow-[0_0_32px_rgba(239,35,60,0.4)] transition-all duration-200 hover:bg-[#d90429] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                  <span>
                    {mode === "recover"
                      ? "Locating Your Verified Pass…"
                      : "Opening Secure PayU Checkout (₹499)…"}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "recover"
                      ? "RECOVER MY PARTICIPANT BADGE"
                      : AVATAR_COMPETITION.formButtonLabel}
                  </span>
                  <ArrowRight
                    size={19}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-[#94a3b8]">
            <span className="inline-flex items-center gap-1.5">
              <Lock size={14} className="text-emerald-400" aria-hidden="true" />
              <span>Secured by PayU · Duplicate-protected</span>
            </span>
            <span>Fee: ₹499 INR</span>
          </div>
        </form>
      </div>
    </div>
  );
}
