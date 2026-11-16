import React from "react";
import { Bot, Briefcase, Home, LayoutGrid, Mail, User } from "lucide-react";
import { actions, useRoom, type AppId } from "../store";

const ITEMS: { app: AppId; label: string; Icon: typeof User }[] = [
  { app: "projects", label: "Projects", Icon: LayoutGrid },
  { app: "experience", label: "Experience", Icon: Briefcase },
  { app: "about", label: "About", Icon: User },
  { app: "contact", label: "Contact", Icon: Mail },
];

/** The always-available way around: the room plus the main computer apps. */
export function PortfolioNavigation() {
  const view = useRoom((s) => s.view);
  const app = useRoom((s) => s.app);
  return (
    <nav
      aria-label="Portfolio sections"
      className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-1.5 sm:px-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl border border-line-2 bg-[#131417]/90 p-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:gap-1 sm:p-1.5">
        <li className="shrink-0">
          <button
            type="button"
            onClick={actions.backToRoom}
            aria-label="Back to room"
            title="Room"
            aria-current={view === "room" ? "page" : undefined}
            className={`flex items-center gap-0 rounded-xl px-2 py-1.5 text-[12px] transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px] ${
              view === "room" ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Home size={14} className={view === "room" ? "text-accent-ink" : ""} aria-hidden="true" />
            <span className="hidden sm:inline">Room</span>
          </button>
        </li>
        <li aria-hidden="true" className="my-1.5 w-px shrink-0 bg-line-2" />
        {ITEMS.map(({ app: id, label, Icon }) => {
          const active = view === "monitor" && app === id;
          return (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => actions.openApp(id)}
                aria-label={label}
                title={label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-0 rounded-xl px-2 py-1.5 text-[12px] transition-colors sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px] ${
                  active ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon size={14} className={active ? "text-accent-ink" : ""} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            </li>
          );
        })}
        <li aria-hidden="true" className="my-1.5 w-px shrink-0 bg-line-2" />
        <li className="shrink-0">
          <button
            type="button"
            onClick={actions.openRobotChat}
            aria-label="Ask robot"
            title="Ask robot"
            className="flex items-center gap-0 rounded-xl px-2 py-1.5 text-[12px] text-muted transition-colors hover:text-ink sm:gap-2 sm:px-3 sm:py-2 sm:text-[13px]"
          >
            <Bot size={14} aria-hidden="true" />
            <span className="hidden md:inline">Ask robot</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
