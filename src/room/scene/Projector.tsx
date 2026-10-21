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

  useFrame(() => {
    const s = getState();
    const showPins = s.view === "room" && s.arrived;

    pinElements.forEach((el, id) => {
      const anchor = anchors.get(id);
      if (!anchor || !showPins) {
        el.dataset.visible = "false";
        return;
      }
      anchor.getWorldPosition(v);
      v.project(camera);
      const onScreen = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      el.dataset.visible = onScreen ? "true" : "false";
      if (onScreen) {
        el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0)`;
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
 * down when it drops (or back up when there is headroom). The measured rate is
 * exposed on `window.__roomFps` for testing.
 */
export function AdaptiveQuality({ min = 0.75, max }: { min?: number; max: number }) {
  const { setDpr } = useThree();
  const dpr = useRef(max);
  const frames = useRef(0);
  const since = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    const elapsed = now - since.current;
    if (elapsed < 2000) return;
    const fps = (frames.current * 1000) / elapsed;
    (window as unknown as { __roomFps?: number }).__roomFps = Math.round(fps);
    frames.current = 0;
    since.current = now;
    if (fps < 42 && dpr.current > min) {
      dpr.current = Math.max(min, dpr.current - 0.25);
      setDpr(dpr.current);
    } else if (fps > 58 && dpr.current < max) {
      dpr.current = Math.min(max, dpr.current + 0.25);
      setDpr(dpr.current);
    }
  });
  return null;
}
