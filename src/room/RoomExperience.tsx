import React, { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, FileText, MousePointerClick, Trophy, Zap } from "lucide-react";
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
const HackathonApp = lazy(() =>
  import("../hackathon/HackathonApp").then((m) => ({ default: m.HackathonApp }))
);
const BadgeVerifyPage = lazy(() =>
  import("../competition/BadgeVerifyPage").then((m) => ({ default: m.BadgeVerifyPage }))
);

function parseRoute(pathname: string): {
  mode: "room" | "competition" | "verify";
  verifyId: string;
} {
  const verifyMatch = pathname.match(/^\/competition\/verify\/([^/?#]+)/i);
  if (verifyMatch) {
    return { mode: "verify", verifyId: decodeURIComponent(verifyMatch[1]).toUpperCase() };
  }
  if (/^\/competition(\/|$)/i.test(pathname)) {
    return { mode: "competition", verifyId: "" };
  }
  return { mode: "room", verifyId: "" };
}

/** Rendered by the scene's error boundary: if WebGL fails, fall back to the computer alone. */
function OnSceneFailure({ onFail }: { onFail: () => void }) {
  useEffect(() => {
    onFail();
  }, [onFail]);
  return null;
}

/** A one-time hint until the visitor first interacts. */
function FirstHint() {
  const touched = useRoom((s) => s.hovered !== null || s.view !== "room" || s.robotChat || s.competitionOpen);
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
          className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-3 sm:bottom-24 sm:px-4"
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
 * The portfolio: a 3D room whose computer runs AK-OS, plus the AI Hackathon
 * experience (/competition & /competition/verify/:id). Without WebGL,
 * on very slow connections, or when Lite Mode is chosen, AK-OS runs full-screen
 * on its own so every page of content stays fast and reachable.
 */
export function RoomExperience({ render, active }: { render: RenderProfile; active: boolean }) {
  const [flat, setFlat] = useState(!render.use3D);
  const [stage, setStage] = useState<LoadStage>(flat ? "ready" : "engine");
  const [route, setRoute] = useState(() =>
    typeof window !== "undefined" ? parseRoute(window.location.pathname) : { mode: "room" as const, verifyId: "" }
  );

  const posterProject = useRoom((s) => s.posterProject);
  const view = useRoom((s) => s.view);
  const competitionOpen = useRoom((s) => s.competitionOpen);
  const posterIndex = featuredProjects.findIndex((p) => p.id === posterProject);
  const inComputer = view === "monitor";

  // Sync browser URL changes (popstate) and store competitionOpen state
  useEffect(() => {
    const syncFromLocation = () => {
      const parsed = parseRoute(window.location.pathname);
      setRoute(parsed);
      if (parsed.mode === "competition" || parsed.mode === "verify") {
        setState({ competitionOpen: true, view: "trophy", arrived: true });
      } else {
        setState({ competitionOpen: false, view: getState().view === "trophy" ? "room" : getState().view });
      }
    };
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  useEffect(() => {
    if (competitionOpen && route.mode === "room") {
      setRoute(parseRoute(window.location.pathname));
    } else if (!competitionOpen && route.mode !== "room") {
      setRoute({ mode: "room", verifyId: "" });
    }
  }, [competitionOpen, route.mode]);

  useEffect(() => {
    if (flat) {
      setStage("ready");
      if (!getState().competitionOpen) {
        setState({ view: "monitor", arrived: true, posterProject: null, robotChat: false, appNonce: getState().appNonce + 1 });
      }
    } else {
      setStage("engine");
      if (!getState().competitionOpen) {
        setState({ view: "room", arrived: true, posterProject: null, hovered: null });
      }
    }
  }, [flat]);

  // Esc always leads back towards the room.
  useEffect(() => {
    if (flat) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = getState();
      if (s.competitionOpen) {
        actions.closeCompetition();
        return;
      }
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

  const openCompetitionPage = useCallback(() => {
    actions.openCompetition("/competition");
    setRoute({ mode: "competition", verifyId: "" });
  }, []);

  const closeCompetitionToRoom = useCallback(() => {
    actions.closeCompetition();
    setRoute({ mode: "room", verifyId: "" });
  }, []);

  const showCompetitionOverlay = competitionOpen || route.mode !== "room";
  const [hasEnteredRoom, setHasEnteredRoom] = useState(() => !showCompetitionOverlay);

  useEffect(() => {
    if (!showCompetitionOverlay) {
      setHasEnteredRoom(true);
    }
  }, [showCompetitionOverlay]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#101216]">
      <h1 className="sr-only">
        {profile.name}, {profile.roleLine}. An interactive 3D room: open the computer for projects, experience and contact, or click the gold trophy for the AI Hackathon.
      </h1>

      {!flat && hasEnteredRoom && (
        <Suspense fallback={null}>
          <RoomCanvas profile={render} active={active && !showCompetitionOverlay} fallback={<OnSceneFailure onFail={onFail} />} onStage={setStage} />
        </Suspense>
      )}

      {!flat && !inComputer && !showCompetitionOverlay && (
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
                <span className=" truncate md:hidden">Open to roles</span>
              </span>
            </span>
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={openCompetitionPage}
              title="AVATAR — DESIGN. BUILD. SELL. IN ONE DAY. (PRE-REGISTRATIONS ARE NOW OPEN!)"
              className="btn-ghost !border-[#f5c451]/50 !bg-[#131417]/90 !px-2.5 !py-1.5 text-[12px] font-semibold !text-[#ffe28a] backdrop-blur-md hover:!border-[#f5c451] sm:!px-3.5 sm:!py-2 sm:text-[13px]"
            >
              <Trophy size={13} className="shrink-0 text-[#f5c451]" aria-hidden="true" />
              <span>AVATAR</span>
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
            <a
              href={profile.links.resumePdf}
              target="_blank"
              rel="noopener noreferrer"
              title="Download Resume PDF"
              aria-label="Resume PDF"
              className="btn-ghost !bg-[#131417]/85 !px-2.5 !py-1.5 text-[12px] backdrop-blur-md sm:!px-4 sm:!py-2 sm:text-[13px]"
            >
              <FileText size={13} aria-hidden="true" />
              <span className="hidden md:inline">Resume</span>
            </a>
          </div>
        </header>
      )}

      {/* Homepage Promotional Announcement Pill for AVATAR Pre-Registration */}
      {!flat && !inComputer && !showCompetitionOverlay && (
        <aside
          aria-label="AVATAR Hackathon Announcement"
          className="pointer-events-none fixed inset-x-0 top-[3.9rem] z-40 flex justify-center px-2.5 sm:top-[4.85rem] sm:px-4"
        >
          <button
            type="button"
            onClick={openCompetitionPage}
            className="pointer-events-auto group flex max-w-full items-center gap-2 rounded-full border border-[#f5c451]/45 bg-[#13151a]/92 px-3 py-1.5 text-left text-[11.5px] text-ink shadow-[0_14px_34px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all hover:border-[#f5c451] hover:bg-[#181b22] sm:gap-2.5 sm:px-4 sm:py-2 sm:text-[12.5px]"
          >
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#e3262e]/20 px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-[#ff6b72] border border-[#e3262e]/40 sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5058]" aria-hidden="true" />
              PRE-REGISTRATIONS ARE NOW OPEN!
            </span>
            <span className="truncate font-medium text-[#eef1f5]">
              <strong className="font-semibold text-[#ffe28a]">AVATAR</strong>
              <span className="hidden xs:inline"> · DESIGN. BUILD. SELL. IN ONE DAY.</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[#f5c451] group-hover:translate-x-0.5 transition-transform">
              Join
              <ArrowRight size={12} aria-hidden="true" />
            </span>
          </button>
        </aside>
      )}

      {!flat && !showCompetitionOverlay && <HotspotPins />}
      {!flat && !showCompetitionOverlay && <ViewPanels />}
      {!flat && !showCompetitionOverlay && <RobotChatPanel />}
      <Desktop flat={flat} canUse3D={render.webgl} onEnter3D={enter3D} />
      {!flat && view === "room" && stage === "ready" && !showCompetitionOverlay && <FirstHint />}
      {!flat && !inComputer && !showCompetitionOverlay && <PortfolioNavigation />}

      {/* AI Hackathon and Public QR Verification Experience */}
      <AnimatePresence>
        {showCompetitionOverlay && (
          <motion.div
            key={route.mode === "verify" ? `verify-${route.verifyId}` : "competition"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[65]"
          >
            <Suspense fallback={null}>
              {route.mode === "verify" ? (
                <BadgeVerifyPage
                  participantId={route.verifyId}
                  onNavigateCompetition={openCompetitionPage}
                  onBackToRoom={closeCompetitionToRoom}
                />
              ) : (
                <HackathonApp onBackToRoom={closeCompetitionToRoom} />
              )}
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

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
        {stage !== "ready" && !showCompetitionOverlay && (
          <LoadingScreen key="loading" stage={stage} slowNetwork={render.slowNetwork} onSkipToLite={enterLite} />
        )}
      </AnimatePresence>
    </div>
  );
}
