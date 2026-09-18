import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { SceneCanvas } from "../../three/SceneCanvas";
import { NodeField } from "./NodeField";
import type { RenderProfile } from "../../hooks/useDeviceTier";
import type { PointerValues } from "../../hooks/usePointer";

/**
 * A slow-rotating wireframe armature sitting inside the node field. It gives the
 * ecosystem a structural spine so the composition reads as engineered rather
 * than a particle cloud. Skipped entirely on low tier.
 */
function Armature({ profile, reveal }: { profile: RenderProfile; reveal: MotionValue<number> }) {
  const ref = useRef<THREE.Group>(null);

  const rings = useMemo(() => {
    // Three orthogonal rings - a gyroscope silhouette.
    const geo = new THREE.TorusGeometry(3.05, 0.004, 3, 128);
    return [
      { geo, rot: [0, 0, 0] as const },
      { geo, rot: [Math.PI / 2, 0, 0] as const },
      { geo, rot: [0, Math.PI / 2, Math.PI / 3] as const },
    ];
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff2b3d"),
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    []
  );

  React.useEffect(() => {
    return () => {
      rings[0].geo.dispose();
      material.dispose();
    };
  }, [rings, material]);

  useFrame((_, delta) => {
    if (!ref.current || profile.reducedMotion) return;
    const dt = Math.min(delta, 0.05);
    ref.current.rotation.y += dt * 0.08;
    ref.current.rotation.x += dt * 0.03;
    material.opacity = 0.2 * reveal.get();
  });

  return (
    <group ref={ref}>
      {rings.map((r, i) => (
        <mesh key={i} geometry={r.geo} material={material} rotation={r.rot as unknown as THREE.Euler} />
      ))}
    </group>
  );
}

export interface HeroSceneProps {
  profile: RenderProfile;
  pointer: PointerValues;
  reveal: MotionValue<number>;
  scroll: MotionValue<number>;
  active: boolean;
  fallback: React.ReactNode;
}

/** Lazy entry point for the hero's 3D ecosystem layer. */
export default function HeroScene({ profile, pointer, reveal, scroll, active, fallback }: HeroSceneProps) {
  return (
    <SceneCanvas
      profile={profile}
      active={active}
      fallback={fallback}
      className="!fixed inset-0"
      camera={{ position: [0, 0, 9], fov: 42, near: 0.1, far: 40 }}
    >
      <NodeField profile={profile} pointer={pointer} reveal={reveal} scroll={scroll} />
      {profile.tier !== "low" && <Armature profile={profile} reveal={reveal} />}
    </SceneCanvas>
  );
}
