import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fadeIn } from "../lib/motion-variants";
import {
  Cpu, Terminal, CheckCircle2, Calendar, MapPin,
  ExternalLink, Briefcase, ChevronDown, ChevronRight
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
    location: "On-site",
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
    location: "Hybrid",
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

// ─── Mobile Accordion Layout ─────────────────────────────────────────────────
const MobileAccordion = () => {
  const [openId, setOpenId] = useState<string>("ebani"); // first open by default

  const toggle = (id: string) => setOpenId(prev => prev === id ? "" : id);

  return (
    <div className="flex flex-col gap-3">
      {experiences.map((exp, idx) => {
        const isOpen = openId === exp.id;
        return (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isOpen ? "border-cyan-500/40 bg-cyan-500/[0.04]" : "border-white/10 bg-white/[0.02]"}`}
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggle(exp.id)}
              className="w-full flex items-center gap-4 p-5 text-left touch-manipulation"
              aria-expanded={isOpen}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isOpen ? "bg-cyan-400 text-black" : "bg-white/10 text-cyan-400"}`}>
                {React.createElement(exp.icon, { size: 22 })}
              </div>

              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-0.5">{exp.role}</p>
                <h3 className="text-base font-black text-white uppercase tracking-tight truncate">{exp.company}</h3>
                <p className="text-[10px] text-white/35 font-bold mt-0.5">{exp.period}</p>
              </div>

              {/* Chevron */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 text-white/30"
              >
                <ChevronDown size={18} />
              </motion.div>
            </button>

            {/* Accordion Body */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-5">
                    {/* Location & Period */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <MapPin size={12} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-white/60">{exp.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <Calendar size={12} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-white/60">{exp.period}</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-white/60 leading-relaxed italic border-l-2 border-cyan-500/30 pl-4">
                      "{exp.summary}"
                    </p>

                    {/* Responsibilities */}
                    <div>
                      <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.25em] mb-3 flex items-center gap-1.5">
                        <Terminal size={10} /> Responsibilities
                      </p>
                      <div className="space-y-2">
                        {exp.learnt.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-start gap-3"
                          >
                            <ChevronRight size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-white/60 leading-relaxed font-medium">{item}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Tech stack */}
                    <div>
                      <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.25em] mb-2">Tech Stack</p>
                      <div className="flex flex-wrap gap-1.5">
                        {exp.tech.map((t) => (
                          <span key={t} className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-widest">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 border-b-2 border-white/10 pb-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <Briefcase size={22} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter">
            Work <span className="text-cyan-400">Experience</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <span className="text-xs font-mono text-white/70 uppercase tracking-widest font-black">Active</span>
        </div>
      </motion.div>

      {/* Mobile: Accordion | Desktop: Tab layout */}
      <div className="block lg:hidden">
        <MobileAccordion />
      </div>
      <div className="hidden lg:block">
        <DesktopExperience />
      </div>
    </section>
  );
};
