import React from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer } from "../lib/motion-variants";
import { Brain, Eye, Sparkles, Camera, Database, Briefcase, Layers, Zap, Activity } from "lucide-react";

const focusItems = [
  {
    title: "AI-Powered Flutter Apps",
    icon: Brain,
    desc: "Integrating state-of-the-art AI inference pipelines directly into highly responsive mobile apps.",
    status: "Active Research"
  },
  {
    title: "Computer Vision",
    icon: Eye,
    desc: "Implementing client-side image processing, custom overlays, and real-time landmark rendering.",
    status: "In Development"
  },
  {
    title: "Virtual Try-On Systems",
    icon: Sparkles,
    desc: "Perfecting overlay pipelines to let users visualize clothing and accessories live from device feeds.",
    status: "Refining Pipeline"
  },
  {
    title: "Camera Facial Analysis",
    icon: Camera,
    desc: "Extracting attribute vectors, skin metrics, and estimations from high-frequency video frames.",
    status: "Optimizing Latency"
  },
  {
    title: "Firebase Integrations",
    icon: Database,
    desc: "Structuring real-time sync, dynamic cloud firestores, and secure tokenized authentication.",
    status: "Production Ready"
  },
  {
    title: "Enterprise Mobile Apps",
    icon: Briefcase,
    desc: "Engineering robust kiosk setups for retail environments with strict crash safety and uptime metrics.",
    status: "Active Deployment"
  },
  {
    title: "Clean Architecture",
    icon: Layers,
    desc: "Adhering to MVVM/Clean principles for modular development, extreme testability, and fast scaling.",
    status: "Standard Protocol"
  },
  {
    title: "Performance Optimization",
    icon: Zap,
    desc: "Optimizing frame render times, background thread computation, and asset compression.",
    status: "Benchmark Phase"
  }
];

export const WorkingOn = () => {
  return (
    <section id="working-on" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto overflow-hidden">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeIn}
        className="mb-12 md:mb-20 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/70 font-black">Live Pipeline</span>
        </div>
        <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">What I'm Working On</h3>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"
      >
        {focusItems.map((item, idx) => (
          <motion.div
            key={idx}
            variants={fadeIn}
            className="p-6 md:p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:border-cyan-500/20 hover:bg-white/[0.04] transition-all duration-300 group flex items-start gap-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-cyan-500/10 transition-colors" />
            
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
              <item.icon size={22} />
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 className="text-sm md:text-base font-black text-white uppercase tracking-tight italic">
                  {item.title}
                </h4>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[8px] font-mono font-bold uppercase tracking-wider border border-cyan-500/20">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed font-semibold">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
