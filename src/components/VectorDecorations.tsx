import React from 'react';
import { motion } from 'motion/react';

export const VectorDecorations = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
      {/* Circuit Line 1 */}
      <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M 10 0 L 10 20 L 20 20 L 20 40 L 0 40"
          fill="none"
          stroke="rgba(34, 211, 238, 0.3)"
          strokeWidth="0.05"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Circuit Line 2 */}
        <motion.path
          d="M 90 100 L 90 80 L 80 80 L 80 60 L 100 60"
          fill="none"
          stroke="rgba(16, 185, 129, 0.3)"
          strokeWidth="0.05"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
        />

        {/* Floating Particles/Nodes */}
        <motion.circle
          cx="10"
          cy="20"
          r="0.2"
          fill="#22d3ee"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="90"
          cy="80"
          r="0.2"
          fill="#10b981"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </svg>

      {/* Side Decorative Text */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-12 opacity-10 rotate-180" style={{ writingMode: 'vertical-rl' }}>
        <span className="text-[10px] font-mono tracking-[1em] uppercase text-white whitespace-nowrap">SYSTEM_CORE_READY</span>
        <div className="h-32 w-px bg-white/20" />
        <span className="text-[10px] font-mono tracking-[1em] uppercase text-white whitespace-nowrap">INIT_PHASE_04</span>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-12 opacity-10" style={{ writingMode: 'vertical-rl' }}>
        <span className="text-[10px] font-mono tracking-[1em] uppercase text-white whitespace-nowrap">EST_STABILITY_99.9%</span>
        <div className="h-32 w-px bg-white/20" />
        <span className="text-[10px] font-mono tracking-[1em] uppercase text-white whitespace-nowrap">DATALINK_ESTABLISHED</span>
      </div>
    </div>
  );
};
