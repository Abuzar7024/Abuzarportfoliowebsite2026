import React, { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import emailjs from "@emailjs/browser";
import { ArrowRight, CheckCircle2, Loader2, Mail, RotateCcw, TriangleAlert } from "lucide-react";
import { useUserSession } from "../context/UserSessionContext";
import { buildLocationParams } from "../lib/emailjs-params";
import { formatBudgetValue, isBudgetValid, type InquiryType } from "../lib/user-session";
import { profile } from "../data/profile";
import { BudgetSelector } from "./BudgetSelector";
import { DialCodePicker } from "./DialCodePicker";

const INQUIRIES: { id: InquiryType; label: string }[] = [
  { id: "job", label: "A job opportunity" },
  { id: "freelance", label: "A project" },
  { id: "general", label: "Just saying hi" },
];

const PROJECT_TYPES = [
  { id: "mobile", label: "Mobile app" },
  { id: "web", label: "Website" },
  { id: "both", label: "App + website" },
  { id: "unsure", label: "Not sure yet" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 2000;

type Status = "idle" | "sending" | "sent" | "error";
type Field = "fullName" | "email" | "phoneNumber" | "message" | "budget";
type Errors = Partial<Record<Field, string>>;

const env = import.meta.env;
const EMAILJS = {
  serviceId: env.VITE_EMAILJS_SERVICE_ID as string | undefined,
  templateId: env.VITE_EMAILJS_TEMPLATE_ID as string | undefined,
  publicKey: env.VITE_EMAILJS_PUBLIC_KEY as string | undefined,
};
const configured = !!(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

/**
 * The contact form. Sends through EmailJS (same template variables as
 * emailjs-template.html); drafts persist in localStorage via the session
 * context, so a refresh never loses a half-written message. If EmailJS is not
 * configured or fails, the visitor gets a pre-filled email instead of a dead end.
 */
export function ContactForm() {
  const { session, region, budgetRanges, updateContact, clearContactDraft } = useUserSession();
  const c = session.contact;
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");
  const [sentTo, setSentTo] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const isProject = c.inquiryType === "freelance";
  const subject =
    c.inquiryType === "job" ? "Job opportunity" : c.inquiryType === "freelance" ? "Project enquiry" : "Hello";

  const validate = (): Errors => {
    const e: Errors = {};
    if (c.fullName.trim().length < 2) e.fullName = "Please tell me your name.";
    if (!EMAIL_RE.test(c.email.trim())) e.email = "That email doesn't look right.";
    const digits = c.phoneNumber.replace(/\D/g, "");
    if (digits && (digits.length < 6 || digits.length > 15)) e.phoneNumber = "Phone numbers are 6–15 digits.";
    const msg = c.message.trim();
    if (msg.length < MESSAGE_MIN) e.message = `A little more detail, please (at least ${MESSAGE_MIN} characters).`;
    if (isProject && !isBudgetValid(c.budget, c.customBudget)) e.budget = "Pick a rough budget, or enter your own.";
    return e;
  };

  const budgetText = isProject ? formatBudgetValue(c.budget, c.customBudget, region.currencySymbol) : "N/A";
  const phoneText = c.phoneNumber.trim() ? `${c.dialCode} ${c.phoneNumber.trim()}` : "Not provided";

  const mailtoHref = () => {
    const lines = [
      c.message.trim(),
      "",
      `— ${c.fullName.trim()}`,
      c.companyName.trim() && `Company: ${c.companyName.trim()}`,
      c.phoneNumber.trim() && `Phone: ${phoneText}`,
      isProject && `Budget: ${budgetText}`,
    ].filter(Boolean);
    return `mailto:${profile.email}?subject=${encodeURIComponent(`${subject} — via portfolio`)}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (status === "sending") return;

    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0] as Field | undefined;
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }

    // Bots fill every field; people never see this one.
    if (honeypot.current?.value) {
      setStatus("sent");
      return;
    }

    if (!configured) {
      setFailure("Direct sending isn't set up on this deployment yet.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await emailjs.send(
        EMAILJS.serviceId!,
        EMAILJS.templateId!,
        {
          form_type: "contact",
          subject: `${subject} — ${c.fullName.trim()}`,
          purpose: INQUIRIES.find((i) => i.id === c.inquiryType)?.label ?? subject,
          from_name: c.fullName.trim(),
          from_email: c.email.trim(),
          reply_to: c.email.trim(),
          company_name: c.companyName.trim() || "Not provided",
          visitor_phone: phoneText,
          dial_code: c.dialCode,
          project_type: isProject ? PROJECT_TYPES.find((p) => p.id === c.projectType)?.label ?? "Not specified" : "N/A",
          budget: budgetText,
          timeline: "N/A",
          service_requested: "N/A",
          message: c.message.trim(),
          ...buildLocationParams(session.location, region),
        },
        { publicKey: EMAILJS.publicKey!, limitRate: { id: "portfolio-contact", throttle: 15000 } }
      );
      setSentTo(c.fullName.trim().split(/\s+/)[0]);
      clearContactDraft();
      setErrors({});
      setStatus("sent");
    } catch (err) {
      const code = (err as { status?: number })?.status;
      setFailure(
        code === 429
          ? "You just sent one — give it a few seconds before sending again."
          : "The message couldn't be delivered just now."
      );
      setStatus("error");
    }
  };

  const fieldProps = (name: Field) => ({
    "data-field": name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? id(`${name}-err`) : undefined,
  });

  const clearError = (name: Field) => errors[name] && setErrors((e) => ({ ...e, [name]: undefined }));

  const ErrorText = ({ name }: { name: Field }) =>
    errors[name] ? (
      <p id={id(`${name}-err`)} className="mt-1.5 text-[12.5px] text-accent-ink">
        {errors[name]}
      </p>
    ) : null;

  if (status === "sent") {
    return (
      <motion.div
        className="hud flex min-h-[28rem] flex-col items-center justify-center p-8 text-center"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        role="status"
      >
        <span className="grid h-14 w-14 place-items-center rounded-full border border-success/40 bg-success/10 text-success">
          <CheckCircle2 size={26} aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-3xl tracking-tight">Signal received{sentTo ? `, ${sentTo}` : ""}.</h3>
        <p className="measure mt-3 text-muted">
          Thanks for reaching out. I read every message myself and usually reply within one or two working days.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="btn-ghost mt-8">
          <RotateCcw size={14} aria-hidden="true" />
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="hud p-6 sm:p-8" aria-labelledby={id("title")}>
      <h3 id={id("title")} className="sr-only">
        Contact form
      </h3>

      <fieldset>
        <legend className="field-label">I'm reaching out about</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {INQUIRIES.map((q) => (
            <button
              key={q.id}
              type="button"
              role="radio"
              aria-checked={c.inquiryType === q.id}
              onClick={() => updateContact({ inquiryType: q.id })}
              className="seg"
            >
              {q.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="field-label">
            Your name
          </label>
          <input
            id={id("name")}
            className="input"
            autoComplete="name"
            maxLength={80}
            value={c.fullName}
            onChange={(e) => {
              updateContact({ fullName: e.target.value });
              clearError("fullName");
            }}
            {...fieldProps("fullName")}
          />
          <ErrorText name="fullName" />
        </div>
        <div>
          <label htmlFor={id("email")} className="field-label">
            Email
          </label>
          <input
            id={id("email")}
            type="email"
            inputMode="email"
            className="input"
            autoComplete="email"
            maxLength={120}
            value={c.email}
            onChange={(e) => {
              updateContact({ email: e.target.value });
              clearError("email");
            }}
            {...fieldProps("email")}
          />
          <ErrorText name="email" />
        </div>

        <div>
          <label htmlFor={id("company")} className="field-label">
            Company <span className="normal-case tracking-normal text-faint">(optional)</span>
          </label>
          <input
            id={id("company")}
            className="input"
            autoComplete="organization"
            maxLength={100}
            value={c.companyName}
            onChange={(e) => updateContact({ companyName: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor={id("phone")} className="field-label">
            Phone <span className="normal-case tracking-normal text-faint">(optional)</span>
          </label>
          <div className="flex gap-2">
            <DialCodePicker value={c.dialCode} onChange={(dialCode) => updateContact({ dialCode, dialCodeManual: true })} />
            <input
              id={id("phone")}
              type="tel"
              inputMode="tel"
              className="input min-w-0"
              autoComplete="tel-national"
              maxLength={20}
              value={c.phoneNumber}
              onChange={(e) => {
                updateContact({ phoneNumber: e.target.value.replace(/[^\d\s()-]/g, "") });
                clearError("phoneNumber");
              }}
              {...fieldProps("phoneNumber")}
            />
          </div>
          <ErrorText name="phoneNumber" />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isProject && (
          <motion.div
            key="project"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <fieldset className="pt-6">
              <legend className="field-label">What are we building?</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {PROJECT_TYPES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={c.projectType === p.id}
                    onClick={() => updateContact({ projectType: p.id })}
                    className="seg"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="pt-6" data-field="budget" tabIndex={-1} aria-describedby={errors.budget ? id("budget-err") : undefined}>
              <legend className="field-label">
                Rough budget <span className="normal-case tracking-normal text-faint">({region.currencyCode})</span>
              </legend>
              <BudgetSelector
                budgets={budgetRanges}
                value={c.budget}
                customValue={c.customBudget}
                currencySymbol={region.currencySymbol}
                currencyCode={region.currencyCode}
                onSelect={(budget) => {
                  updateContact({ budget });
                  clearError("budget");
                }}
                onCustomChange={(customBudget) => {
                  updateContact({ customBudget });
                  clearError("budget");
                }}
              />
              <ErrorText name="budget" />
            </fieldset>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor={id("message")} className="field-label">
            Message
          </label>
          <span className={`font-mono text-[11px] ${c.message.length > MESSAGE_MAX * 0.9 ? "text-accent-ink" : "text-faint"}`}>
            {c.message.length}/{MESSAGE_MAX}
          </span>
        </div>
        <textarea
          id={id("message")}
          className="input min-h-36 resize-y"
          maxLength={MESSAGE_MAX}
          rows={5}
          placeholder={
            c.inquiryType === "job"
              ? "The role, the team, and where to read more…"
              : c.inquiryType === "freelance"
                ? "What you want to build, who it's for, and any deadline…"
                : "Say hello…"
          }
          value={c.message}
          onChange={(e) => {
            updateContact({ message: e.target.value });
            clearError("message");
          }}
          {...fieldProps("message")}
        />
        <ErrorText name="message" />
      </div>

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Leave this empty
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <AnimatePresence>
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-6 flex gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm"
          >
            <TriangleAlert size={17} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true" />
            <div>
              <p className="text-ink">{failure}</p>
              <p className="mt-1 text-muted">
                Your message is saved here.{" "}
                <a href={mailtoHref()} className="link-u text-ink">
                  Send it from your email app instead
                </a>
                , or try again.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-7 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[12.5px] text-faint">
          <Mail size={13} aria-hidden="true" />
          Drafts are saved on this device until you send.
        </p>
        <button type="submit" className="btn-primary" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ArrowRight size={15} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
