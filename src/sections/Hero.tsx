import React from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer } from "../lib/motion-variants";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Github, Linkedin, Mail, Smartphone, ArrowDown } from "lucide-react";

export const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden bg-black">
      {/* Cinematic Space & Moon Background */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {/* Distant Starfield Layer */}
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-lighten" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1669729026928-36afe1390851?auto=format&fit=crop&q=80&w=2000')` }}
        />
        
        {/* The Moon - Advanced Blending */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 0.5, scale: 1, rotate: 0 }}
            transition={{ duration: 3.5, ease: "easeOut" }}
            className="absolute top-[5%] -right-[20%] md:-right-[10%] w-[130vw] md:w-[75vw] lg:w-[60vw] aspect-square"
        >
            <div className="relative w-full h-full">
                {/* Radial Masking for Perfect Edge Blending */}
                <div 
                    className="absolute inset-0 z-10"
                    style={{ 
                        background: 'radial-gradient(circle at 50% 50%, transparent 20%, black 85%)',
                        mixBlendMode: 'multiply'
                    }}
                />
                <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1760117144211-f734f9776595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsaXN0aWMlMjBkYXJrJTIwbW9vbiUyMHNwYWNlJTIwaGlnaCUyMHJlc29sdXRpb258ZW58MXx8fHwxNzcwMjA2NDc1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Moon Background"
                    className="w-full h-full object-contain grayscale brightness-110 contrast-125 select-none pointer-events-none mix-blend-screen"
                />
                {/* Atmosphere Halo */}
                <div className="absolute inset-0 bg-cyan-500/10 blur-[150px] rounded-full mix-blend-color-dodge opacity-60" />
            </div>
        </motion.div>

        {/* Global Lighting and Shadow Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/10 to-black opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-60" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 text-center max-w-5xl"
      >
        <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-12 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] font-black text-cyan-400 font-mono">System Protocol v4.0 Active</span>
        </motion.div>

        {/* Impact Name Branding */}
        <motion.div variants={fadeIn} className="relative mb-10 group px-4">
          <h1 className="relative text-[4.2rem] sm:text-[7.5rem] md:text-9xl lg:text-[11.5rem] font-black tracking-tighter text-white leading-[0.75] italic uppercase select-none">
            <span className="block mb-2 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">Abuzar</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white/80 to-cyan-500 drop-shadow-[0_0_60px_rgba(34,211,238,0.2)]">
              Khan
            </span>
          </h1>
        </motion.div>

        <motion.p 
          variants={fadeIn}
          className="text-lg sm:text-2xl md:text-3xl text-white/90 mb-8 max-w-3xl mx-auto font-black px-4 uppercase tracking-[0.2em] italic flex items-center justify-center gap-2 flex-wrap"
        >
          Flutter <span className="text-cyan-400 opacity-50">/</span> Front-End <span className="text-emerald-400 opacity-50">/</span> UI Designer
        </motion.p>
        
        <motion.p 
          variants={fadeIn}
          className="text-[12px] sm:text-base md:text-lg text-white/30 mb-16 max-w-2xl mx-auto italic px-6 leading-relaxed font-medium"
        >
          “Transforming conceptual architecture into high-performance digital reality. Expert in building stable, scalable, and visually stunning applications.”
        </motion.p>

        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-5 px-6">
          <button 
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-16 py-6 bg-white text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-cyan-400 transition-all cursor-pointer shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-3 group"
          >
            Explore Work
            <ArrowDown size={14} className="group-hover:translate-y-1 transition-transform animate-bounce" />
          </button>
          <button 
            onClick={() => window.open('https://wa.me/918770206120')}
            className="w-full sm:w-auto px-16 py-6 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-white/10 transition-all flex items-center justify-center gap-3 cursor-pointer backdrop-blur-md active:scale-95"
          >
            <Smartphone size={16} className="text-cyan-400" />
            Contact Me
          </button>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-24 flex items-center justify-center gap-14">
          <a href="https://github.com/Abuzar7024" target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white transition-all transform hover:scale-125 hover:-translate-y-1"><Github size={28} /></a>
          <a href="https://www.linkedin.com/in/abuzar-khan7024/" target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-blue-400 transition-all transform hover:scale-125 hover:-translate-y-1"><Linkedin size={28} /></a>
          <a href="mailto:abuzxarrr87@gmail.com" className="text-white/20 hover:text-cyan-400 transition-all transform hover:scale-125 hover:-translate-y-1"><Mail size={28} /></a>
        </motion.div>
      </motion.div>
    </section>
  );
};
