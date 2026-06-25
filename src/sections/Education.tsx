import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Calendar, MapPin } from "lucide-react";

const education = [
  {
    id: "bca",
    degree: "Bachelor of Computer Applications (B.C.A)",
    school: "Manipal University Jaipur",
    location: "Jaipur, India",
    years: "2025 — PRESENT",
    status: "Higher Education",
    color: "from-cyan-500/10 to-transparent",
  },
  {
    id: "hs",
    degree: "High Secondary (Commerce)",
    school: "Campion School Co-Ed",
    location: "Bhopal, MP",
    years: "03/2010 — 06/2023",
    status: "Schooling",
    color: "from-emerald-500/10 to-transparent",
  },
];

export const Education = () => {
  return (
    <section id="education" className="education-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="education-header"
      >
        <div className="education-badge">
          <GraduationCap size={14} className="text-cyan-400" />
          <span>Academic History</span>
        </div>
        <h3 className="education-title">Education</h3>
      </motion.div>

      <div className="education-grid">
        {education.map((edu, idx) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            viewport={{ once: true }}
            className="education-card group"
          >
            <div className={`education-card-bg bg-gradient-to-br ${edu.color}`} />

            <div className="education-card-inner">
              <div className="education-card-meta">
                <span className="education-card-status">{edu.status}</span>
                <div className="education-card-years">
                  <Calendar size={12} />
                  {edu.years}
                </div>
              </div>

              <h4 className="education-card-degree">{edu.degree}</h4>

              <div className="education-card-school-wrap">
                <div className="education-card-school">
                  <div className="education-card-bar" />
                  <span>{edu.school}</span>
                </div>
                <div className="education-card-location">
                  <MapPin size={10} />
                  {edu.location}
                </div>
              </div>
            </div>

            <div className="education-card-deco">
              <GraduationCap size={120} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
