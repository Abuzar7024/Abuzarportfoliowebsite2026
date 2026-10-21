import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { Toaster } from "sonner";
import { UserSessionProvider } from "./context/UserSessionContext";
import { OfflineScreen } from "./components/OfflineScreen";
import { ResumeDocument } from "./components/ResumeDocument";
import { SceneFallback } from "./components/SceneFallback";
import { SceneErrorBoundary } from "./three/SceneErrorBoundary";
import { Nav } from "./components/Nav";
import { Hero } from "./sections/Hero";
import { HelloChapter, YearsChapter } from "./sections/Chapters";
import { ScreenFrame } from "./components/ScreenFrame";
import { About } from "./sections/About";
import { Experience } from "./sections/Experience";
import { Work } from "./sections/Work";
import { Skills } from "./sections/Skills";
import { Contact } from "./sections/Contact";
import { Footer } from "./sections/Footer";
import { useRenderProfile } from "./hooks/useDeviceTier";
import { usePointer } from "./hooks/usePointer";
import { useIsFinePointer } from "./hooks/useMediaQuery";
import { useLenis } from "./hooks/useLenis";

const FutureScene = lazy(() => import("./three/FutureScene"));

const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const isPrintMode = params.get("print") === "resume";
/** `?offline` previews the offline page without disconnecting. */
const previewOffline = params.has("offline");
const MOTION_KEY = "portfolio-3d-motion";

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

function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function readMotionPref() {
  try {
    return localStorage.getItem(MOTION_KEY) !== "off";
  } catch {
    return true;
  }
}

function Site() {
  const render = useRenderProfile();
  const fine = useIsFinePointer();
  const pointer = usePointer(fine && !render.reducedMotion);
  const { scrollYProgress } = useScroll();
  // Full strength around the name and the grid floor; quieter while reading.
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.1, 0.86, 1], [1, 0.55, 0.55, 1]);

  const online = useOnline();
  const [visible, setVisible] = useState(true);
  const [motionOn, setMotionOn] = useState(readMotionPref);
  // The hero name is chrome in 3D; if the scene cannot render, it falls back to HTML type.
  const [name3D, setName3D] = useState(render.use3D);
  const [offlineOpen, setOfflineOpen] = useState(previewOffline || !online);
  const [playOpen, setPlayOpen] = useState(false);
  const overlay = offlineOpen || playOpen;

  useLenis(!overlay);

  // Open the offline screen whenever the connection drops; it stays until dismissed.
  useEffect(() => {
    if (!online) setOfflineOpen(true);
  }, [online]);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const toggleMotion = useCallback(() => {
    setMotionOn((s) => {
      try {
        localStorage.setItem(MOTION_KEY, s ? "off" : "on");
      } catch {
        // preference just won't persist
      }
      return !s;
    });
  }, []);

  const showHtmlName = useCallback(() => setName3D(false), []);
  const fallback = <SceneFallback onShow={showHtmlName} />;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{ opacity: render.reducedMotion ? 0.7 : sceneOpacity }}
      >
        {render.use3D ? (
          <SceneErrorBoundary fallback={fallback}>
            <Suspense fallback={null}>
              <FutureScene
                profile={render}
                pointer={pointer}
                scroll={scrollYProgress}
                active={visible && motionOn && !overlay}
                fallback={fallback}
              />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          fallback
        )}
      </motion.div>
      <div className="grain" aria-hidden="true" />
      <ScreenFrame />

      <Nav motionOn={motionOn} onToggleMotion={toggleMotion} />
      <Toaster
        position="bottom-center"
        theme="dark"
        toastOptions={{ className: "!bg-bg-3 !border-line-2 !text-ink !rounded-2xl" }}
      />

      <main id="main" className="relative z-10" inert={overlay || undefined}>
        <Hero name3D={name3D} />
        <HelloChapter />
        <About />
        <YearsChapter />
        <Experience />
        <Work />
        <Skills />
        <Contact />
      </main>
      <div className="relative z-10" inert={overlay || undefined}>
        <Footer onPlay={() => setPlayOpen(true)} />
      </div>

      <AnimatePresence>
        {overlay && (
          <OfflineScreen
            key="offline"
            mode={offlineOpen ? "offline" : "play"}
            online={online && !(previewOffline && offlineOpen)}
            onClose={() => {
              setOfflineOpen(false);
              setPlayOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  if (isPrintMode) return <PrintResume />;
  return (
    <UserSessionProvider>
      <Site />
    </UserSessionProvider>
  );
}
