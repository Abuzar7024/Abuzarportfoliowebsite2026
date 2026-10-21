import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Power, Search, Volume2, Wifi } from "lucide-react";
import { profile } from "../../data/profile";
import { actions, getState, screen, subscribe, useRoom } from "../store";
import { APP_SPECS, SPECS, type IconName, type WinSpec } from "./fs";
import { initialWm, wmReducer, type Area } from "./windows";
import { Window } from "./Window";
import { OsIcon } from "./OsIcon";
import { BotApp, Explorer, GameApp, MailApp, Notepad, ProjectViewer, ResumeViewer, SkillsApp } from "./apps";

const DESKTOP_ICONS: { label: string; icon: IconName; spec: WinSpec }[] = [
  { label: "This PC", icon: "pc", spec: SPECS.pc },
  { label: "About me.txt", icon: "text", spec: SPECS.about },
  { label: "Projects", icon: "folder", spec: SPECS.projects },
  { label: "Experience", icon: "folder", spec: SPECS.experience },
  { label: "Resume.pdf", icon: "pdf", spec: SPECS.resume },
  { label: "Skills", icon: "skills", spec: SPECS.skills },
  { label: "Mail", icon: "mail", spec: SPECS.mail },
  { label: "AK-Bot", icon: "bot", spec: SPECS.bot },
  { label: "Signal Run", icon: "game", spec: SPECS.game },
  { label: "Recycle Bin", icon: "bin", spec: SPECS.bin },
];

const PINNED: WinSpec[] = [SPECS.pc, SPECS.about, SPECS.mail, SPECS.bot];

const START_ITEMS: { label: string; icon: IconName; spec: WinSpec }[] = [
  { label: "About me", icon: "text", spec: SPECS.about },
  { label: "Projects", icon: "folder", spec: SPECS.projects },
  { label: "Experience", icon: "folder", spec: SPECS.experience },
  { label: "Skills", icon: "skills", spec: SPECS.skills },
  { label: "Resume", icon: "pdf", spec: SPECS.resume },
  { label: "Mail", icon: "mail", spec: SPECS.mail },
  { label: "AK-Bot", icon: "bot", spec: SPECS.bot },
  { label: "Contact info", icon: "text", spec: SPECS.contactTxt },
  { label: "Education", icon: "text", spec: SPECS.education },
  { label: "Signal Run", icon: "game", spec: SPECS.game },
  { label: "File Explorer", icon: "pc", spec: SPECS.pc },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time dateTime={now.toISOString()} className="text-right text-[11px] leading-tight text-ink-2">
      <span className="block">{now.toTimeString().slice(0, 5)}</span>
      <span className="block text-faint">{now.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
    </time>
  );
}

/** Mouse: click selects, double-click opens. Keyboard and touch: one activation opens. */
function DesktopIcon({ label, icon, onOpen }: { label: string; icon: IconName; onOpen: () => void }) {
  return (
    <button
      type="button"
      className="os-file flex w-[5.4rem] flex-col items-center gap-1 rounded-md p-1.5 text-center"
      onDoubleClick={onOpen}
      onClick={(e) => {
        if (e.detail === 0 || matchMedia("(pointer: coarse)").matches) onOpen();
      }}
    >
      <span className="grid h-11 w-11 place-items-center">
        <OsIcon name={icon} size={34} />
      </span>
      <span className="line-clamp-2 text-[11.5px] leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">{label}</span>
    </button>
  );
}

/**
 * AK-OS: a small desktop operating system inside the room's computer. Real
 * HTML laid over the 3D screen (or full-screen when too small), with windows,
 * a file explorer, a start menu and a taskbar.
 */
