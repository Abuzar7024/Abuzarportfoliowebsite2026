import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useScroll } from "motion/react";
import { Toaster } from "sonner";
import { UserSessionProvider } from "./context/UserSessionContext";
import { Intro } from "./components/Intro";
import { Cursor } from "./components/Cursor";
import { Navbar } from "./components/Navbar";
import { OfflineScreen } from "./components/OfflineScreen";
import { ResumeDocument } from "./components/ResumeDocument";
import { MonolithFallback } from "./components/Fallbacks";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { TechStack } from "./sections/TechStack";
import { Projects } from "./sections/Projects";
import { ExperienceTimeline } from "./sections/ExperienceTimeline";
import { GitHubActivity } from "./sections/GitHubActivity";
import { Resume } from "./sections/Resume";
import { Services } from "./sections/Services";
import { Contact } from "./sections/Contact";
import { Footer } from "./sections/Footer";
import { useRenderProfile } from "./hooks/useDeviceTier";
import { usePointer } from "./hooks/usePointer";
import { useIsFinePointer } from "./hooks/useMediaQuery";
import { useLenis } from "./hooks/useLenis";
import type { MonolithControls } from "./three/Monolith";

const MonolithScene = lazy(() => import("./three/MonolithScene"));

const isPrintMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("print") === "resume";
const EASE = [0.16, 1, 0.3, 1] as const;

/** Standalone print view used by the PDF generator (`?print=resume`). */
function PrintResume() {
  useEffect(() => {
    document.body.classList.add("print-resume");
    document.documentElement.style.background = "#fff";
    document.title = "Abuzar Khan — Resume";
    return () => document.body.classList.remove("print-resume");
  }, []);
  return (
    <div id="resume-print-root" className="bg-white">
      <ResumeDocument siteUrl={(import.meta.env.VITE_SITE_URL as string | undefined) || undefined} />
    </div>
  );
}

function Site() {
  const render = useRenderProfile();
  const fine = useIsFinePointer();
  const pointer = usePointer(fine && !render.reducedMotion);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: hero } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const [visible, setVisible] = useState(true);
  const [intro, setIntro] = useState(true);
  const reveal = useMotionValue(0);
  const stage = useMotionValue(0);
  const spin = useMotionValue(0);
  const pulse = useMotionValue(0);
  const hover = useMotionValue(0);
  const controls = useMemo<MonolithControls>(() => ({ spin, pulse, hover }), [spin, pulse, hover]);
  useLenis(!intro);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const finish = useCallback(() => {
    setIntro(false);
    animate(reveal, 1, { duration: 0.4 });
    animate(stage, 1, { duration: render.reducedMotion ? 0.01 : 1.2, ease: EASE });
  }, [reveal, stage, render.reducedMotion]);

  useEffect(() => {
    if (render.reducedMotion) {
      finish();
      return;
    }
    const controls = animate(reveal, 1, { duration: 1.9, ease: [0.5, 0, 0.2, 1], delay: 0.25 });
    const t = setTimeout(finish, 2500);
    return () => {
      controls.stop();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = intro ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [intro]);

  const fallback = (
    <motion.div className="fixed inset-0 flex items-center justify-center" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <div className="w-[min(60vw,320px)] lg:absolute lg:right-[12vw] lg:top-1/2 lg:w-[min(30vw,420px)] lg:-translate-y-1/2">
        <MonolithFallback animate={!render.reducedMotion} />
      </div>
    </motion.div>
  );

  return (
    <LayoutGroup>
      {/* signature object: same layer in the intro and the hero */}
      <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden="true">
        {render.use3D ? (
          <Suspense fallback={null}>
            <MonolithScene profile={render} pointer={pointer} reveal={reveal} stage={stage} scroll={hero} controls={controls} active={visible} fallback={fallback} />
          </Suspense>
        ) : (
          fallback
        )}
      </div>

      <AnimatePresence>{intro && <Intro key="intro" reveal={reveal} onSkip={finish} reduced={render.reducedMotion} />}</AnimatePresence>
      <div className="grain" aria-hidden="true" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: intro ? 0 : 1 }} transition={{ duration: 0.9, ease: "easeOut", delay: intro ? 0 : 0.15 }}>
        <Cursor />
        <Navbar />
        <Toaster position="bottom-center" theme="dark" richColors toastOptions={{ className: "!bg-bg-2 !border-line !text-ink !rounded-2xl" }} />
        <main id="main" className="relative z-10">
          <div ref={heroRef}>
            <Hero progress={hero} controls={controls} />
          </div>
          <About />
          <TechStack />
          <Projects />
          <ExperienceTimeline />
          <GitHubActivity />
          <Resume />
          <Services />
          <Contact />
        </main>
        <div className="relative z-10">
          <Footer />
        </div>
      </motion.div>
    </LayoutGroup>
  );
}

export default function App() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (isPrintMode) return <PrintResume />;
  if (offline) return <OfflineScreen />;

  return (
    <UserSessionProvider>
      <Site />
    </UserSessionProvider>
  );
}
