import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { Interactive } from "./Interactive";
import { useRoom } from "../store";

/** Desk placement, shared with the objects that sit on it. */
export const DESK = { x: 0, z: -2.35, w: 2.1, d: 0.85, top: 0.76 };

function Drawers() {
  const m = getMaterials();
  const h = DESK.top - 0.05;
  const w = 0.46;
  const d = DESK.d - 0.1;
  const x = DESK.x - DESK.w / 2 + w / 2 + 0.04;
  const fronts = [0.16, 0.16, 0.3];
  let y = h - 0.02;
  return (
    <group position={[x, 0, DESK.z]}>
      <mesh geometry={geo.rbox(w, h, d, 0.01)} material={m.plastic} position={[0, h / 2, 0]} castShadow receiveShadow />
      {fronts.map((fh, i) => {
        y -= fh + 0.012;
        const cy = y + fh / 2;
        return (
          <group key={i} position={[0, cy, d / 2 + 0.006]}>
            <mesh geometry={geo.rbox(w - 0.03, fh, 0.02, 0.006)} material={m.plasticDark} />
            <mesh geometry={geo.rbox(0.14, 0.014, 0.022, 0.006)} material={m.chrome} position={[0, fh * 0.25, 0.018]} />
          </group>
        );
      })}
      {/* Casters */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} geometry={geo.cyl(0.018, 0.018, 0.02, 12)} material={m.rubber} rotation={[0, 0, Math.PI / 2]} position={[sx * (w / 2 - 0.05), 0.018, sz * (d / 2 - 0.06)]} />
        ))
      )}
    </group>
  );
}

/** Steel U-frame leg on the open side of the desk. */
function FrameLeg() {
  const m = getMaterials();
  const x = DESK.x + DESK.w / 2 - 0.09;
  const h = DESK.top - 0.05;
  return (
    <group position={[x, 0, DESK.z]}>
      {[-1, 1].map((sz) => (
        <mesh key={sz} geometry={geo.box(0.05, h, 0.05)} material={m.metal} position={[0, h / 2, sz * (DESK.d / 2 - 0.08)]} castShadow />
      ))}
      <mesh geometry={geo.box(0.05, 0.05, DESK.d - 0.1)} material={m.metal} position={[0, 0.025, 0]} />
      <mesh geometry={geo.box(0.05, 0.05, DESK.d - 0.1)} material={m.metal} position={[0, h - 0.06, 0]} />
    </group>
  );
}

/** Articulated desk lamp. Click toggles it; the warm spotlight follows. */
function Lamp() {
  const m = getMaterials();
  const on = useRoom((s) => s.lampOn);
  const light = useRef<THREE.SpotLight>(null);
  const bulb = useRef<THREE.MeshBasicMaterial>(null);
  const level = useRef(on ? 1 : 0);
  const target = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);

  useFrame((_, delta) => {
    level.current = THREE.MathUtils.damp(level.current, on ? 1 : 0, 10, Math.min(delta, 0.05));
    if (light.current) light.current.intensity = level.current * 16;
    if (bulb.current) bulb.current.color.setRGB(0.25 + level.current * 1.8, 0.22 + level.current * 1.45, 0.2 + level.current * 0.95);
  });

  return (
    <Interactive id="lamp" anchor={[0.1, 0.62, 0]} position={[DESK.x - 0.82, DESK.top, DESK.z - 0.22]}>
      <mesh geometry={geo.cyl(0.085, 0.095, 0.022, 32)} material={m.plasticDark} position={[0, 0.011, 0]} castShadow />
      <mesh geometry={geo.sphere(0.022, 16, 12)} material={m.chrome} position={[0, 0.03, 0]} />
      {/* Lower arm */}
      <group position={[0, 0.03, 0]} rotation={[0, 0, -0.32]}>
        <mesh geometry={geo.cyl(0.011, 0.011, 0.36, 10)} material={m.red} position={[0, 0.18, 0]} castShadow />
        <group position={[0, 0.36, 0]}>
          <mesh geometry={geo.sphere(0.02, 16, 12)} material={m.chrome} />
          {/* Upper arm */}
          <group rotation={[0, 0, 1.25]}>
            <mesh geometry={geo.cyl(0.01, 0.01, 0.3, 10)} material={m.red} position={[0, 0.15, 0]} castShadow />
            <group position={[0, 0.3, 0]} rotation={[0, 0, 1.05]}>
              <mesh geometry={geo.sphere(0.018, 16, 12)} material={m.chrome} />
              {/* Shade */}
              <mesh geometry={geo.cone(0.075, 0.12, 24)} material={m.plasticDark} position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]} castShadow />
              <mesh geometry={geo.sphere(0.026, 16, 12)} position={[0, -0.1, 0]}>
                <meshBasicMaterial ref={bulb} color="#fff1d6" toneMapped={false} />
              </mesh>
              <spotLight
                ref={light}
                color="#ffd9a8"
                intensity={16}
                distance={3.6}
                angle={0.75}
                penumbra={0.65}
                decay={1.6}
                position={[0, -0.09, 0]}
                castShadow
                shadow-mapSize={[512, 512]}
                shadow-bias={-0.002}
              />
            </group>
          </group>
        </group>
      </group>
      <object3D ref={target} position={[0.35, -0.2, 0.2]} />
    </Interactive>
  );
}

