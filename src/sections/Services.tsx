import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Smartphone, Brain, Globe, ShoppingBag, Cloud, Paintbrush, Rocket,
  ArrowRight, MessageCircle, Mail, CheckCircle, X,
  ChevronRight, Send
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner@2.0.3";

// ─── Config ──────────────────────────────────────────────────────────────────
const WHATSAPP = "918770206120";

const SERVICE_GRADIENT: Record<string, string> = {
  flutter: "linear-gradient(135deg, #06b6d4, #3b82f6)",
  ai: "linear-gradient(135deg, #8b5cf6, #9333ea)",
  web: "linear-gradient(135deg, #10b981, #14b8a6)",
  ecommerce: "linear-gradient(135deg, #f97316, #f43f5e)",
  api: "linear-gradient(135deg, #0ea5e9, #6366f1)",
  uiux: "linear-gradient(135deg, #ec4899, #f43f5e)",
  maintenance: "linear-gradient(135deg, #f59e0b, #eab308)",
};

const SERVICE_ACCENT: Record<string, string> = {
  flutter: "#22d3ee",
  ai: "#a78bfa",
  web: "#34d399",
  ecommerce: "#fb923c",
  api: "#38bdf8",
  uiux: "#f472b6",
  maintenance: "#fbbf24",
};

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
  {
    id: "maintenance",
    emoji: "🚀",
    Icon: Rocket,
    title: "App Maintenance & Optimization",
    subtitle: "Long-Term Performance Support",
    description: "Bug fixes, performance optimization, refactoring, feature development and store updates.",
    features: ["Bug Fixes", "Performance Optimization", "Code Refactoring", "Feature Development", "Store Updates"],
    cta: "Optimize My App",
    accent: "from-amber-500 to-yellow-500",
    glow: "rgba(245,158,11,0.2)",
    whatsappMsg: "Hi Abuzar, I need help optimizing and maintaining my existing app. Let's discuss!",
  },
];

// ─── Service Order Form Modal ─────────────────────────────────────────────────
const BUDGETS = ["< $500", "$500 – $1,000", "$1,000 – $3,000", "$3,000 – $5,000", "$5,000 – $10,000", "$10,000+"];
const TIMELINES = ["ASAP", "1 – 2 weeks", "1 month", "2 – 3 months", "Flexible"];

interface FormData {
  name: string;
  email: string;
  company: string;
  description: string;
  budget: string;
  timeline: string;
}

