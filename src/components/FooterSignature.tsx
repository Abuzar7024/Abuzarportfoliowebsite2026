import React from "react";
import { motion } from "motion/react";
import { Heart, Code2, Zap, ArrowUpCircle, Sparkles } from "lucide-react";
import userImg from "figma:asset/3ef0dcfbbef7385c7aef0b4ba88c824b200ef5f6.png";

const TECH_BADGES = [
  { icon: Code2, label: "React", className: "signature-badge--react" },
  { icon: Zap, label: "Tailwind", className: "signature-badge--tailwind" },
  { icon: Heart, label: "Love", className: "signature-badge--love" },
] as const;

export const FooterSignature = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="signature-section">
      <div className="signature-section-glow" aria-hidden="true" />
      <div className="signature-section-line" aria-hidden="true" />

      <div className="signature-wrap">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="signature-card-outer"
        >
          <div className="signature-card-border" aria-hidden="true" />

          <div className="signature-card">
            <span className="signature-corner signature-corner--tl" aria-hidden="true" />
            <span className="signature-corner signature-corner--tr" aria-hidden="true" />
            <span className="signature-corner signature-corner--bl" aria-hidden="true" />
            <span className="signature-corner signature-corner--br" aria-hidden="true" />
            <div className="signature-card-grid" aria-hidden="true" />

            <div className="signature-card-inner">
              <div className="signature-photo-block">
                <div className="signature-photo-ring" aria-hidden="true" />
                <div className="signature-photo-frame">
                  <img src={userImg} alt="Abuzar Khan" className="signature-photo" />
                  <div className="signature-photo-overlay" aria-hidden="true" />
                  <div className="signature-photo-scan" aria-hidden="true" />
                </div>
                <div className="signature-id-badge">
                  <span className="signature-id-dot" aria-hidden="true" />
                  Identity_Verified
                </div>
              </div>

              <div className="signature-copy">
                <p className="signature-eyebrow">
                  <Sparkles size={11} />
                  Mission Complete
                </p>
                <h2 className="signature-headline">
                  Designed
                  <br />
                  &amp; Built by
                  <br />
                  <span className="signature-name">Abuzar</span>
                </h2>
                <p className="signature-tagline">
                  Building digital experiences that hit different — fast, polished, and
                  built to scale. Open for collabs that actually move the needle.
                </p>

                <div className="signature-badges">
                  {TECH_BADGES.map(({ icon: Icon, label, className }) => (
                    <span key={label} className={`signature-badge ${className}`}>
                      <Icon size={12} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="signature-footer"
        >
          <button type="button" onClick={scrollToTop} className="signature-reboot">
            <ArrowUpCircle size={40} />
            <span>System Reboot</span>
          </button>

          <div className="signature-copyright">
            <span>© 2026 Abuzar Khan</span>
            <span className="signature-copyright-dot" aria-hidden="true" />
            <span>Encrypted_Terminal</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
