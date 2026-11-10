import React, { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { AVATAR_COMPETITION } from "../data/avatar-competition";

export interface TermsAndConditionsPageProps {
  initialSection?: "terms" | "privacy";
  onBackToCompetition: () => void;
  onBackToRoom?: () => void;
}

export function TermsAndConditionsPage({
  initialSection = "terms",
  onBackToCompetition,
}: TermsAndConditionsPageProps) {
  useEffect(() => {
    if (
      initialSection === "privacy" ||
      (typeof window !== "undefined" && window.location.hash === "#privacy-policy")
    ) {
      const el = document.getElementById("privacy-policy");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    }
  }, [initialSection]);

  return (
    <div className="h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#07090e] text-[#f1f5f9] font-jakarta selection:bg-[#ef233c] selection:text-white print:h-auto print:overflow-visible print:bg-white print:text-[#111318]">
      {/* Top Bar (Hidden when printing) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07090e]/90 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackToCompetition}
            data-testid="terms-back-to-hackathon"
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/[0.08]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to AI Hackathon</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-[#94a3b8] sm:inline">
              Version: {AVATAR_COMPETITION.registration.termsVersion}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/[0.12] sm:text-sm"
            >
              <Printer size={15} aria-hidden="true" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Legal Document Container */}
      <main className="mx-auto max-w-[860px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="border-b border-white/10 pb-8 print:border-black/15">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#ef233c]">
            Official Legal Agreement · abuzarcode.in
          </span>
          <h1 className="mt-2 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white print:text-[#111318]">
            AI Hackathon — Terms &amp; Conditions and Privacy Policy
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[#94a3b8] print:text-[#5A606D]">
            <span>
              <strong className="text-white print:text-[#111318]">Last Updated:</strong> November 5, 2026
            </span>
            <span>
              <strong className="text-white print:text-[#111318]">Terms Version:</strong>{" "}
              {AVATAR_COMPETITION.registration.termsVersion}
            </span>
            <span>
              <strong className="text-white print:text-[#111318]">Pre-registration Fee:</strong> ₹499 INR
            </span>
          </div>
        </div>

        <div className="mt-10 space-y-10 text-[16px] leading-[1.75] text-[#cbd5e1] sm:text-[17px] print:text-[#2C303A]">
          {/* Clause A */}
          <section aria-labelledby="clause-a">
            <h2
              id="clause-a"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              A. Introduction
            </h2>
            <p className="mt-3">
              Welcome to <strong className="text-white print:text-[#111318]">AI Hackathon</strong>, organised through{" "}
              <a
                href="https://abuzarcode.in"
                className="font-semibold text-white underline underline-offset-4 print:text-[#111318]"
              >
                abuzarcode.in
              </a>
              .
            </p>
            <p className="mt-3">
              By submitting your pre-registration and making the applicable payment, you agree to these Terms &amp; Conditions and the Privacy Policy set out below. Please read this document carefully before completing your pre-registration.
            </p>
          </section>

          {/* Clause B */}
          <section aria-labelledby="clause-b">
            <h2
              id="clause-b"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              B. Pre-registration Fee
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                The current pre-registration fee is{" "}
                <strong className="text-white print:text-[#111318]">
                  ₹499 (Four Hundred Ninety-Nine Indian Rupees)
                </strong>
                .
              </li>
              <li>
                This ₹499 payment is for the pre-registration process and secures your official verified participant credential (<code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white print:bg-black/5 print:text-[#111318]">AIH-2026-XXXXXX</code>).
              </li>
              <li>
                Official competition dates and further participation instructions will be announced after the pre-registration target of{" "}
                <strong className="text-white print:text-[#111318]">5,000 participants</strong> is reached.
              </li>
            </ul>
          </section>

          {/* Clause C */}
          <section
            aria-labelledby="clause-c"
            className="rounded-2xl border border-white/10 bg-[#0d111a] p-6 sm:p-7 print:border-black/15 print:bg-[#FAF9F6]"
          >
            <h2
              id="clause-c"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              C. No-Refund Policy &amp; Exceptions
            </h2>
            <ul className="mt-3 list-disc space-y-2.5 pl-5">
              <li>
                Once pre-registration is successfully completed, the{" "}
                <strong className="text-white print:text-[#111318]">₹499 pre-registration fee</strong> is generally non-refundable if a participant voluntarily withdraws.
              </li>
              <li>
                If a participant chooses not to attend the competition after completing the applicable registration process, voluntary non-attendance does not ordinarily qualify for a refund.
              </li>
              <li>
                Failure to participate, failure to attend scheduled rounds or failure to follow competition instructions does not automatically create a refund entitlement.
              </li>
              <li>
                These conditions remain subject to applicable consumer protection laws and any statutory refund rights that cannot legally be excluded.
              </li>
              <li>
                Duplicate successful payments, failed transactions where money was debited without registration confirmation, erroneous charges and accepted refund requests will be investigated and handled appropriately through the original payment channel.
              </li>
            </ul>
          </section>

          {/* Clause D */}
          <section aria-labelledby="clause-d">
            <h2
              id="clause-d"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              D. Participant Responsibilities
            </h2>
            <p className="mt-3">Participants must:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Provide accurate, truthful and complete personal information during pre-registration.</li>
              <li>Use a valid, active email address and WhatsApp phone number that they personally control.</li>
              <li>Follow the official competition rules, code of conduct and technical submission guidelines once announced.</li>
              <li>Avoid plagiarism, cheating, identity misrepresentation and unauthorised collaboration.</li>
              <li>Follow instructions and verification requests issued by the organising team.</li>
            </ul>
          </section>

          {/* Clause E */}
          <section aria-labelledby="clause-e">
            <h2
              id="clause-e"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              E. Competition Dates &amp; Format
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>The official competition dates are not announced yet.</li>
              <li>
                The pre-registration campaign target is{" "}
                <strong className="text-white print:text-[#111318]">5,000 pre-registrations</strong>.
              </li>
              <li>
                Official dates, eligibility criteria, competition format, judging parameters and detailed round rules will be communicated to confirmed pre-registered participants through official channels once the target is reached.
              </li>
            </ul>
          </section>

          {/* Clause F */}
          <section aria-labelledby="clause-f">
            <h2
              id="clause-f"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              F. Prize Information &amp; Reward Conditions
            </h2>
            <p className="mt-3">
              The announced prize pool for AI Hackathon is structured as follows:
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0d111a] p-4 print:border-black/15 print:bg-[#FAF9F6]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#ef233c]">
                  First Place
                </div>
                <div className="mt-1 text-xl font-extrabold text-white print:text-[#111318]">
                  ₹5,00,000
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0d111a] p-4 print:border-black/15 print:bg-[#FAF9F6]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] print:text-[#5A606D]">
                  Second Place
                </div>
                <div className="mt-1 text-xl font-extrabold text-white print:text-[#111318]">
                  ₹3,00,000
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0d111a] p-4 print:border-black/15 print:bg-[#FAF9F6]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] print:text-[#5A606D]">
                  Third Place
                </div>
                <div className="mt-1 text-xl font-extrabold text-white print:text-[#111318]">
                  ₹1,00,000{" "}
                  <span className="text-sm font-bold text-[#ef233c]">
                    + ₹10,000 Amazon Gift Voucher
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#38bdf8]/30 bg-[#0c1627] p-4 print:border-black/15 print:bg-[#FAF9F6]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] print:text-[#111318]">
                  Top 100 Performers
                </div>
                <div className="mt-1 text-base font-extrabold text-white print:text-[#111318]">
                  One Month of Claude Subscription Each
                </div>
                <div className="mt-0.5 text-xs text-[#94a3b8] print:text-[#5A606D]">
                  Arranged by the organising team for eligible performers
                </div>
              </div>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white print:text-[#111318]">Top 100 Performers Reward:</strong> One month of Claude subscription each, provided by our organising team using the participant&apos;s registered Google-linked account, subject to account eligibility, regional availability and applicable third-party redemption terms.
              </li>
              <li>
                Final rankings and prize eligibility will be determined strictly using the officially published competition rules and judging criteria.
              </li>
              <li>
                <strong className="text-white print:text-[#111318]">Independent Event Notice:</strong> Claude (Anthropic) and Amazon are third-party brands. Their reward items are arranged by the organising team and do not imply that Anthropic or Amazon officially sponsors or endorses this competition unless a formal sponsorship agreement is separately announced.
              </li>
            </ul>
          </section>

          {/* Clause G */}
          <section aria-labelledby="clause-g">
            <h2
              id="clause-g"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              G. Payment Conditions
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Payments are processed securely through <strong className="text-white print:text-[#111318]">PayU</strong>.
              </li>
              <li>
                The pre-registration payable amount is <strong className="text-white print:text-[#111318]">₹499 INR</strong>, controlled strictly by the backend server.
              </li>
              <li>
                A registration is considered successfully paid only after cryptographic hash validation and server-side payment verification with PayU.
              </li>
              <li>
                A browser redirect or query string alone is not proof of payment.
              </li>
              <li>
                Participants should retain their PayU transaction reference and Participant ID (<code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white print:bg-black/5 print:text-[#111318]">AIH-2026-XXXXXX</code>) for future correspondence.
              </li>
              <li>
                Duplicate and unsuccessful transactions will be reconciled and investigated by the organising team.
              </li>
            </ul>
          </section>

          {/* Clause H — Privacy Policy */}
          <section
            id="privacy-policy"
            aria-labelledby="clause-h"
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-[#0d111a] p-6 sm:p-7 print:border-black/15 print:bg-[#FAF9F6]"
          >
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#ef233c]">
              Privacy Policy ({AVATAR_COMPETITION.registration.privacyVersion})
            </span>
            <h2
              id="clause-h"
              className="mt-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              H. Privacy &amp; Communications Policy
            </h2>
            <p className="mt-3">
              We respect your privacy. Participant information collected during pre-registration (specifically your <strong className="text-white print:text-[#111318]">full name</strong>, <strong className="text-white print:text-[#111318]">email address</strong>, <strong className="text-white print:text-[#111318]">WhatsApp number</strong>, payment reference and timestamped consent record) is used strictly for:
            </p>
            <ul className="mt-2.5 list-disc space-y-1.5 pl-5">
              <li>Registration processing and duplicate prevention across browsers and devices.</li>
              <li>Payment verification and transaction reconciliation.</li>
              <li>Official competition announcements and schedule notifications.</li>
              <li>Participant communication and onboarding instructions.</li>
              <li>Organisational updates related to AI Hackathon.</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white print:text-[#111318]">Data Protection &amp; Public Verification:</strong> Private participant contact details (email address and WhatsApp phone number) are never exposed on public badge verification pages and are never sold to third-party data brokers.
            </p>
          </section>

          {/* Clause I — Changes and Cancellation */}
          <section aria-labelledby="clause-i">
            <h2
              id="clause-i"
              className="text-xl font-extrabold tracking-tight text-white sm:text-2xl print:text-[#111318]"
            >
              I. Changes and Cancellation
            </h2>
            <p className="mt-3">
              Competition schedules, format, platform requirements and rules may need to be updated or modified for operational, technical or regulatory reasons.
            </p>
            <p className="mt-3">
              Any material changes or event cancellation will be communicated directly to registered participants via their registered email address and WhatsApp number. Any resulting refunds or remedies will be handled in accordance with applicable consumer laws and the published refund policy.
            </p>
          </section>
        </div>

        {/* Bottom Return Button */}
        <div className="mt-12 border-t border-white/10 pt-8 print:hidden">
          <button
            type="button"
            onClick={onBackToCompetition}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ef233c] px-7 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(239,35,60,0.35)] transition-all hover:bg-[#d90429]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Return to AI Hackathon Pre-Registration</span>
          </button>
        </div>
      </main>
    </div>
  );
}
