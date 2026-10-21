import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { education } from "../../data/experience";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { Interactive } from "./Interactive";
import { Plant } from "./Desk";
import { certificateTexture, mulberry32 } from "./textures";
import { ROOM } from "./Room";

const WALL_X = ROOM.halfW - 0.02;
const SHELF = { z0: -2.75, z1: -1.05, depth: 0.26, heights: [1.0, 1.45, 1.9] };
const BOOK_COLORS = ["#2b2e34", "#3a3e45", "#c9ced6", "#8b929d", "#b3141c", "#1c1e22"].map((c) => new THREE.Color(c));

/** Books on each shelf, all one InstancedMesh. */
function Books() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const books = useMemo(() => {
    const rand = mulberry32(64);
    const out: { y: number; z: number; w: number; h: number; d: number; lean: number; c: THREE.Color }[] = [];
    SHELF.heights.forEach((y, shelf) => {
      // Leave room for the plant and ornaments on part of each shelf.
      let z = SHELF.z0 + 0.05 + (shelf === 1 ? 0.55 : 0);
      const end = shelf === 2 ? SHELF.z0 + 0.95 : SHELF.z1 - 0.05;
      while (z < end) {
        const w = 0.025 + rand() * 0.03;
        const h = 0.17 + rand() * 0.09;
        const lean = rand() < 0.08 ? 0.25 : 0;
        out.push({ y: y + 0.018 + h / 2, z: z + w / 2, w, h, d: 0.15 + rand() * 0.05, lean, c: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)] });
        z += w + 0.003 + (lean ? 0.04 : 0);
      }
    });
    return out;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.75 }), []);
  useEffect(() => () => mat.dispose(), [mat]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    books.forEach((b, i) => {
      dummy.position.set(-b.d / 2 - 0.02, b.y, b.z);
      dummy.rotation.set(b.lean, 0, 0);
      dummy.scale.set(b.d, b.h, b.w);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, b.c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [books]);

  return <instancedMesh ref={ref} args={[geo.box(1, 1, 1), mat, books.length]} castShadow />;
}

function Certificate({ index, position }: { index: number; position: [number, number, number] }) {
  const m = getMaterials();
  const e = education[index];
  const tex = certificateTexture(e.id, { title: e.degree.replace(/\s*\(.*\)/, "").toUpperCase(), school: e.school, meta: `${e.years} · ${e.status}` });
  return (
    <group position={position}>
      <mesh geometry={geo.box(0.62, 0.46, 0.03)} material={m.trim} castShadow />
      <mesh geometry={geo.plane(0.56, 0.4)} position={[0, 0, 0.016]}>
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function Shelf() {
  const m = getMaterials();
  const len = SHELF.z1 - SHELF.z0;
  const zc = (SHELF.z0 + SHELF.z1) / 2;
  return (
    <Interactive id="shelf" anchor={[-0.3, 2.35, -2.2]} position={[WALL_X, 0, 0]}>
      {SHELF.heights.map((y) => (
        <group key={y}>
          <mesh geometry={geo.box(SHELF.depth, 0.035, len)} material={m.wood} position={[-SHELF.depth / 2, y, zc]} castShadow receiveShadow />
          {/* Hidden bracket glow */}
          <mesh geometry={geo.box(0.004, 0.004, len - 0.1)} material={m.neon} position={[-SHELF.depth + 0.01, y - 0.02, zc]} />
        </group>
      ))}
      <Books />
      <Plant position={[-0.13, SHELF.heights[2] + 0.018, SHELF.z1 - 0.25]} scale={1.1} seed={5} />
      {/* A faceted crystal ornament and a small chrome sphere */}
      <mesh geometry={geo.custom("ornament", () => new THREE.OctahedronGeometry(0.06, 0))} material={m.chrome} position={[-0.13, SHELF.heights[1] + 0.1, SHELF.z0 + 0.2]} scale={[1, 1.5, 1]} castShadow />
      <mesh geometry={geo.sphere(0.045, 24, 16)} material={m.red} position={[-0.13, SHELF.heights[1] + 0.063, SHELF.z0 + 0.38]} castShadow />
      {/* Education certificates on the back wall, beside the shelves */}
      <group position={[-WALL_X, 0, ROOM.back + 0.02]}>
        <Certificate index={0} position={[2.78, 1.95, 0]} />
        <Certificate index={1} position={[3.48, 1.95, 0]} />
      </group>
      {/* Tall floor plant in the corner */}
      <Plant position={[-0.45, 0, ROOM.back + 0.45]} scale={3.4} seed={9} />
    </Interactive>
  );
}
