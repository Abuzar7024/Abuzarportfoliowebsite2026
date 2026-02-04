import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Home, RefreshCw, Skull } from 'lucide-react';
import userImg from "figma:asset/3ef0dcfbbef7385c7aef0b4ba88c824b200ef5f6.png";

const NotFound = () => {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center p-4 overflow-hidden relative font-mono text-white">
      {/* Background Matrix/Glitch Effect */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #ff0000 1px, transparent 0)`, backgroundSize: '16px 16px' }} />
      
      {/* Intense Red Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/30 blur-[120px] rounded-full animate-pulse" />

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-6">
        
        {/* Scarier Compact Image Container */}
        <motion.div
          animate={glitch ? { 
            x: [-2, 2, -1, 0], 
            filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] 
          } : {}}
          className="relative group shrink-0"
        >
          <div className="absolute inset-0 bg-red-600/30 blur-2xl opacity-50 rounded-full" />
          
          <div className="relative w-48 h-48 md:w-56 md:h-56 overflow-hidden border-4 border-red-900/80 rounded-full shadow-[0_0_60px_rgba(255,0,0,0.4)]">
            <motion.img 
              src={userImg} 
              alt="The Watcher" 
              className={`w-full h-full object-cover transition-all duration-75 grayscale brightness-[0.3] contrast-[2.5] ${glitch ? 'invert' : ''}`}
            />
            {/* Blood-like Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-transparent to-red-950/20" />
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Skull size={100} className="text-red-500" />
            </div>
          </div>

          <motion.div 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 3 }}
            className="absolute -top-2 -right-2 px-3 py-1 bg-red-600 text-[9px] font-black uppercase tracking-tighter"
          >
            SYSTEM_STALKER
          </motion.div>
        </motion.div>

        {/* Compact Text HUD */}
        <div className="text-center w-full">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-red-950/50 border border-red-500/30 rounded-full">
            <AlertCircle className="text-red-500" size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500">Node_Corrupted // Protocol_Error</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 leading-none">
            YOU ARE <span className="text-red-600">LOST</span>
          </h1>

          <p className="text-white/40 text-xs md:text-sm mb-8 leading-relaxed font-bold italic max-w-xs mx-auto">
            "Your digital footprint has led you to a restricted void. The entity is watching your exit. Do not look back."
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"
            >
              <Home size={14} /> Emergency Exit
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 py-3.5 px-6 bg-red-950/20 border border-red-900/40 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-900/40 transition-all active:scale-95"
            >
              <RefreshCw size={14} /> Attempt Re-Sync
            </button>
          </div>
        </div>

        {/* Static noise element */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none text-[8px] font-mono whitespace-nowrap">
            LOG_ENTITY_SNAPSHOT_CAPTURED // {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
