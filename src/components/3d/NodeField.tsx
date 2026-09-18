import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import type { RenderProfile } from "../../hooks/useDeviceTier";
import type { PointerValues } from "../../hooks/usePointer";

/**
 * The hero's signature object: a floating digital ecosystem.
 *
 * A structured lattice of nodes (not a random cloud) whose density and depth
 * read as a system rather than decoration. Nodes drift on a slow noise-like
 * field, are pushed away from the pointer, and stretch along the scroll
 * velocity vector so fast scrolling smears the field into motion lines.
 *
 * Built natively on Three.js 0.185 with a custom ShaderMaterial - one draw
 * call for the points, one for the linking lines.
 */

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform vec3  uPointer;      // pointer in world space
  uniform float uPointerAmt;   // 0..1 strength of pointer repulsion
  uniform float uVelocity;     // scroll velocity, signed
  uniform float uReveal;       // 0..1 intro reveal

  attribute float aScale;      // per-node size variance
  attribute float aPhase;      // per-node animation offset
  attribute float aRing;       // 0..1 distance from the lattice core

  varying float vAlpha;
  varying float vHot;          // 0..1 how "activated" this node is

  void main() {
    vec3 pos = position;

    // Slow organic drift - cheap pseudo-noise from layered sines.
    float t = uTime * 0.28 + aPhase * 6.2831;
    pos.x += sin(t * 0.9 + pos.y * 0.6) * 0.16;
    pos.y += cos(t * 0.75 + pos.z * 0.5) * 0.16;
    pos.z += sin(t * 0.6 + pos.x * 0.55) * 0.12;

    // Breathing: the whole lattice expands and contracts subtly.
    pos *= 1.0 + sin(uTime * 0.4 + aRing * 3.0) * 0.022;

    // Pointer repulsion, falling off smoothly with distance.
    vec3 toPointer = pos - uPointer;
    float d = length(toPointer);
    float push = smoothstep(2.6, 0.0, d) * uPointerAmt;
    pos += normalize(toPointer + 1e-4) * push * 0.85;
    vHot = push;

    // Scroll velocity smears nodes vertically into motion streaks.
    pos.y -= uVelocity * (0.35 + aRing * 0.55);

    // Intro: nodes fly in from depth.
    pos.z += (1.0 - uReveal) * (5.0 + aRing * 9.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Perspective-correct point size.
    float size = uSize * aScale * (1.0 + vHot * 1.5);
    gl_PointSize = size * (18.0 / -mv.z);

    // Depth fade keeps the far field from muddying the type.
    vAlpha = smoothstep(26.0, 4.0, -mv.z) * uReveal;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying float vAlpha;
  varying float vHot;

  void main() {
    // Round sprite with a soft core.
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    // Tight core with a thin halo - reads as a node, not a smudge.
    float core = smoothstep(0.5, 0.18, r) * 0.35 + smoothstep(0.26, 0.0, r);

    // Red only where the pointer activates a node - restraint by default.
    vec3 col = mix(uColor, uAccent, vHot);
    float a = core * vAlpha * (0.34 + vHot * 0.66);
    gl_FragColor = vec4(col, a);
  }
`;

export interface NodeFieldProps {
  profile: RenderProfile;
  pointer: PointerValues;
  /** 0 -> 1 intro reveal. */
  reveal: MotionValue<number>;
  /** Page scroll progress 0..1. */
  scroll: MotionValue<number>;
}

/** Builds a structured lattice: concentric shells of nodes, denser at the core. */
function buildLattice(count: number) {
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const phases = new Float32Array(count);
  const rings = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Fibonacci-sphere distribution per shell gives even, non-random coverage.
    const shell = i % 3;
    const radius = 2.4 + shell * 1.75;
    const k = Math.floor(i / 3);
    const n = Math.ceil(count / 3);
    const y = 1 - (k / Math.max(1, n - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = k * 2.399963229728653; // golden angle

    // Flatten slightly into a disc so it reads as a system, not a planet.
    positions[i * 3] = Math.cos(theta) * rad * radius;
    positions[i * 3 + 1] = y * radius * 0.62;
    positions[i * 3 + 2] = Math.sin(theta) * rad * radius;

    scales[i] = 0.55 + Math.random() * 0.9;
    phases[i] = Math.random();
    rings[i] = shell / 2;
  }
  return { positions, scales, phases, rings };
}

export function NodeField({ profile, pointer, reveal, scroll }: NodeFieldProps) {
  const points = useRef<THREE.Points>(null);
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Device-tier particle budget.
  const count = Math.max(180, Math.round(1500 * profile.particleScale));

  const geometry = useMemo(() => {
    const { positions, scales, phases, rings } = buildLattice(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aRing", new THREE.BufferAttribute(rings, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: profile.tier === "high" ? 5.5 : 7 },
          uPointer: { value: new THREE.Vector3(999, 999, 999) },
          uPointerAmt: { value: 0 },
          uVelocity: { value: 0 },
          uReveal: { value: 0 },
          uColor: { value: new THREE.Color("#8e8e99") },
          uAccent: { value: new THREE.Color("#ff2b3d") },
        },
      }),
    [profile.tier]
  );

  // Dispose GPU resources on unmount - required, R3F does not free custom geometry/material.
  React.useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const lastScroll = useRef(0);
  const smoothVel = useRef(0);
  const pointerWorld = useRef(new THREE.Vector3(999, 999, 999));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const u = material.uniforms;
    const r = reveal.get();

    u.uTime.value = state.clock.elapsedTime;
    u.uReveal.value += (r - u.uReveal.value) * Math.min(1, dt * 3);

    // Scroll velocity -> smeared motion, smoothed so it never snaps.
    const s = scroll.get();
    const raw = (s - lastScroll.current) / Math.max(dt, 0.0001);
    lastScroll.current = s;
    smoothVel.current += (raw - smoothVel.current) * Math.min(1, dt * 6);
    u.uVelocity.value = THREE.MathUtils.clamp(smoothVel.current * 0.6, -1.4, 1.4);

    // Map normalised pointer into the field's world space.
    if (profile.reducedMotion) {
      u.uPointerAmt.value = 0;
    } else {
      const px = pointer.nx.get() * viewport.width * 0.5;
      const py = pointer.ny.get() * viewport.height * 0.5;
      pointerWorld.current.set(px, py, 0);
      u.uPointer.value.lerp(pointerWorld.current, Math.min(1, dt * 5));
      u.uPointerAmt.value += (pointer.active.get() - u.uPointerAmt.value) * Math.min(1, dt * 4);
    }

    // The lattice rotates slowly; the pointer nudges its tilt.
    if (group.current) {
      const g = group.current;
      g.rotation.y += dt * (profile.reducedMotion ? 0 : 0.045);
      const tx = pointer.ny.get() * 0.18;
      const tz = pointer.nx.get() * 0.1;
      g.rotation.x += (tx - g.rotation.x) * Math.min(1, dt * 2);
      g.rotation.z += (tz - g.rotation.z) * Math.min(1, dt * 2);
    }
  });

  return (
    <group ref={group}>
      <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
