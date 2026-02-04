import React from "react";
import { motion } from "motion/react";
import { Heart, Code2, Zap, ArrowUpCircle } from "lucide-react";
import userImg from "figma:asset/3ef0dcfbbef7385c7aef0b4ba88c824b200ef5f6.png";

export const FooterSignature = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="relative pt-20 pb-32 px-6 overflow-hidden border-t border-white/5 bg-[#020202]">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* The Reveal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative group mb-12"
        >
          {/* Glowing Aura */}
          <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16 p-8 md:p-12 bg-white/[0.02] border border-white/10 rounded-[3rem] backdrop-blur-xl">
            {/* Original Image Display */}
            <div className="shrink-0 relative">
                <div className="absolute inset-0 border border-cyan-500/30 rounded-[2.5rem] rotate-3 scale-105" />
                <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl">
                    <img 
                        src={userImg} 
                        alt="Abuzar Khan" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                </div>
                
                {/* ID Tag */}
                <div className="absolute -bottom-3 -left-3 px-4 py-2 bg-black border border-white/10 rounded-xl shadow-2xl">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-400">Identity_Verified</p>
                </div>
            </div>

            {/* Text Side */}
            <div className="text-center md:text-left">
                <h4 className="text-sm font-black text-cyan-400 uppercase tracking-[0.4em] mb-4">Mission Complete</h4>
                <h5 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">
                    Designed <br className="hidden md:block" /> & Built by <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Abuzar</span>
                </h5>
                <p className="text-white/40 text-sm md:text-base italic font-medium leading-relaxed max-w-sm">
                    "Crafting high-performance digital systems with precision engineering. Available for legendary collaborations."
                </p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <Code2 size={12} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">React</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <Zap size={12} className="text-yellow-400" />
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Tailwind</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <Heart size={12} className="text-red-400" />
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Love</span>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>

        {/* Final Bottom Bar */}
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 w-full"
        >
            <button 
                onClick={scrollToTop}
                className="group flex flex-col items-center gap-3 text-white/20 hover:text-cyan-400 transition-all cursor-pointer"
            >
                <ArrowUpCircle size={40} className="group-hover:-translate-y-2 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.6em]">System Reboot</span>
            </button>
            
            <div className="text-[10px] font-mono text-white/10 uppercase tracking-[0.4em] flex items-center gap-4">
                <span>© 2026 Abuzar Khan</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/20" />
                <span>Encrypted_Terminal</span>
            </div>
        </motion.div>
      </div>
    </section>
  );
};
