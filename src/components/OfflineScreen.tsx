import React from "react";
import { motion } from "motion/react";
import { WifiOff, AlertTriangle, RefreshCcw, ShieldAlert } from "lucide-react";

export const OfflineScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6 overflow-hidden">
      {/* HUD Background Decorations */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #06b6d4 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
      
      {/* Glitch Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 via-transparent to-transparent opacity-20" />
      
      <div className="relative w-full max-w-lg">
        {/* Animated HUD Corner Brackets */}
        <div className="absolute -top-10 -left-10 w-20 h-20 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-3xl" />
        <div className="absolute -bottom-10 -right-10 w-20 h-20 border-b-2 border-r-2 border-cyan-500/30 rounded-br-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#050505] border border-cyan-500/20 rounded-[2.5rem] p-10 md:p-16 backdrop-blur-3xl shadow-[0_0_100px_rgba(6,182,212,0.05)] relative overflow-hidden text-center"
        >
          {/* Scan Line Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/20 blur-sm animate-scan" />

          <div className="flex flex-col items-center">
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                opacity: [1, 0.7, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-10"
            >
              <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 rounded-full border-2 border-cyan-500/40 flex items-center justify-center bg-cyan-950/20">
                <WifiOff size={40} className="text-cyan-400" />
              </div>
            </motion.div>

            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-cyan-500/5 border border-cyan-500/20 rounded-full">
              <ShieldAlert size={12} className="text-cyan-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">System_Status: Offline</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-6 leading-none">
              Link <span className="text-cyan-400">Severed</span>
            </h1>

            <p className="text-white/40 text-sm md:text-base mb-12 leading-relaxed font-medium italic">
              "Environment synchronization failed. Your terminal has lost connection to the primary uplink. Re-establishing connection protocols automatically."
            </p>

            <div className="space-y-4 w-full">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 w-1/3 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                />
              </div>
              <div className="flex justify-between items-center text-[8px] font-mono text-cyan-500/40 uppercase tracking-widest font-black">
                <span>Attempting_Reconnect...</span>
                <span>Node: 0x87-AZ</span>
              </div>
            </div>

            {/* Manual Re-sync button as a fallback */}
            <button 
              onClick={() => window.location.reload()}
              className="mt-12 flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 transition-all active:scale-95 group cursor-pointer"
            >
              <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
              Force Manual Re-Sync
            </button>
          </div>
        </motion.div>

        {/* HUD Data Streams */}
        <div className="absolute top-1/2 -left-20 -translate-y-1/2 hidden lg:flex flex-col gap-4 opacity-10">
            <div className="text-[10px] font-mono text-cyan-400 animate-pulse">ERROR_SIG_0404</div>
            <div className="text-[10px] font-mono text-cyan-400 delay-100 animate-pulse">IP_UNREACHABLE</div>
            <div className="text-[10px] font-mono text-cyan-400 delay-200 animate-pulse">GATEWAY_TIMEOUT</div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
