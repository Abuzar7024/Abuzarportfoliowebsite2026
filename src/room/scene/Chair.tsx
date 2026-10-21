import React from "react";
import * as THREE from "three";
import { getMaterials } from "./materials";
import { geo } from "./geometry";

/** A task chair, built facing -z (towards the desk) and then turned in place. */
export function Chair({ position = [0.8, 0, -1.25], rotation = 0.55 }: { position?: [number, number, number]; rotation?: number }) {
  const m = getMaterials();
  const seatY = 0.48;
  const spokes = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Star base with casters */}
      {spokes.map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh geometry={geo.rbox(0.05, 0.035, 0.3, 0.012)} material={m.plasticDark} position={[0, 0.085, 0.15]} rotation={[-0.12, 0, 0]} castShadow />
          <group position={[0, 0.035, 0.29]}>
            <mesh geometry={geo.cyl(0.028, 0.028, 0.026, 16)} material={m.rubber} rotation={[0, 0, Math.PI / 2]} />
            <mesh geometry={geo.box(0.012, 0.04, 0.03)} material={m.metal} position={[0, 0.03, 0]} />
          </group>
        </group>
      ))}
      <mesh geometry={geo.cyl(0.05, 0.06, 0.05, 20)} material={m.plasticDark} position={[0, 0.1, 0]} />
      {/* Gas lift */}
      <mesh geometry={geo.cyl(0.024, 0.024, 0.28, 16)} material={m.chrome} position={[0, 0.26, 0]} />
      <mesh geometry={geo.cyl(0.034, 0.034, 0.1, 16)} material={m.plasticDark} position={[0, 0.17, 0]} />
      <mesh geometry={geo.rbox(0.22, 0.04, 0.22, 0.015)} material={m.metal} position={[0, seatY - 0.06, 0]} />
      {/* Seat */}
      <mesh geometry={geo.rbox(0.52, 0.09, 0.5, 0.04, 4)} material={m.fabric} position={[0, seatY, -0.02]} castShadow receiveShadow />
      {/* Backrest on a curved spine */}
      <mesh geometry={geo.rbox(0.06, 0.05, 0.22, 0.015)} material={m.plasticDark} position={[0, seatY - 0.01, 0.26]} />
      <mesh geometry={geo.rbox(0.06, 0.32, 0.05, 0.015)} material={m.plasticDark} position={[0, seatY + 0.12, 0.33]} rotation={[0.1, 0, 0]} />
      <group position={[0, seatY + 0.42, 0.33]} rotation={[0.12, 0, 0]}>
        <mesh geometry={geo.rbox(0.48, 0.62, 0.08, 0.04, 4)} material={m.fabric} castShadow />
        <mesh geometry={geo.box(0.36, 0.05, 0.02)} material={m.red} position={[0, -0.15, -0.04]} />
        <mesh geometry={geo.rbox(0.5, 0.64, 0.05, 0.03, 3)} material={m.plasticDark} position={[0, 0, 0.035]} />
        {/* Headrest */}
        <mesh geometry={geo.rbox(0.3, 0.14, 0.08, 0.035, 3)} material={m.fabric} position={[0, 0.42, -0.01]} />
        <mesh geometry={geo.box(0.04, 0.1, 0.03)} material={m.metal} position={[0, 0.32, 0.02]} />
      </group>
      {/* Armrests */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.29, seatY, 0.02]}>
          <mesh geometry={geo.rbox(0.035, 0.2, 0.05, 0.012)} material={m.plasticDark} position={[0, 0.1, 0]} />
          <mesh geometry={geo.rbox(0.07, 0.03, 0.26, 0.012)} material={m.plastic} position={[0, 0.21, -0.02]} castShadow />
        </group>
      ))}
    </group>
  );
}

export const CHAIR_DEFAULT = new THREE.Vector3(0.8, 0, -1.25);