const ServiceModal = ({
  service,
  onClose,
}: {
  service: typeof services[0];
  onClose: () => void;
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", email: "", company: "", description: "", budget: "", timeline: ""
  });

  const update = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const isStep1Valid = form.name.trim() && form.email.includes("@");
  const isStep2Valid = form.description.trim().length >= 10;
  const isStep3Valid = form.budget && form.timeline;

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

  const handleSubmit = async () => {
    setLoading(true);
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const params = {
      from_name: form.name,
      from_email: form.email,
      company_name: form.company || "N/A",
      service_requested: service.title,
      project_description: form.description,
      budget: form.budget,
      timeline: form.timeline,
      subject: `[Service Request] ${service.title} — ${form.name}`,
      message: `Service: ${service.title}\nFrom: ${form.name} (${form.email})\nCompany: ${form.company || "N/A"}\nBudget: ${form.budget}\nTimeline: ${form.timeline}\n\nProject Description:\n${form.description}`,
    };

    try {
      if (serviceId && templateId && publicKey) {
        await emailjs.send(serviceId, templateId, params, publicKey);
      }
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
    `Budget: ${form.budget}\nTimeline: ${form.timeline}\n\n` +
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
        style={{ boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 40px ${service.glow}` }}
      >
        <div className="service-modal-header">
          <div className="service-modal-header-row">
            <div className="service-modal-header-info">
              <div className="service-modal-icon" style={{ background: SERVICE_GRADIENT[service.id] }}>
                <service.Icon size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                {!submitted && (
                  <p className="service-modal-eyebrow" style={{ color: SERVICE_ACCENT[service.id] }}>
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
                style={{ width: `${(step / 3) * 100}%`, background: SERVICE_GRADIENT[service.id] }}
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
                        <label className="service-modal-label">Budget Range *</label>
                        <div className="grid grid-cols-2 gap-2">
                          {BUDGETS.map(b => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => update("budget", b)}
                              className={`service-modal-chip service-modal-chip--budget ${form.budget === b ? "service-modal-chip--active" : ""}`}
                              style={form.budget === b ? { background: SERVICE_GRADIENT[service.id], boxShadow: `0 0 20px ${service.glow}` } : undefined}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
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
                              style={form.timeline === t ? { background: SERVICE_GRADIENT[service.id], boxShadow: `0 0 20px ${service.glow}` } : undefined}
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
                      onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                      disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                      className="service-modal-btn service-modal-btn--primary flex-1"
                      style={(step === 1 ? isStep1Valid : isStep2Valid) ? { background: SERVICE_GRADIENT[service.id], boxShadow: `0 0 24px ${service.glow}` } : undefined}
                    >
                      Continue <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!isStep3Valid || loading}
                      className="service-modal-btn service-modal-btn--primary flex-1"
                      style={isStep3Valid && !loading ? { background: SERVICE_GRADIENT[service.id], boxShadow: `0 0 24px ${service.glow}` } : undefined}
                    >
                      {loading ? <div className="service-modal-spinner" /> : <><Send size={13} /> Submit Request</>}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="service-modal-success">
                <div className="service-modal-icon service-modal-icon--lg" style={{ background: SERVICE_GRADIENT[service.id] }}>
                  <CheckCircle size={28} className="text-white" />
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
                  style={{ background: SERVICE_GRADIENT[service.id], boxShadow: `0 0 30px ${service.glow}` }}
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
  const accent = SERVICE_ACCENT[service.id];
  const gradient = SERVICE_GRADIENT[service.id];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full"
    >
      <div className="service-card" onClick={onSelect}>
        <div className="service-card-accent" style={{ background: gradient }} />
        <div
          className="service-card-glow"
          style={{ background: `radial-gradient(ellipse at 30% 0%, ${service.glow} 0%, transparent 70%)` }}
        />

        <div className="service-card-inner">
          <div className="service-card-top">
            <div className="service-card-icon" style={{ background: gradient, boxShadow: `0 0 24px ${service.glow}` }}>
              <service.Icon size={22} className="text-white" />
            </div>
            <span className="service-card-num">{String(index + 1).padStart(2, "0")}</span>
          </div>

          <h3 className="service-card-title">{service.title}</h3>
          <p className="service-card-subtitle" style={{ color: accent }}>{service.subtitle}</p>
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
            style={{ background: gradient, boxShadow: `0 8px 24px ${service.glow}` }}
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

// ─── CTA Banner ───────────────────────────────────────────────────────────────
const CTABanner = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const openWA = () => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi Abuzar, I'd like to discuss my project. Can we connect?")}`, "_blank");
  const openEmail = () => { window.location.href = "mailto:abuzxarrr87@gmail.com?subject=Project Inquiry"; };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative mt-16 rounded-[2.5rem] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/50 via-black/80 to-violet-950/30 backdrop-blur-2xl" />
      <div className="absolute inset-0 border border-white/10 rounded-[2.5rem]" />
      <div className="absolute inset-0 rounded-[2.5rem]" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.1) 0%, transparent 70%)" }} />

      <motion.div animate={{ y: [-12, 12, -12] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-8 -left-8 w-32 h-32 bg-cyan-500/8 blur-3xl rounded-full pointer-events-none" />
      <motion.div animate={{ y: [12, -12, 12] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-8 -right-8 w-48 h-48 bg-violet-500/8 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 px-8 sm:px-14 py-12 sm:py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-950/40 border border-cyan-500/25 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em]">Available for Projects</span>
        </motion.div>

        <motion.h3 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }} className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-5">
          Ready to Build
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-violet-400">Something Amazing?</span>
        </motion.h3>

        <motion.p initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }} className="text-sm sm:text-base text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
          I help startups and businesses turn ideas into high-quality digital products with Flutter, AI, and modern technologies.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={openWA} className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-[0.35em] rounded-full hover:from-cyan-400 hover:to-blue-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] active:scale-95 group">
            <MessageCircle size={13} className="group-hover:scale-110 transition-transform" /> Discuss Your Project
          </button>
          <button onClick={openEmail} className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-white/5 border border-white/15 text-white text-[10px] font-black uppercase tracking-[0.35em] rounded-full hover:bg-white/10 hover:border-white/25 transition-all backdrop-blur active:scale-95">
            <Mail size={13} /> Email Me
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.7 }} className="mt-10 flex flex-wrap items-center justify-center gap-5 sm:gap-8">
          {["Quick Response", "Free Consultation", "Production-Ready Code", "On-Time Delivery"].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-white/25">
              <CheckCircle size={11} className="text-cyan-500/50" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item}</span>
            </div>
          ))}
        </motion.div>
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

      {/* CTA */}
      <CTABanner />
    </section>
  );
};