function Mug() {
  const m = getMaterials();
  return (
    <group position={[DESK.x + 0.44, DESK.top, DESK.z + 0.28]}>
      <mesh geometry={geo.cyl(0.042, 0.038, 0.1, 28)} material={m.red} position={[0, 0.05, 0]} castShadow />
      <mesh geometry={geo.circle(0.036, 24)} material={m.soil} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.092, 0]} />
      <mesh geometry={geo.torus(0.026, 0.007, 8, 20)} material={m.red} position={[0.046, 0.05, 0]} />
    </group>
  );
}

function Speaker({ x }: { x: number }) {
  const m = getMaterials();
  return (
    <group position={[x, DESK.top, DESK.z - 0.18]} rotation={[0, -x * 0.35, 0]}>
      <mesh geometry={geo.rbox(0.14, 0.24, 0.16, 0.02)} material={m.plastic} position={[0, 0.12, 0]} castShadow />
      <mesh geometry={geo.circle(0.045, 28)} material={m.plasticDark} position={[0, 0.09, 0.081]} />
      <mesh geometry={geo.torus(0.045, 0.004, 6, 32)} material={m.chrome} position={[0, 0.09, 0.082]} />
      <mesh geometry={geo.sphere(0.012, 12, 8)} material={m.metal} position={[0, 0.09, 0.083]} scale={[1, 1, 0.4]} />
      <mesh geometry={geo.circle(0.02, 20)} material={m.plasticDark} position={[0, 0.18, 0.081]} />
      <mesh geometry={geo.sphere(0.005, 8, 6)} material={m.neon} position={[0.05, 0.025, 0.082]} />
    </group>
  );
}

/** A small potted plant: tapered pot and fanned, faceted leaves. */
export function Plant({ position, scale = 1, seed = 1 }: { position: [number, number, number]; scale?: number; seed?: number }) {
  const m = getMaterials();
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + seed;
    const tilt = 0.45 + ((i * 37 + seed * 11) % 7) * 0.06;
    return { a, tilt, len: 0.16 + ((i * 13 + seed) % 5) * 0.02, dark: i % 3 === 0 };
  });
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo.cyl(0.07, 0.055, 0.12, 24)} material={m.ceramic} position={[0, 0.06, 0]} castShadow />
      <mesh geometry={geo.circle(0.064, 20)} material={m.soil} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.115, 0]} />
      {leaves.map((l, i) => (
        <group key={i} position={[0, 0.11, 0]} rotation={[0, l.a, 0]}>
          <group rotation={[l.tilt, 0, 0]}>
            <mesh geometry={geo.cone(0.03, l.len, 4)} material={l.dark ? m.leafDark : m.leaf} position={[0, l.len / 2, 0]} scale={[1, 1, 0.25]} />
          </group>
        </group>
      ))}
    </group>
  );
}

function Notebook() {
  const m = getMaterials();
  return (
    <group position={[DESK.x - 0.5, DESK.top, DESK.z + 0.24]} rotation={[0, 0.25, 0]}>
      <mesh geometry={geo.box(0.21, 0.018, 0.28)} material={m.plasticDark} position={[0, 0.009, 0]} castShadow />
      <mesh geometry={geo.box(0.2, 0.012, 0.27)} material={m.paper} position={[0.004, 0.01, 0]} />
      <mesh geometry={geo.box(0.012, 0.02, 0.28)} material={m.red} position={[-0.1, 0.01, 0]} />
      <mesh geometry={geo.cyl(0.005, 0.005, 0.15, 8)} material={m.chrome} rotation={[Math.PI / 2, 0, 0.4]} position={[0.14, 0.006, 0.02]} />
    </group>
  );
}

function Cables() {
  const m = getMaterials();
  const y = DESK.top + 0.004;
  const z = DESK.z;
  return (
    <group>
      <mesh
        geometry={geo.tube("monitor-cable", [[0.05, y + 0.08, z - 0.32], [0.12, y + 0.01, z - 0.38], [0.2, y, z - 0.42], [0.32, y - 0.2, z - 0.44], [0.4, 0.02, z - 0.44]], 0.007)}
        material={m.rubber}
      />
      <mesh
        geometry={geo.tube("keyboard-cable", [[-0.05, y + 0.01, z + 0.25], [-0.12, y, z + 0.05], [-0.18, y, z - 0.2], [-0.1, y, z - 0.38]], 0.004)}
        material={m.rubber}
      />
    </group>
  );
}

export function Desk() {
  const m = getMaterials();
  return (
    <group>
      {/* Top with an edge band */}
      <mesh geometry={geo.rbox(DESK.w, 0.05, DESK.d, 0.012)} material={m.wood} position={[DESK.x, DESK.top - 0.025, DESK.z]} castShadow receiveShadow />
      <mesh geometry={geo.box(DESK.w - 0.02, 0.012, 0.012)} material={m.trim} position={[DESK.x, DESK.top - 0.05, DESK.z + DESK.d / 2 - 0.006]} />
      {/* Modesty panel */}
      <mesh geometry={geo.box(DESK.w - 0.6, 0.36, 0.018)} material={m.plastic} position={[DESK.x + 0.25, DESK.top - 0.24, DESK.z - DESK.d / 2 + 0.05]} />
      <Drawers />
      <FrameLeg />
      <Lamp />
      <Mug />
      <Speaker x={DESK.x - 0.62} />
      <Speaker x={DESK.x + 0.62} />
      <Plant position={[DESK.x + 0.88, DESK.top, DESK.z - 0.22]} seed={2} />
      <Notebook />
      <Cables />
    </group>
  );
}
