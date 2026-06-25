import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Smartphone, Brain, Globe, ShoppingBag, Cloud, Paintbrush,
  ArrowRight, MessageCircle, CheckCircle, X,
  ChevronRight, Send
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner@2.0.3";
import { BudgetSelector } from "../components/BudgetSelector";
import { useUserSession } from "../context/UserSessionContext";
import {
  CUSTOM_BUDGET_KEY,
  formatBudgetValue,
  isBudgetValid,
  type ServiceFormDraft,
} from "../lib/user-session";
import { buildLocationParams } from "../lib/emailjs-params";
import { requestUserGeolocation } from "../lib/geolocation";

// ─── Config ──────────────────────────────────────────────────────────────────
const WHATSAPP = "918770206120";

const THEME_GRADIENT = "linear-gradient(135deg, #06b6d4, #3b82f6)";
const THEME_GLOW = "rgba(6,182,212,0.2)";

const FORM_STEPS = [
  { n: 1, label: "Your details", hint: "Tell me who you are so I can get back to you." },
  { n: 2, label: "Your project", hint: "Share what you want to build — the more detail, the better." },
  { n: 3, label: "Budget & timeline", hint: "Pick a budget range and timeline that works for you." },
] as const;

// ─── Service Data ─────────────────────────────────────────────────────────────
const services = [
  {
    id: "flutter",
    emoji: "📱",
    Icon: Smartphone,
    title: "Flutter App Development",
    subtitle: "Cross-Platform Mobile Excellence",
    description: "Build beautiful, high-performance cross-platform mobile apps for Android and iOS with clean architecture.",
    features: ["Cross-Platform Apps", "Enterprise Mobile Apps", "MVP Development", "Responsive UI", "Firebase Integration", "Offline Support", "App Store & Play Store"],
    cta: "Get Flutter App",
    accent: "from-cyan-500 to-blue-500",
    glow: "rgba(6,182,212,0.2)",
    whatsappMsg: "Hi Abuzar, I visited your portfolio and I'm interested in Flutter App Development. Can we discuss my project?",
  },
  {
    id: "ai",
    emoji: "🤖",
    Icon: Brain,
    title: "AI-Powered Mobile Apps",
    subtitle: "Intelligent User Experiences",
    description: "Integrate AI into mobile apps — computer vision, face detection, virtual try-on, chatbots and more.",
    features: ["Computer Vision", "Face Detection", "Virtual Try-On", "AI Recommendations", "OpenAI Integration", "Gemini Integration", "Image Processing"],
    cta: "Build AI Solution",
    accent: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.2)",
    whatsappMsg: "Hi Abuzar, I'm interested in building an AI-powered mobile application. Let's connect!",
  },
  {
    id: "web",
    emoji: "🌐",
    Icon: Globe,
    title: "Website & Web Application",
    subtitle: "Enterprise Web Solutions",
    description: "Modern websites, SaaS platforms, dashboards and web apps with responsive, premium designs.",
    features: ["Business Websites", "Landing Pages", "Admin Dashboards", "SaaS Platforms", "CRM Systems", "Progressive Web Apps"],
    cta: "Build My Website",
    accent: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.2)",
    whatsappMsg: "Hi Abuzar, I'd like to discuss a website development project with you.",
  },
  {
    id: "ecommerce",
    emoji: "🛍️",
    Icon: ShoppingBag,
    title: "E-Commerce & Retail",
    subtitle: "AI-Powered Shopping Experiences",
    description: "Scalable retail platforms, virtual try-on, shopping apps and fashion recommendation engines.",
    features: ["Shopping Apps", "Virtual Try-On", "Product Catalog", "Payment Gateway", "SKU Integration", "Fashion AI Engine"],
    cta: "Start My Store",
    accent: "from-orange-500 to-rose-500",
    glow: "rgba(249,115,22,0.2)",
    whatsappMsg: "Hi Abuzar, I'm interested in building an e-commerce or retail solution. Can you help?",
  },
  {
    id: "api",
    emoji: "☁️",
    Icon: Cloud,
    title: "API & Backend Integration",
    subtitle: "Secure & Scalable Infrastructure",
    description: "REST APIs, Firebase, auth, real-time databases, push notifications and third-party SDK integrations.",
    features: ["REST API Integration", "Firebase", "Authentication", "Cloud Firestore", "Push Notifications", "Third-Party SDKs"],
    cta: "Integrate APIs",
    accent: "from-sky-500 to-indigo-500",
    glow: "rgba(14,165,233,0.2)",
    whatsappMsg: "Hi Abuzar, I need help with API and backend integration for my app. Let's talk!",
  },
  {
    id: "uiux",
    emoji: "🎨",
    Icon: Paintbrush,
    title: "UI/UX Design",
    subtitle: "Intuitive & Delightful Interfaces",
    description: "Mobile UI, dashboards, design systems and interactive prototypes that users love.",
    features: ["Mobile UI", "Dashboard Design", "Design Systems", "Responsive Interfaces", "Interactive Prototypes"],
    cta: "Design My Product",
    accent: "from-pink-500 to-rose-500",
    glow: "rgba(236,72,153,0.2)",
    whatsappMsg: "Hi Abuzar, I'm interested in UI/UX design services for my product. Can we connect?",
  },
];

