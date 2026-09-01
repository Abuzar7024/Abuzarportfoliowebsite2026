import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CheckCircle2, Gamepad2, Send } from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { profile } from "../data/profile";
import { FadeIn, SectionHead } from "../components/Reveal";
import { CodeWindow } from "../components/CodeWindow";
import { FlappyGame } from "../components/FlappyGame";
import { useUserSession } from "../context/UserSessionContext";
import type { InquiryType } from "../lib/user-session";
import { buildLocationParams } from "../lib/emailjs-params";
import { requestUserGeolocation } from "../lib/geolocation";
import { formatVisitorPhone, getPhonePlaceholder } from "../lib/dial-codes";
import { DialCodePicker } from "../components/DialCodePicker";

const INQUIRY_TYPES = ["general", "job"] as const;
const INQUIRY_LABELS: Record<(typeof INQUIRY_TYPES)[number], string> = { general: "General", job: "Hiring" };
const normalize = (t: InquiryType) => (t === "job" ? "job" : "general");

const CHANNELS = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}`, cursor: "Mail" },
  { label: "WhatsApp", value: profile.phoneDisplay, href: `https://wa.me/${profile.whatsapp}`, cursor: "Chat" },
  { label: "LinkedIn", value: "in/abuzar-khan7024", href: profile.links.linkedin, cursor: "Open" },
  { label: "GitHub", value: `@${profile.links.githubUser}`, href: profile.links.github, cursor: "Open" },
  { label: "Resume", value: "Abuzar-Khan-Resume.pdf", href: profile.links.resumePdf, cursor: "PDF", download: true },
];

