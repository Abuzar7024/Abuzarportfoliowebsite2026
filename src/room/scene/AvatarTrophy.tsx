import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { brandFont } from "../../three/brandFont";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { Interactive } from "./Interactive";
import { getState } from "../store";
import { mulberry32 } from "./textures";

const PARTICLE_VERT = /* glsl */ `
  uniform float uTime;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aRadius;
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float t = uTime * aSpeed + aPhase;
    float angle = t * 1.4 + aPhase;
    float yCycle = fract(t * 0.35);
    vec3 p = position;
    p.x = cos(angle) * (aRadius + sin(t * 2.0) * 0.03);
    p.z = sin(angle) * (aRadius + cos(t * 2.0) * 0.03);
    p.y = 0.92 + yCycle * 0.78;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = sin(yCycle * 3.14159265) * 0.9;
    vColor = aColor;
    gl_PointSize = aSize * (180.0 / max(-mv.z, 0.5));
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }
`;

/**
 * AI Hackathon Championship Trophy: positioned on the right side of the room near
 * AK-Bot and the bookshelf. Features a sculpted metallic-gold cup, engraved 3D
 * "AI HACK" branding, red & white neon illumination, floating particles, and
 * hover-reactive cinematic lighting.
 */
export function AvatarTrophy({
  position = [2.82, 0, -1.25] as [number, number, number],
  rotation = -0.68,
  reduced = false,
  lite = false,
}) {
  const m = getMaterials();
  const cupGroup = useRef<THREE.Group>(null);
  const crestRef = useRef<THREE.Mesh>(null);
  const orbitRing1 = useRef<THREE.Mesh>(null);
  const orbitRing2 = useRef<THREE.Mesh>(null);
  const goldLight = useRef<THREE.PointLight>(null);
  const redLight = useRef<THREE.PointLight>(null);
  const auraMat = useRef<THREE.MeshBasicMaterial>(null);

  // Sculpted chalice profile using LatheGeometry
  const cupGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.055, 0.0),
      new THREE.Vector2(0.038, 0.035),
      new THREE.Vector2(0.024, 0.095),
      new THREE.Vector2(0.032, 0.145),
      new THREE.Vector2(0.092, 0.215),
      new THREE.Vector2(0.128, 0.305),
      new THREE.Vector2(0.142, 0.385),
      new THREE.Vector2(0.132, 0.392),
      new THREE.Vector2(0.105, 0.29),
      new THREE.Vector2(0.0, 0.22),
    ];
    const g = new THREE.LatheGeometry(pts, lite ? 20 : 36);
    g.computeVertexNormals();
    return g;
  }, [lite]);

  // Engraved 3D "AVATAR" text on the plinth and trophy collar
  const avatarTextGeo = useMemo(() => {
    const g = new TextGeometry("AVATAR", {
      font: brandFont,
      size: 0.036,
      depth: 0.008,
      curveSegments: 3,
    });
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
    return g;
  }, []);

  const cupBadgeTextGeo = useMemo(() => {
    const g = new TextGeometry("AVATAR", {
      font: brandFont,
      size: 0.02,
      depth: 0.004,
      curveSegments: 3,
    });
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, 0);
    return g;
  }, []);

  // Subtle floating particles (gold, signal red, and white)
  const { particleGeo, particleMat } = useMemo(() => {
    const count = lite ? 14 : 28;
    const rand = mulberry32(2026);
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const radius = new Float32Array(count);
    const size = new Float32Array(count);
    const color = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      phase[i] = rand() * Math.PI * 2;
      speed[i] = 0.45 + rand() * 0.55;
      radius[i] = 0.14 + rand() * 0.18;
      size[i] = 0.08 + rand() * 0.09;
      const pick = rand();
      if (pick < 0.55) {
        // Metallic Gold
        color[i * 3] = 1.0;
        color[i * 3 + 1] = 0.82;
        color[i * 3 + 2] = 0.35;
      } else if (pick < 0.82) {
        // Signal Red
        color[i * 3] = 1.0;
        color[i * 3 + 1] = 0.24;
        color[i * 3 + 2] = 0.28;
      } else {
        // Crisp White
        color[i * 3] = 0.95;
        color[i * 3 + 1] = 0.97;
        color[i * 3 + 2] = 1.0;
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aRadius", new THREE.BufferAttribute(radius, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.25, 0), 1.2);

    const mat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
    });

    return { particleGeo: g, particleMat: mat };
  }, [lite]);

  useEffect(
    () => () => {
      [cupGeo, avatarTextGeo, cupBadgeTextGeo, particleGeo, particleMat].forEach((x) => x.dispose());
    },
    [cupGeo, avatarTextGeo, cupBadgeTextGeo, particleGeo, particleMat]
  );

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const s = getState();
    const hovered = s.hovered === "trophy";

    if (!reduced) {
      particleMat.uniforms.uTime.value = t;
      if (cupGroup.current) {
        cupGroup.current.rotation.y += dt * (hovered ? 1.35 : 0.45);
        cupGroup.current.position.y = 0.96 + Math.sin(t * 1.7) * 0.022;
      }
      if (crestRef.current) {
        crestRef.current.rotation.y -= dt * 1.4;
        crestRef.current.rotation.x = Math.sin(t * 2.2) * 0.25;
      }
      if (orbitRing1.current) {
        orbitRing1.current.rotation.z += dt * (hovered ? 1.8 : 0.7);
      }
      if (orbitRing2.current) {
        orbitRing2.current.rotation.x -= dt * (hovered ? 1.5 : 0.55);
      }
    }

    if (goldLight.current) {
      const targetGold = hovered ? 4.8 : 2.4;
      goldLight.current.intensity = THREE.MathUtils.damp(goldLight.current.intensity, targetGold, 8, dt);
    }
    if (redLight.current) {
      const targetRed = hovered ? 3.2 : 1.5;
      redLight.current.intensity = THREE.MathUtils.damp(redLight.current.intensity, targetRed, 8, dt);
    }
    if (auraMat.current) {
      const targetOpacity = hovered ? 0.22 : 0.09 + Math.sin(t * 2.5) * 0.02;
      auraMat.current.opacity = THREE.MathUtils.damp(auraMat.current.opacity, targetOpacity, 8, dt);
    }
  });

  return (
    <Interactive
      id="trophy"
      views={["room", "shelf", "trophy"]}
      anchor={[0, 1.72, 0]}
      position={position}
      rotation={[0, rotation, 0]}
    >
      {/* ── Museum Display Pedestal ── */}
      {/* Base plinth */}
      <mesh geometry={geo.cyl(0.28, 0.32, 0.08, 32)} material={m.plasticDark} position={[0, 0.04, 0]} castShadow receiveShadow />
      {/* Bottom signal-red neon ring */}
      <mesh geometry={geo.torus(0.305, 0.007, 8, 48)} material={m.neon} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.082, 0]} />
      {/* Main fluted dark column */}
      <mesh geometry={geo.cyl(0.22, 0.26, 0.72, 32)} material={m.plastic} position={[0, 0.44, 0]} castShadow receiveShadow />
      {/* Vertical white & gold accent ribs on pedestal */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        return (
          <mesh
            key={i}
            geometry={geo.box(0.012, 0.66, 0.012)}
            material={i % 2 === 0 ? m.gold : m.neonWhite}
            position={[Math.cos(a) * 0.238, 0.44, Math.sin(a) * 0.238]}
            rotation={[0, -a, 0]}
          />
        );
      })}
      {/* Upper metallic crown & glowing stage platform */}
      <mesh geometry={geo.cyl(0.26, 0.22, 0.06, 32)} material={m.metal} position={[0, 0.83, 0]} castShadow />
      <mesh geometry={geo.cyl(0.21, 0.21, 0.018, 32)} material={m.gold} position={[0, 0.869, 0]} />
      {/* Top white & red neon concentric rings */}
      <mesh geometry={geo.torus(0.245, 0.007, 8, 48)} material={m.neon} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.862, 0]} />
      <mesh geometry={geo.torus(0.185, 0.005, 8, 48)} material={m.neonWhite} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.88, 0]} />

      {/* Front engraved AI HACK nameplate on pedestal */}
      <group position={[0, 0.56, 0.236]}>
        <mesh geometry={geo.rbox(0.34, 0.12, 0.018, 0.008)} material={m.plasticDark} />
        <mesh geometry={geo.rbox(0.32, 0.1, 0.02, 0.006)} material={m.gold} position={[0, 0, 0.002]} />
        <mesh geometry={geo.rbox(0.305, 0.086, 0.022, 0.005)} material={m.plasticDark} position={[0, 0, 0.004]} />
        <mesh geometry={avatarTextGeo} material={m.goldBright} position={[0, 0.008, 0.014]} />
        <mesh geometry={geo.box(0.22, 0.005, 0.004)} material={m.neon} position={[0, -0.026, 0.016]} />
      </group>

      {/* Volumetric upward light cone */}
      <mesh geometry={geo.cyl(0.24, 0.15, 0.68, 24)} position={[0, 1.22, 0]}>
        <meshBasicMaterial
          ref={auraMat}
          color="#ffd97d"
          transparent
          opacity={0.09}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* ── Floating & Rotating Gold Championship Trophy ── */}
      <group ref={cupGroup} position={[0, 0.96, 0]}>
        {/* Stepped championship base */}
        <mesh geometry={geo.cyl(0.095, 0.115, 0.036, 28)} material={m.plasticDark} position={[0, 0.018, 0]} castShadow />
        <mesh geometry={geo.cyl(0.082, 0.092, 0.028, 28)} material={m.gold} position={[0, 0.05, 0]} castShadow />
        <mesh geometry={geo.torus(0.086, 0.004, 8, 36)} material={m.neon} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.064, 0]} />

        {/* Sculpted Championship Cup (LatheGeometry) */}
        <mesh geometry={cupGeo} material={m.gold} position={[0, 0.064, 0]} castShadow />

        {/* Bright gold rim & inner white neon core */}
        <mesh geometry={geo.torus(0.137, 0.009, 12, 40)} material={m.goldBright} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.45, 0]} />
        <mesh geometry={geo.torus(0.118, 0.005, 8, 36)} material={m.neonWhite} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.445, 0]} />
        <mesh geometry={geo.torus(0.096, 0.006, 10, 36)} material={m.goldBright} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.28, 0]} />

        {/* Engraved AI 2026 Championship Crest on front & back of cup */}
        {[1, -1].map((side) => (
          <group key={side} position={[0, 0.34, side * 0.126]} rotation={[side === 1 ? -0.18 : 0.18, side === 1 ? 0 : Math.PI, 0]}>
            <mesh geometry={geo.rbox(0.16, 0.052, 0.008, 0.004)} material={m.plasticDark} />
            <mesh geometry={cupBadgeTextGeo} material={m.goldBright} position={[0, 0, 0.005]} />
            <mesh geometry={geo.box(0.12, 0.003, 0.003)} material={m.neon} position={[0, -0.018, 0.006]} />
          </group>
        ))}

        {/* Twin Swept Championship Wing Handles */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.105, 0.32, 0]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
            <mesh
              geometry={geo.torus(0.085, 0.011, 10, 28, Math.PI * 1.15)}
              material={m.goldBright}
              rotation={[0, 0, -Math.PI * 0.58]}
              castShadow
            />
            <mesh
              geometry={geo.sphere(0.016, 14, 10)}
              material={m.goldBright}
              position={[0.082, 0.02, 0]}
            />
          </group>
        ))}

        {/* Levitating Championship Star / Octahedron Crown */}
        <mesh
          ref={crestRef}
          geometry={geo.custom("trophy-star", () => new THREE.OctahedronGeometry(0.055, 0))}
          material={m.goldBright}
          position={[0, 0.54, 0]}
          scale={[1, 1.35, 1]}
          castShadow
        />

        {/* Orbiting energy halos around the crown */}
        <group position={[0, 0.54, 0]}>
          <mesh ref={orbitRing1} geometry={geo.torus(0.11, 0.0035, 8, 48)} material={m.neonGold} rotation={[1.1, 0.4, 0]} />
          <mesh ref={orbitRing2} geometry={geo.torus(0.14, 0.003, 8, 48)} material={m.neon} rotation={[0.5, -0.8, 0]} />
        </group>
      </group>

      {/* Subtle floating golden & neon particles */}
      <points geometry={particleGeo} material={particleMat} />

      {/* Cinematic Trophy Lighting */}
      {!lite && (
        <>
          <pointLight ref={goldLight} color="#ffd470" intensity={2.4} distance={2.8} decay={2} position={[0, 1.45, 0.25]} />
          <pointLight ref={redLight} color="#ff3b44" intensity={1.5} distance={2.2} decay={2} position={[0, 0.92, 0.2]} />
        </>
      )}
    </Interactive>
  );
}
