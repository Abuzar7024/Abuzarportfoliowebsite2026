import type { WinSpec } from "./fs";

/** Window manager state for AK-OS, as a pure reducer (unit-tested). */

export interface Win extends WinSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

export interface WmState {
  wins: Win[];
  top: number;
  focused: string | null;
}

export interface Area {
  w: number;
  h: number;
}

export type WmAction =
  | { type: "open"; spec: WinSpec; area: Area }
  | { type: "close"; key: string }
  | { type: "focus"; key: string }
  | { type: "minimize"; key: string }
  | { type: "toggleMax"; key: string }
  | { type: "move"; key: string; x: number; y: number; area: Area }
  /** Taskbar click: minimise if focused, otherwise restore and focus. */
  | { type: "taskbar"; key: string };

export const initialWm: WmState = { wins: [], top: 1, focused: null };

/** Below this width every window opens maximised (phones, small screens). */
export const COMPACT_WIDTH = 720;

function raise(state: WmState, key: string, patch: Partial<Win> = {}): WmState {
  const top = state.top + 1;
  return { ...state, top, focused: key, wins: state.wins.map((w) => (w.key === key ? { ...w, ...patch, z: top } : w)) };
}

export function wmReducer(state: WmState, action: WmAction): WmState {
  switch (action.type) {
    case "open": {
      const { spec, area } = action;
      if (state.wins.some((w) => w.key === spec.key)) {
        // Same window, possibly new content (e.g. Explorer at another path).
        const s = raise(state, spec.key, { minimized: false });
        return { ...s, wins: s.wins.map((w) => (w.key === spec.key ? { ...w, title: spec.title, props: spec.props } : w)) };
      }
      const w = Math.max(320, Math.min(area.w * 0.7, 980));
      const h = Math.max(260, Math.min(area.h * 0.78, 720));
      const step = (state.wins.length % 6) * 26;
      const top = state.top + 1;
      const win: Win = {
        ...spec,
        w,
        h,
        x: Math.max(0, Math.min((area.w - w) / 2 + step - 50, area.w - w)),
        y: Math.max(0, Math.min((area.h - h) / 2 + step - 40, area.h - h)),
        z: top,
        minimized: false,
        maximized: area.w < COMPACT_WIDTH,
      };
      return { wins: [...state.wins, win], top, focused: spec.key };
    }
    case "close": {
      const wins = state.wins.filter((w) => w.key !== action.key);
      const next = [...wins].filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
      return { ...state, wins, focused: state.focused === action.key ? (next?.key ?? null) : state.focused };
    }
    case "focus":
      return state.focused === action.key ? state : raise(state, action.key, { minimized: false });
    case "minimize": {
      const wins = state.wins.map((w) => (w.key === action.key ? { ...w, minimized: true } : w));
      const next = wins.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0];
      return { ...state, wins, focused: next?.key ?? null };
    }
    case "toggleMax":
      return raise(state, action.key, { maximized: !state.wins.find((w) => w.key === action.key)?.maximized });
    case "move": {
      const { area } = action;
      return {
        ...state,
        wins: state.wins.map((w) =>
          w.key === action.key
            ? {
                ...w,
                // Keep at least part of the title bar reachable.
                x: Math.min(Math.max(action.x, 80 - w.w), area.w - 80),
                y: Math.min(Math.max(action.y, 0), area.h - 40),
              }
            : w
        ),
      };
    }
    case "taskbar": {
      const win = state.wins.find((w) => w.key === action.key);
      if (!win) return state;
      if (state.focused === action.key && !win.minimized) return wmReducer(state, { type: "minimize", key: action.key });
      return raise(state, action.key, { minimized: false });
    }
  }
}
