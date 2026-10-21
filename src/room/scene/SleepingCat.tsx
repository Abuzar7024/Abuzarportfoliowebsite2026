import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { geo } from "./geometry";
import { getMaterials } from "./materials";
import { Interactive } from "./Interactive";
import { DESK } from "./Desk";
import { getState } from "../store";
import { fabricTexture } from "./textures";

/**
 * A grey cat asleep in a curl on the desk. Breathes slowly, flicks the tip of
 * its tail, and twitches an ear (and its tail) when petted (catPing).
 */
export function SleepingCat() {
  const body = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const tailTip = useRef<THREE.Group>(null);
  const petAt = useRef(-10);
  const lastPing = useRef(getState().catPing);
  const m = getMaterials();

  const fur = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8e949d", map: fabricTexture("#8a9099", "fur"), roughness: 1 }),
    []
  );
  const furDark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5c616a", roughness: 1 }), []);
  const nose = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c46b72", roughness: 0.6 }), []);
  useEffect(() => () => [fur, furDark, nose].forEach((x) => x.dispose()), [fur, furDark, nose]);

  // Tail curls around the front of the body; the last segment is animated separately.
  const tail = geo.tube(
    "cat-tail",
    [
      [0.13, 0.04, -0.04],
      [0.16, 0.035, 0.05],
      [0.08, 0.03, 0.12],
      [-0.04, 0.028, 0.13],
    ],
    0.022,
    40
  );
  const tip = geo.tube("cat-tail-tip", [[0, 0, 0], [-0.04, 0.004, 0.006], [-0.08, 0.012, 0]], 0.019, 16);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const s = getState();
    if (s.catPing !== lastPing.current) {
      lastPing.current = s.catPing;
      petAt.current = t;
    }
    const sincePet = t - petAt.current;
    const breath = Math.sin(t * 1.4);
    if (body.current) {
      body.current.scale.set(1 + breath * 0.018, 1 + breath * 0.035, 1 + breath * 0.012);
    }
    if (earL.current) {
      const twitch = sincePet < 0.5 ? Math.sin(sincePet * 40) * 0.35 : Math.sin(t * 0.3) > 0.995 ? 0.2 : 0;
      earL.current.rotation.z = THREE.MathUtils.damp(earL.current.rotation.z, twitch, 18, dt);
    }
    if (tailTip.current) {
      const wiggle = sincePet < 1.5 ? Math.sin(sincePet * 12) * 0.5 : Math.sin(t * 0.7) * 0.18;
      tailTip.current.rotation.y = wiggle;
    }
  });

  return (
    <Interactive id="cat" anchor={[0, 0.2, 0]} position={[DESK.x - 0.78, DESK.top, DESK.z + 0.14]} rotation={[0, 0.35, 0]}>
      <group ref={body}>
        {/* Curled body */}
        <mesh geometry={geo.sphere(0.1, 28, 20)} material={fur} scale={[1.45, 0.72, 1.15]} position={[0.02, 0.07, 0]} castShadow />
        <mesh geometry={geo.sphere(0.08, 24, 16)} material={fur} scale={[1.1, 0.75, 1]} position={[0.1, 0.065, -0.03]} />
        {/* Stripes along the back */}
        {[-0.04, 0.02, 0.08].map((x) => (
          <mesh key={x} geometry={geo.torus(0.085, 0.006, 6, 24, Math.PI)} material={furDark} position={[x, 0.07, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1, 0.85, 1.2]} />
        ))}
      </group>
      {/* Head tucked on the front paws */}
      <group position={[-0.13, 0.065, 0.05]} rotation={[0, 0.5, 0.1]}>
        <mesh geometry={geo.sphere(0.058, 24, 18)} material={fur} scale={[1, 0.86, 0.95]} castShadow />
        <mesh geometry={geo.sphere(0.028, 16, 12)} material={fur} position={[-0.04, -0.012, 0.012]} scale={[1, 0.75, 1.1]} />
        <mesh geometry={geo.sphere(0.008, 10, 8)} material={nose} position={[-0.064, -0.004, 0.014]} />
        {/* Closed eyes: little arcs */}
        {[-0.02, 0.026].map((z) => (
          <mesh key={z} geometry={geo.torus(0.012, 0.0022, 4, 12, Math.PI)} material={m.plasticDark} position={[-0.046, 0.016, z]} rotation={[0, Math.PI / 2, Math.PI]} />
        ))}
        {/* Ears */}
        <group ref={earL} position={[0.0, 0.045, 0.03]}>
          <mesh geometry={geo.cone(0.022, 0.045, 4)} material={fur} rotation={[0.3, 0, -0.2]} />
        </group>
        <group position={[0.012, 0.045, -0.025]}>
          <mesh geometry={geo.cone(0.022, 0.045, 4)} material={fur} rotation={[-0.3, 0, -0.2]} />
        </group>
      </group>
      {/* Front paws */}
      <mesh geometry={geo.capsule(0.017, 0.05, 4)} material={fur} position={[-0.16, 0.017, 0.1]} rotation={[0, 0.3, Math.PI / 2]} />
      <mesh geometry={geo.capsule(0.017, 0.045, 4)} material={fur} position={[-0.15, 0.017, 0.055]} rotation={[0, 0.1, Math.PI / 2]} />
      {/* Tail */}
      <mesh geometry={tail} material={fur} />
      <group ref={tailTip} position={[-0.04, 0.028, 0.13]}>
        <mesh geometry={tip} material={furDark} />
      </group>
    </Interactive>
  );
}
