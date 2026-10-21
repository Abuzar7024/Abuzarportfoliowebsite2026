import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { DESK } from "./Desk";
import { ROOM } from "./Room";

/**
 * Atmosphere pieces that make the room glow: a hologram on a floor pedestal,
 * rain running down the window, and an LED strip under the desk.
 */

/** A pedestal projecting a slowly turning wireframe globe with orbit rings. */
export function Hologram({ position = [1.35, 0, -2.5] as [number, number, number], reduced = false }) {
  const m = getMaterials();
  const globe = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);

  const wire = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(0.26, 2);
    const w = new THREE.WireframeGeometry(base);
    base.dispose();
    return w;
  }, []);
  const lineMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color("#d6dde8").multiplyScalar(1.4), transparent: true, opacity: 0.75, toneMapped: false }),
    []
  );
  const beamGeo = useMemo(() => new THREE.CylinderGeometry(0.3, 0.12, 0.9, 32, 1, true), []);
  useEffect(() => () => [wire, lineMat, beamGeo].forEach((x) => x.dispose()), [wire, lineMat, beamGeo]);

  useFrame(({ clock }, delta) => {
    if (reduced) return;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    if (globe.current) {
      globe.current.rotation.y += dt * 0.5;
      globe.current.position.y = 1.32 + Math.sin(t * 1.2) * 0.03;
    }
    if (rings.current) rings.current.rotation.z += dt * 0.8;
    if (beam.current) beam.current.opacity = 0.1 + Math.sin(t * 3) * 0.025;
  });

  return (
    <group position={position}>
      {/* Pedestal */}
      <mesh geometry={geo.cyl(0.2, 0.26, 0.7, 32)} material={m.plastic} position={[0, 0.35, 0]} castShadow />
      <mesh geometry={geo.cyl(0.21, 0.21, 0.03, 32)} material={m.metal} position={[0, 0.715, 0]} />
      <mesh geometry={geo.torus(0.17, 0.008, 8, 48)} material={m.neon} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.735, 0]} />
      <mesh geometry={geo.torus(0.255, 0.006, 8, 48)} material={m.neon} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} />
      {/* Light cone */}
      <mesh geometry={beamGeo} position={[0, 1.18, 0]}>
        <meshBasicMaterial ref={beam} color="#c9d4e4" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* Globe with a red core and orbiting rings */}
      <group ref={globe} position={[0, 1.32, 0]}>
        <lineSegments geometry={wire} material={lineMat} />
        <mesh geometry={geo.sphere(0.06, 20, 14)} material={m.neon} />
        <group ref={rings} rotation={[1.1, 0.3, 0]}>
          <mesh geometry={geo.torus(0.38, 0.004, 6, 64)} material={m.neon} />
          <mesh geometry={geo.sphere(0.018, 12, 8)} material={m.neon} position={[0.38, 0, 0]} />
        </group>
        <mesh geometry={geo.torus(0.33, 0.003, 6, 64)} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#e6ebf2" toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>
      <pointLight color="#ff3b44" intensity={2} distance={2.2} decay={2} position={[0, 1.3, 0]} />
    </group>
  );
}

const RAIN_FRAG = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    // Columns of streaks sliding down at different speeds.
    float cols = 140.0;
    float x = vUv.x * cols;
    float id = floor(x);
    float fx = fract(x);
    float speed = 0.25 + hash(id) * 0.5;
    float y = fract(vUv.y + uTime * speed + hash(id + 7.0));
    float len = 0.04 + hash(id + 3.0) * 0.08;
    float streak = smoothstep(0.0, 0.02, y) * smoothstep(len, 0.0, y) * smoothstep(0.5, 0.0, abs(fx - 0.5));
    float on = step(0.55, hash(id + floor(uTime * speed + hash(id + 7.0) + vUv.y)));
    gl_FragColor = vec4(vec3(0.82, 0.86, 0.93), streak * on * 0.22);
  }
`;

/** Rain running down the inside of the window glass. */
export function WindowRain({ reduced = false }) {
  const { left, right, bottom, top } = ROOM.window;
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: RAIN_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock }) => {
    if (!reduced) material.uniforms.uTime.value = clock.elapsedTime;
  });
  return <mesh geometry={geo.plane(right - left, top - bottom)} material={material} position={[0, (top + bottom) / 2, ROOM.back + 0.005]} />;
}

/** Red LED strip under the desk's front edge. */
export function LedStrips() {
  const m = getMaterials();
  return (
    <group>
      <mesh geometry={geo.box(DESK.w - 0.12, 0.008, 0.008)} material={m.neon} position={[DESK.x, DESK.top - 0.056, DESK.z + DESK.d / 2 - 0.03]} />
      <pointLight color="#ff3b44" intensity={1.2} distance={1.6} decay={2} position={[DESK.x, DESK.top - 0.25, DESK.z + DESK.d / 2]} />
    </group>
  );
}
