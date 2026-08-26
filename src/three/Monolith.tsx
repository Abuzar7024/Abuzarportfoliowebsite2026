import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import type { RenderProfile } from "../hooks/useDeviceTier";
import type { PointerValues } from "../hooks/usePointer";

const RED = "#ff2b3d";

export interface MonolithControls {
  /** Extra spin velocity (rad/s) injected by dragging; decays with inertia. */
  spin: MotionValue<number>;
  /** 1 on click → decays to 0; drives the pulse. */
  pulse: MotionValue<number>;
  /** 1 while the pointer is over the hero object area. */
  hover: MotionValue<number>;
}

interface MonolithProps {
  profile: RenderProfile;
  pointer: PointerValues;
  reveal: MotionValue<number>;
  stage: MotionValue<number>;
  scroll: MotionValue<number>;
  controls: MonolithControls;
}

/**
 * The signature object: a dark faceted crystal with a red core and orbiting satellites,
 * lit by a sweeping red light. Interactive: drag to spin (with inertia), click to pulse,
 * hover to energise the orbit. One mesh, one edge overlay, a ring of small spheres, four lights.
 */
export function Monolith({ profile, pointer, reveal, stage, scroll, controls }: MonolithProps) {
  const { viewport } = useThree();
  const root = useRef<THREE.Group>(null);
  const crystal = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const edges = useRef<THREE.LineSegments>(null);
  const core = useRef<THREE.Mesh>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const glow = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const spinY = useRef(0);
  const velocity = useRef(0);

  const geo = useMemo(() => new THREE.IcosahedronGeometry(1.3, 0), []);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geo, 1), [geo]);
  const satellites = useMemo(
    () =>
      Array.from({ length: profile.tier === "low" ? 4 : 7 }, (_, i) => ({
        a: (i / (profile.tier === "low" ? 4 : 7)) * Math.PI * 2,
        r: 2.05 + (i % 2) * 0.25,
        size: 0.055 + (i % 3) * 0.02,
      })),
    [profile.tier]
  );
  const glowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 128);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.35, "rgba(255,255,255,0.28)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((state, dt) => {
    const t = Math.min(dt, 0.05);
    const time = state.clock.elapsedTime;
    const r = reveal.get();
    const s = stage.get();
    const p = scroll.get();
    const hov = controls.hover.get();
    const pulse = controls.pulse.get();
    const wide = viewport.aspect > 1.05;
    const vw = viewport.width;
    const vh = viewport.height;

    // drag inertia
    velocity.current += controls.spin.get();
    controls.spin.set(0);
    velocity.current *= Math.pow(0.08, t); // friction
    spinY.current += velocity.current * t;

    // composition: centred (intro) → right column (desktop) / top band (phones)
    const size0 = Math.min(vw, vh) * 0.26;
    const size1 = wide ? Math.min(vh * 0.24, vw * 0.11) : Math.min(vw * 0.23, vh * 0.14);
    const x1 = wide ? vw * 0.25 : 0;
    const y1 = wide ? 0 : vh * 0.5 - vh * 0.22;
    const scale = THREE.MathUtils.lerp(size0, size1, s) * (0.55 + r * 0.45) * (1 - p * 0.1) * (1 + pulse * 0.08);
    tmp.set(THREE.MathUtils.lerp(0, x1, s), THREE.MathUtils.lerp(0, y1, s) + p * (wide ? 1.4 : 0.9), 0);

    const g = root.current;
    if (g) {
      g.position.lerp(tmp, 1 - Math.exp(-8 * t));
      g.scale.setScalar(scale);
      g.visible = p < 0.95;
      g.position.y += profile.reducedMotion ? 0 : Math.sin(time * 0.8) * 0.02 * scale;
    }
    const px = profile.reducedMotion ? 0 : pointer.sx.get();
    const py = profile.reducedMotion ? 0 : pointer.sy.get();
    if (crystal.current) {
      const auto = profile.reducedMotion ? 0 : time * (0.16 + hov * 0.12);
      crystal.current.rotation.y = auto + spinY.current + px * 0.3;
      crystal.current.rotation.x = THREE.MathUtils.damp(crystal.current.rotation.x, 0.35 + py * 0.22 + (profile.reducedMotion ? 0 : Math.sin(time * 0.5) * 0.05), 3, t);
    }
    if (orbit.current) {
      orbit.current.rotation.y = (profile.reducedMotion ? 0 : -time * (0.35 + hov * 0.5)) - spinY.current * 0.4;
      orbit.current.rotation.x = 0.55 + py * 0.15;
      orbit.current.rotation.z = 0.2 + px * 0.1;
      orbit.current.visible = r > 0.7;
      orbit.current.scale.setScalar(0.85 + Math.min(1, (r - 0.7) / 0.3) * 0.15 + pulse * 0.25);
    }
    if (sweep.current) {
      const o = profile.reducedMotion ? 0 : time * 0.6;
      const sweepX = THREE.MathUtils.lerp(-6, 3, Math.min(1, r * 1.2));
      sweep.current.position.set(r < 0.95 ? sweepX : Math.cos(o) * 3.2, 1.4 + Math.sin(o * 0.7) * 0.6, 2.2 + Math.sin(o) * 1.2);
      sweep.current.intensity = 10 + r * 40 + pulse * 60 + hov * 10;
    }
    if (key.current) key.current.intensity = 0.3 + r * 3.2;
    if (core.current) {
      const m = core.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + r * 0.55 + pulse * 0.4;
      core.current.rotation.y = -time * 0.3;
      core.current.scale.setScalar(0.62 + pulse * 0.25 + hov * 0.05);
    }
    if (edges.current) (edges.current.material as THREE.LineBasicMaterial).opacity = 0.1 + r * 0.35 + pulse * 0.4;
    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial;
      m.opacity = (0.1 + r * 0.3 + pulse * 0.3) * (1 - p);
      glow.current.position.copy(g ? g.position : tmp);
      glow.current.position.z = -1.2;
      glow.current.scale.setScalar(scale * 6.5);
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#3a3038", "#050505", 0.6]} />
      <directionalLight ref={key} position={[3, 4, 5]} intensity={0.3} color="#fff4f2" />
      <pointLight ref={sweep} position={[-6, 1.4, 2.2]} intensity={10} color={RED} distance={16} decay={1.4} />
      <pointLight position={[-3, -2.5, 2.5]} intensity={5} color="#ffd8d3" distance={12} decay={1.6} />
      <pointLight position={[2.5, -1, -3]} intensity={12} color={RED} distance={12} decay={1.6} />

      <mesh ref={glow} position={[0, 0, -1.2]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glowTex} color={RED} transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <group ref={root} scale={0.001}>
        <group ref={crystal}>
          <mesh geometry={geo}>
            <meshStandardMaterial color="#26242b" metalness={0.7} roughness={0.32} flatShading transparent opacity={0.86} />
          </mesh>
          <lineSegments ref={edges} geometry={edgeGeo}>
            <lineBasicMaterial color="#ff7a86" transparent opacity={0.2} />
          </lineSegments>
          <mesh ref={core} scale={0.62}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={RED} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>

        {/* orbiting satellites + ring */}
        <group ref={orbit}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.08, 2.1, 128]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {satellites.map((sat, i) => (
            <mesh key={i} position={[Math.cos(sat.a) * sat.r, 0, Math.sin(sat.a) * sat.r]}>
              <sphereGeometry args={[sat.size, 12, 12]} />
              <meshStandardMaterial color={i % 3 === 0 ? RED : "#ffffff"} emissive={i % 3 === 0 ? RED : "#ffd9d3"} emissiveIntensity={i % 3 === 0 ? 1.6 : 0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}
