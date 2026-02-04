import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export const Loader = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  // EDIT_CONTENT: Max 3 steps, Max 25 chars per step
  const steps = ["Launching portfolio...", "Loading modules...", "Ready"];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1000),
      setTimeout(() => onComplete(), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] font-mono"
    >
      <div className="relative h-24 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-cyan-400 text-sm tracking-widest uppercase"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
        
        <div className="mt-8 w-48 h-[1px] bg-white/10 relative overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          />
        </div>
      </div>
    </motion.div>
  );
};
