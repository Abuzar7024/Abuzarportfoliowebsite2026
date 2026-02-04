import React from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer, glassHover } from "../lib/motion-variants";
import { 
  Smartphone, 
  Database, 
  Globe, 
  Layers, 
  Figma as FigmaIcon,
  MousePointer2,
  Award,
  ExternalLink
} from "lucide-react";

const skillGroups = [
  { id: 1, title: "Mobile & Frameworks", icon: Smartphone, skills: ["Flutter", "Dart", "React.js", "HTML", "CSS", "Tailwind"] },
  { id: 2, title: "Architecture & State", icon: Layers, skills: ["MVVM", "MVC", "Clean Architecture", "GetX", "Riverpod", "Provider"] },
  { id: 3, title: "Mobile Tools", icon: Database, skills: ["Firebase", "Firestore", "FCM", "Google Maps API", "REST APIs", "JSON"] },
  { id: 4, title: "Design & UX", icon: FigmaIcon, skills: ["Figma", "Component UI", "Responsive Layouts", "UI Optimization"] },
  { id: 5, title: "Dev Tools", icon: MousePointer2, skills: ["Git", "Android Studio", "VS Code", "Postman", "Play/App Store Builds"] },
  { id: 6, title: "Methodology", icon: Globe, skills: ["Agile", "RESTful APIs", "Performance Caching", "API Optimization"] },
];

const certificates = [
  { id: 1, name: "Simplilearn Mean Stack Certificate", link: "#" },
  { id: 2, name: "My Tectra Flutter Development Certificate", link: "#" }
];

export const Skills = () => {
  return (
    <section id="skills" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeIn}
        className="mb-12 md:mb-20 text-center"
      >
        <h2 className="text-[10px] md:text-sm uppercase tracking-[0.3em] text-cyan-400 font-bold mb-4">Expertise Terminal</h2>
        <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">Technical Arsenal</h3>
      </motion.div>

      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-20"
      >
        {skillGroups.map((group) => (
          <motion.div
            key={group.id}
            variants={fadeIn}
            whileHover={glassHover}
            className="p-6 md:p-8 bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] group transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-cyan-500/10 transition-colors" />
            
            <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-cyan-500/20 text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
              <group.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <h4 className="text-[9px] md:text-[11px] font-black text-white uppercase tracking-[0.2em] mb-4 md:mb-6">{group.title}</h4>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {group.skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 md:px-3 md:py-1.5 bg-white/[0.03] border border-white/5 rounded-full text-[8px] md:text-[10px] text-white/50 font-bold uppercase tracking-widest group-hover:text-cyan-400/70 group-hover:border-cyan-500/20 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Certificates Section */}
      <div className="mt-16 md:mt-24 pt-16 md:pt-24 border-t border-white/5">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 mb-10 md:track-12"
        >
            <div className="text-center md:text-left">
                <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                    <Award size={18} className="text-cyan-400" />
                    <span className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black text-cyan-400">Verifications</span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">Certificates</h3>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {certificates.map((cert) => (
                <motion.a
                    key={cert.id}
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-5 md:p-6 bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] hover:border-cyan-500/30 group transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 shrink-0">
                            <Award size={16} />
                        </div>
                        <span className="text-xs md:text-sm font-bold text-white/70 group-hover:text-white transition-colors uppercase tracking-tight line-clamp-1">{cert.name}</span>
                    </div>
                    <ExternalLink size={14} className="text-white/20 group-hover:text-cyan-400 transition-colors shrink-0 ml-4" />
                </motion.a>
            ))}
        </div>
      </div>
    </section>
  );
};
