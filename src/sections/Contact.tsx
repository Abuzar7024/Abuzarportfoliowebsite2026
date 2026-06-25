import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sectionReveal } from "../lib/motion-variants";
import {
  Send,
  Mail,
  MessageSquare,
  Building2,
  CheckCircle2,
  Gamepad2,
  Phone,
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
  getPhonePlaceholder,
} from "../lib/dial-codes";
import emailjs from "@emailjs/browser";

const WHATSAPP = "918770206120";

const INQUIRY_TYPES = ["general", "job"] as const;

const INQUIRY_LABELS: Record<(typeof INQUIRY_TYPES)[number], string> = {
  general: "General",
  job: "Hiring",
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
      toast.error("Email service is not configured. Please try again later.", {
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
        toast.success("Message sent successfully!", {
          className: "bg-[#0a0a0a] border border-white/10 text-white rounded-2xl",
        });
      } else {
        throw new Error(`EmailJS responded with status: ${result.status}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send message";
      console.error("EmailJS error:", error);
      toast.error(message, {
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
        className="contact-section-header"
      >
        <p className="contact-eyebrow">Contact</p>
        <h2 className="contact-title">Let's Connect</h2>
        <p className="contact-subtitle">
          Have a project or opportunity in mind? Send a message and I'll get back to you within 24 hours.
        </p>
      </motion.div>

      <div className="contact-layout">
        <aside className="contact-aside">
          <h3 className="contact-aside-title">Reach me directly</h3>
          <a href="mailto:abuzxarrr87@gmail.com" className="contact-link">
            <Mail size={16} />
            <span>abuzxarrr87@gmail.com</span>
          </a>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            <Phone size={16} />
            <span>+91 8770206120</span>
          </a>
          <p className="contact-aside-note">Usually replies within 24 hours.</p>
        </aside>

        <div className="contact-form-card">
          {!success ? (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-type-row">
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
                  <label className="contact-label" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    required
                    type="text"
                    placeholder="Your name"
                    className="contact-input"
                    value={draft.fullName}
                    onChange={(e) => updateContact({ fullName: e.target.value })}
                  />
                </div>
                <div className="contact-field">
                  <label className="contact-label" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    required
                    type="email"
                    placeholder="you@example.com"
                    className="contact-input"
                    value={draft.email}
                    onChange={(e) => updateContact({ email: e.target.value })}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {inquiryType === "job" && (
                  <motion.div
                    key="company"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="contact-field"
                  >
                    <label className="contact-label" htmlFor="contact-company">
                      Company
                    </label>
                    <input
                      id="contact-company"
                      required
                      type="text"
                      placeholder="Company name"
                      className="contact-input"
                      value={draft.companyName}
                      onChange={(e) => updateContact({ companyName: e.target.value })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="contact-field">
                <label className="contact-label">Phone <span className="contact-optional">(optional)</span></label>
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
                    aria-label="Country dial code"
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
                    aria-label="Phone number"
                  />
                </div>
              </div>

              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="Tell me about your project or role..."
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
                    Send message
                    <Send size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="contact-success"
            >
              <CheckCircle2 size={36} className="contact-success-icon" />
              <h4 className="contact-success-title">Message sent</h4>
              <p className="contact-success-text">
                Thanks for reaching out. I'll get back to you soon.
              </p>
              <div className="contact-success-actions">
                <button
                  type="button"
                  onClick={() => setShowGame(true)}
                  className="contact-btn-primary"
                >
                  <Gamepad2 size={15} /> Play mini-game
                </button>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="contact-btn-ghost"
                >
                  Send another message
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