// ─── Service Order Form Modal ─────────────────────────────────────────────────
const TIMELINES = ["ASAP", "1 – 2 weeks", "1 month", "2 – 3 months", "Flexible"];

type FormData = ServiceFormDraft;

const ServiceModal = ({
  service,
  onClose,
}: {
  service: typeof services[0];
  onClose: () => void;
}) => {
  const { session, updateServiceForm, updateLocation, budgetRanges, region } = useUserSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoCapturing, setGeoCapturing] = useState(false);
  const [form, setForm] = useState<FormData>(() => ({ ...session.serviceForm }));

  const update = (k: keyof FormData, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      updateServiceForm(next);
      return next;
    });
  };

  const isStep1Valid = form.name.trim() && form.email.includes("@");
  const isStep2Valid = form.description.trim().length >= 10;
  const isStep3Valid = isBudgetValid(form.budget, form.customBudget) && !!form.timeline;
  const resolvedBudget = formatBudgetValue(form.budget, form.customBudget, region.currencySymbol);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
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
      message:
        `Service: ${service.title}\n` +
        `From: ${form.name} (${form.email})\n` +
        `Company: ${form.company || "N/A"}\n` +
        `Budget: ${resolvedBudget} (${region.currencyCode})\n` +
        `Timeline: ${form.timeline}\n` +
        `Country: ${loc.country} (${loc.country_code})\n` +
        `Latitude: ${loc.latitude}\n` +
        `Longitude: ${loc.longitude}\n` +
        `Maps: ${loc.location_maps_url}\n\n` +
        `Project Description:\n${form.description}`,
      ...loc,
    };

    try {
      if (serviceId && templateId && publicKey) {
        await emailjs.send(serviceId, templateId, params, publicKey);
      }
      updateServiceForm({
        description: "",
        budget: "",
        customBudget: "",
        timeline: "",
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error("Service form EmailJS error:", err);
      toast.error("Could not send email. Please contact via WhatsApp directly.");
      setSubmitted(true); // Still show WhatsApp option
    } finally {
      setLoading(false);
    }
  };

  const whatsappMsg = encodeURIComponent(
    `Hi Abuzar! I just filled out a service request on your portfolio.\n\n` +
    `Service: ${service.title}\nName: ${form.name}\nEmail: ${form.email}\n` +
    `Budget: ${resolvedBudget}\nTimeline: ${form.timeline}\n\n` +
    `Project Details:\n${form.description}`
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="service-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="service-modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="service-modal-panel"
        style={{ boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 40px ${THEME_GLOW}` }}
      >
        <div className="service-modal-header">
          <div className="service-modal-header-row">
            <div className="service-modal-header-info">
              <div className="service-modal-icon">
                <service.Icon size={20} className="text-cyan-400" />
              </div>
              <div className="min-w-0">
                {!submitted && (
                  <p className="service-modal-eyebrow">
                    Step {step} of 3 · {FORM_STEPS[step - 1].label}
                  </p>
                )}
                <h3 id="service-modal-title" className="service-modal-title">{service.title}</h3>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close form" className="service-modal-close">
              <X size={18} />
            </button>
          </div>

          {!submitted && (
            <div className="service-modal-progress">
              <div
                className="service-modal-progress-fill"
                style={{ width: `${(step / 3) * 100}%`, background: THEME_GRADIENT }}
              />
            </div>
          )}
        </div>

        <div className="service-modal-body">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">

                <p className="service-modal-hint">{FORM_STEPS[step - 1].hint}</p>

                {step === 1 && (
                  <div className="service-modal-fields">
                      <div className="service-modal-field-group">
                        <label className="service-modal-label">Your Name *</label>
                        <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. John Doe" className="service-modal-field" />
                      </div>
                      <div className="service-modal-field-group">
                        <label className="service-modal-label">Email Address *</label>
                        <input value={form.email} onChange={e => update("email", e.target.value)} type="email" placeholder="john@company.com" className="service-modal-field" />
                      </div>
                      <div className="service-modal-field-group">
                        <label className="service-modal-label">Company <span className="service-modal-optional">(optional)</span></label>
                        <input value={form.company} onChange={e => update("company", e.target.value)} placeholder="Your company name" className="service-modal-field" />
                      </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="service-modal-field-group">
                      <label className="service-modal-label">Project Description *</label>
                      <textarea value={form.description} onChange={e => update("description", e.target.value)} rows={5} placeholder={`Describe what you want to build for "${service.title}"...\n\nWhat's the main goal? Who are your users? Any specific features?`} className="service-modal-field resize-none min-h-[120px]" />
                      <p className="service-modal-char-count">{form.description.length} chars</p>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                      <div>
                        <label className="service-modal-label">
                          Budget Range * <span className="service-modal-optional">({region.currencyCode})</span>
                        </label>
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
                          activeStyle={{ background: THEME_GRADIENT, boxShadow: `0 0 20px ${THEME_GLOW}` }}
                        />
                      </div>
                      <div>
                        <label className="service-modal-label">Timeline *</label>
                        <div className="flex flex-wrap gap-2">
                          {TIMELINES.map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => update("timeline", t)}
                              className={`service-modal-chip service-modal-chip--timeline ${form.timeline === t ? "service-modal-chip--active" : ""}`}
                              style={form.timeline === t ? { background: THEME_GRADIENT, boxShadow: `0 0 20px ${THEME_GLOW}` } : undefined}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                  </div>
                )}

                <div className="service-modal-footer">
                  {step > 1 && (
                    <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="service-modal-btn service-modal-btn--ghost">
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      onClick={handleContinue}
                      disabled={step === 1 ? !isStep1Valid || geoCapturing : !isStep2Valid || geoCapturing}
                      className="service-modal-btn service-modal-btn--primary flex-1"
                      style={(step === 1 ? isStep1Valid : isStep2Valid) && !geoCapturing ? { background: THEME_GRADIENT, boxShadow: `0 0 24px ${THEME_GLOW}` } : undefined}
                    >
                      {geoCapturing ? (
                        <div className="service-modal-spinner" />
                      ) : (
                        <>
                          Continue <ChevronRight size={13} />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!isStep3Valid || loading}
                      className="service-modal-btn service-modal-btn--primary flex-1"
                      style={isStep3Valid && !loading ? { background: THEME_GRADIENT, boxShadow: `0 0 24px ${THEME_GLOW}` } : undefined}
                    >
                      {loading ? <div className="service-modal-spinner" /> : <><Send size={13} /> Submit Request</>}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="service-modal-success">
                <div className="service-modal-icon service-modal-icon--lg">
                  <CheckCircle size={28} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="service-modal-success-title">Request Sent!</h4>
                  <p className="service-modal-success-text">
                    Thanks for reaching out. Let's continue on WhatsApp.
                  </p>
                </div>

                <a
                  href={`https://wa.me/${WHATSAPP}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-modal-btn service-modal-btn--primary w-full"
                  style={{ background: THEME_GRADIENT, boxShadow: `0 0 30px ${THEME_GLOW}` }}
                >
                  <MessageCircle size={16} />
                  Open WhatsApp
                  <ArrowRight size={14} />
                </a>

                <button onClick={onClose} className="service-modal-btn service-modal-btn--ghost w-full">
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Service Card ─────────────────────────────────────────────────────────────
const ServiceCard = ({ service, index, onSelect }: { service: typeof services[0]; index: number; onSelect: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full"
    >
      <div className="service-card" onClick={onSelect}>
        <div className="service-card-blob" aria-hidden="true" />

        <div className="service-card-inner">
          <div className="service-card-top">
            <div className="service-card-icon">
              <service.Icon size={22} />
            </div>
            <span className="service-card-num">{String(index + 1).padStart(2, "0")}</span>
          </div>

          <h3 className="service-card-title">{service.title}</h3>
          <p className="service-card-subtitle">{service.subtitle}</p>
          <p className="service-card-desc">{service.description}</p>

          <div className="service-card-tags">
            {service.features.slice(0, 5).map(f => (
              <span key={f} className="service-card-tag">{f}</span>
            ))}
            {service.features.length > 5 && (
              <span className="service-card-tag">+{service.features.length - 5}</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="service-card-cta"
          >
            <MessageCircle size={12} />
            {service.cta}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Services Section ────────────────────────────────────────────────────
export const Services = () => {
  const titleRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(titleRef, { once: true, amount: 0.3 });
  const [activeService, setActiveService] = useState<typeof services[0] | null>(null);

  return (
    <section id="services" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Modal — portaled to body so overlay covers full screen */}
      {createPortal(
        <AnimatePresence>
          {activeService && (
            <ServiceModal
              key={activeService.id}
              service={activeService}
              onClose={() => setActiveService(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Header */}
      <div ref={titleRef} className="services-header text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/30 border border-cyan-500/25 rounded-full mb-7">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.35em]">Production-Ready Solutions</span>
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 25 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-none mb-5">
          Professional
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white/80 to-cyan-500">Development Services</span>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="text-sm sm:text-base text-white/35 max-w-2xl mx-auto leading-relaxed px-4 services-header-desc">
          From AI-powered mobile applications to enterprise software — I help businesses transform ideas into scalable digital products.
          <br className="hidden sm:block" />
          <span className="text-white/50 font-semibold"> Click any service to get a quote.</span>
        </motion.p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {services.map((s, i) => (
          <ServiceCard key={s.id} service={s} index={i} onSelect={() => setActiveService(s)} />
        ))}
      </div>
    </section>
  );
};