export function Desktop({ flat = false }: { flat?: boolean }) {
  const view = useRoom((s) => s.view);
  const arrived = useRoom((s) => s.arrived);
  const open = view === "monitor" && arrived;
  const root = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Area>({ w: 1000, h: 600 });
  const [wm, dispatch] = useReducer(wmReducer, initialWm);
  const [start, setStart] = useState(false);
  const [query, setQuery] = useState("");
  const [explorerPath, setExplorerPath] = useState("/");

  useEffect(() => {
    screen.overlay = root.current;
    return () => {
      screen.overlay = null;
    };
  }, []);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sizeRef = useRef(size);
  sizeRef.current = size;
  const openSpec = useCallback((spec: WinSpec) => {
    if (spec.kind === "explorer") setExplorerPath(spec.props?.path ?? "/");
    dispatch({ type: "open", spec, area: sizeRef.current });
    setStart(false);
  }, []);

  // The room's navigation (and the first boot) open the matching window.
  useEffect(() => {
    let seen = -1;
    const sync = () => {
      const s = getState();
      if (s.view === "monitor" && s.arrived && s.appNonce !== seen) {
        seen = s.appNonce;
        openSpec(APP_SPECS[s.app]);
      }
    };
    sync();
    return subscribe(sync);
  }, [openSpec]);

  useEffect(() => {
    if (!start) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setStart(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [start]);

  const running = wm.wins.filter((w) => !PINNED.some((p) => p.key === w.key));
  const taskbarItems: WinSpec[] = [...PINNED, ...running];
  const results = START_ITEMS.filter((i) => i.label.toLowerCase().includes(query.trim().toLowerCase()));

  const renderApp = (spec: WinSpec) => {
    switch (spec.kind) {
      case "explorer":
        return <Explorer path={explorerPath} onNavigate={(p) => openSpec({ ...SPECS.pc, title: p === "/" ? "This PC" : p.split("/").pop()!, props: { path: p } })} open={openSpec} />;
      case "notepad":
        return <Notepad doc={spec.props?.doc ?? ""} />;
      case "project":
        return <ProjectViewer id={spec.props?.id ?? ""} open={openSpec} />;
      case "resume":
        return <ResumeViewer />;
      case "mail":
        return <MailApp />;
      case "skills":
        return <SkillsApp />;
      case "bot":
        return <BotApp />;
      case "game":
        return <GameApp />;
    }
  };

  return (
    <div
      ref={root}
      className="monitor-os"
      data-open={open}
      data-full={flat ? "true" : undefined}
      role="application"
      aria-roledescription="desktop"
      aria-label={`AK-OS, ${profile.name}'s computer`}
      aria-hidden={!open}
      inert={!open || undefined}
    >
      <div className="os-wallpaper relative flex h-full flex-col overflow-hidden">
        {/* Desktop surface */}
        <div ref={area} className="relative min-h-0 flex-1" onPointerDown={(e) => e.target === e.currentTarget && setStart(false)}>
          <ul className="absolute inset-y-2 left-2 flex flex-col flex-wrap content-start gap-1" aria-label="Desktop">
            {DESKTOP_ICONS.map((d) => (
              <li key={d.label}>
                <DesktopIcon label={d.label} icon={d.icon} onOpen={() => openSpec(d.spec)} />
              </li>
            ))}
          </ul>
          {wm.wins.map((w) => (
            <Window key={w.key} win={w} focused={wm.focused === w.key} area={size} dispatch={dispatch}>
              {renderApp(w)}
            </Window>
          ))}
        </div>

        {/* Start menu */}
        <AnimatePresence>
          {start && (
            <motion.div
              className="os-start absolute bottom-12 left-1/2 z-[999] flex max-h-[calc(100%-4rem)] w-[min(34rem,calc(100%-1rem))] -translate-x-1/2 flex-col rounded-xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              role="dialog"
              aria-label="Start"
            >
              <div className="p-4 pb-2">
                <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2">
                  <Search size={14} className="text-muted" aria-hidden="true" />
                  <span className="sr-only">Search apps and files</span>
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && results[0] && openSpec(results[0].spec)}
                    placeholder="Search apps and files"
                    className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
                  />
                </label>
              </div>
              <p className="px-5 pt-2 text-[12px] font-medium text-ink-2">{query ? "Results" : "Pinned"}</p>
              <ul className="grid grid-cols-3 gap-1 overflow-y-auto p-3 sm:grid-cols-4">
                {results.map((i) => (
                  <li key={i.label}>
                    <button type="button" onClick={() => openSpec(i.spec)} className="os-file flex w-full flex-col items-center gap-1.5 rounded-md p-2.5">
                      <OsIcon name={i.icon} size={26} />
                      <span className="text-[11.5px] text-ink">{i.label}</span>
                    </button>
                  </li>
                ))}
                {results.length === 0 && <li className="col-span-full p-4 text-center text-[13px] text-muted">Nothing matches "{query}".</li>}
              </ul>
              <div className="flex items-center justify-between border-t border-white/[0.08] px-5 py-3">
                <span className="flex items-center gap-2.5 text-[13px] text-ink">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-brand text-[9px] text-white">AK</span>
                  {profile.name}
                </span>
                {!flat && (
                  <button type="button" onClick={actions.backToRoom} className="os-iconbtn !h-9 !w-9" aria-label="Shut down: back to the room" title="Back to the room">
                    <Power size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Taskbar */}
        <nav className="os-taskbar relative z-[1000] flex h-12 shrink-0 items-center px-2" aria-label="Taskbar">
          <div className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar sm:justify-center">
            <button
              type="button"
              className={`os-taskbtn ${start ? "os-taskbtn--active" : ""}`}
              onClick={() => {
                setQuery("");
                setStart((s) => !s);
              }}
              aria-expanded={start}
              aria-label="Start"
            >
              <span className="grid h-6 w-6 place-items-center rounded-md bg-accent font-brand text-[8px] text-white">AK</span>
            </button>
            {taskbarItems.map((spec) => {
              const win = wm.wins.find((w) => w.key === spec.key);
              const focused = wm.focused === spec.key && win && !win.minimized;
              return (
                <button
                  key={spec.key}
                  type="button"
                  className={`os-taskbtn ${focused ? "os-taskbtn--active" : ""}`}
                  onClick={() => (win ? dispatch({ type: "taskbar", key: spec.key }) : openSpec(spec))}
                  aria-label={win ? `${spec.title}${win.minimized ? " (minimised)" : ""}` : `Open ${spec.title}`}
                  title={spec.title}
                >
                  <OsIcon name={spec.icon} size={20} />
                  {win && <span className={`absolute bottom-0.5 h-[3px] rounded-full ${focused ? "w-4 bg-accent" : "w-1.5 bg-silver/70"}`} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="flex shrink-0 items-center gap-3 pl-2">
            <span className="hidden items-center gap-2 text-ink-2 sm:flex" aria-hidden="true">
              <Wifi size={14} />
              <Volume2 size={14} />
            </span>
            <Clock />
            {!flat && (
              <button type="button" onClick={actions.backToRoom} className="os-taskbtn !w-auto gap-1.5 !px-2.5 text-[12px] text-ink-2" aria-label="Back to the room">
                <Power size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Room</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
