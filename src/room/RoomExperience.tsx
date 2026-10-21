import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, Monitor, MousePointerClick } from "lucide-react";
import { Toaster } from "sonner";
import type { RenderProfile } from "../hooks/useDeviceTier";
import { profile } from "../data/profile";
import { featuredProjects } from "../data/projects";
import { ProjectDialog } from "../components/ProjectDialog";
import type { LoadStage } from "./RoomCanvas";
import { actions, getState, setState, useRoom } from "./store";
import { LoadingScreen } from "./ui/LoadingScreen";
import { HotspotPins } from "./ui/HotspotPins";
import { PortfolioNavigation } from "./ui/PortfolioNavigation";
import { ViewPanels } from "./ui/ViewPanels";
import { RobotChatPanel } from "./ui/RobotChatPanel";
import { Desktop } from "./os/Desktop";

const RoomCanvas = lazy(() => import("./RoomCanvas"));

/** Rendered by the scene's error boundary: if WebGL fails, fall back to the computer alone. */
function OnSceneFailure({ onFail }: { onFail: () => void }) {
  useEffect(() => {
    onFail();
  }, [onFail]);
  return null;
}

/** A one-time hint until the visitor first interacts. */
function FirstHint() {
  const touched = useRoom((s) => s.hovered !== null || s.view !== "room" || s.robotChat);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (touched) setSeen(true);
    const t = window.setTimeout(() => setSeen(true), 12000);
    return () => window.clearTimeout(t);
  }, [touched]);
  return (
    <AnimatePresence>
      {!seen && (
        <motion.p
          className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.8 }}
        >
          <span className="desktop-room-hint flex items-center gap-2 rounded-full border border-line-2 bg-bg/80 px-4 py-2 text-[12.5px] text-ink-2 backdrop-blur">
            <MousePointerClick size={14} className="text-accent-ink" aria-hidden="true" />
            Click the glowing objects · drag to look around
          </span>
          <span className="phone-room-hint items-center gap-3 rounded-2xl border border-line-2 bg-bg/90 px-3.5 py-2.5 text-[12px] text-ink-2 shadow-lg backdrop-blur-xl">
            <span className="phone-swipe-track" aria-hidden="true">
              <span className="phone-swipe-arrow">‹</span>
              <span className="phone-swipe-thumb" />
              <span className="phone-swipe-arrow">›</span>
            </span>
            <span className="text-left leading-snug">
              <span className="block font-medium text-ink">Swipe around to explore the room</span>
              <span className="block text-[11px] text-muted">Move your finger to look around · tap glowing objects</span>
            </span>
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/**
 * The portfolio: a 3D room whose computer runs AK-OS. Without WebGL (or if
 * the scene fails), AK-OS runs full-screen on its own so every page of
 * content stays reachable.
 */
export function RoomExperience({ render, active }: { render: RenderProfile; active: boolean }) {
  const [flat, setFlat] = useState(!render.use3D);
  const [stage, setStage] = useState<LoadStage>(flat ? "ready" : "engine");
  const posterProject = useRoom((s) => s.posterProject);
  const view = useRoom((s) => s.view);
  const posterIndex = featuredProjects.findIndex((p) => p.id === posterProject);
  const inComputer = view === "monitor";

  useEffect(() => {
    if (flat) {
      setStage("ready");
      setState({ view: "monitor", arrived: true, posterProject: null, robotChat: false, appNonce: getState().appNonce + 1 });
    } else {
      setState({ view: "room", arrived: true, posterProject: null, hovered: null });
    }
  }, [flat]);

  // Esc always leads back towards the room.
  useEffect(() => {
    if (flat) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = getState();
      if (s.posterProject || s.robotChat) return; // those dialogs close themselves
      if (s.view !== "room") actions.backToRoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flat]);

  const stepPoster = useCallback((dir: 1 | -1) => {
    const i = featuredProjects.findIndex((p) => p.id === getState().posterProject);
    actions.openPoster(featuredProjects[(i + dir + featuredProjects.length) % featuredProjects.length].id);
  }, []);
  const closePoster = useCallback(() => setState({ posterProject: null }), []);
  const onFail = useCallback(() => setFlat(true), []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#101216]">
      <h1 className="sr-only">
        {profile.name}, {profile.roleLine}. An interactive 3D room: open the computer for projects, experience and contact.
      </h1>

      {!flat && (
        <Suspense fallback={null}>
          <RoomCanvas profile={render} active={active} fallback={<OnSceneFailure onFail={onFail} />} onStage={setStage} />
        </Suspense>
      )}

      {!flat && !inComputer && (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-3 p-3 sm:p-5">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line-2 bg-[#131417]/80 py-2 pl-2 pr-4 backdrop-blur-xl">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-line-2 bg-bg-2 font-brand text-[11px] text-silver">AK</span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-semibold tracking-tight">
                {profile.name}
                <span className="text-accent">.</span>
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <span className="signal-dot !h-1.5 !w-1.5" aria-hidden="true" />
                <span className="hidden sm:inline">{profile.availability}</span>
                <span className="sm:hidden">Open to roles</span>
              </span>
            </span>
          </div>
          <a href={profile.links.resumePdf} target="_blank" rel="noopener noreferrer" className="btn-ghost pointer-events-auto !bg-[#131417]/80 !px-4 !py-2 backdrop-blur-xl">
            <FileText size={14} aria-hidden="true" />
            Resume
          </a>
        </header>
      )}

      {!flat && !inComputer && (
        <aside className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-40 flex justify-center px-3 lg:hidden">
          <span className="flex max-w-full items-center gap-2 rounded-full border border-line-2 bg-[#131417]/85 px-3 py-2 text-center text-[11px] leading-tight text-ink-2 shadow-lg backdrop-blur-xl sm:px-4 sm:text-[12px]">
            <Monitor size={14} className="shrink-0 text-accent-ink" aria-hidden="true" />
            <span>For the best view, open this site on a computer</span>
          </span>
        </aside>
      )}

      {!flat && <HotspotPins />}
      {!flat && <ViewPanels />}
      {!flat && <RobotChatPanel />}
      <Desktop flat={flat} />
      {!flat && view === "room" && stage === "ready" && <FirstHint />}
      {!flat && !inComputer && <PortfolioNavigation />}

      <AnimatePresence>
        {posterProject && posterIndex >= 0 && (
          <ProjectDialog
            key="poster-dialog"
            project={featuredProjects[posterIndex]}
            index={posterIndex}
            total={featuredProjects.length}
            onClose={closePoster}
            onStep={stepPoster}
          />
        )}
      </AnimatePresence>

      <Toaster position="top-center" theme="dark" toastOptions={{ className: "!bg-bg-3 !border-line-2 !text-ink !rounded-2xl" }} />

      <AnimatePresence>{stage !== "ready" && <LoadingScreen key="loading" stage={stage} />}</AnimatePresence>
    </div>
  );
}
