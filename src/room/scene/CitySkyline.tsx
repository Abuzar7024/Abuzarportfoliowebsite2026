import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mulberry32 } from "./textures";

/**
 * The night city outside the window. All buildings are one InstancedMesh
 * (one draw call); their lit windows come from a shader that tiles a window
 * grid over each face in world units, so tall and short towers get the same
 * window size. Red aviation beacons and slow air-traffic lights add motion.
 */

const FOG = new THREE.Color("#101216");

const BUILDING_VERT = /* glsl */ `
  attribute float aSeed;
  varying vec3 vLocal;
  varying vec3 vNormal;
  varying vec3 vScale;
  varying float vSeed;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    vLocal = position;
    vNormal = normal;
    vSeed = aSeed;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const BUILDING_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uFog;
  uniform float uFogDensity;
  varying vec3 vLocal;
  varying vec3 vNormal;
  varying vec3 vScale;
  varying float vSeed;
  varying float vDepth;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7)) + vSeed * 91.3) * 43758.5453); }

  void main() {
    // Face coordinates in metres: across the face, and up from the ground.
    float across = abs(vNormal.x) > 0.5 ? vLocal.z * vScale.z : vLocal.x * vScale.x;
    float up = (vLocal.y + 0.5) * vScale.y;
    // Faces turned towards the room catch a little city glow; side faces stay darker.
    float facing = abs(vNormal.z) > 0.5 ? 1.0 : 0.72;
    vec3 wall = mix(vec3(0.085, 0.09, 0.105), vec3(0.14, 0.145, 0.165), clamp(up / 45.0, 0.0, 1.0)) * facing;
    vec3 col = wall;

    if (abs(vNormal.y) < 0.5) {
      vec2 cell = vec2(1.0, 1.25);
      vec2 g = vec2(across, up) / cell;
      vec2 id = floor(g);
      vec2 f = fract(g);
      float inside = step(0.25, f.x) * step(f.x, 0.75) * step(0.28, f.y) * step(f.y, 0.72);
      float r = hash(id);
      float lit = step(0.6, r);
      // A few windows slowly switch on and off.
      lit *= step(0.08, fract(r * 13.0 + uTime * 0.01 * step(0.97, r)));
      vec3 warm = vec3(1.0, 0.86, 0.66);
      vec3 cool = vec3(0.78, 0.84, 0.95);
      vec3 glow = mix(cool, warm, step(0.5, fract(r * 7.0))) * (0.55 + 0.6 * fract(r * 31.0));
      // Rare signal-red windows.
      glow = mix(glow, vec3(1.0, 0.18, 0.2), step(0.985, r));
      vec3 detailed = mix(col, glow, inside * lit) + inside * (1.0 - lit) * 0.012;
      // Far away a window is smaller than a pixel: blend to the average glow instead of aliasing.
      vec2 fw = fwidth(g);
      float far = clamp(max(fw.x, fw.y) * 2.5 - 0.6, 0.0, 1.0);
      vec3 average = col + vec3(0.9, 0.85, 0.78) * 0.4 * 0.25 * 0.6;
      col = mix(detailed, average, far);
    } else {
      col = vec3(0.045, 0.048, 0.055);
    }

    float fog = 1.0 - exp(-pow(uFogDensity * vDepth, 2.0));
    gl_FragColor = vec4(mix(col, uFog, fog), 1.0);
  }
`;

const SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vY;
  void main() {
    vUv = uv;
    vY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  varying float vY;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    // Graded by world height so the horizon glow sits behind the skyline.
    vec3 top = vec3(0.03, 0.035, 0.05);
    vec3 horizon = vec3(0.17, 0.14, 0.17);
    vec3 col = mix(horizon, top, smoothstep(-4.0, 34.0, vY));
    col += vec3(0.2, 0.05, 0.06) * exp(-max(vY + 4.0, 0.0) / 7.0);
    vec2 s = floor(vUv * vec2(420.0, 160.0));
    float star = step(0.9965, hash(s)) * smoothstep(12.0, 30.0, vY);
    col += star * 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const LIGHTS_VERT = /* glsl */ `
  uniform float uTime;
  attribute float aPhase;
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aSpeed;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // Moving lights wrap across the skyline; static ones (speed 0) just blink.
    p.x = aSpeed == 0.0 ? p.x : mod(p.x + uTime * aSpeed + 70.0, 140.0) - 70.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float blink = aSpeed == 0.0 ? pow(max(0.0, sin(uTime * 2.2 + aPhase)), 8.0) : 0.8 + 0.2 * sin(uTime * 9.0 + aPhase);
    vAlpha = 0.25 + blink * 0.75;
    vColor = aColor;
    gl_PointSize = aSize * (300.0 / -mv.z);
  }
`;

const LIGHTS_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha);
  }
