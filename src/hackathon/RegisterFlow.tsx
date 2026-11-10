import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Lock, Minus, Plus } from "lucide-react";
import { computeFee, formatInr } from "../shared/hackathon-pricing";
import {
  MAX_TEAM_MEMBERS,
  MAX_TEAM_SIZE_MESSAGE,
  validateTeamInput,
  type FieldErrors,
} from "../shared/hackathon-validation";
import { ApiError, api, navigate, session, type ContentResponse } from "./lib";
import { Kicker, Link, btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";

const DRAFT_STORAGE_KEY = "avatar_reg_draft_v2";

interface FormMember {
  fullName: string;
  email: string;
  code: string;
  number: string;
  organisation: string;
  course: string;
  github: string;
  linkedin: string;
  skills: string;
}

const emptyMember = (): FormMember => ({
  fullName: "",
  email: "",
  code: "+91",
  number: "",
  organisation: "",
  course: "",
  github: "",
  linkedin: "",
  skills: "",
});

const hasData = (m: FormMember) =>
  Object.entries(m).some(([k, v]) => k !== "code" && String(v).trim() !== "");

const COUNTRY_CODES = ["+91", "+1", "+44", "+971", "+65", "+61", "+49", "+977", "+880", "+94", "+92"];

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-[13px] font-semibold text-[#b81f17]">
      {msg}
    </p>
  );
}

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {optional && <span className="ml-1 font-normal text-[#6b685e]">(optional)</span>}
      </label>
      {children}
      <FieldError id={`${id}-err`} msg={error} />
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ["Team", "Participants", "Fee summary", "Payment"];
  return (
    <ol className="grid grid-cols-2 border-y border-[#15181d] sm:grid-cols-4" aria-label="Registration progress">
      {steps.map((s, i) => (
        <li
          key={s}
          aria-current={step === i + 1 ? "step" : undefined}
          className={`border-b border-r border-[#15181d] px-2.5 py-2.5 text-center sm:border-b-0 sm:px-4 sm:py-3 last:border-r-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r [&:nth-child(n+3)]:border-b-0 ${
            step === i + 1 ? "bg-[#15181d] text-white" : step > i + 1 ? "bg-[#e4e0d4]" : "bg-white/60"
          }`}
        >
          <span className="block font-mono text-[10.5px] sm:text-[11px] font-semibold">0{i + 1}</span>
          <span className="block truncate text-[12px] font-bold sm:text-[14px]">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function RegisterFlow({ data, onReload }: { data: ContentResponse; onReload: () => void }) {
  const s = data.content.settings;
  const maxTeamSize = Math.min(s.maxTeamSize || MAX_TEAM_MEMBERS, MAX_TEAM_MEMBERS);
  const pricing = useMemo(
    () => ({ feePerPerson: s.feePerPerson, minTeamSize: 1 as const, maxTeamSize, tax: s.tax }),
    [s.feePerPerson, maxTeamSize, s.tax]
  );
  const sandbox = import.meta.env.DEV && new URLSearchParams(window.location.search).get("sandbox") === "1";

  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) || "{}").teamName || "";
    } catch {
      return "";
    }
  });
  const [count, setCount] = useState(() => {
    try {
      const saved = Number(JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) || "{}").count);
      return saved >= 1 && saved <= maxTeamSize ? saved : 1;
    } catch {
      return 1;
    }
  });
  const [countText, setCountText] = useState(() => String(count));
  const [organisation, setOrganisation] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) || "{}").organisation || "";
    } catch {
      return "";
    }
  });
  const [referral, setReferral] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) || "{}").referral || "";
    } catch {
      return "";
    }
  });
  const [members, setMembers] = useState<FormMember[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) || "{}").members;
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {
      /* ignore */
    }
    return [emptyMember()];
  });
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shrink, setShrink] = useState<number | null>(null);
  const [fee, setFee] = useState<ReturnType<typeof computeFee> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ teamName, count, organisation, referral, members })
      );
    } catch {
      /* ignore storage quota errors */
    }
  }, [teamName, count, organisation, referral, members]);

  const visible = members.slice(0, count);
  const preview = (() => {
    try {
      return computeFee(count, pricing);
    } catch {
      return null;
    }
  })();

  const goStep = (n: number) => {
    setStep(n);
    setBanner(null);
    topRef.current?.scrollIntoView({ block: "start" });
  };

  const applyCount = (n: number) => {
    const clamped = Math.max(1, Math.min(maxTeamSize, n));
    setCount(clamped);
    setCountText(String(clamped));
    setMembers((prev) => {
      const next = prev.slice();
      while (next.length < clamped) next.push(emptyMember());
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.memberCount;
      return next;
    });
    setShrink(null);
  };

  const onCountChange = (text: string) => {
    setCountText(text);
    if (!/^\d+$/.test(text.trim())) return;
    const n = Number(text.trim());
    if (n > maxTeamSize) {
      setErrors((prev) => ({ ...prev, memberCount: MAX_TEAM_SIZE_MESSAGE }));
      return;
    }
    if (n < 1) return;
    if (n < count && members.slice(n, count).some(hasData)) {
      setShrink(n);
      return;
    }
    applyCount(n);
  };

  const addMember = () => {
    if (count >= maxTeamSize) {
      setErrors((prev) => ({ ...prev, memberCount: MAX_TEAM_SIZE_MESSAGE }));
      return;
    }
    applyCount(count + 1);
  };

  const removeLastMember = () => {
    if (count <= 1) return;
    const target = count - 1;
    if (members.slice(target, count).some(hasData)) {
      setShrink(target);
      return;
    }
    applyCount(target);
  };

  const composed = () => {
    const parsedCount = /^\d+$/.test(countText.trim()) ? Number(countText.trim()) : count;
    return {
      teamName,
      memberCount: parsedCount,
      organisation,
      referralCode: referral,
      consent,
      members: visible.map((m) => ({
        fullName: m.fullName,
        email: m.email,
        mobile: `${m.code.trim()}${m.number.replace(/\D/g, "")}`,
        organisation: m.organisation,
        course: m.course,
        github: m.github,
        linkedin: m.linkedin,
        skills: m.skills,
      })),
    };
  };

  const validate = (scope: "team" | "members" | "all"): FieldErrors => {
    const r = validateTeamInput(composed(), { maxTeamSize });
    if (r.ok) return {};
    const out: FieldErrors = {};
    for (const [k, v] of Object.entries(r.errors)) {
      const isMember = k.startsWith("members.");
      if (k === "consent" && scope !== "all") continue;
      if (scope === "team" && (isMember || k === "members")) continue;
      if (scope === "members" && !isMember && k !== "members" && k !== "memberCount") continue;
      out[k] = v;
    }
    return out;
  };

  const next1 = () => {
    if (shrink !== null) return;
    const e = validate("team");
    setErrors(e);
    if (Object.keys(e).length) return;
    goStep(2);
  };

  const next2 = () => {
    const e = validate("members");
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      if (first.startsWith("members.")) {
        document.getElementById(`m-${first.split(".")[1]}-${first.split(".")[2]}`)?.focus();
      }
      return;
    }
    goStep(3);
  };

  const submitRegistration = async () => {
    const e = validate("all");
    setErrors(e);
    if (Object.keys(e).length) {
      setBanner(e.memberCount ?? e.consent ?? "Please review your details.");
      if (Object.keys(e).some((k) => k.startsWith("members."))) goStep(2);
      else if (!e.consent) goStep(1);
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      const r = await api<{ teamToken: string; fee: ReturnType<typeof computeFee> }>("register", {
        method: "POST",
        body: { ...composed(), sandbox },
      });
      session.setTeamToken(r.teamToken);
      setFee(r.fee);
      goStep(4);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) {
          setErrors(err.fields);
          setStep(Object.keys(err.fields).some((k) => k.startsWith("members.")) ? 2 : 1);
        }
        setBanner(err.message);
        if (err.code === "REGISTRATION_CLOSED") onReload();
      } else setBanner("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    setBanner(null);
    try {
      const r = await api<{
        alreadyPaid: boolean;
        txn?: string;
        payToken?: string;
        checkout?: { actionUrl: string; txnid: string; fields: Record<string, string> };
      }>("payment/initiate", { method: "POST", body: { teamToken: session.getTeamToken(), sandbox } });
      if (r.alreadyPaid && r.txn && r.payToken) {
        session.setPay(r.txn, r.payToken);
        navigate(`/competition/payment?txn=${encodeURIComponent(r.txn)}&t=${encodeURIComponent(r.payToken)}`);
        return;
      }
      if (!r.checkout || !r.payToken) throw new Error("Checkout unavailable");
      session.setPay(r.checkout.txnid, r.payToken);
      const form = document.createElement("form");
      form.method = "POST";
      form.action = r.checkout.actionUrl;
      form.style.display = "none";
      for (const [k, v] of Object.entries(r.checkout.fields)) {
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = k;
        i.value = v;
        form.appendChild(i);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setBanner(err instanceof ApiError ? err.message : "Could not start the payment. Please try again.");
      if (err instanceof ApiError && err.code === "INVALID_TOKEN") goStep(3);
      setBusy(false);
    }
  };

  const setM = (i: number, patch: Partial<FormMember>) =>
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const err = (k: string) => errors[k];

  if (!data.registration.open) {
    return (
      <div className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-10 xl:px-14">
        <Kicker>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</Kicker>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
          Registration is not open right now.
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-[#3d3b35]">
          {data.registration.reason ?? "Registration has not opened yet."} Check the{" "}
          <Link to="/competition/status" className="font-bold underline">
            Hackathon Status
          </Link>{" "}
          page for live updates.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/competition/status" className={btnPrimary}>
            View Hackathon Status
          </Link>
          <Link to="/competition" className={btnSecondary}>
            <ArrowLeft size={16} /> Back to AVATAR
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-10 xl:px-14" ref={topRef}>
      <div className="inline-flex items-center gap-2 border border-[#15181d] bg-[#d6281f] px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">
        PRE-REGISTRATIONS ARE NOW OPEN!
      </div>
      <div className="mt-3">
        <Kicker>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</Kicker>
      </div>
      <h1 className="mt-2 text-[clamp(1.85rem,4.2vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
        Pre-register for AVATAR
      </h1>
      <p className="mt-2 max-w-3xl text-[15.5px] sm:text-[16px] text-[#3d3b35]">
        Solo builders (1 member) and teams of up to {maxTeamSize} members receive their Official AVATAR Participant Pass &amp; Team ID upon verified payment.
      </p>
      <div className="mt-6">
        <Stepper step={step} />
      </div>

      {banner && (
        <div
          role="alert"
          className="mt-6 flex gap-3 border-l-4 border-[#d6281f] bg-white px-4 py-3 text-[15px] font-semibold text-[#15181d]"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#d6281f]" aria-hidden="true" />
          <span>{banner}</span>
        </div>
      )}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {step === 1 && (
            <form
              className="grid gap-6 border border-[#15181d] bg-white p-5 sm:grid-cols-2 sm:p-7"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next1();
              }}
            >
              <div className="sm:col-span-2">
                <Field id="team-name" label="Team name" error={err("teamName")}>
                  <input
                    id="team-name"
                    className={inputCls}
                    placeholder="e.g. Apex Builders"
                    value={teamName}
                    maxLength={80}
                    onChange={(e) => setTeamName(e.target.value)}
                    aria-describedby="team-name-err"
                    autoComplete="off"
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="member-count" className={labelCls}>
                  Team size (number of participants)
                </label>
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <input
                    id="member-count"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxTeamSize}
                    className={`${inputCls} !w-24 sm:!w-28 text-center font-mono font-bold`}
                    value={countText}
                    onChange={(e) => onCountChange(e.target.value)}
                    aria-describedby="member-count-err"
                  />
                  <button
                    type="button"
                    data-testid="remove-member-button"
                    disabled={count <= 1}
                    onClick={removeLastMember}
                    className="inline-flex items-center gap-1.5 border border-[#15181d] bg-white px-3.5 py-3 text-[13.5px] sm:px-4 sm:text-[14px] font-bold text-[#15181d] transition-colors hover:bg-[#15181d] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={15} aria-hidden="true" />
                    Remove Member
                  </button>
                  <button
                    type="button"
                    data-testid="add-member-button"
                    disabled={count >= maxTeamSize}
                    onClick={addMember}
                    className="inline-flex items-center gap-1.5 border border-[#15181d] bg-[#15181d] px-3.5 py-3 text-[13.5px] sm:px-4 sm:text-[14px] font-bold text-white transition-colors hover:border-[#d6281f] hover:bg-[#d6281f] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={15} aria-hidden="true" />
                    Add Member ({count}/{maxTeamSize})
                  </button>
                </div>
                <FieldError id="member-count-err" msg={err("memberCount")} />
                <p className="mt-1.5 text-[13px] text-[#5b584f]">
                  {count >= maxTeamSize
                    ? MAX_TEAM_SIZE_MESSAGE
                    : `Minimum 1 member (solo), maximum ${maxTeamSize} members per team.`}
                </p>
              </div>

              {shrink !== null && (
                <div
                  role="alertdialog"
                  aria-label="Confirm removing member details"
                  className="border-2 border-[#d6281f] bg-[#f6f4ef] p-4 sm:col-span-2"
                >
                  <p className="text-[15px] font-bold">
                    Reducing the team to {shrink} will remove the details you entered for member
                    {shrink + 1 < count ? `s ${shrink + 1}–${count}` : ` ${count}`}.
                  </p>
                  <p className="mt-1 text-[14px] text-[#3d3b35]">
                    They stay saved on this page, so increasing the number again restores them.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" className={`${btnPrimary} !py-2 !text-[14px]`} onClick={() => applyCount(shrink)}>
                      Remove them
                    </button>
                    <button
                      type="button"
                      className={`${btnSecondary} !py-2 !text-[14px]`}
                      onClick={() => {
                        setShrink(null);
                        setCountText(String(count));
                      }}
                    >
                      Keep {count} members
                    </button>
                  </div>
                </div>
              )}

              <Field id="org" label="College / organisation" optional>
                <input
                  id="org"
                  className={inputCls}
                  placeholder="e.g. MANIT Bhopal / Independent"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                />
              </Field>
              <Field id="ref" label="Referral code" optional>
                <input
                  id="ref"
                  className={inputCls}
                  placeholder="Optional referral code"
                  value={referral}
                  maxLength={40}
                  onChange={(e) => setReferral(e.target.value)}
                />
              </Field>

              <div className="flex flex-col gap-3 border-t border-[#15181d] pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[15px] font-bold">
                  Total ({count} {count === 1 ? "member" : "members"}): {preview ? formatInr(preview.total) : "—"}
                </p>
                <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
                  Continue <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form
              className="space-y-6"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next2();
              }}
            >
              {visible.map((m, i) => (
                <fieldset key={i} className="border border-[#15181d] bg-white p-4 sm:p-6">
                  <legend className="flex flex-wrap items-center gap-2 bg-[#f6f4ef] px-2.5 py-0.5 text-[14.5px] sm:text-[15px] font-extrabold">
                    <span>Participant {i + 1} of {count}</span>
                    <span
                      className={`px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider ${
                        i === 0 ? "bg-[#d6281f] text-white" : "bg-[#e4e0d4]"
                      }`}
                    >
                      {i === 0 ? "Team Leader" : "Team Member"}
                    </span>
                  </legend>
                  <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Field id={`m-${i}-fullName`} label="Full name" error={err(`members.${i}.fullName`)}>
                      <input
                        id={`m-${i}-fullName`}
                        className={inputCls}
                        value={m.fullName}
                        onChange={(e) => setM(i, { fullName: e.target.value })}
                        autoComplete={i === 0 ? "name" : "off"}
                      />
                    </Field>
                    <Field id={`m-${i}-email`} label="Email address" error={err(`members.${i}.email`)}>
                      <input
                        id={`m-${i}-email`}
                        type="email"
                        className={inputCls}
                        value={m.email}
                        onChange={(e) => setM(i, { email: e.target.value })}
                        autoComplete={i === 0 ? "email" : "off"}
                      />
                    </Field>
                    <div className="min-w-0">
                      <label htmlFor={`m-${i}-number`} className={labelCls}>
                        Mobile number
                      </label>
                      <div className="flex gap-2">
                        <input
                          aria-label={`Participant ${i + 1} country code`}
                          list="hk-codes"
                          className={`${inputCls} !w-[78px] sm:!w-[88px] shrink-0 text-center font-mono`}
                          value={m.code}
                          onChange={(e) => setM(i, { code: e.target.value })}
                        />
                        <input
                          id={`m-${i}-number`}
                          type="tel"
                          inputMode="tel"
                          className={inputCls}
                          value={m.number}
                          onChange={(e) => setM(i, { number: e.target.value })}
                          autoComplete={i === 0 ? "tel-national" : "off"}
                        />
                      </div>
                      <FieldError id={`m-${i}-mobile-err`} msg={err(`members.${i}.mobile`)} />
                    </div>
                    <Field id={`m-${i}-organisation`} label="College / organisation" error={err(`members.${i}.organisation`)}>
                      <input
                        id={`m-${i}-organisation`}
                        className={inputCls}
                        value={m.organisation}
                        onChange={(e) => setM(i, { organisation: e.target.value })}
                      />
                    </Field>
                    <Field id={`m-${i}-course`} label="Course / designation" error={err(`members.${i}.course`)}>
                      <input
                        id={`m-${i}-course`}
                        className={inputCls}
                        value={m.course}
                        onChange={(e) => setM(i, { course: e.target.value })}
                      />
                    </Field>
                    <Field id={`m-${i}-skills`} label="Technical skills" optional>
                      <input
                        id={`m-${i}-skills`}
                        className={inputCls}
                        placeholder="e.g. React, Python, Design"
                        value={m.skills}
                        maxLength={300}
                        onChange={(e) => setM(i, { skills: e.target.value })}
                      />
                    </Field>
                    <Field id={`m-${i}-github`} label="GitHub profile" optional error={err(`members.${i}.github`)}>
                      <input
                        id={`m-${i}-github`}
                        className={inputCls}
                        placeholder="github.com/username"
                        value={m.github}
                        onChange={(e) => setM(i, { github: e.target.value })}
                      />
                    </Field>
                    <Field id={`m-${i}-linkedin`} label="LinkedIn profile" optional error={err(`members.${i}.linkedin`)}>
                      <input
                        id={`m-${i}-linkedin`}
                        className={inputCls}
                        placeholder="linkedin.com/in/username"
                        value={m.linkedin}
                        onChange={(e) => setM(i, { linkedin: e.target.value })}
                      />
                    </Field>
                    {i === 0 && count > 1 && (
                      <button
                        type="button"
                        className="text-left text-[13px] font-semibold underline sm:col-span-2 xl:col-span-4"
                        onClick={() => {
                          for (let j = 1; j < count; j++) {
                            setM(j, { organisation: members[j].organisation || m.organisation });
                          }
                        }}
                      >
                        Copy leader&apos;s college / organisation to empty member fields
                      </button>
                    )}
                  </div>
                </fieldset>
              ))}

              {/* Add Member bar on Step 2 */}
              <div className="flex flex-col justify-between gap-3 border border-[#15181d] bg-white p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[14px] font-bold text-[#15181d]">
                    Team size: {count} of {maxTeamSize} members
                  </p>
                  <p className="text-[13px] text-[#5b584f]">
                    {count >= maxTeamSize
                      ? MAX_TEAM_SIZE_MESSAGE
                      : `You can add up to ${maxTeamSize - count} more team ${maxTeamSize - count === 1 ? "member" : "members"}.`}
                  </p>
                  <FieldError id="step2-member-count-err" msg={err("memberCount")} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {count > 1 && (
                    <button
                      type="button"
                      onClick={removeLastMember}
                      className={`${btnSecondary} !px-4 !py-2 !text-[13px]`}
                    >
                      <Minus size={14} aria-hidden="true" /> Remove Last
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="step2-add-member-button"
                    disabled={count >= maxTeamSize}
                    onClick={addMember}
                    className={`${btnPrimary} !px-4 !py-2 !text-[13px]`}
                  >
                    <Plus size={14} aria-hidden="true" /> Add Member
                  </button>
                </div>
              </div>

              <datalist id="hk-codes">
                {COUNTRY_CODES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <div className="flex flex-col-reverse gap-3 border-t border-[#15181d] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" className={`${btnSecondary} w-full sm:w-auto`} onClick={() => goStep(1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
                  Review fee <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {step === 3 && preview && (
            <div className="border border-[#15181d] bg-white p-5 sm:p-7">
              <table className="w-full border-collapse text-left text-[15px] sm:text-[16px]">
                <caption className="sr-only">Order summary</caption>
                <tbody>
                  {[
                    ["Hackathon", "AVATAR — DESIGN. BUILD. SELL. IN ONE DAY."],
                    ["Team name", teamName],
                    ["Number of members", `${preview.members} (max ${maxTeamSize})`],
                    ["Registration fee per person", formatInr(preview.feePerPerson)],
                    ["Subtotal", formatInr(preview.subtotal)],
                    ...(preview.tax > 0 ? [[preview.taxLabel ?? "Tax", formatInr(preview.tax)]] : []),
                  ].map(([k, v]) => (
                    <tr key={k} className="border-t border-[#bdb8ab] first:border-t-0">
                      <th scope="row" className="py-3 pr-4 font-semibold text-[#3d3b35]">
                        {k}
                      </th>
                      <td className="py-3 text-right font-bold">{v}</td>
                    </tr>
                  ))}
                  <tr className="border-y-2 border-[#15181d]">
                    <th scope="row" className="py-4 text-[17px] sm:text-[18px] font-extrabold">
                      Final payable amount
                    </th>
                    <td className="py-4 text-right text-[24px] sm:text-[26px] font-extrabold">{formatInr(preview.total)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-2 text-[13px] text-[#5b584f]">
                {preview.tax === 0 ? "No tax is added by this website." : ""} The amount is calculated again on the server before payment.
              </p>
              <label className="mt-6 flex cursor-pointer items-start gap-3 border border-[#15181d] bg-[#f6f4ef] p-4 text-[14.5px] sm:text-[15px] leading-relaxed">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#d6281f]"
                  data-testid="consent"
                />
                <span>
                  As team leader, I have read and agree to the{" "}
                  <Link to="/competition/policy/terms" className="font-bold underline">
                    Terms and Conditions
                  </Link>
                  ,{" "}
                  <Link to="/competition/policy/privacy" className="font-bold underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/competition/policy/refund" className="font-bold underline">
                    Refund Policy
                  </Link>
                  , and I consent to receive event-related communication on behalf of my team.
                </span>
              </label>
              {errors.consent && <FieldError id="consent-err" msg={errors.consent} />}
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#15181d] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" className={`${btnSecondary} w-full sm:w-auto`} onClick={() => goStep(2)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" className={`${btnPrimary} w-full sm:w-auto`} disabled={busy || !consent} onClick={submitRegistration}>
                  {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
                  {busy ? "Saving…" : "Continue to payment"}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="border border-[#15181d] bg-white p-5 sm:p-7">
                <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5b584f]">
                  Amount payable
                </p>
                <p className="mt-1 text-[34px] sm:text-[40px] font-extrabold tracking-[-0.03em]">{formatInr((fee ?? preview!).total)}</p>
                <p className="mt-1 text-[15px] text-[#3d3b35]">
                  {count} {count === 1 ? "participant" : "participants"} × {formatInr(s.feePerPerson)} · Team &quot;{teamName}&quot;
                </p>
                <ul className="mt-5 space-y-2 text-[14px] text-[#3d3b35]">
                  <li className="flex gap-2">
                    <Lock size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> Payment is processed by PayU. We never see your card or bank details.
                  </li>
                  <li>
                    Your registration is confirmed only after PayU&apos;s server confirms the payment. Do not pay twice if the page is slow: check the status page instead.
                  </li>
                </ul>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#15181d] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" className={`${btnSecondary} w-full sm:w-auto`} disabled={busy} onClick={() => goStep(3)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" className={`${btnPrimary} w-full sm:w-auto`} disabled={busy} onClick={pay} data-testid="pay-button">
                  {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                  {busy ? "Connecting to PayU…" : `Pay ${formatInr((fee ?? preview!).total)} securely`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Registration Summary Sidebar */}
        <aside aria-label="Registration summary" className="border-2 border-[#15181d] bg-[#15181d] p-5 text-white sm:p-6 lg:sticky lg:top-20">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#ff6b5e]">
            AVATAR · LIVE SUMMARY
          </p>
          <h2 className="mt-1.5 text-[20px] font-extrabold leading-tight text-white">
            DESIGN. BUILD. SELL. IN ONE DAY.
          </h2>
          <dl className="mt-5 space-y-3 border-y border-white/20 py-4 text-[14px]">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#d8d4c8]">Team Name</dt>
              <dd className="truncate font-bold text-white">{teamName.trim() || "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#d8d4c8]">Team Size</dt>
              <dd className="font-mono font-bold text-white">
                {count} / {maxTeamSize} {count === 1 ? "Member" : "Members"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#d8d4c8]">Fee per Participant</dt>
              <dd className="font-mono font-bold text-white">{formatInr(s.feePerPerson)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t border-white/20 pt-3">
              <dt className="font-bold text-white">Total Payable</dt>
              <dd className="font-mono text-[22px] font-extrabold text-[#ff6b5e]">
                {preview ? formatInr(preview.total) : "—"}
              </dd>
            </div>
          </dl>
          <ul className="mt-4 space-y-2 text-[12.5px] leading-relaxed text-[#d8d4c8]">
            <li>• Official AVATAR Pass issued immediately after PayU verification</li>
            <li>• Unique Registration ID (AIH-R) &amp; Team ID (AIH-T)</li>
            <li>• QR code pass credential ready for download</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
