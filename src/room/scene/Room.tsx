import React, { useMemo } from "react";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { brandFont } from "../../three/brandFont";

/** Room extents in metres. The camera side (+z) is left open. */
export const ROOM = {
  halfW: 4,
  back: -3.2,
  front: 3.8,
  height: 3.4,
  window: { left: -2.1, right: 2.1, bottom: 0.45, top: 3.05 },
};

const T = 0.2; // wall thickness

function Wall({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  const m = getMaterials();
  return (
    <mesh
      geometry={geo.box(x1 - x0, y1 - y0, T)}
      material={m.wall}
      position={[(x0 + x1) / 2, (y0 + y1) / 2, ROOM.back - T / 2]}
      receiveShadow
    />
  );
}

function WindowFrame() {
  const m = getMaterials();
  const { left, right, bottom, top } = ROOM.window;
  const w = right - left;
  const h = top - bottom;
  const z = ROOM.back;
  const bar = 0.06;
  const mullions = [-0.7, 0.7];
  return (
    <group>
      {/* Outer frame */}
      <mesh geometry={geo.box(w + bar * 2, bar, 0.14)} material={m.trim} position={[0, top + bar / 2, z]} />
      <mesh geometry={geo.box(bar, h, 0.14)} material={m.trim} position={[left - bar / 2, bottom + h / 2, z]} />
      <mesh geometry={geo.box(bar, h, 0.14)} material={m.trim} position={[right + bar / 2, bottom + h / 2, z]} />
      {/* Mullions and transom */}
      {mullions.map((x) => (
        <mesh key={x} geometry={geo.box(0.035, h, 0.08)} material={m.trim} position={[x, bottom + h / 2, z]} />
      ))}
      <mesh geometry={geo.box(w, 0.035, 0.08)} material={m.trim} position={[0, bottom + h * 0.78, z]} />
      {/* Deep sill people can perch things on */}
      <mesh geometry={geo.box(w + 0.3, 0.05, 0.34)} material={m.wood} position={[0, bottom - 0.025, z + 0.12]} castShadow receiveShadow />
      <mesh geometry={geo.box(w + 0.3, 0.02, 0.02)} material={m.neon} position={[0, bottom - 0.055, z + 0.28]} />
      {/* Glass */}
      <mesh geometry={geo.plane(w, h)} material={m.glass} position={[0, bottom + h / 2, z - 0.01]} />
    </group>
  );
}

/** "AK" in red neon tubes on the back wall, with a dark mounting plate. */
function NeonSign() {
  const m = getMaterials();
  const text = useMemo(() => {
    const g = new TextGeometry("AK", { font: brandFont, size: 0.34, depth: 0.025, curveSegments: 4 });
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
    return g;
  }, []);
  React.useEffect(() => () => text.dispose(), [text]);
  return (
    <group position={[-3.05, 2.35, ROOM.back + 0.02]}>
      <mesh geometry={geo.rbox(1.1, 0.72, 0.03, 0.012)} material={m.plasticDark} />
      <mesh geometry={text} material={m.neon} position={[0, 0.07, 0.03]} />
      <mesh geometry={geo.box(0.74, 0.018, 0.018)} material={m.neon} position={[0, -0.2, 0.04]} />
      <pointLight color="#ff3b44" intensity={1.1} distance={2.4} decay={2} position={[0, 0, 0.4]} />
    </group>
  );
}

export function Room() {
  const m = getMaterials();
  const { halfW, back, front, height, window: win } = ROOM;
  const depth = front - back;
  const zc = (front + back) / 2;

  return (
    <group>
      {/* Floor and ceiling */}
      <mesh geometry={geo.plane(halfW * 2, depth)} material={m.floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} receiveShadow />
      <mesh geometry={geo.plane(halfW * 2, depth)} material={m.ceiling} rotation={[Math.PI / 2, 0, 0]} position={[0, height, zc]} />

      {/* Back wall around the window opening */}
      <Wall x0={-halfW} x1={win.left} y0={0} y1={height} />
      <Wall x0={win.right} x1={halfW} y0={0} y1={height} />
      <Wall x0={win.left} x1={win.right} y0={0} y1={win.bottom} />
      <Wall x0={win.left} x1={win.right} y0={win.top} y1={height} />

      {/* Side walls */}
      <mesh geometry={geo.box(T, height, depth)} material={m.wall} position={[-halfW - T / 2, height / 2, zc]} receiveShadow />
      <mesh geometry={geo.box(T, height, depth)} material={m.wall} position={[halfW + T / 2, height / 2, zc]} receiveShadow />

      {/* Skirting boards */}
      <mesh geometry={geo.box(halfW * 2, 0.09, 0.02)} material={m.trim} position={[0, 0.045, back + 0.01]} />
      <mesh geometry={geo.box(0.02, 0.09, depth)} material={m.trim} position={[-halfW + 0.01, 0.045, zc]} />
      <mesh geometry={geo.box(0.02, 0.09, depth)} material={m.trim} position={[halfW - 0.01, 0.045, zc]} />

      {/* Red neon cove line under the ceiling, back and sides */}
      <mesh geometry={geo.box(halfW * 2, 0.018, 0.018)} material={m.neon} position={[0, height - 0.06, back + 0.05]} />
      <mesh geometry={geo.box(0.018, 0.018, depth)} material={m.neon} position={[-halfW + 0.05, height - 0.06, zc]} />
      <mesh geometry={geo.box(0.018, 0.018, depth)} material={m.neon} position={[halfW - 0.05, height - 0.06, zc]} />

      {/* Ceiling light panel */}
      <mesh geometry={geo.rbox(1.6, 0.04, 0.5, 0.015)} material={m.plasticDark} position={[0.2, height - 0.03, -0.6]} />
      <mesh geometry={geo.plane(1.5, 0.4)} rotation={[Math.PI / 2, 0, 0]} position={[0.2, height - 0.052, -0.6]}>
        <meshBasicMaterial color="#d9dee6" toneMapped={false} />
      </mesh>

      <WindowFrame />
      <NeonSign />

      {/* Rug under the desk and chair */}
      <mesh geometry={geo.plane(3.3, 2.4)} material={m.rug} rotation={[-Math.PI / 2, 0, 0]} position={[0.25, 0.006, -1.55]} receiveShadow />
    </group>
  );
}

// Re-exported so the scene can size things relative to the window.
export const WINDOW_CENTER = new THREE.Vector3(0, (ROOM.window.bottom + ROOM.window.top) / 2, ROOM.back);
