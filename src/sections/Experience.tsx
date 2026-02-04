import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fadeIn } from "../lib/motion-variants";
import { Cpu, Terminal, CheckCircle2, Calendar, MapPin, ExternalLink, Briefcase } from "lucide-react";

const experiences = [
  {
    id: "ohara",
    company: "Ohara IT Solutions",
    role: "Flutter Developer",
    icon: Cpu,
    period: "11/2025 - PRESENT",
    location: "On-site",
    tech: ["Flutter", "GetX", "Riverpod", "Dart"],
    summary: "Managing complete app lifecycle from development to store deployment with a focus on clean architecture and high-performance cross-platform delivery.",
    learnt: [
      "Developed new features using MVC, MVVM and GetX.",
      "Integrated REST APIs and secure local storage.",
      "Implemented dynamic multi-step forms.",
      "Optimized layouts for peak performance.",
      "Collaborated with QA and Project Managers."
    ]
  },
  {
    id: "quasar",
    company: "Quasar digital solutions",
    role: "Junior Developer",
    icon: Terminal,
    period: "06/2024 - 05/2025",
    location: "Hybrid",
    tech: ["React", "Firebase", "Tailwind"],
    summary: "Built responsive web and mobile applications in Agile teams, focusing on seamless user experiences, rapid prototyping, and scalable frontend code.",
    learnt: [
      "Implemented Firebase Auth and Firestore.",
      "Designed accessible interfaces from Figma.",
      "Improved performance via refactoring.",
      "Executed end-to-end testing protocols."
    ]
  }
];

export const Experience = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="experience" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto bg-black">
      {/* HEADER - BOLD & CONTRASTY */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 border-b-2 border-white/10 pb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                <Briefcase size={24} className="text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tighter">
                Work <span className="text-cyan-400">Experience</span>
            </h2>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
            <span className="text-xs font-mono text-white/80 uppercase tracking-widest font-black">Active_Session</span>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* ENHANCED SEGMENTED CONTROL */}
        <div className="flex p-2 bg-white/5 border border-white/10 rounded-2xl sm:rounded-full overflow-hidden">
          {experiences.map((exp, i) => (
            <button
              key={exp.id}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-4 px-6 rounded-xl sm:rounded-full text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 relative ${
                activeTab === i ? "text-black" : "text-white/50 hover:text-white/90"
              }`}
            >
              {activeTab === i && (
                <motion.div 
                    layoutId="tabHighlight"
                    className="absolute inset-0 bg-white" 
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{exp.company}</span>
            </button>
          ))}
        </div>

        {/* CONTRASTY CARD CONTENT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8"
          >
            {/* LEFT SIDE: PRIMARY DETAILS */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-xl relative overflow-hidden group">
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
                
                <div className="flex items-start gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] shrink-0">
                        {React.createElement(experiences[activeTab].icon, { size: 28 })}
                    </div>
                    <div>
                        <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight mb-1">
                            {experiences[activeTab].role}
                        </h3>
                        <p className="text-sm text-cyan-400 font-black uppercase tracking-[0.2em]">
                            {experiences[activeTab].company}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mb-8">
                    <div className="flex items-center gap-3 text-sm text-white/70 font-bold bg-white/5 p-4 rounded-2xl border border-white/5">
                        <Calendar size={18} className="text-cyan-400" />
                        <span>{experiences[activeTab].period}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/70 font-bold bg-white/5 p-4 rounded-2xl border border-white/5">
                        <MapPin size={18} className="text-cyan-400" />
                        <span>{experiences[activeTab].location}</span>
                    </div>
                </div>

                <p className="text-base sm:text-lg text-white/90 leading-relaxed font-semibold italic mb-8">
                    "{experiences[activeTab].summary}"
                </p>

                <div className="flex flex-wrap gap-2">
                    {experiences[activeTab].tech.map((t, idx) => (
                        <span key={idx} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">
                            {t}
                        </span>
                    ))}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: LOGS & ACHIEVEMENTS */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                        <Terminal size={16} className="text-cyan-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white/40 uppercase tracking-[0.3em]">Execution_Report</span>
                </div>

                <div className="flex-1 space-y-4">
                  {experiences[activeTab].learnt.map((log, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-4 group p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all hover:bg-white/[0.04]"
                    >
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
                      <p className="text-sm sm:text-base text-white/70 group-hover:text-white transition-colors leading-relaxed font-bold">
                        {log}
                      </p>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                    <div className="flex gap-1">
                        {[1,2,3].map(j => <div key={j} className="w-1 h-1 rounded-full bg-cyan-400/20" />)}
                    </div>
                    <button className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-white/40 hover:text-cyan-400 transition-all group/btn">
                        System Logs <ExternalLink size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
