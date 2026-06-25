import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader } from "./components/Loader";
import { Navbar } from "./components/Navbar";
import { SiteIcon } from "./components/SiteIcon";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Skills } from "./sections/Skills";
import { WorkingOn } from "./sections/WorkingOn";
import { Experience } from "./sections/Experience";
import { Projects } from "./sections/Projects";
import { Services } from "./sections/Services";
import { Education } from "./sections/Education";
import { Contact } from "./sections/Contact";
import { FooterSignature } from "./components/FooterSignature";
import { MouseGlow } from "./components/MouseGlow";
import { VectorDecorations } from "./components/VectorDecorations";
import { OfflineScreen } from "./components/OfflineScreen";
import NotFound from "./NotFound";

import { Toaster } from "sonner@2.0.3";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) return <OfflineScreen />;

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-cyan-500/30 overflow-x-hidden">
      <SiteIcon />
      <Toaster position="bottom-center" theme="dark" richColors />
      <AnimatePresence>
        {loading && <Loader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MouseGlow />
          <VectorDecorations />
          <Navbar />
          
          <main className="relative">
            {/* HUD / Creative Accents */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none border-[1px] border-white/[0.03] z-50 m-2 sm:m-4 rounded-[1.5rem] sm:rounded-[2rem]" />
            
            {/* Creative Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-0" 
                 style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
            
            <Hero />
            <About />
            <Skills />
            <WorkingOn />
            <Experience />
            <Projects />
            <Services />
            <Education />
            <Contact />
            <FooterSignature />
          </main>
        </motion.div>
      )}
    </div>
  );
}
