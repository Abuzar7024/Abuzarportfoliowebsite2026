import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fadeIn } from "../lib/motion-variants";
import {
  Cpu, Terminal,   CheckCircle2, Calendar, MapPin,
  ExternalLink, Briefcase, ChevronDown
} from "lucide-react";

const experiences = [
  {
    id: "ebani",
    company: "Ebani Tech",
    role: "Flutter Developer",
    icon: Cpu,
    period: "06/2026 — PRESENT",
    location: "Hyderabad, India",
    tech: ["Flutter", "Dart", "REST APIs", "Computer Vision", "Firebase", "Android", "iOS"],
    summary: "Developing enterprise mobile architectures, building responsive UIs for kiosk/mobile devices, and collaborating with AI/ML teams to integrate real-time camera processing and Computer Vision models.",
    learnt: [
      "Develop enterprise Flutter applications for Android and iOS.",
      "Build scalable mobile architectures.",
      "Integrate REST APIs and backend services.",
      "Work with AI/ML teams to integrate Computer Vision models.",
      "Implement real-time camera processing.",
      "Optimize application performance.",
      "Build responsive UI for kiosk and mobile devices.",
      "Maintain production applications.",
      "Collaborate with backend and design teams.",
    ],
  },
  {
    id: "ohara",
    company: "Ohara IT Solutions",
    role: "Flutter Developer",
    icon: Briefcase,
    period: "11/2025 — 05/2026",
    location: "Mumbai, India",
    tech: ["Flutter", "GetX", "Riverpod", "Dart"],
    summary: "Managed complete app lifecycle from development to store deployment with a focus on clean architecture and high-performance cross-platform delivery.",
    learnt: [
      "Developed new features using MVC, MVVM and GetX.",
      "Integrated REST APIs and secure local storage.",
      "Implemented dynamic multi-step forms.",
      "Optimized layouts for peak performance.",
      "Collaborated with QA and Project Managers.",
    ],
  },
  {
    id: "quasar",
    company: "Quasar Digital Solutions",
    role: "Junior Developer",
    icon: Terminal,
    period: "06/2024 — 05/2025",
    location: "Bhopal, India",
    tech: ["React", "Firebase", "Tailwind"],
    summary: "Built responsive web and mobile applications in Agile teams, focusing on seamless user experiences, rapid prototyping, and scalable frontend code.",
    learnt: [
      "Implemented Firebase Auth and Firestore.",
      "Designed accessible interfaces from Figma.",
      "Improved performance via refactoring.",
      "Executed end-to-end testing protocols.",
    ],
  },
];

// ─── Desktop Tab Layout (unchanged) ─────────────────────────────────────────
const DesktopExperience = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      {/* Segmented Control */}
      <div className="flex p-2 bg-white/5 border border-white/10 rounded-full overflow-hidden">
        {experiences.map((exp, i) => (
          <button
            key={exp.id}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-4 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 relative ${
              activeTab === i ? "text-black" : "text-white/50 hover:text-white/90"
            }`}
          >
            {activeTab === i && (
              <motion.div
                layoutId="tabHighlight"
                className="absolute inset-0 bg-white rounded-full"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{exp.company}</span>
          </button>
        ))}
      </div>

      {/* Card Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8"
        >
          {/* Left: Details */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
            <div className="flex items-start gap-5 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] shrink-0">
                {React.createElement(experiences[activeTab].icon, { size: 28 })}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight mb-1">
                  {experiences[activeTab].role}
                </h3>
                <p className="text-sm text-cyan-400 font-black uppercase tracking-[0.2em]">
                  {experiences[activeTab].company}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-white/70 font-bold bg-white/5 p-4 rounded-2xl border border-white/5">
                <Calendar size={18} className="text-cyan-400 shrink-0" />
                <span>{experiences[activeTab].period}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70 font-bold bg-white/5 p-4 rounded-2xl border border-white/5">
                <MapPin size={18} className="text-cyan-400 shrink-0" />
                <span>{experiences[activeTab].location}</span>
              </div>
            </div>

            <p className="text-base text-white/90 leading-relaxed font-semibold italic mb-8">
              "{experiences[activeTab].summary}"
            </p>

            <div className="flex flex-wrap gap-2">
              {experiences[activeTab].tech.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Logs */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <Terminal size={16} className="text-cyan-400" />
              </div>
              <span className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">Execution_Report</span>
            </div>

            <div className="flex-1 space-y-4">
              {experiences[activeTab].learnt.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all hover:bg-white/[0.04] group"
                >
                  <div className="mt-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
                  <p className="text-sm text-white/70 group-hover:text-white transition-colors leading-relaxed font-bold">
                    {log}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3].map((j) => <div key={j} className="w-1 h-1 rounded-full bg-cyan-400/20" />)}
              </div>
              <button className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white/30 hover:text-cyan-400 transition-all group/btn">
                System Logs <ExternalLink size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── Mobile Timeline Layout ───────────────────────────────────────────────────
const MobileExperience = () => {
  const [openId, setOpenId] = useState<string>("ebani");

  return (
    <div className="exp-mobile">
      {experiences.map((exp, idx) => {
        const isOpen = openId === exp.id;
        const isLast = idx === experiences.length - 1;

        return (
          <div key={exp.id} className={`exp-mobile-item ${isLast ? "exp-mobile-item--last" : ""}`}>
            <span className="exp-mobile-dot" aria-hidden="true" />

            <div className={`exp-mobile-card ${isOpen ? "exp-mobile-card--open" : ""}`}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : exp.id)}
                className="exp-mobile-trigger"
                aria-expanded={isOpen}
              >
                <div className="exp-mobile-icon">
                  {React.createElement(exp.icon, { size: 18 })}
                </div>
                <div className="exp-mobile-meta">
                  <p className="exp-mobile-role">{exp.role}</p>
                  <h3 className="exp-mobile-company">{exp.company}</h3>
                  <p className="exp-mobile-period">{exp.period} · {exp.location}</p>
                </div>
                <ChevronDown size={16} className={`exp-mobile-chevron ${isOpen ? "exp-mobile-chevron--open" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="exp-mobile-body-wrap"
                  >
                    <div className="exp-mobile-body">
                      <p className="exp-mobile-summary">{exp.summary}</p>

                      <ul className="exp-mobile-list">
                        {exp.learnt.slice(0, 5).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>

                      <div className="exp-mobile-tags">
                        {exp.tech.map((t) => (
                          <span key={t} className="exp-mobile-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Section ─────────────────────────────────────────────────────────────────
export const Experience = () => {
  return (
    <section id="experience" className="py-20 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="experience-header"
      >
        <div className="experience-header-title">
          <div className="experience-header-icon">
            <Briefcase size={20} className="text-cyan-400" />
          </div>
          <h2 className="experience-heading">
            Work <span className="text-cyan-400">Experience</span>
          </h2>
        </div>
        <div className="experience-header-badge">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <span>Active</span>
        </div>
      </motion.div>

      {/* Mobile: Timeline | Desktop: Tab layout */}
      <div className="block lg:hidden">
        <MobileExperience />
      </div>
      <div className="hidden lg:block">
        <DesktopExperience />
      </div>
    </section>
  );
};
