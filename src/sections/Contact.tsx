import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fadeIn, staggerContainer, sectionReveal } from "../lib/motion-variants";
import {
  Send,
  User,
  Mail,
  MessageSquare,
  Briefcase,
  Building2,
  CheckCircle2,
  Gamepad2,
  Phone,
  ChevronDown,
  Radio,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { FlappyGame } from "../components/FlappyGame";
import { useUserSession } from "../context/UserSessionContext";
import type { InquiryType } from "../lib/user-session";
import { buildLocationParams } from "../lib/emailjs-params";
import { requestUserGeolocation } from "../lib/geolocation";
import {
  DIAL_CODE_OPTIONS,
  formatVisitorPhone,
  getDialCodeForCountry,
  getPhonePlaceholder,
} from "../lib/dial-codes";
import emailjs from "@emailjs/browser";

const WHATSAPP = "918770206120";

const TERMINAL_LINES = [
  { cmd: "ping email", out: "abuzxarrr87@gmail.com → 200 OK" },
  { cmd: "status", out: "channel open · accepting inquiries" },
  { cmd: "encrypt", out: "TLS 1.3 · transmission ready" },
];

const INQUIRY_TYPES = ["general", "job"] as const;

const INQUIRY_LABELS: Record<(typeof INQUIRY_TYPES)[number], string> = {
  general: "general",
  job: "hiring",
};

function normalizeInquiryType(type: InquiryType): (typeof INQUIRY_TYPES)[number] {
  return type === "job" ? "job" : "general";
}

export const Contact = () => {
  const {
    session,
    region,
    updateContact,
    updateLocation,
    clearContactDraft,
  } = useUserSession();
  const draft = session.contact;
  const inquiryType = normalizeInquiryType(draft.inquiryType);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const rawData = {
      fullName: draft.fullName,
      email: draft.email,
      purpose: inquiryType === "general" ? "General inquiry" : "Job opportunity",
      message: draft.message,
      projectType: "N/A",
      budget: "N/A",
      companyName: draft.companyName || "N/A",
    };

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      const errorMsg =
        "EmailJS configuration is missing in environment variables. Please check your .env.local file.";
      console.error(errorMsg, { serviceId, templateId, publicKey });
      toast.error(errorMsg, {
        duration: 5000,
        className: "bg-[#0a0a0a] border border-white/10 text-white rounded-2xl",
      });
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

      const templateParams = {
        form_type: "contact",
        from_name: rawData.fullName,
        from_email: rawData.email,
        subject: `[Portfolio Connection] ${rawData.purpose} - ${rawData.fullName}`,
        purpose: rawData.purpose,
        dial_code: draft.dialCode,
        phone_number: draft.phoneNumber || "Not provided",
        visitor_phone: visitorPhone,
        message:
          `${rawData.message}\n\n` +
          `--- Contact ---\n` +
          `Phone: ${visitorPhone}\n\n` +
          `--- Location ---\n` +
          `Country: ${loc.country} (${loc.country_code})\n` +
          `Latitude: ${loc.latitude}\n` +
          `Longitude: ${loc.longitude}\n` +
          `Maps: ${loc.location_maps_url}`,
        project_type: rawData.projectType,
        budget: `${rawData.budget} (${region.currencyCode})`,
        company_name: rawData.companyName,
        service_requested: "N/A",
        project_description: rawData.message,
        timeline: "N/A",
        ...loc,
      };

      const result = await emailjs.send(serviceId, templateId, templateParams, publicKey);

      if (result.status === 200) {
        setSuccess(true);
        clearContactDraft();
        toast.success("Transmission successfully received!", {
          className: "bg-[#0a0a0a] border border-white/10 text-white rounded-2xl",
        });
      } else {
        throw new Error(`EmailJS responded with status: ${result.status}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to broadcast signal";
      console.error("EmailJS Transmission Error:", error);
      toast.error(`Transmission Error: ${message}`, {
        className: "bg-[#0a0a0a] border border-white/10 text-white rounded-2xl",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="contact-section">
      <AnimatePresence>
        {showGame && <FlappyGame onClose={() => setShowGame(false)} />}
      </AnimatePresence>

      <motion.div
        variants={sectionReveal}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="contact-section-header contact-section-header--split"
      >
        <div className="contact-header-copy">
          <p className="contact-eyebrow">
            <span className="contact-eyebrow-dot" />
            Transmissions
          </p>
          <h2 className="contact-title">
            Let's <span className="contact-title-accent">Connect</span>
          </h2>
        </div>
        <p className="contact-subtitle">
          Open a secure channel for high-performance builds, freelance missions, or
          full-time opportunities.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="contact-hub"
      >
        <div className="contact-hub-bar">
          <div className="contact-hub-bar-left">
            <span className="contact-form-dot contact-form-dot--red" />
            <span className="contact-form-dot contact-form-dot--yellow" />
            <span className="contact-form-dot contact-form-dot--green" />
            <span className="contact-form-bar-title">transmission_hub.tsx — live</span>
          </div>
          <div className="contact-status-row contact-status-row--inline">
            <span className="contact-status-chip contact-status-chip--live">
              <Radio size={10} /> online
            </span>
            <span className="contact-status-chip">&lt;24h</span>
            <span className="contact-status-chip">{region.currencyCode}</span>
          </div>
        </div>

        <div className="contact-hub-body">
          <motion.div variants={fadeIn} className="contact-hub-form">
            <div className="contact-form-body contact-form-body--flush">
              {!success ? (
                <form onSubmit={handleSubmit}>
                  <div className="contact-type-grid">
                    {INQUIRY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateContact({ inquiryType: type })}
                        className={`contact-type-btn ${inquiryType === type ? "contact-type-btn--active" : ""}`}
                      >
                        {INQUIRY_LABELS[type]}
                      </button>
                    ))}
                  </div>

                  <div className="contact-field-grid">
                    <div className="contact-field">
                      <label className="contact-field-label">
                        <User size={10} /> identity
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        className="contact-input"
                        value={draft.fullName}
                        onChange={(e) => updateContact({ fullName: e.target.value })}
                      />
                    </div>
                    <div className="contact-field">
                      <label className="contact-field-label">
                        <Mail size={10} /> signal_address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="john@example.com"
                        className="contact-input"
                        value={draft.email}
                        onChange={(e) => updateContact({ email: e.target.value })}
                      />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {inquiryType === "job" && (
                      <motion.div
                        key="job-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="contact-field"
                        style={{ marginBottom: "1rem" }}
                      >
                        <label className="contact-field-label">
                          <Building2 size={10} /> organization
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Company Name"
                          className="contact-input"
                          value={draft.companyName}
                          onChange={(e) => updateContact({ companyName: e.target.value })}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="contact-field" style={{ marginBottom: "1rem" }}>
                    <label className="contact-field-label">
                      <MessageSquare size={10} /> payload
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="// describe your project, timeline, or opportunity..."
                      className="contact-textarea"
                      value={draft.message}
                      onChange={(e) => updateContact({ message: e.target.value })}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="contact-submit">
                    {loading ? (
                      <span className="contact-submit-spinner" />
                    ) : (
                      <>
                        initialize_connection
                        <Send size={14} />
                      </>
                    )}
                  </button>

                  <div className="contact-footer-note">
                    <span className="contact-footer-dot" />
                    <span>session cached locally · {region.currencyCode} pricing</span>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="contact-success"
                >
                  <div className="contact-success-icon">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="contact-success-title">Transmission Sent</h4>
                  <p className="contact-success-text">
                    Your signal has been broadcast. I'll respond on your frequency shortly.
                  </p>
                  <div className="contact-success-actions">
                    <button
                      type="button"
                      onClick={() => setShowGame(true)}
                      className="contact-btn-primary"
                    >
                      <Gamepad2 size={16} /> play mini-game
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuccess(false)}
                      className="contact-btn-ghost"
                    >
                      broadcast again
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="contact-hub-aside">
            <div className="contact-terminal contact-terminal--compact">
              {TERMINAL_LINES.map((line, i) => (
                <motion.div
                  key={line.cmd}
                  className="contact-terminal-line"
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.12 }}
                >
                  <span className="contact-terminal-prompt">$</span>
                  {line.cmd}
                  <span className="contact-terminal-out"> → {line.out}</span>
                </motion.div>
              ))}
              <div className="contact-terminal-line">
                <span className="contact-terminal-prompt">$</span>
                locale: {region.countryName} ({region.currencyCode})
              </div>
              <div className="contact-terminal-line">
                <span className="contact-terminal-prompt">$</span>
                dial: {draft.dialCode}
              </div>
              <div className="contact-terminal-line">
                <span className="contact-terminal-prompt">$</span>
                awaiting input
                <span className="contact-terminal-cursor" />
              </div>
            </div>

            <div className="contact-channels contact-channels--stack">
              <a href="mailto:abuzxarrr87@gmail.com" className="contact-channel">
                <div className="contact-channel-icon">
                  <Mail size={18} />
                </div>
                <div className="min-w-0">
                  <p className="contact-channel-label">email://</p>
                  <p className="contact-channel-value">abuzxarrr87@gmail.com</p>
                </div>
                <span className="contact-channel-arrow">↗</span>
              </a>

              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-channel"
              >
                <div className="contact-channel-icon">
                  <Briefcase size={18} />
                </div>
                <div className="min-w-0">
                  <p className="contact-channel-label">whatsapp://</p>
                  <p className="contact-channel-value">+91 8770206120</p>
                </div>
                <span className="contact-channel-arrow">↗</span>
              </a>

              <button
                type="button"
                onClick={() => updateContact({ preferCall: !draft.preferCall })}
                className={`contact-call-toggle ${draft.preferCall ? "contact-call-toggle--open" : ""}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="contact-channel-icon">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="contact-channel-label">voice://callback</p>
                    <p className="contact-channel-value text-sm">Prefer a call — share your number</p>
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  className="text-white/30 shrink-0"
                  style={{
                    transform: draft.preferCall ? "rotate(180deg)" : "none",
                    transition: "transform 0.3s",
                  }}
                />
              </button>

              <AnimatePresence>
                {draft.preferCall && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="contact-call-panel">
                      <p className="contact-call-label">// your_phone_number</p>
                      <p className="contact-call-region-hint">
                        Region: {region.countryName} ({region.countryCode}) · default{" "}
                        {getDialCodeForCountry(region.countryCode)}
                      </p>
                      <div className="contact-phone-row">
                        <select
                          value={draft.dialCode}
                          onChange={(e) =>
                            updateContact({
                              dialCode: e.target.value,
                              dialCodeManual: true,
                            })
                          }
                          className="contact-select"
                        >
                          {DIAL_CODE_OPTIONS.map((opt) => (
                            <option key={opt.countryCode} value={opt.dialCode}>
                              {opt.flag} {opt.dialCode}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          value={draft.phoneNumber}
                          onChange={(e) =>
                            updateContact({ phoneNumber: e.target.value.replace(/\D/g, "") })
                          }
                          placeholder={getPhonePlaceholder(draft.dialCode)}
                          maxLength={12}
                          className="contact-input"
                        />
                      </div>
                      {draft.phoneNumber.length >= 7 && (
                        <motion.a
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi Abuzar, my phone number is ${draft.dialCode} ${draft.phoneNumber}. Please call me when available.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contact-wa-btn"
                        >
                          <Phone size={12} /> transmit via whatsapp
                        </motion.a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="contact-hub-stats">
          <div className="contact-info-stat">
            <span className="contact-info-stat-label">response</span>
            <span className="contact-info-stat-value">&lt; 24 hours</span>
          </div>
          <div className="contact-info-stat">
            <span className="contact-info-stat-label">encryption</span>
            <span className="contact-info-stat-value">TLS 1.3</span>
          </div>
          <div className="contact-info-stat">
            <span className="contact-info-stat-label">region</span>
            <span className="contact-info-stat-value">{region.countryName}</span>
          </div>
          <div className="contact-info-stat">
            <span className="contact-info-stat-label">currency</span>
            <span className="contact-info-stat-value">{region.currencyCode}</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