/** Scene 07 — Contact. The finale: giant typography, editorial channels, a quiet form. */
export function Contact() {
  const { session, region, updateContact, updateLocation, clearContactDraft } = useUserSession();
  const draft = session.contact;
  const inquiryType = normalize(draft.inquiryType);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      toast.error("Email service is not configured yet — please use email or WhatsApp directly.");
      setLoading(false);
      return;
    }
    try {
      let location = session.location;
      if (location.latitude == null || location.longitude == null) {
        location = await requestUserGeolocation();
        updateLocation(location);
      }
      const loc = buildLocationParams(location, region);
      const visitorPhone = formatVisitorPhone(draft.dialCode, draft.phoneNumber);
      const purpose = inquiryType === "general" ? "General inquiry" : "Job opportunity";
      const templateParams = {
        form_type: "contact",
        from_name: draft.fullName,
        from_email: draft.email,
        subject: `[Portfolio Connection] ${purpose} - ${draft.fullName}`,
        purpose,
        dial_code: draft.dialCode,
        phone_number: draft.phoneNumber || "Not provided",
        visitor_phone: visitorPhone,
        message: `${draft.message}\n\n--- Contact ---\nPhone: ${visitorPhone}\n\n--- Location ---\nCountry: ${loc.country} (${loc.country_code})\nLatitude: ${loc.latitude}\nLongitude: ${loc.longitude}\nMaps: ${loc.location_maps_url}`,
        project_type: "N/A",
        budget: `N/A (${region.currencyCode})`,
        company_name: draft.companyName || "N/A",
        service_requested: "N/A",
        project_description: draft.message,
        timeline: "N/A",
        ...loc,
      };
      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      if (result.status !== 200) throw new Error(`EmailJS responded with status ${result.status}`);
      setSuccess(true);
      clearContactDraft();
      toast.success("Message sent — I'll get back to you soon.");
    } catch (error) {
      console.error("EmailJS error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <AnimatePresence>{showGame && <FlappyGame onClose={() => setShowGame(false)} />}</AnimatePresence>

      <div className="container-x">
        <SectionHead id="contact-title" label="Contact" title="Let’s build something." text="Have a role, a product idea or a problem worth solving? Pick a channel or send a message — I usually reply within 24 hours." />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-12 lg:gap-8">
          {/* channels */}
          <div className="lg:col-span-5">
            <CodeWindow file="contacts.json" meta={`${CHANNELS.length} channels`}>
            <ul className="divide-y divide-line px-5 sm:px-6">
              {CHANNELS.map((c, i) => (
                <li key={c.label}>
                  <FadeIn delay={i * 0.04}>
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      download={c.download ? "Abuzar-Khan-Resume.pdf" : undefined}
                      className="group flex items-center justify-between gap-4 py-4 sm:py-5"
                      data-cursor={c.cursor}
                    >
                      <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-4">
                        <span className="font-display text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent">{c.label}</span>
                        <span className="truncate text-[13px] text-muted">{c.value}</span>
                      </span>
                      <ArrowUpRight size={20} className="shrink-0 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </a>
                  </FadeIn>
                </li>
              ))}
            </ul>
            </CodeWindow>
            <FadeIn delay={0.2}>
              <p className="mt-4 font-mono text-[12px] text-muted">
                {"// "}{profile.location} · {profile.availability} · open to remote
              </p>
            </FadeIn>
          </div>

          {/* form */}
          <FadeIn delay={0.1} className="lg:col-span-7">
            <CodeWindow file="new-message.ts" meta="EmailJS · encrypted in transit" bodyClassName="p-6 sm:p-8">
            {!success ? (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[12px] text-muted">{"// send a message"}</p>
                  <div className="flex gap-2" role="radiogroup" aria-label="Inquiry type">
                    {INQUIRY_TYPES.map((t) => (
                      <button key={t} type="button" role="radio" aria-checked={inquiryType === t} onClick={() => updateContact({ inquiryType: t })} className={`chip !py-1.5 transition-colors ${inquiryType === t ? "chip-accent" : "hover:border-line-2"}`}>
                        {INQUIRY_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mono-label">Name</span>
                    <input required type="text" placeholder="Your name" className="input mt-1.5" autoComplete="name" value={draft.fullName} onChange={(e) => updateContact({ fullName: e.target.value })} />
                  </label>
                  <label className="block">
                    <span className="mono-label">Email</span>
                    <input required type="email" placeholder="you@example.com" className="input mt-1.5" autoComplete="email" value={draft.email} onChange={(e) => updateContact({ email: e.target.value })} />
                  </label>
                </div>
                <AnimatePresence initial={false}>
                  {inquiryType === "job" && (
                    <motion.label key="company" className="block overflow-hidden" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <span className="mono-label">Company</span>
                      <input required type="text" placeholder="Company name" className="input mt-1.5" autoComplete="organization" value={draft.companyName} onChange={(e) => updateContact({ companyName: e.target.value })} />
                    </motion.label>
                  )}
                </AnimatePresence>
                <div>
                  <span className="mono-label">
                    Phone <span className="normal-case tracking-normal">(optional)</span>
                  </span>
                  <div className="mt-1.5 flex gap-2">
                    <DialCodePicker value={draft.dialCode} onChange={(dialCode) => updateContact({ dialCode, dialCodeManual: true })} />
                    <input type="tel" value={draft.phoneNumber} onChange={(e) => updateContact({ phoneNumber: e.target.value.replace(/\D/g, "") })} placeholder={getPhonePlaceholder(draft.dialCode)} maxLength={12} className="input min-w-0" aria-label="Phone number" autoComplete="tel-national" />
                  </div>
                </div>
                <label className="block">
                  <span className="mono-label">Message</span>
                  <textarea required rows={5} placeholder="Tell me about your project or role…" className="input mt-1.5 resize-none" value={draft.message} onChange={(e) => updateContact({ message: e.target.value })} />
                </label>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                  {loading ? "Sending…" : (
                    <>
                      Send message <Send size={15} />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-muted">Your draft is saved in this browser. Location is only attached with your permission.</p>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
                  <CheckCircle2 size={30} />
                </span>
                <h3 className="font-display text-2xl font-bold">Message sent</h3>
                <p className="max-w-sm text-sm text-muted">Thanks for reaching out — I'll get back to you soon. While you wait…</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => setShowGame(true)} className="btn-primary">
                    <Gamepad2 size={15} /> Play the mini-game
                  </button>
                  <button type="button" onClick={() => setSuccess(false)} className="btn-ghost">
                    Send another
                  </button>
                </div>
              </motion.div>
            )}
            </CodeWindow>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
