import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Monitor, MousePointerClick, Zap } from "lucide-react";
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
    const t = window.setTimeout(() => setSeen(true), 10000);
    return () => window.clearTimeout(t);
  }, [touched]);
  return (
    <AnimatePresence>
      {!seen && (
        <motion.p
          className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-3 sm:bottom-24 sm:px-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.5 }}
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
 * The portfolio: a smooth 3D room whose computer runs AK-OS. Without WebGL,
 * on very slow connections, or when Lite Mode is chosen, AK-OS runs full-screen
 * on its own so every page of content stays fast and reachable.
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
      setStage("engine");
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
  const enterLite = useCallback(() => setFlat(true), []);
  const enter3D = useCallback(() => {
    if (render.webgl) setFlat(false);
  }, [render.webgl]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#101216]">
      <h1 className="sr-only">
        {profile.name}, {profile.roleLine}. An interactive 3D room: open the computer for projects, experience, skills and contact.
      </h1>

      {!flat && (
        <Suspense fallback={null}>
          <RoomCanvas profile={render} active={active} fallback={<OnSceneFailure onFail={onFail} />} onStage={setStage} />
        </Suspense>
      )}

      {!flat && !inComputer && (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-2 p-2.5 sm:p-5">
          <div className="pointer-events-auto flex min-w-0 items-center gap-2.5 rounded-2xl border border-line-2 bg-[#131417]/85 py-1.5 pl-1.5 pr-3 backdrop-blur-md sm:gap-3 sm:py-2 sm:pl-2 sm:pr-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line-2 bg-bg-2 font-brand text-[10px] text-silver sm:h-9 sm:w-9 sm:text-[11px]">
              AK
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-[13.5px] font-semibold tracking-tight sm:text-[15px]">
                {profile.name}
                <span className="text-accent">.</span>
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted sm:text-[11.5px]">
                <span className="signal-dot !h-1.5 !w-1.5 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">{profile.availability}</span>
                <span className="truncate md:hidden">Open to roles</span>
              </span>
            </span>
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => actions.openApp(getState().app)}
              title="Open computer"
              className="btn-ghost !bg-[#131417]/85 !px-2.5 !py-1.5 text-[12px] backdrop-blur-md sm:!px-3.5 sm:!py-2 sm:text-[13px]"
            >
              <Monitor size={13} className="text-accent-ink" aria-hidden="true" />
              <span className="hidden sm:inline">Computer</span>
            </button>
            <button
              type="button"
              onClick={enterLite}
              title="Switch to fast Lite Mode (no 3D)"
              aria-label="Lite Mode"
              className="btn-ghost !bg-[#131417]/85 !px-2.5 !py-1.5 text-[12px] backdrop-blur-md sm:!px-3.5 sm:!py-2 sm:text-[13px]"
            >
              <Zap size={13} className="text-accent-ink" aria-hidden="true" />
              <span className="hidden sm:inline">Lite</span>
            </button>
          </div>
        </header>
      )}

      {!flat && <HotspotPins />}
      {!flat && <ViewPanels />}
      {!flat && <RobotChatPanel />}
      <Desktop flat={flat} canUse3D={render.webgl} onEnter3D={enter3D} />
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

      <AnimatePresence>
        {stage !== "ready" && (
          <LoadingScreen key="loading" stage={stage} slowNetwork={render.slowNetwork} onSkipToLite={enterLite} />
        )}
      </AnimatePresence>
    </div>
  );
}
