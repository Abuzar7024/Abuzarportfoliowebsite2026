import React from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer } from "../lib/motion-variants";
import { Cpu, Terminal, ShieldCheck } from "lucide-react";

export const About = () => {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto overflow-hidden">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeIn}
        className="mb-12 md:mb-20 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 mb-4 md:mb-6">
            <Cpu size={14} className="text-cyan-400" />
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/70 font-black">System Core</span>
        </div>
        <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white italic uppercase tracking-tighter leading-tight">About Me</h3>
      </motion.div>

      <motion.div 
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
      >
        {/* Left Side: Deep Info Card */}
        <motion.div 
          variants={fadeIn}
          className="p-8 md:p-10 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[3rem] hover:border-cyan-500/30 transition-all duration-500 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <p className="text-sm sm:text-base text-white/75 leading-relaxed font-bold">
              I am a Flutter Developer with hands-on experience building production-ready mobile applications using Flutter and Dart. My work focuses on AI-powered applications, computer vision, virtual try-on technology, camera-based facial analysis, REST API integrations, Firebase services, and scalable mobile architectures.
            </p>
            <p className="text-sm sm:text-base text-white/75 leading-relaxed font-bold">
              I have developed enterprise applications used in retail environments, collaborated with AI teams to integrate machine learning models into Flutter apps, and optimized applications for performance, responsiveness, and production deployment.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-black">Core_Protocol_Initialized</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Key Stats/Details */}
        <motion.div 
          variants={fadeIn}
          className="p-8 md:p-10 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[3rem] hover:border-cyan-500/30 transition-all duration-500 flex flex-col justify-between"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Terminal size={18} className="text-cyan-400" />
              <span className="text-xs sm:text-sm font-black text-white/40 uppercase tracking-[0.3em]">Developer Specifications</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <span className="text-cyan-400 font-mono text-xs font-black select-none mt-0.5">01</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">AI-Powered Systems</h4>
                  <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed font-semibold">Specialized in Virtual Try-On, Camera Facial Analysis, and Computer Vision integration.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <span className="text-cyan-400 font-mono text-xs font-black select-none mt-0.5">02</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Mobile Architecture</h4>
                  <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed font-semibold">Clean Architecture, Riverpod, Provider, and optimized state management routines.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                <span className="text-cyan-400 font-mono text-xs font-black select-none mt-0.5">03</span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Enterprise Ready</h4>
                  <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed font-semibold">Focused on building high-performance applications tailored for retail, kiosk, and production environments.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between text-xs font-mono text-white/20">
            <span>UPTIME: 100%</span>
            <span>SYSTEM TYPE: MOBILE_ENG</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
