import React from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer, glassHover } from "../lib/motion-variants";
import { Smartphone, Database, Layers, Brain, Settings } from "lucide-react";

const skillGroups = [
  { id: 1, title: "Mobile", icon: Smartphone, skills: ["Flutter", "Dart", "Android", "iOS"] },
  { id: 2, title: "AI & Computer Vision", icon: Brain, skills: ["Virtual Try-On", "Computer Vision", "Face Detection", "Image Processing", "Camera Integration", "AI API Integration", "Machine Learning APIs"] },
  { id: 3, title: "Backend", icon: Database, skills: ["REST APIs", "Firebase", "Authentication", "Cloud Firestore"] },
  { id: 4, title: "State Management", icon: Layers, skills: ["Provider", "Riverpod"] },
  { id: 5, title: "Tools", icon: Settings, skills: ["Git", "GitHub", "Postman", "Android Studio", "VS Code", "Figma"] }
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
        <h2 className="text-[10px] md:text-sm uppercase tracking-[0.3em] text-cyan-400 font-bold mb-4">Expertise</h2>
        <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">Technical Arsenal</h3>
      </motion.div>

      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
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
    </section>
  );
};
