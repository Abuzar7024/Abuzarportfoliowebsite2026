import React, { useCallback, useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { ArrowLeft, CheckCircle2, Clock, Download, LifeBuoy, Loader2, Printer, RotateCcw } from "lucide-react";
import { ApiError, api, inr, navigate, session, type ContentResponse } from "./lib";
import { HackathonPassCard, downloadPassPng, type PassMemberData } from "./HackathonPass";
import { downloadReceipt, printReceipt, type ReceiptData } from "./receipt";
import { Kicker, Link, btnPrimary, btnSecondary } from "./ui";

interface StatusResponse {
  payment: { txnid: string; status: string; amount: number; members: number; verifiedAt: string | null; failureReason: string | null; needsReview: boolean };
  team: { name: string; status: string; memberCount: number; teamCode?: string | null; mode?: string };
  members: { registrationCode: string | null; fullName: string; role: string }[];
  teamToken: string | null;
  emails: { leader: Record<string, string>; organiser: Record<string, string> } | null;
  emailJs: { serviceId: string; templateId: string } | null;
}

const POLL_MS = [4000, 6000, 8000, 12000, 15000];

function FailureArt() {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-40" role="img" aria-label="Payment failed illustration">
      <rect x="14" y="26" width="132" height="78" fill="#fff" stroke="#15181d" strokeWidth="2.5" />
      <rect x="14" y="40" width="132" height="14" fill="#15181d" />
      <rect x="26" y="72" width="38" height="8" fill="#bdb8ab" />
      <rect x="26" y="86" width="60" height="6" fill="#e4e0d4" />
      <circle cx="124" cy="30" r="22" fill="#d6281f" stroke="#fff" strokeWidth="3" />
      <path d="M115 21l18 18M133 21l-18 18" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function PaymentPage({ data }: { data: ContentResponse }) {
  const [creds] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const txn = p.get("txn");
    const t = p.get("t");
    if (txn && t) {
      session.setPay(txn, t);
      window.history.replaceState({}, "", window.location.pathname);
      return { txn, t };
    }
    return session.getPay();
  });
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const polls = useRef(0);
  const emailsTried = useRef(false);

  const load = useCallback(async (reconcile: boolean) => {
    if (!creds) return;
    try {
      const r = await api<StatusResponse>(`payment/status?txn=${encodeURIComponent(creds.txn)}&t=${encodeURIComponent(creds.t)}${reconcile ? "&reconcile=1" : ""}`);
      setStatus(r);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the payment status.");
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => { void load(true); }, [load]);

  // Safe automatic refresh while the payment is unresolved.
  useEffect(() => {
    const st = status?.payment.status;
    if (!st || !["INITIATED", "PENDING", "CREATED"].includes(st) || polls.current >= POLL_MS.length * 3) return;
    const delay = POLL_MS[Math.min(polls.current, POLL_MS.length - 1)];
    const id = window.setTimeout(() => { polls.current += 1; void load(true); }, delay);
    return () => window.clearTimeout(id);
  }, [status, load]);

  // Best-effort confirmation emails (EmailJS runs in the browser). Success never depends on this.
  useEffect(() => {
    const emails = status?.emails;
    const cfg = status?.emailJs;
    const key = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "").trim();
    if (!emails || !cfg || !creds || !key || !cfg.serviceId || !cfg.templateId || emailsTried.current) return;
    emailsTried.current = true;
    (async () => {
      try {
        await emailjs.send(cfg.serviceId, cfg.templateId, emails.leader, { publicKey: key });
        await emailjs.send(cfg.serviceId, cfg.templateId, emails.organiser, { publicKey: key });
        await api("payment/emails-sent", { method: "POST", body: { txn: creds.txn, t: creds.t } });
      } catch { /* the registration stays confirmed; admins can resend */ }
    })();
  }, [status, creds]);

  const retry = async () => {
    if (!status?.teamToken) return;
    setRetrying(true);
    setRetryError(null);
    try {
      session.setTeamToken(status.teamToken);
      const sandbox = import.meta.env.DEV && new URLSearchParams(window.location.search).get("sandbox") === "1";
      const r = await api<{ alreadyPaid: boolean; txn?: string; payToken?: string; checkout?: { actionUrl: string; txnid: string; fields: Record<string, string> } }>("payment/initiate", { method: "POST", body: { teamToken: status.teamToken, sandbox } });
      if (r.alreadyPaid && r.txn && r.payToken) {
        session.setPay(r.txn, r.payToken);
        window.location.href = `/competition/payment?txn=${encodeURIComponent(r.txn)}&t=${encodeURIComponent(r.payToken)}`;
        return;
      }
      if (!r.checkout || !r.payToken) throw new Error("no checkout");
      session.setPay(r.checkout.txnid, r.payToken);
      const form = document.createElement("form");
      form.method = "POST"; form.action = r.checkout.actionUrl; form.style.display = "none";
      for (const [k, v] of Object.entries(r.checkout.fields)) {
        const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; form.appendChild(i);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setRetryError(e instanceof ApiError ? e.message : "Could not start a new payment.");
      setRetrying(false);
    }
  };

  const wrap = (children: React.ReactNode) => <div className="w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-10 xl:px-14">{children}</div>;
  const contact = data.content.settings.contactEmail;

  if (!creds) {
    return wrap(
      <>
        <Kicker>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</Kicker>
        <h1 className="mt-3 text-[clamp(1.9rem,4.5vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">We could not find a payment on this device.</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#3d3b35]">If you have already paid, visit the public Hackathon Status page to verify your registration and download your official AVATAR pass. Please do not pay again.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/competition/status" className={btnPrimary}>View Hackathon Status</Link><Link to="/competition" className={btnSecondary}>Back to AVATAR</Link></div>
      </>
    );
  }
  if (loading) return wrap(<p className="flex items-center gap-3 text-[17px]"><Loader2 className="animate-spin" aria-hidden="true" /> Verifying your transaction with PayU…</p>);
  if (error || !status) {
    return wrap(
      <>
        <h1 className="text-[2rem] font-extrabold leading-tight">We could not load this payment.</h1>
        <p className="mt-3 text-[16px] text-[#3d3b35]">{error ?? "Unknown error."} If money was debited, do not pay again. It will be reconciled automatically.</p>
        <button type="button" className={`${btnPrimary} mt-6`} onClick={() => { setLoading(true); void load(true); }}>Try again</button>
      </>
    );
  }

  const p = status.payment;

  // =========================================================================
  // OUTCOME A — SUCCESSFUL PAYMENT
  // =========================================================================
  if (p.status === "SUCCESS" || p.status === "REFUND_PENDING" || p.status === "REFUNDED") {
    const receipt: ReceiptData = {
      eventName: data.content.settings.eventName,
      teamName: status.team.name,
      teamCode: status.team.teamCode ?? null,
      amount: p.amount,
      members: status.members,
      txnid: p.txnid,
      status: "SUCCESS (verified with PayU)",
      paidAt: p.verifiedAt,
    };
    const leaderMember = status.members[0];
    const primaryPass: PassMemberData | null = leaderMember
      ? {
          registrationCode: leaderMember.registrationCode ?? "AIH-R-PENDING",
          teamCode: status.team.teamCode ?? "AIH-T-PENDING",
          teamName: status.team.name,
          fullName: leaderMember.fullName,
          role: leaderMember.role,
          memberCount: status.members.length,
          feePaidInr: p.amount,
          verifiedAt: p.verifiedAt,
        }
      : null;

    return wrap(
      <div data-testid="payment-success">
        <div className="flex items-center gap-3 text-[#157a3a]">
          <CheckCircle2 size={28} aria-hidden="true" />
          <Kicker>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</Kicker>
        </div>
        <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-[#15181d]">
          PAYMENT SUCCESSFUL!
        </h1>
        <p className="mt-2 text-[17px] text-[#3d3b35]">
          Registration confirmed. Your official <strong>AVATAR</strong> participant pass is ready below.
        </p>

        {/* Key Transaction & Registration Summary */}
        <dl className="mt-8 grid grid-cols-1 gap-x-6 border-t-2 border-[#15181d] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            ["Participant name", leaderMember?.fullName ?? status.team.name],
            ["Registration ID", leaderMember?.registrationCode ?? status.team.teamCode ?? "—"],
            ["Transaction ID", p.txnid],
            ["Payment amount", inr(p.amount)],
            ["Payment status", `${p.status} · Verified`],
            ["Registration confirmation", `CONFIRMED · Team ${status.team.teamCode ?? status.team.name}`],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-[#bdb8ab] py-3.5">
              <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">{k}</dt>
              <dd className="mt-1 break-words text-[15px] sm:text-[16px] font-extrabold text-[#15181d]">{v}</dd>
            </div>
          ))}
        </dl>

        {/* All Registered Participants Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[300px] border-collapse text-left text-[14px] sm:text-[15px]">
            <thead>
              <tr className="border-b-2 border-[#15181d] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2 pr-3">Registration ID</th>
                <th className="py-2 pr-3">Participant Name</th>
                <th className="py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {status.members.map((m) => (
                <tr key={m.registrationCode ?? m.fullName} className="border-b border-[#bdb8ab]">
                  <td className="py-3 pr-3 font-mono font-semibold">{m.registrationCode}</td>
                  <td className="py-3 pr-3 font-bold">{m.fullName}</td>
                  <td className="py-3">{m.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {p.needsReview && (
          <p className="mt-4 border-l-4 border-[#d6281f] bg-white px-4 py-3 text-[14px]">
            Our team will review a note on this payment. Your registration remains confirmed.
          </p>
        )}

        {/* Primary Download & Pass Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {primaryPass && (
            <button
              type="button"
              data-testid="download-primary-pass"
              className={btnPrimary}
              onClick={() => downloadPassPng(primaryPass)}
            >
              <Download size={16} aria-hidden="true" /> Download Participant Pass (PNG)
            </button>
          )}
          <button type="button" className={btnSecondary} onClick={() => downloadReceipt(receipt)}>
            <Download size={16} aria-hidden="true" /> Download Confirmation Receipt
          </button>
          <button type="button" className={btnSecondary} onClick={() => printReceipt(receipt)}>
            <Printer size={16} aria-hidden="true" /> Print / Save as PDF
          </button>
          <Link to="/competition/status" className={btnSecondary}>
            View Hackathon Status
          </Link>
        </div>

        {/* Official AVATAR Participant Passes */}
        <section className="mt-12 border-t-2 border-[#15181d] pt-8">
          <Kicker>Official AVATAR Credentials Issued</Kicker>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em]">
            Official AVATAR Participant {status.members.length > 1 ? "Passes" : "Pass"}
          </h2>
          <p className="mt-1 text-[15px] text-[#3d3b35]">
            Download or print each participant&apos;s personal pass below. Scanning the QR code on any pass redirects to <strong>https://abuzarcode.in/</strong>.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {status.members.map((m) => (
              <HackathonPassCard
                key={m.registrationCode ?? m.fullName}
                pass={{
                  registrationCode: m.registrationCode ?? "AIH-R-PENDING",
                  teamCode: status.team.teamCode ?? "AIH-T-PENDING",
                  teamName: status.team.name,
                  fullName: m.fullName,
                  role: m.role,
                  memberCount: status.members.length,
                  feePaidInr: p.amount,
                  verifiedAt: p.verifiedAt,
                }}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // =========================================================================
  // OUTCOME C — PENDING PAYMENT
  // =========================================================================
  if (p.status === "INITIATED" || p.status === "PENDING" || p.status === "CREATED") {
    return wrap(
      <div data-testid="payment-pending">
        <div className="flex items-center gap-3 text-[#9a6a00]">
          <Clock size={28} aria-hidden="true" />
          <Kicker>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</Kicker>
        </div>
        <h1 className="mt-3 text-[clamp(2rem,4.8vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#15181d]">
          PAYMENT PROCESSING
        </h1>
        <p className="mt-4 max-w-xl text-[18px] font-semibold leading-relaxed text-[#15181d]">
          Your payment is currently being verified. Please wait while we confirm your transaction.
        </p>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#3d3b35]">
          This page checks with PayU automatically. <strong>Please do not pay again</strong> while verification is in progress: if your bank has debited the money, your registration and participant pass will be issued as soon as PayU confirms the transaction.
        </p>
        <dl className="mt-6 grid gap-x-6 border-t-2 border-[#15181d] sm:grid-cols-3">
          {[
            ["Team", status.team.name],
            ["Transaction ID", p.txnid],
            ["Payment amount", inr(p.amount)],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-[#bdb8ab] py-3">
              <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">{k}</dt>
              <dd className="mt-1 break-words text-[16px] font-extrabold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 flex items-center gap-2 text-[14px] text-[#5b584f]" role="status">
          <Loader2 size={15} className="animate-spin" aria-hidden="true" /> Payment status: {p.status}. Auto-verifying with backend…
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            data-testid="check-payment-status"
            className={btnPrimary}
            onClick={() => {
              polls.current = 0;
              void load(true);
            }}
          >
            Check Payment Status
          </button>
          <Link to="/competition" className={btnSecondary}>
            Back to AVATAR
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // OUTCOME B — FAILED / CANCELLED / EXPIRED PAYMENT
  // =========================================================================
  const canRetry = Boolean(status.teamToken) && data.registration.open;
  return wrap(
    <div data-testid="payment-failed">
      <FailureArt />
      <div className="mt-4">
        <Kicker>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</Kicker>
      </div>
      <h1 className="mt-2 text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-[#15181d]">
        PAYMENT FAILED
      </h1>
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-[#3d3b35]">
        {p.failureReason ?? "Your transaction could not be completed or was declined/cancelled."} Your registration has not been marked as paid and no participant pass has been generated yet. Your entered registration details are safely saved so you can retry payment below without re-entering your information.
      </p>
      <dl className="mt-6 grid gap-x-6 border-t-2 border-[#15181d] sm:grid-cols-3">
        {[
          ["Transaction ID", p.txnid],
          ["Payment amount", inr(p.amount)],
          ["Team", status.team.name],
        ].map(([k, v]) => (
          <div key={k} className="border-b border-[#bdb8ab] py-3">
            <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">{k}</dt>
            <dd className="mt-1 break-words text-[16px] font-extrabold">{v}</dd>
          </div>
        ))}
      </dl>
      {retryError && (
        <p role="alert" className="mt-4 border-l-4 border-[#d6281f] bg-white px-4 py-3 text-[14px] font-semibold">
          {retryError}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canRetry && (
          <button
            type="button"
            data-testid="retry-payment"
            className={btnPrimary}
            disabled={retrying}
            onClick={retry}
          >
            {retrying ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />} Retry Payment
          </button>
        )}
        <a
          className={btnSecondary}
          href={contact ? `mailto:${contact}?subject=Payment%20${encodeURIComponent(p.txnid)}` : "/competition/policy/contact"}
          onClick={contact ? undefined : (e) => { e.preventDefault(); navigate("/competition/policy/contact"); }}
        >
          <LifeBuoy size={16} aria-hidden="true" /> Contact Support
        </a>
        <Link to="/competition" className={btnSecondary}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to AVATAR
        </Link>
      </div>
      {!canRetry && <p className="mt-4 text-[14px] text-[#5b584f]">To start again, return to the registration page.</p>}
    </div>
  );
}
