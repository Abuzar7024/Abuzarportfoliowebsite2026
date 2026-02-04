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
    color: "from-cyan-500/10 to-transparent"
  },
  {
    id: "hs",
    degree: "High Secondary (Commerce)",
    school: "Campion School Co-Ed",
    location: "Bhopal, MP",
    years: "03/2010 — 06/2023",
    status: "Schooling",
    color: "from-emerald-500/10 to-transparent"
  }
];

export const Education = () => {
  return (
    <section id="education" className="py-16 md:py-24 px-4 sm:px-6 max-w-5xl mx-auto overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10 md:mb-20 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
            <GraduationCap size={14} className="text-cyan-400" />
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/70 font-black">Academic History</span>
        </div>
        <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white italic uppercase tracking-tighter leading-tight">Education</h3>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {education.map((edu, idx) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="group relative p-6 sm:p-8 md:p-10 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden hover:border-cyan-500/30 transition-all duration-500"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${edu.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6 md:mb-8">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black px-2.5 py-1 md:px-3 md:py-1.5 bg-cyan-400/10 rounded-lg md:rounded-xl shrink-0">
                        {edu.status}
                    </span>
                    <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-mono text-white/30 font-bold uppercase tracking-widest">
                        <Calendar size={12} className="shrink-0" />
                        {edu.years}
                    </div>
                </div>

                <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 md:mb-4 leading-none italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                    {edu.degree}
                </h4>
                
                <div className="space-y-2 md:space-y-3 mt-auto">
                    <div className="flex items-start gap-2 text-white/60 font-bold text-xs md:text-sm uppercase tracking-wide">
                        <div className="w-1 h-4 bg-cyan-500/50 mt-0.5 shrink-0" />
                        <span className="leading-tight">{edu.school}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] italic">
                        <MapPin size={10} className="shrink-0" />
                        {edu.location}
                    </div>
                </div>
            </div>

            {/* Decoration - Hidden on small mobile to avoid layout issues */}
            <div className="absolute -bottom-6 -right-6 text-white/[0.02] group-hover:text-cyan-400/[0.05] transition-colors pointer-events-none hidden sm:block">
                <GraduationCap size={120} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
