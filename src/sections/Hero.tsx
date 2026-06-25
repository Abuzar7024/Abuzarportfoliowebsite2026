import React from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer } from "../lib/motion-variants";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Github, Linkedin, Mail, ArrowDown } from "lucide-react";

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
          className="text-sm sm:text-lg md:text-xl text-white/95 mb-8 max-w-4xl mx-auto font-black px-4 uppercase tracking-[0.15em] flex items-center justify-center gap-2 flex-wrap"
        >
          Flutter Developer <span className="text-cyan-400 opacity-50">|</span> AI-Powered Mobile Apps <span className="text-emerald-400 opacity-50">|</span> Computer Vision <span className="text-cyan-400 opacity-50">|</span> Firebase <span className="text-emerald-400 opacity-50">|</span> REST APIs
        </motion.p>
        
        <motion.p 
          variants={fadeIn}
          className="text-[13px] sm:text-base md:text-lg text-white/40 mb-16 max-w-3xl mx-auto px-6 leading-relaxed font-medium"
        >
          I build high-performance Flutter applications that integrate Artificial Intelligence, Computer Vision, Camera Processing, and Cloud APIs to solve real-world retail and fashion problems. I enjoy turning complex AI workflows into seamless mobile experiences.
        </motion.p>

        <motion.div
          variants={fadeIn}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto px-6 sm:px-0"
        >
          {/* Primary — View Projects */}
          <button
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            className="
              w-full sm:flex-1
              inline-flex items-center justify-center gap-2
              px-8 py-4
              bg-white text-black
              text-[11px] font-black uppercase tracking-[0.3em]
              rounded-full
              hover:bg-cyan-400 hover:text-black
              transition-all duration-200
              active:scale-95 cursor-pointer
              group
            "
          >
            View Projects
            <ArrowDown size={13} className="group-hover:translate-y-0.5 transition-transform" />
          </button>

          {/* Secondary — Contact Me */}
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="
              w-full sm:flex-1
              inline-flex items-center justify-center gap-2
              px-8 py-4
              bg-white/[0.06] border border-white/20 text-white
              text-[11px] font-black uppercase tracking-[0.3em]
              rounded-full backdrop-blur-sm
              hover:border-cyan-500/60 hover:text-cyan-400 hover:bg-white/10
              transition-all duration-200
              active:scale-95 cursor-pointer
            "
          >
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
