import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { DESK } from "./Desk";

const U = 0.0235; // one key unit, metres
const GAP = 0.0035;

/** Row layouts in key units: a compact 75% board. "r" marks signal-red keys. */
const ROWS: (number | [number, "r" | "s"])[][] = [
  [[1, "r"], 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, [1.5, "s"]],
  [[1.5, "s"], 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [[1.75, "s"], 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, [1.75, "r"]],
  [[2.25, "s"], 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, [1.75, "s"]],
  [[1.25, "s"], [1.25, "s"], [1.25, "s"], 6.25, [1.25, "s"], [1.25, "s"], [1.75, "s"]],
];

const COLORS = { k: new THREE.Color("#2e3137"), s: new THREE.Color("#9aa1ab"), r: new THREE.Color("#d9252d") };

export function Keyboard() {
  const m = getMaterials();
  const keysRef = useRef<THREE.InstancedMesh>(null);

  const keys = useMemo(() => {
    const out: { x: number; z: number; w: number; c: keyof typeof COLORS }[] = [];
    ROWS.forEach((row, r) => {
      const widths = row.map((k) => (Array.isArray(k) ? k[0] : k));
      const total = widths.reduce((a, b) => a + b, 0) * U;
      let x = -total / 2;
      row.forEach((k) => {
        const [w, c] = Array.isArray(k) ? k : [k, "k" as const];
        out.push({ x: x + (w * U) / 2, z: (r - 2) * U, w: w * U - GAP, c });
        x += w * U;
      });
    });
    return out;
  }, []);

  // Key caps share one unit geometry, stretched per key.
  const capGeo = geo.rbox(1, 1, 1, 0.12, 2);
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55 }), []);
  useEffect(() => () => capMat.dispose(), [capMat]);

  useEffect(() => {
    const mesh = keysRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    keys.forEach((k, i) => {
      dummy.position.set(k.x, 0.022, k.z);
      dummy.scale.set(k.w, 0.012, U - GAP);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, COLORS[k.c]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [keys]);

  return (
    <group position={[DESK.x - 0.02, DESK.top, DESK.z + 0.22]} rotation={[0, 0.02, 0]}>
      {/* Mousepad */}
      <mesh geometry={geo.rbox(0.82, 0.004, 0.3, 0.002)} material={m.fabric} position={[0.1, 0.002, 0]} receiveShadow />
      <mesh geometry={geo.box(0.82, 0.0045, 0.006)} material={m.red} position={[0.1, 0.002, 0.15]} />
      {/* Case, slightly raised at the back */}
      <group rotation={[0.06, 0, 0]} position={[0, 0.004, 0]}>
        <mesh geometry={geo.rbox(0.37, 0.022, 0.135, 0.008)} material={m.plastic} position={[0, 0.011, 0]} castShadow />
        <mesh geometry={geo.box(0.35, 0.002, 0.118)} material={m.plasticDark} position={[0, 0.0225, 0]} />
        <instancedMesh ref={keysRef} args={[capGeo, capMat, keys.length]} castShadow />
      </group>
      {/* Mouse */}
      <group position={[0.31, 0.004, 0.01]}>
        <mesh geometry={geo.sphere(0.03, 24, 16)} material={m.plastic} scale={[0.9, 0.55, 1.45]} position={[0, 0.014, 0]} castShadow />
        <mesh geometry={geo.box(0.002, 0.006, 0.03)} material={m.plasticDark} position={[0, 0.03, -0.02]} />
        <mesh geometry={geo.cyl(0.005, 0.005, 0.005, 12)} material={m.red} rotation={[0, 0, Math.PI / 2]} position={[0, 0.031, -0.018]} />
      </group>
    </group>
  );
}
