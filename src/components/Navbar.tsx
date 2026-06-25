import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

const Logo = () => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="relative group cursor-pointer"
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  >
    <div className="absolute inset-0 bg-cyan-400/30 blur-xl group-hover:bg-cyan-400/50 transition-colors rounded-full" />
    <div className="relative w-10 h-10 bg-[#050505] border border-white/20 rounded-xl flex items-center justify-center overflow-hidden shadow-2xl shadow-cyan-500/10">
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L4 21h4.5l1.5-4h4l1.5 4h4.5L12 3z" />
        <path d="M10.5 13h3" className="opacity-40" />
      </svg>
      {/* Decorative inner light */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
    </div>
  </motion.div>
);

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navItems = ["Home", "About", "Skills", "Experience", "Projects", "Contact"];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id.toLowerCase());
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 p-4 sm:p-6 pointer-events-none">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Cool A Logo (Visible on all views now for better branding) */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="pointer-events-auto"
          >
            <Logo />
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex flex-1 justify-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              className="flex items-center gap-1 p-1 bg-[#050505]/60 backdrop-blur-xl border border-white/10 rounded-full pointer-events-auto"
            >
              {navItems.map((item, i) => (
                <motion.button
                  key={item}
                  onClick={() => scrollTo(item)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.9 + i * 0.05 }}
                  whileHover={{ y: -2, color: "#22d3ee" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-xs font-medium text-white/60 transition-colors cursor-pointer uppercase tracking-widest"
                >
                  {item}
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Mobile Menu Toggle */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.8 }}
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden pointer-events-auto w-10 h-10 flex items-center justify-center bg-[#050505]/60 backdrop-blur-xl border border-white/10 rounded-full text-cyan-400 z-50 shadow-lg shadow-cyan-500/5"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>

          {/* Spacer for desktop to center the nav */}
          <div className="hidden lg:block w-10 h-10" />
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl lg:hidden flex flex-col items-center justify-center gap-8"
          >
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-cyan-500/10 m-4 rounded-[2rem]" />
            
            <Logo />

            <div className="flex flex-col items-center gap-6 mt-4">
              {navItems.map((item, i) => (
                <motion.button
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => scrollTo(item)}
                  className="text-4xl font-bold text-white hover:text-cyan-400 transition-colors uppercase tracking-tighter"
                >
                  {item}
                </motion.button>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-[10px] font-mono text-cyan-500/40 uppercase tracking-[0.5em]"
            >
              System Access Granted
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