`;

interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  rot: number;
}

/** Near blocks are shorter; the far rows tower. Seeded, so identical every visit. */
function layoutCity(count: number): Building[] {
  const rand = mulberry32(19);
  return Array.from({ length: count }, (_, i) => {
    const row = i % 4;
    return {
      z: -15 - row * 9 - rand() * 6,
      x: (rand() - 0.5) * (50 + row * 18),
      w: 2.2 + rand() * 3.5,
      d: 2.2 + rand() * 3.5,
      h: (5 + Math.pow(rand(), 1.8) * 26) * (0.55 + row * 0.22),
      rot: rand() < 0.15 ? 0.3 : 0,
    };
  });
}

const GROUND_Y = -6;

export function CitySkyline({ count = 160 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const buildings = useMemo(() => layoutCity(count), [count]);

  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const rand = mulberry32(77);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = rand();
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BUILDING_VERT,
        fragmentShader: BUILDING_FRAG,
        uniforms: { uTime: { value: 0 }, uFog: { value: FOG }, uFogDensity: { value: 0.016 } },
      }),
    []
  );

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new THREE.Object3D();
    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2 + GROUND_Y, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.rotation.y = b.rot;
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [buildings]);

  // Aviation beacons on the tall roofs, plus a handful of moving air-traffic lights.
  const lights = useMemo(() => {
    const rand = mulberry32(5);
    const pts: number[] = [];
    const phase: number[] = [];
    const size: number[] = [];
    const color: number[] = [];
    const speed: number[] = [];
    for (const b of buildings) {
      if (b.h <= 16) continue;
      pts.push(b.x, b.h + GROUND_Y + 0.5, b.z);
      phase.push(rand() * 6.28);
      size.push(0.9);
      color.push(1, 0.2, 0.24);
      speed.push(0);
    }
    for (let i = 0; i < 14; i++) {
      pts.push((rand() - 0.5) * 140, 6 + rand() * 14, -14 - rand() * 30);
      phase.push(rand() * 6.28);
      size.push(0.45 + rand() * 0.3);
      const red = rand() < 0.35;
      color.push(red ? 1 : 0.9, red ? 0.25 : 0.93, red ? 0.28 : 1);
      speed.push((rand() < 0.5 ? -1 : 1) * (1.5 + rand() * 3));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute("aColor", new THREE.Float32BufferAttribute(color, 3));
    g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(speed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    return g;
  }, [buildings]);

  const lightsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: LIGHTS_VERT,
        fragmentShader: LIGHTS_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  );
  const sky = useMemo(() => new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, depthWrite: false }), []);
  const skyGeo = useMemo(() => new THREE.PlaneGeometry(260, 110), []);
  const moonGeo = useMemo(() => new THREE.CircleGeometry(2.2, 48), []);
  const haloGeo = useMemo(() => new THREE.PlaneGeometry(14, 14), []);
  const moonMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#dfe4eb", toneMapped: false, fog: false }), []);
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: UV_VERT,
        fragmentShader: /* glsl */ `
          precision mediump float;
          varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            gl_FragColor = vec4(0.8, 0.84, 0.92, pow(clamp(1.0 - d, 0.0, 1.0), 3.0) * 0.35);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(
    () => () => {
      [geometry, material, lights, lightsMat, sky, skyGeo, moonGeo, haloGeo, moonMat, haloMat].forEach((r) => r.dispose());
    },
    [geometry, material, lights, lightsMat, sky, skyGeo, moonGeo, haloGeo, moonMat, haloMat]
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    lightsMat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group>
      <mesh geometry={skyGeo} material={sky} position={[0, 20, -70]} />
      <mesh geometry={haloGeo} material={haloMat} position={[16, 26, -66]} />
      <mesh geometry={moonGeo} material={moonMat} position={[16, 26, -65.9]} />
      <instancedMesh ref={mesh} args={[geometry, material, count]} />
      <points geometry={lights} material={lightsMat} frustumCulled={false} />
    </group>
  );
}
