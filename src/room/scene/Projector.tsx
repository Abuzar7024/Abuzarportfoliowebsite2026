import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { anchors, getState, pinElements, screen } from "../store";
import { SCREEN } from "./ComputerMonitor";

/** Below this projected size the computer UI goes full-screen so it stays readable. */
const MIN_W = 720;
const MIN_H = 450;

/**
 * Every frame, projects 3D anchors to screen space and writes the result
 * straight onto the DOM: hotspot pins follow their objects, and the monitor
 * interface is sized to the screen's projected rectangle.
 */
export function Projector() {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const corners = useMemo(
    () => [
      new THREE.Vector3(-SCREEN.w / 2, SCREEN.h / 2, 0),
      new THREE.Vector3(SCREEN.w / 2, SCREEN.h / 2, 0),
      new THREE.Vector3(-SCREEN.w / 2, -SCREEN.h / 2, 0),
      new THREE.Vector3(SCREEN.w / 2, -SCREEN.h / 2, 0),
    ],
    []
  );
  const lastRect = useRef("");
  const lastPins = useRef(new Map<string, { vis: string; tx: number; ty: number }>());

  useFrame(() => {
    const s = getState();
    const showPins = s.view === "room" && s.arrived;

    pinElements.forEach((el, id) => {
      const anchor = anchors.get(id);
      let prev = lastPins.current.get(id);
      if (!prev) {
        prev = { vis: "", tx: -9999, ty: -9999 };
        lastPins.current.set(id, prev);
      }

      if (!anchor || !showPins) {
        if (prev.vis !== "false") {
          prev.vis = "false";
          el.dataset.visible = "false";
        }
        return;
      }

      anchor.getWorldPosition(v);
      v.project(camera);
      const onScreen = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      const visStr = onScreen ? "true" : "false";
      if (prev.vis !== visStr) {
        prev.vis = visStr;
        el.dataset.visible = visStr;
      }
      if (onScreen) {
        const tx = Math.round(((v.x + 1) / 2) * size.width * 2) / 2;
        const ty = Math.round(((1 - v.y) / 2) * size.height * 2) / 2;
        if (tx !== prev.tx || ty !== prev.ty) {
          prev.tx = tx;
          prev.ty = ty;
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
      }
    });

    const overlay = screen.overlay;
    const mesh = screen.mesh;
    if (overlay && mesh && s.view === "monitor") {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const c of corners) {
        v.copy(c).applyMatrix4(mesh.matrixWorld).project(camera);
        const x = ((v.x + 1) / 2) * size.width;
        const y = ((1 - v.y) / 2) * size.height;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      const w = maxX - minX;
      const h = maxY - minY;
      const full = w < MIN_W || h < MIN_H;
      const key = `${Math.round(minX)},${Math.round(minY)},${Math.round(w)},${Math.round(h)},${full}`;
      if (key !== lastRect.current) {
        lastRect.current = key;
        overlay.style.setProperty("--sx", `${minX}px`);
        overlay.style.setProperty("--sy", `${minY}px`);
        overlay.style.setProperty("--sw", `${w}px`);
        overlay.style.setProperty("--sh", `${h}px`);
        overlay.dataset.full = String(full);
      }
    }
  });

  return null;
}

/**
 * Adaptive resolution: measures the real frame rate and steps the pixel ratio
 * down when it drops (or back up when there is headroom). Also sheds heavy
 * effects if FPS stays low. The measured rate is exposed on `window.__roomFps`.
 */
export function AdaptiveQuality({
  min = 0.7,
  max,
  onLowFps,
}: {
  min?: number;
  max: number;
  onLowFps?: () => void;
}) {
  const { setDpr } = useThree();
  const dpr = useRef(max);
  const frames = useRef(0);
  const since = useRef(performance.now());
  const droppedEffects = useRef(false);

  useFrame((_, delta) => {
    // Ignore pauses caused by on-demand rendering (e.g. inside AK-OS) or background tabs.
    if (delta > 0.25 || document.hidden) {
      frames.current = 0;
      since.current = performance.now();
      return;
    }
    frames.current++;
    const now = performance.now();
    const elapsed = now - since.current;
    if (elapsed < 1200) return;
    const fps = (frames.current * 1000) / elapsed;
    (window as unknown as { __roomFps?: number }).__roomFps = Math.round(fps);
    frames.current = 0;
    since.current = now;
    if (fps < 45) {
      if (!droppedEffects.current && onLowFps) {
        droppedEffects.current = true;
        onLowFps();
      } else if (dpr.current > min) {
        dpr.current = Math.max(min, dpr.current - 0.2);
        setDpr(dpr.current);
      }
    } else if (fps > 58 && dpr.current < max && !droppedEffects.current) {
      dpr.current = Math.min(max, dpr.current + 0.15);
      setDpr(dpr.current);
    }
  });
  return null;
}
