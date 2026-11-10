import React, { useRef } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
import type { Win, WmAction, Area } from "./windows";
import { OsIcon } from "./OsIcon";

interface WindowProps {
  win: Win;
  focused: boolean;
  area: Area;
  dispatch: React.Dispatch<WmAction>;
  children: React.ReactNode;
}

/** A desktop window: drag by the title bar, double-click it to maximise. */
export function Window({ win, focused, area, dispatch, children }: WindowProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const drag = useRef<{ dx: number; dy: number; x: number; y: number } | null>(null);
  if (win.minimized) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    if (win.maximized || (e.target as HTMLElement).closest("button")) return;
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y, x: win.x, y: win.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const nx = Math.min(Math.max(e.clientX - drag.current.dx, 80 - win.w), area.w - 80);
    const ny = Math.min(Math.max(e.clientY - drag.current.dy, 0), area.h - 40);
    drag.current.x = nx;
    drag.current.y = ny;
    if (sectionRef.current) {
      sectionRef.current.style.left = `${nx}px`;
      sectionRef.current.style.top = `${ny}px`;
    }
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const { x, y } = drag.current;
    drag.current = null;
    dispatch({ type: "move", key: win.key, x, y, area });
  };

  const style: React.CSSProperties = win.maximized
    ? { left: 0, top: 0, width: "100%", height: "100%", zIndex: win.z }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z };

  return (
    <section
      ref={sectionRef}
      role="dialog"
      aria-label={win.title}
      className={`os-window absolute flex flex-col overflow-hidden ${win.maximized ? "" : "rounded-xl"} ${focused ? "os-window--focused" : ""}`}
      style={style}
      onPointerDown={() => dispatch({ type: "focus", key: win.key })}
    >
      <header
        className="flex h-10 shrink-0 cursor-default select-none items-center gap-2.5 border-b border-white/[0.06] pl-3"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => dispatch({ type: "toggleMax", key: win.key })}
      >
        <OsIcon name={win.icon} size={15} />
        <h2 className="min-w-0 flex-1 truncate font-sans text-[12.5px] font-normal tracking-normal text-ink-2">{win.title}</h2>
        <div className="flex h-full">
          <button type="button" className="os-winbtn" onClick={() => dispatch({ type: "minimize", key: win.key })} aria-label={`Minimise ${win.title}`}>
            <Minus size={14} aria-hidden="true" />
          </button>
          <button type="button" className="os-winbtn" onClick={() => dispatch({ type: "toggleMax", key: win.key })} aria-label={win.maximized ? `Restore ${win.title}` : `Maximise ${win.title}`}>
            {win.maximized ? <Copy size={12} aria-hidden="true" /> : <Square size={12} aria-hidden="true" />}
          </button>
          <button type="button" className="os-winbtn os-winbtn--close" onClick={() => dispatch({ type: "close", key: win.key })} aria-label={`Close ${win.title}`}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain scrollbar-thin">{children}</div>
    </section>
  );
}
