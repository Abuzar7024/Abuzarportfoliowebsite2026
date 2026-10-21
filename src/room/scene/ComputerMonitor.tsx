import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { Interactive } from "./Interactive";
import { DESK } from "./Desk";
import { screen as screenRef, useRoom } from "../store";
import { fontsReady } from "./textures";

/** Visible screen size in metres (16:10, matching the OS overlay). */
export const SCREEN = { w: 0.74, h: 0.4625 };
const BEZEL = 0.07;

/**
 * Idle screen: an animated "AK-OS" lock screen painted on a canvas a few
 * times a second. When the computer is opened, the crisp HTML interface is
 * laid over this exact rectangle instead (see os/Desktop.tsx).
 */
function useScreensaver() {
  const { canvas, ctx, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 640;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, ctx: c.getContext("2d")!, texture: t };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const fontsOk = useRef(false);
  useEffect(() => {
    fontsReady(['80px "Michroma"', '24px "JetBrains Mono"']).then(() => (fontsOk.current = true));
  }, []);

  const last = useRef(-1);
  const paint = (t: number, hovered: boolean) => {
    const W = canvas.width;
    const H = canvas.height;
    const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
    bg.addColorStop(0, "#1b1d22");
    bg.addColorStop(1, "#0c0d0f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(201,207,216,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // Orbiting signal around the logo.
    const cx = W / 2;
    const cy = H / 2 - 30;
    ctx.strokeStyle = "rgba(201,207,216,0.25)";
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#e3262e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, t * 1.4, t * 1.4 + 1.1);
    ctx.stroke();
    ctx.fillStyle = "#eef1f5";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `80px ${fontsOk.current ? '"Michroma"' : "sans-serif"}`;
    ctx.fillText("AK", cx, cy + 4);
    ctx.font = `600 26px ${fontsOk.current ? '"JetBrains Mono"' : "monospace"}`;
    ctx.fillStyle = "#c4cad3";
    ctx.fillText("A K - O S   v 2 . 0", cx, cy + 190);
    const blink = Math.floor(t * 2) % 2 === 0;
    ctx.fillStyle = hovered ? "#ff5058" : "#8b929d";
    ctx.font = `500 24px ${fontsOk.current ? '"JetBrains Mono"' : "monospace"}`;
    ctx.fillText(`> CLICK TO BOOT${blink ? " _" : "  "}`, cx, cy + 240);
    const now = new Date();
    ctx.textAlign = "right";
    ctx.fillStyle = "#8b929d";
    ctx.font = `500 22px ${fontsOk.current ? '"JetBrains Mono"' : "monospace"}`;
    ctx.fillText(now.toTimeString().slice(0, 5), W - 36, 44);
    ctx.textAlign = "left";
    ctx.fillText("ABUZAR KHAN", 36, 44);
    // Scanlines.
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    texture.needsUpdate = true;
  };

  return {
    texture,
    tick(t: number, hovered: boolean) {
      // ~8 fps is plenty for a lock screen and keeps canvas uploads cheap.
      const frame = Math.floor(t * 8);
      if (frame === last.current) return;
      last.current = frame;
      paint(t, hovered);
    },
  };
}

export function ComputerMonitor() {
  const m = getMaterials();
  const screenMesh = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);
  const saver = useScreensaver();
  const view = useRoom((s) => s.view);
  const hovered = useRoom((s) => s.hovered === "monitor");

  useEffect(() => {
    screenRef.mesh = screenMesh.current;
    return () => {
      screenRef.mesh = null;
    };
  }, []);

  useFrame(({ clock }) => {
    if (view !== "monitor") saver.tick(clock.elapsedTime, hovered);
    if (glow.current) glow.current.intensity = view === "monitor" ? 2.4 : 1.4;
  });

  const bw = SCREEN.w + BEZEL * 2;
  const bh = SCREEN.h + BEZEL * 2 + 0.04;
  const y = DESK.top + 0.17 + bh / 2;
  const z = DESK.z - 0.12;

  return (
    <Interactive id="monitor" anchor={[0, bh / 2 + 0.08, 0]} position={[DESK.x, y, z]}>
      {/* Front bezel and deep retro housing tapering to the back */}
      <mesh geometry={geo.rbox(bw, bh, 0.09, 0.03)} material={m.plastic} castShadow />
      <mesh geometry={geo.custom("monitor-back", () => {
        const g = new THREE.BoxGeometry(bw * 0.86, bh * 0.82, 0.34, 1, 1, 1);
        // Taper the rear face for the CRT silhouette.
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          if (p.getZ(i) < 0) {
            p.setX(i, p.getX(i) * 0.7);
            p.setY(i, p.getY(i) * 0.72);
          }
        }
        g.computeVertexNormals();
        return g;
      })} material={m.plastic} position={[0, 0.01, -0.21]} castShadow />
      {/* Vents on the back */}
      {[-0.06, -0.02, 0.02, 0.06].map((vy) => (
        <mesh key={vy} geometry={geo.box(0.3, 0.008, 0.01)} material={m.plasticDark} position={[0, vy + 0.05, -0.385]} />
      ))}
      {/* Silver trim, recessed screen, glass */}
      <mesh geometry={geo.rbox(SCREEN.w + 0.03, SCREEN.h + 0.03, 0.01, 0.008)} material={m.metal} position={[0, 0.02, 0.043]} />
      <mesh ref={screenMesh} geometry={geo.plane(SCREEN.w, SCREEN.h)} position={[0, 0.02, 0.05]}>
        <meshBasicMaterial map={saver.texture} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.plane(SCREEN.w, SCREEN.h)} material={m.glass} position={[0, 0.02, 0.052]} />
      {/* Chin: badge, power LED, buttons */}
      <mesh geometry={geo.box(0.07, 0.016, 0.004)} material={m.metal} position={[-bw / 2 + 0.12, -bh / 2 + 0.035, 0.046]} />
      <mesh geometry={geo.sphere(0.007, 12, 8)} material={m.neon} position={[bw / 2 - 0.1, -bh / 2 + 0.035, 0.046]} />
      {[0, 1].map((i) => (
        <mesh key={i} geometry={geo.cyl(0.008, 0.008, 0.008, 12)} material={m.plasticDark} rotation={[Math.PI / 2, 0, 0]} position={[bw / 2 - 0.15 - i * 0.03, -bh / 2 + 0.035, 0.046]} />
      ))}
      {/* Stand */}
      <mesh geometry={geo.rbox(0.12, 0.16, 0.12, 0.02)} material={m.plasticDark} position={[0, -bh / 2 - 0.06, -0.12]} />
      <mesh geometry={geo.rbox(0.36, 0.025, 0.26, 0.01)} material={m.plastic} position={[0, -bh / 2 - 0.155, -0.1]} castShadow receiveShadow />
      <pointLight ref={glow} color="#d6dde8" intensity={1.4} distance={1.8} decay={2} position={[0, 0.02, 0.35]} />
    </Interactive>
  );
}
