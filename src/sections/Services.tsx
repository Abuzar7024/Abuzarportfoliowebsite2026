import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Brain, CheckCircle2, ChevronRight, Cloud, Globe, MessageCircle, Paintbrush, Send, ShoppingBag, Smartphone, X } from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";
import { BudgetSelector } from "../components/BudgetSelector";
import { FadeIn, SectionHead } from "../components/Reveal";
import { useUserSession } from "../context/UserSessionContext";
import { useScrollLock } from "../hooks/useScrollLock";
import { CUSTOM_BUDGET_KEY, formatBudgetValue, isBudgetValid, type ServiceFormDraft } from "../lib/user-session";
import { buildLocationParams } from "../lib/emailjs-params";
import { requestUserGeolocation } from "../lib/geolocation";
import { profile } from "../data/profile";

const FORM_STEPS = [
  { n: 1, label: "Your details", hint: "Tell me who you are so I can get back to you." },
  { n: 2, label: "Your project", hint: "Share what you want to build — the more detail, the better." },
  { n: 3, label: "Budget & timeline", hint: "Pick a budget range and timeline that works for you." },
] as const;

const TIMELINES = ["ASAP", "1 – 2 weeks", "1 month", "2 – 3 months", "Flexible"];

export const services = [
  { id: "flutter", Icon: Smartphone, title: "Flutter App Development", subtitle: "Cross-platform mobile", description: "High-performance Android and iOS apps from one codebase, built on clean architecture and shipped to both stores.", features: ["Cross-platform apps", "Enterprise mobile apps", "MVP development", "Firebase integration", "Offline support", "App Store & Play Store"], whatsappMsg: "Hi Abuzar, I visited your portfolio and I'm interested in Flutter App Development. Can we discuss my project?" },
  { id: "ai", Icon: Brain, title: "AI-Powered Mobile Apps", subtitle: "Vision & camera features", description: "Computer vision, face detection, virtual try-on and AI API integrations inside responsive mobile apps.", features: ["Computer vision", "Face detection", "Virtual try-on", "AI API integration", "Image processing"], whatsappMsg: "Hi Abuzar, I'm interested in building an AI-powered mobile application. Let's connect!" },
  { id: "web", Icon: Globe, title: "Websites & Web Apps", subtitle: "React front-ends", description: "Modern landing pages, dashboards and web applications with responsive, premium interfaces.", features: ["Business websites", "Landing pages", "Admin dashboards", "Interactive 3D experiences", "Progressive web apps"], whatsappMsg: "Hi Abuzar, I'd like to discuss a website development project with you." },
  { id: "ecommerce", Icon: ShoppingBag, title: "E-Commerce & Retail", subtitle: "Shopping experiences", description: "Retail apps with product catalogues, payments and camera-based try-on flows.", features: ["Shopping apps", "Virtual try-on", "Product catalogue", "Payment gateway"], whatsappMsg: "Hi Abuzar, I'm interested in building an e-commerce or retail solution. Can you help?" },
  { id: "api", Icon: Cloud, title: "API & Backend Integration", subtitle: "Secure infrastructure", description: "REST APIs, Firebase Auth, Cloud Firestore, push notifications and third-party SDK integrations.", features: ["REST API integration", "Firebase", "Authentication", "Cloud Firestore", "Push notifications", "Third-party SDKs"], whatsappMsg: "Hi Abuzar, I need help with API and backend integration for my app. Let's talk!" },
  { id: "uiux", Icon: Paintbrush, title: "UI/UX Implementation", subtitle: "Design to production", description: "Accessible mobile UI, dashboards and design systems implemented pixel-accurately from Figma.", features: ["Mobile UI", "Dashboard design", "Design systems", "Responsive interfaces", "Prototypes"], whatsappMsg: "Hi Abuzar, I'm interested in UI/UX implementation for my product. Can we connect?" },
];

type Service = (typeof services)[number];

function ServiceModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const { session, updateServiceForm, updateLocation, budgetRanges, region } = useUserSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoCapturing, setGeoCapturing] = useState(false);
  const [form, setForm] = useState<ServiceFormDraft>(() => ({ ...session.serviceForm }));
  useScrollLock(true);

  const update = (k: keyof ServiceFormDraft, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      updateServiceForm(next);
      return next;
    });
  };

  const isStep1Valid = !!form.name.trim() && form.email.includes("@");
  const isStep2Valid = form.description.trim().length >= 10;
  const isStep3Valid = isBudgetValid(form.budget, form.customBudget) && !!form.timeline;
  const resolvedBudget = formatBudgetValue(form.budget, form.customBudget, region.currencySymbol);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleContinue = async () => {
    const canAdvance = step === 1 ? isStep1Valid : isStep2Valid;
    if (!canAdvance || geoCapturing) return;
    setGeoCapturing(true);
    try {
      const geo = await requestUserGeolocation();
      updateLocation(geo);
    } finally {
      setGeoCapturing(false);
    }
    setStep((s) => (s + 1) as 2 | 3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    let location = session.location;
    if (location.latitude == null || location.longitude == null) {
      location = await requestUserGeolocation();
      updateLocation(location);
    }
    const loc = buildLocationParams(location, region);
    const params = {
      form_type: "service_request",
      from_name: form.name,
      from_email: form.email,
      dial_code: "N/A",
      phone_number: "N/A",
      visitor_phone: "N/A",
      company_name: form.company || "N/A",
      service_requested: service.title,
      project_description: form.description,
      budget: resolvedBudget,
      timeline: form.timeline,
      purpose: `Service: ${service.title}`,
      project_type: service.title,
      subject: `[Service Request] ${service.title} — ${form.name}`,
      message: `Service: ${service.title}\nFrom: ${form.name} (${form.email})\nCompany: ${form.company || "N/A"}\nBudget: ${resolvedBudget} (${region.currencyCode})\nTimeline: ${form.timeline}\nCountry: ${loc.country} (${loc.country_code})\nLatitude: ${loc.latitude}\nLongitude: ${loc.longitude}\nMaps: ${loc.location_maps_url}\n\nProject Description:\n${form.description}`,
      ...loc,
    };
    try {
      if (serviceId && templateId && publicKey) await emailjs.send(serviceId, templateId, params, publicKey);
      else toast("Email delivery is not configured — continue on WhatsApp.");
      updateServiceForm({ description: "", budget: "", customBudget: "", timeline: "" });
      setSubmitted(true);
    } catch (err) {
      console.error("Service form EmailJS error:", err);
      toast.error("Could not send email. Please continue via WhatsApp.");
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const whatsappMsg = encodeURIComponent(`Hi Abuzar! I just filled out a service request on your portfolio.\n\nService: ${service.title}\nName: ${form.name}\nEmail: ${form.email}\nBudget: ${resolvedBudget}\nTimeline: ${form.timeline}\n\nProject Details:\n${form.description}`);
  const chip = "rounded-xl border border-line bg-white/[0.03] px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:border-line-2";
  const chipActive = "!border-accent !bg-accent/15 !text-accent";

  return (
    <motion.div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="service-modal-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-xl" onClick={onClose} aria-hidden="true" />
      <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 32 }} transition={{ type: "spring", damping: 28, stiffness: 320 }} onClick={(e) => e.stopPropagation()} className="glass relative flex max-h-[92svh] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]">
        <div className="border-b border-line p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="icon-tile">
                <service.Icon size={18} />
              </span>
              <div>
                {!submitted && (
                  <p className="mono-label">
                    Step {step} of 3 · {FORM_STEPS[step - 1].label}
                  </p>
                )}
                <h3 id="service-modal-title" className="font-display text-xl">
                  {service.title}
                </h3>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close form" className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:text-ink">
              <X size={16} />
            </button>
          </div>
          {!submitted && (
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div className="h-full bg-accent" animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          )}
        </div>

        <div className="scrollbar-thin overflow-y-auto p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-4">
                <p className="text-sm text-muted">{FORM_STEPS[step - 1].hint}</p>
                {step === 1 && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="mono-label">Your name *</span>
                      <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Priya Sharma" className="input mt-1.5" autoComplete="name" />
                    </label>
                    <label className="block">
                      <span className="mono-label">Email *</span>
                      <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="you@company.com" className="input mt-1.5" autoComplete="email" />
                    </label>
                    <label className="block">
                      <span className="mono-label">Company (optional)</span>
                      <input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Your company" className="input mt-1.5" autoComplete="organization" />
                    </label>
                  </div>
                )}
                {step === 2 && (
                  <label className="block">
                    <span className="mono-label">Project description *</span>
                    <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={6} placeholder={`Describe what you want to build for "${service.title}".\n\nWhat's the main goal? Who are your users? Any specific features?`} className="input mt-1.5 min-h-[140px] resize-none" />
                    <span className="mt-1 block text-right font-mono text-[11px] text-muted">{form.description.length} chars</span>
                  </label>
                )}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <p className="mono-label mb-2">
                        Budget range * <span className="normal-case tracking-normal">({region.currencyCode})</span>
                      </p>
                      <BudgetSelector
                        budgets={budgetRanges}
                        value={form.budget}
                        customValue={form.customBudget}
                        currencySymbol={region.currencySymbol}
                        currencyCode={region.currencyCode}
                        onSelect={(b) => {
                          update("budget", b);
                          if (b !== CUSTOM_BUDGET_KEY) update("customBudget", "");
                        }}
                        onCustomChange={(v) => update("customBudget", v)}
                        chipClassName={chip}
                        activeClassName={chipActive}
                        inputClassName="input"
                      />
                    </div>
                    <div>
                      <p className="mono-label mb-2">Timeline *</p>
                      <div className="flex flex-wrap gap-2">
                        {TIMELINES.map((t) => (
                          <button key={t} type="button" onClick={() => update("timeline", t)} className={`${chip} ${form.timeline === t ? chipActive : ""}`} aria-pressed={form.timeline === t}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="btn-ghost">
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button onClick={() => void handleContinue()} disabled={(step === 1 ? !isStep1Valid : !isStep2Valid) || geoCapturing} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40">
                      {geoCapturing ? "One moment…" : (
                        <>
                          Continue <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  ) : (
                    <button onClick={() => void handleSubmit()} disabled={!isStep3Valid || loading} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40">
                      {loading ? "Sending…" : (
                        <>
                          <Send size={14} /> Submit request
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5 py-4 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent">
                  <CheckCircle2 size={26} />
                </span>
                <div>
                  <h4 className="font-display text-2xl">Request sent</h4>
                  <p className="mt-1 text-sm text-muted">Thanks for reaching out. Let's continue on WhatsApp.</p>
                </div>
                <a href={`https://wa.me/${profile.whatsapp}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                  <MessageCircle size={16} /> Open WhatsApp <ArrowRight size={14} />
                </a>
                <button onClick={onClose} className="btn-ghost w-full">
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Service cards — click opens the structured request flow. */
export function Services() {
  const [active, setActive] = useState<Service | null>(null);

  return (
    <section id="services" className="section !pt-0" aria-labelledby="services-title">
      <div className="container-x">
        <SectionHead id="services-title" label="Services" title="What I can build for you." text="Available for freelance and contract work alongside full-time roles. Pick a service to send a short, structured request — budget ranges adapt to your region." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {services.map((s, i) => (
            <FadeIn key={s.id} delay={i * 0.05} className="h-full">
              <button type="button" onClick={() => setActive(s)} className="card card-hover group flex h-full w-full flex-col p-6 text-left" data-cursor="Request">
                <div className="flex items-center justify-between">
                  <span className="icon-tile">
                    <s.Icon size={18} />
                  </span>
                  <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
                </div>
                <p className="mt-5 font-mono text-[11px] text-muted">service.{s.id}</p>
                <h3 className="mt-1.5 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-0.5 text-[12.5px] text-muted">{s.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{s.description}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {s.features.slice(0, 4).map((f) => (
                    <li key={f} className="chip !px-2.5 !text-[11px]">
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="btn-link mt-auto pt-6">
                  Request a quote <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </FadeIn>
          ))}
        </div>
      </div>

      {createPortal(<AnimatePresence>{active && <ServiceModal key={active.id} service={active} onClose={() => setActive(null)} />}</AnimatePresence>, document.body)}
    </section>
  );
}
