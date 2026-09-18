import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useScroll, useTransform } from "motion/react";
import { Toaster } from "sonner";
import { UserSessionProvider } from "./context/UserSessionContext";
import { Intro } from "./components/Intro";
import { Cursor } from "./components/Cursor";
import { OfflineScreen } from "./components/OfflineScreen";
import { ResumeDocument } from "./components/ResumeDocument";
import { MonolithFallback } from "./components/Fallbacks";
import { Nav } from "./components/ui/Nav";
import { Hero } from "./components/sections/Hero";
import { About } from "./components/sections/About";
import { Experience } from "./components/sections/Experience";
import { Work } from "./components/sections/Work";
import { Skills } from "./components/sections/Skills";
import { Education } from "./components/sections/Education";
import { Resume } from "./components/sections/Resume";
import { Contact } from "./components/sections/Contact";
import { Footer } from "./sections/Footer";
import { ProjectDetail } from "./sections/ProjectDetail";
import { projects } from "./data/projects";
import type { Project } from "./data/types";
import { useRenderProfile } from "./hooks/useDeviceTier";
import { usePointer } from "./hooks/usePointer";
import { useIsFinePointer } from "./hooks/useMediaQuery";
import { useLenis } from "./hooks/useLenis";

const HeroScene = lazy(() => import("./components/3d/HeroScene"));

const isPrintMode =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).get("print") === "resume";
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
  const { scrollYProgress } = useScroll();
  // The ecosystem dominates the hero, then settles back so sections read cleanly.
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.12, 0.3], [1, 0.75, 0.32]);
  const [visible, setVisible] = useState(true);
  const [intro, setIntro] = useState(true);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const reveal = useMotionValue(0);

  useLenis(!intro && !openProject);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const finish = useCallback(() => {
    setIntro(false);
    animate(reveal, 1, { duration: render.reducedMotion ? 0.01 : 1.4, ease: EASE });
  }, [reveal, render.reducedMotion]);

  useEffect(() => {
    if (render.reducedMotion) {
      finish();
      return;
    }
    const c = animate(reveal, 0.65, { duration: 1.9, ease: [0.5, 0, 0.2, 1], delay: 0.25 });
    const t = setTimeout(finish, 2500);
    return () => {
      c.stop();
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

  /** Step through projects from inside the case-study overlay. */
  const navigateProject = useCallback((dir: 1 | -1) => {
    setOpenProject((cur) => {
      if (!cur) return cur;
      const i = projects.findIndex((p) => p.id === cur.id);
      return projects[(i + dir + projects.length) % projects.length];
    });
  }, []);

  const fallback = (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="w-[min(70vw,460px)] opacity-60">
        <MonolithFallback animate={!render.reducedMotion} />
      </div>
    </motion.div>
  );

  return (
    <>
      {/* the ecosystem: one continuous 3D layer behind the whole page */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{ opacity: render.reducedMotion ? 0.4 : sceneOpacity }}
      >
        {render.use3D ? (
          <Suspense fallback={null}>
            <HeroScene
              profile={render}
              pointer={pointer}
              reveal={reveal}
              scroll={scrollYProgress}
              active={visible && !openProject}
              fallback={fallback}
            />
          </Suspense>
        ) : (
          fallback
        )}
      </motion.div>

      <AnimatePresence>
        {intro && <Intro key="intro" reveal={reveal} onSkip={finish} reduced={render.reducedMotion} />}
      </AnimatePresence>
      <div className="grain" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: intro ? 0 : 1 }}
        transition={{ duration: 0.9, ease: "easeOut", delay: intro ? 0 : 0.15 }}
      >
        <Cursor />
        <Nav />
        <Toaster
          position="bottom-center"
          theme="dark"
          richColors
          toastOptions={{ className: "!bg-bg-2 !border-line !text-ink !rounded-2xl" }}
        />

        <main id="main" className="relative z-10">
          <Hero reveal={reveal} />
          <About />
          <Experience />
          <Work profile={render} onOpen={setOpenProject} />
          <Skills />
          <Education />
          <Resume />
          <Contact />
        </main>

        <div className="relative z-10">
          <Footer />
        </div>
      </motion.div>

      <AnimatePresence>
        {openProject && (
          <ProjectDetail
            key={openProject.id}
            project={openProject}
            onClose={() => setOpenProject(null)}
            onNavigate={navigateProject}
          />
        )}
      </AnimatePresence>
    </>
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
