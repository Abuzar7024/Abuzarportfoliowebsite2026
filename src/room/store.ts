import { useSyncExternalStore } from "react";
import type * as THREE from "three";

/**
 * Shared state for the 3D room. It is a tiny external store (no library)
 * because the R3F canvas and the DOM overlays live in different React
 * reconcilers and cannot share context.
 */

export type View = "room" | "monitor" | "posters" | "shelf";
export type AppId = "about" | "projects" | "experience" | "skills" | "resume" | "contact" | "assistant";

export interface RoomState {
  view: View;
  /** True once the camera has finished flying to the current view. */
  arrived: boolean;
  app: AppId;
  /** Bumped on every openApp so the OS re-focuses the window even for the same app. */
  appNonce: number;
  /** The robot's Q&A panel, shown over the room. */
  robotChat: boolean;
  /** Project opened from a wall poster (shown in a dialog over the room). */
  posterProject: string | null;
  hovered: string | null;
  lampOn: boolean;
  /** Incremented to make the robot wave / the cat stir. */
  robotPing: number;
  catPing: number;
}

let state: RoomState = {
  view: "room",
  arrived: true,
  app: "about",
  appNonce: 0,
  robotChat: false,
  posterProject: null,
  hovered: null,
  lampOn: true,
  robotPing: 0,
  catPing: 0,
};

const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<RoomState> | ((s: RoomState) => Partial<RoomState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  let changed = false;
  for (const k in next) {
    if (next[k as keyof RoomState] !== state[k as keyof RoomState]) changed = true;
  }
  if (!changed) return;
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoom<T>(select: (s: RoomState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state));
}

/* ── Actions ─────────────────────────────────────────────────────────── */

export const actions = {
  openApp(app: AppId) {
    setState({
      view: "monitor",
      app,
      appNonce: state.appNonce + 1,
      arrived: state.view === "monitor" ? state.arrived : false,
      posterProject: null,
      robotChat: false,
    });
  },
  backToRoom() {
    setState({ view: "room", arrived: false, posterProject: null, hovered: null });
  },
  openRobotChat() {
    setState({ robotChat: true, view: "room", posterProject: null });
  },
  closeRobotChat() {
    setState({ robotChat: false });
  },
  focus(view: View) {
    if (state.view !== view) setState({ view, arrived: false });
  },
  openPoster(id: string) {
    setState({ view: "posters", arrived: state.view === "posters" ? state.arrived : false, posterProject: id });
  },
  toggleLamp() {
    setState((s) => ({ lampOn: !s.lampOn }));
  },
  pingRobot() {
    setState((s) => ({ robotPing: s.robotPing + 1 }));
  },
  pingCat() {
    setState((s) => ({ catPing: s.catPing + 1 }));
  },
};

/* ── Registries shared between the canvas and DOM overlays ─────────────
   The scene writes screen-space positions straight into these elements every
   frame, so following the camera never re-renders React. */

export interface HotspotDef {
  id: string;
  /** Short name read out by screen readers and shown on the pin. */
  label: string;
  /** What happens, shown on hover: "Open computer". */
  hint: string;
  activate: () => void;
}

/** Every interactive object in the room. The DOM renders a focusable pin for each. */
export const HOTSPOTS: HotspotDef[] = [
  { id: "monitor", label: "Computer", hint: "Open the computer", activate: () => actions.openApp(getState().app) },
  { id: "posters", label: "Project wall", hint: "View project posters", activate: () => actions.focus("posters") },
  {
    id: "robot",
    label: "Robot assistant",
    hint: "Ask the robot about me",
    activate: () => {
      actions.pingRobot();
      actions.openRobotChat();
    },
  },
  { id: "cat", label: "Sleeping cat", hint: "Pet the cat", activate: () => actions.pingCat() },
  { id: "lamp", label: "Desk lamp", hint: "Toggle the lamp", activate: () => actions.toggleLamp() },
  { id: "shelf", label: "Credentials shelf", hint: "See education & skills", activate: () => actions.focus("shelf") },
];

/** World-space anchors for the pins, registered by the scene objects. */
export const anchors = new Map<string, THREE.Object3D>();
export const pinElements = new Map<string, HTMLElement>();

/** The monitor screen mesh (its corners define where the OS overlay sits). */
export const screen: { mesh: THREE.Mesh | null; overlay: HTMLElement | null } = { mesh: null, overlay: null };
