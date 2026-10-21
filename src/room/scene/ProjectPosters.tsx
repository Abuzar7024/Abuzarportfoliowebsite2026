import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { featuredProjects } from "../../data/projects";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { Interactive } from "./Interactive";
import { posterTexture } from "./textures";
import { actions, getState, setState, useRoom } from "../store";
import { pointerGesture } from "./gesture";
import { ROOM } from "./Room";

const POSTER = { w: 0.76, h: 1.07 };
export const POSTER_Z = [-2.55, -1.6, -0.65];
const WALL_X = -ROOM.halfW + 0.02;

const hostOf = (href?: string) => (href ? href.replace(/^https?:\/\//, "").replace(/\/$/, "") : "private build");

function Poster({ index }: { index: number }) {
  const m = getMaterials();
  const p = featuredProjects[index];
  const group = useRef<THREE.Group>(null);
  const view = useRoom((s) => s.view);
  const id = `poster-${p.id}`;
  const primary = p.links.find((l) => l.primary) ?? p.links[0];
  const tex = posterTexture(p.id, index, p.title, p.category, hostOf(primary?.href));

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const hovered = getState().hovered === id;
    const target = hovered ? 0.06 : 0;
    g.position.x = THREE.MathUtils.damp(g.position.x, target, 10, Math.min(delta, 0.05));
  });

  const active = view === "posters";
  return (
    <group
      ref={group}
      position={[0, 0, POSTER_Z[index]]}
      onPointerOver={(e) => {
        if (!active) return;
        e.stopPropagation();
        setState({ hovered: id });
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (getState().hovered === id) setState({ hovered: null });
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        if (!active || pointerGesture.dragged) return;
        e.stopPropagation();
        actions.openPoster(p.id);
      }}
    >
      <mesh geometry={geo.box(0.03, POSTER.h + 0.06, POSTER.w + 0.06)} material={m.trim} castShadow />
      <mesh geometry={geo.plane(POSTER.w, POSTER.h)} position={[0.017, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
      {/* Picture light */}
      <mesh geometry={geo.rbox(0.05, 0.03, 0.42, 0.01)} material={m.metal} position={[0.06, POSTER.h / 2 + 0.07, 0]} />
      <mesh geometry={geo.box(0.004, 0.006, 0.38)} material={m.neon} position={[0.087, POSTER.h / 2 + 0.058, 0]} />
    </group>
  );
}

export function ProjectPosters() {
  return (
    <Interactive id="posters" anchor={[0.3, 0.72, -1.6]} position={[WALL_X, 1.68, 0]}>
      {featuredProjects.map((p, i) => (
        <Poster key={p.id} index={i} />
      ))}
      {/* A single soft wash over the wall */}
      <pointLight color="#e8ecf2" intensity={2.4} distance={3.4} decay={2} position={[1.1, 0.9, -1.6]} />
    </Interactive>
  );
}
