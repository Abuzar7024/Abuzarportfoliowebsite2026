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
      className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line-2 bg-[#131417]/85 p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <li className="shrink-0">
          <button
            type="button"
            onClick={actions.backToRoom}
            aria-label="Back to room"
            title="Room"
            aria-current={view === "room" ? "page" : undefined}
            className={`flex items-center gap-0 rounded-xl px-2.5 py-2 text-[13px] transition-colors xs:gap-2 xs:px-3 ${
              view === "room" ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Home size={15} className={view === "room" ? "text-accent-ink" : ""} aria-hidden="true" />
            <span className="hidden xs:inline">Room</span>
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
                className={`flex items-center gap-0 rounded-xl px-2.5 py-2 text-[13px] transition-colors xs:gap-2 xs:px-3 ${
                  active ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon size={15} className={active ? "text-accent-ink" : ""} aria-hidden="true" />
                <span className="hidden xs:inline">{label}</span>
              </button>
            </li>
          );
        })}
        <li className="shrink-0">
          <button
            type="button"
            onClick={actions.openRobotChat}
            aria-label="Ask robot"
            title="Ask robot"
            className="flex items-center gap-0 rounded-xl px-2.5 py-2 text-[13px] text-muted transition-colors hover:text-ink xs:gap-2 xs:px-3"
          >
            <Bot size={15} aria-hidden="true" />
            <span className="hidden xs:inline">Ask robot</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
