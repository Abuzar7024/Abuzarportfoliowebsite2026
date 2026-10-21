import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FontLoader, type FontData } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { MotionValue } from "motion/react";
import { SceneCanvas } from "./SceneCanvas";
import type { RenderProfile } from "../hooks/useDeviceTier";
import type { PointerValues } from "../hooks/usePointer";
// Michroma (SIL OFL 1.1, see michroma.OFL.txt), subset to A–Z, 0–9 and a little punctuation.
import michroma from "../assets/michroma.typeface.json";

/**
 * The page's one continuous 3D layer.
 *
 * The hero is my name in extruded chrome: letters drop into place, lean towards
 * the pointer, and a signal-red scanner light sweeps across them. Behind it a
 * wireframe planet turns inside chrome orbit rings. Scrolling moves the camera
 * down through rising data particles and floating prisms to a grid floor where
 * monolith towers blink and a red pylon pings outward (the Contact section).
 *
 * Everything is procedural apart from the font: no textures or models.
 */

const SIGNAL = "#e3262e";
const FOG = "#131417";
const FOV = 42;
const CAM_Z = 10;

/** World units the camera descends over the full page scroll. */
const DESCENT = 32;

const damp = THREE.MathUtils.damp;
const ease = (t: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3);

/** Seeded PRNG so the composition is identical on every visit. */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: React.DependencyList = []): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/** Visible size of the z = 0 plane from the resting camera. */
function viewportAtOrigin(aspect: number) {
  const h = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return { w: h * aspect, h };
}

/* ────────────────────────── environment & camera ────────────────────────── */

/** A procedural studio environment so the chrome has something to reflect. */
function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    room.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Rig({ scroll, pointer, reduced }: { scroll: MotionValue<number>; pointer: PointerValues; reduced: boolean }) {
  const { camera, invalidate } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!reduced) return;
    return scroll.on("change", () => invalidate());
  }, [reduced, scroll, invalidate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = scroll.get();
    const ty = -p * DESCENT;
    const tx = reduced ? 0 : pointer.nx.get() * 0.45;
    camera.position.y = reduced ? ty : damp(camera.position.y, ty, 7, dt);
    camera.position.x = reduced ? tx : damp(camera.position.x, tx, 3, dt);
    // Near the end the camera tips down to look across the grid floor.
    const landing = THREE.MathUtils.smoothstep(p, 0.8, 1);
    look.set(camera.position.x * 0.3, camera.position.y - landing * 2.6 + (reduced ? 0 : pointer.ny.get() * 0.2), -10);
    camera.lookAt(look);
  });

  return null;
}

function KeyLights() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (group.current) group.current.position.y = camera.position.y;
  });
  return (
    <group ref={group}>
      <ambientLight color="#8e98a8" intensity={0.35} />
      <directionalLight color="#eef2f7" intensity={1.6} position={[4, 7, 8]} />
      <directionalLight color="#9aa4b4" intensity={0.8} position={[-8, -2, -6]} />
    </group>
  );
}

/* ────────────────────────── chrome name ────────────────────────── */

const font = new FontLoader().parse(michroma as unknown as FontData);
const LETTER_SIZE = 1;
const TRACKING = 0.06;
const LINE_HEIGHT = 1.45;

interface Letter {
  geometry: TextGeometry;
  x: number;
  y: number;
}

/** Builds one centred geometry per glyph so each letter can move on its own. */
function buildName(lines: string[]) {
  const scale = LETTER_SIZE / font.data.resolution;
  const letters: Letter[] = [];
  let maxWidth = 0;
  lines.forEach((line, row) => {
    const advances = [...line].map((ch) => (font.data.glyphs[ch]?.ha ?? 0) * scale + TRACKING);
    const width = advances.reduce((a, b) => a + b, 0) - TRACKING;
    maxWidth = Math.max(maxWidth, width);
    let cursor = -width / 2;
    [...line].forEach((ch, i) => {
      if (ch !== " ") {
        const geometry = new TextGeometry(ch, {
          font,
          size: LETTER_SIZE,
          depth: 0.26,
          curveSegments: 6,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.018,
          bevelSegments: 3,
        });
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox!;
        const cx = (bb.min.x + bb.max.x) / 2;
        // Pivot each glyph around its own centre (cap height ~0.72 em in Michroma).
        geometry.translate(-cx, -0.36, -0.13);
        letters.push({ geometry, x: cursor + cx, y: ((lines.length - 1) / 2 - row) * LINE_HEIGHT });
      }
      cursor += advances[i];
    });
  });
  return { letters, width: maxWidth, height: (lines.length - 1) * LINE_HEIGHT + 0.72 };
}

function ChromeName({ profile, pointer }: { profile: RenderProfile; pointer: PointerValues }) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const scanner = useRef<THREE.PointLight>(null);
  const underline = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);
  const { size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const wide = aspect > 1.1;

  const name = useMemo(() => buildName(wide ? ["ABUZAR KHAN"] : ["ABUZAR", "KHAN"]), [wide]);
  useEffect(() => () => name.letters.forEach((l) => l.geometry.dispose()), [name]);

  const face = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: "#e6eaf0", metalness: 1, roughness: 0.14, envMapIntensity: 1.5 })
  );
  const side = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: "#7d838d", metalness: 1, roughness: 0.32, envMapIntensity: 1 })
  );
  const materials = useMemo(() => [face, side], [face, side]);
  const bar = useDisposable(() => new THREE.BoxGeometry(1, 0.035, 0.035));
  const barMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: SIGNAL, toneMapped: false }));

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    if (start.current === null) start.current = t;
    const since = profile.reducedMotion ? 99 : t - start.current;

    // Fit the name to the viewport, sitting in the upper part of the hero.
    const vp = viewportAtOrigin(aspect);
    const s = Math.min((vp.w * (wide ? 0.84 : 0.86)) / name.width, wide ? 1.35 : 0.95);
    g.scale.setScalar(s);
    g.position.y = (0.5 - (wide ? 0.4 : 0.3)) * vp.h;

    // Pointer in the group's local space, for the ripple.
    const lx = ((pointer.x.get() * vp.w) / 2 - g.position.x) / s;
    const ly = ((-pointer.y.get() * vp.h) / 2 - g.position.y) / s;
    const active = profile.reducedMotion ? 0 : pointer.active.get();

    name.letters.forEach((l, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const e = ease((since - 0.15 - i * 0.07) / 1.1);
      const d = Math.hypot((l.x - lx) * 0.9, (l.y - ly) * 1.4);
      const lift = Math.exp(-d * d * 0.9) * active;
      const idle = profile.reducedMotion ? 0 : Math.sin(t * 0.9 + i * 0.55) * 0.03;
      m.position.set(l.x, l.y + (1 - e) * 2.4 + idle, damp(m.position.z, lift * 0.75, 8, dt));
      // Letters tumble in during the intro, then lean back as the pointer passes.
      m.rotation.x = e < 1 ? (1 - e) * 1.5 : damp(m.rotation.x, -lift * 0.25, 8, dt);
      m.rotation.y = damp(m.rotation.y, lift * (l.x > lx ? 0.35 : -0.35), 6, dt);
      m.scale.setScalar(Math.max(e, 0.0001));
    });

    // Whole-name tilt towards the pointer.
    g.rotation.x = damp(g.rotation.x, profile.reducedMotion ? 0 : -pointer.ny.get() * 0.12, 3, dt);
    g.rotation.y = damp(g.rotation.y, profile.reducedMotion ? 0 : pointer.nx.get() * 0.16, 3, dt);

    if (scanner.current) {
      scanner.current.position.x = profile.reducedMotion ? name.width * 0.25 : Math.sin(t * 0.55) * name.width * 0.62;
    }
    if (underline.current) {
      const u = ease((since - 0.9) / 1.2);
      underline.current.scale.x = Math.max(u * name.width * 0.3, 0.0001);
    }
  });

  return (
    <group ref={group}>
      {name.letters.map((l, i) => (
        <mesh
          key={`${name.width}-${i}`}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          geometry={l.geometry}
          material={materials}
          position={[l.x, l.y, 0]}
        />
      ))}
      <mesh ref={underline} geometry={bar} material={barMat} position={[0, -name.height / 2 - 0.42, 0]} />
      <pointLight ref={scanner} color={SIGNAL} intensity={16} distance={6} decay={1.5} position={[0, 0.2, 1.4]} />
    </group>
  );
}

/* ────────────────────────── planet & rings ────────────────────────── */

function Planet({ profile }: { profile: RenderProfile }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const sat = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const wire = useDisposable(() => {
    const base = new THREE.IcosahedronGeometry(6, 3);
    const w = new THREE.WireframeGeometry(base);
    base.dispose();
    return w;
  });
  const core = useDisposable(() => new THREE.SphereGeometry(5.92, 48, 32));
  const ring1 = useDisposable(() => new THREE.TorusGeometry(8.6, 0.045, 10, 180));
  const ring2 = useDisposable(() => new THREE.TorusGeometry(9.9, 0.022, 8, 180));
  const satGeo = useDisposable(() => new THREE.SphereGeometry(0.16, 16, 12));
  const lineMat = useDisposable(
    () => new THREE.LineBasicMaterial({ color: "#c9cfd8", transparent: true, opacity: 0.16, depthWrite: false })
  );
  const coreMat = useDisposable(() => new THREE.MeshStandardMaterial({ color: "#16181b", roughness: 0.9, metalness: 0.2 }));
  const chrome = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: "#d9dee6", metalness: 1, roughness: 0.2, envMapIntensity: 1.2 })
  );
  const red = useDisposable(() => new THREE.MeshBasicMaterial({ color: SIGNAL, toneMapped: false }));

  useFrame(({ camera, clock }, delta) => {
    if (!group.current) return;
    const wide = size.width / size.height > 1.1;
    // Distant: it drifts up slowly, clearing the hero before the reading sections start.
    group.current.position.set(wide ? 12.5 : 3, camera.position.y * 0.55 + (wide ? -2.2 : 5.5), -30);
    if (profile.reducedMotion) return;
    const dt = Math.min(delta, 0.05);
    if (spin.current) spin.current.rotation.y += dt * 0.05;
    if (rings.current) rings.current.rotation.z += dt * 0.03;
    if (sat.current) {
      const a = clock.elapsedTime * 0.35;
      sat.current.position.set(Math.cos(a) * 8.6, Math.sin(a) * 8.6, 0);
    }
  });

  return (
    <group ref={group}>
      <group ref={spin}>
        <mesh geometry={core} material={coreMat} />
        <lineSegments geometry={wire} material={lineMat} />
      </group>
      <group rotation={[1.15, 0.35, 0]}>
        <group ref={rings}>
          <mesh geometry={ring1} material={chrome} />
          <mesh geometry={ring2} material={chrome} rotation={[0.08, -0.05, 0]} />
          <mesh ref={sat} geometry={satGeo} material={red} />
        </group>
      </group>
    </group>
  );
}

/* ────────────────────────── data particles ────────────────────────── */

const DUST_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uCamY;
  uniform float uDrift;
  uniform float uSize;
  uniform float uHeight;
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aRed;
  varying float vAlpha;
  varying float vRed;

  void main() {
    vec3 p = position;
    // Rise slowly, wrapped in a window around the camera so they never run out.
    float rel = mod(p.y + uTime * aSpeed - uCamY + uHeight * 0.5, uHeight) - uHeight * 0.5;
    p.y = uCamY + rel;
    p.x += sin(uTime * 0.3 + aPhase) * 0.25 + uDrift * (0.4 + aSpeed);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * (1.0 + aRed * 0.6) * (14.0 / -mv.z), 1.0, 14.0);
    float twinkle = 0.55 + 0.45 * sin(uTime * 2.0 + aPhase * 7.0);
    vAlpha = smoothstep(36.0, 6.0, -mv.z) * smoothstep(0.5, 2.5, -mv.z) * twinkle;
    vRed = aRed;
  }
`;

const DUST_FRAG = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying float vRed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d);
    vec3 col = mix(vec3(0.86, 0.89, 0.93), vec3(1.0, 0.2, 0.24), vRed);
    gl_FragColor = vec4(col, a * vAlpha * 0.8);
  }
`;

function DataParticles({ profile, pointer }: { profile: RenderProfile; pointer: PointerValues }) {
  const count = Math.round(1500 * profile.particleScale);
  const height = 28;

  const geometry = useDisposable(() => {
    const rand = mulberry32(7);
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const phase = new Float32Array(count);
    const redness = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 36;
      pos[i * 3 + 1] = (rand() - 0.5) * height;
      pos[i * 3 + 2] = -22 + rand() * 28;
      speed[i] = 0.08 + rand() * 0.35;
      phase[i] = rand() * Math.PI * 2;
      redness[i] = rand() < 0.06 ? 1 : 0;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aRed", new THREE.BufferAttribute(redness, 1));
    // The wrap moves particles in the shader, so the CPU bounds would be wrong.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    return g;
  }, [count]);

  const material = useDisposable(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uCamY: { value: 0 },
          uDrift: { value: 0 },
          uSize: { value: profile.tier === "high" ? 5.5 : 4.5 },
          uHeight: { value: height },
        },
      }),
    [profile.tier]
  );

  useFrame(({ camera, clock }) => {
    const u = material.uniforms;
    u.uTime.value = profile.reducedMotion ? 0 : clock.elapsedTime;
    u.uCamY.value = camera.position.y;
    u.uDrift.value = profile.reducedMotion ? 0 : pointer.nx.get() * 0.6;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/* ────────────────────────── floating prisms ────────────────────────── */

function Prisms({ profile }: { profile: RenderProfile }) {
  const chromeRef = useRef<THREE.InstancedMesh>(null);
  const redRef = useRef<THREE.InstancedMesh>(null);
  const count = profile.tier === "high" ? 22 : profile.tier === "medium" ? 14 : 8;
  const redCount = 3;

  const geometry = useDisposable(() => new THREE.OctahedronGeometry(0.5, 0));
  const chrome = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d4dae2",
        metalness: 1,
        roughness: 0.16,
        flatShading: true,
        envMapIntensity: 1.2,
      })
  );
  const red = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5a0b10",
        emissive: SIGNAL,
        emissiveIntensity: 1.1,
        metalness: 0.5,
        roughness: 0.25,
        flatShading: true,
      })
  );

  const prisms = useMemo(() => {
    const rand = mulberry32(21);
    const make = (n: number) =>
      Array.from({ length: n }, (_, i) => {
        const sideSign = i % 2 === 0 ? 1 : -1;
        return {
          // Kept to the edges and well behind the text column.
          pos: new THREE.Vector3(sideSign * (7 + rand() * 8), -8 - rand() * (DESCENT - 12), -8 - rand() * 10),
          scale: new THREE.Vector3(0.45, 1.1 + rand() * 1.2, 0.45).multiplyScalar(0.5 + rand() * 0.7),
          rot: new THREE.Euler(rand() * 3, rand() * 3, rand() * 3),
          speed: new THREE.Vector3((rand() - 0.5) * 0.4, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.3),
          bob: rand() * Math.PI * 2,
        };
      });
    return { chrome: make(count), red: make(redCount) };
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = profile.reducedMotion ? 0 : clock.elapsedTime;
    const write = (mesh: THREE.InstancedMesh | null, list: typeof prisms.chrome) => {
      if (!mesh) return;
      list.forEach((s, i) => {
        dummy.position.copy(s.pos);
        dummy.position.y += Math.sin(t * 0.5 + s.bob) * 0.25;
        dummy.rotation.set(s.rot.x + t * s.speed.x, s.rot.y + t * s.speed.y, s.rot.z + t * s.speed.z);
        dummy.scale.copy(s.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    write(chromeRef.current, prisms.chrome);
    write(redRef.current, prisms.red);
  });

  return (
    <>
      <instancedMesh ref={chromeRef} args={[geometry, chrome, count]} frustumCulled={false} />
      <instancedMesh ref={redRef} args={[geometry, red, redCount]} frustumCulled={false} />
    </>
  );
}

/* ────────────────────────── grid floor & signal pylon ────────────────────────── */

const GRID_VERT = /* glsl */ `
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const GRID_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uLine;
  uniform vec3 uSignal;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec2 g = vWorld.xz * 0.55;
    g.y += uTime * 0.35;
    vec2 f = abs(fract(g - 0.5) - 0.5) / fwidth(g);
    float line = 1.0 - min(min(f.x, f.y), 1.0);
    float fade = smoothstep(60.0, 5.0, vDepth);
    // A faint red wash spreading from the pylon at the centre.
    float glow = smoothstep(14.0, 0.0, length(vWorld.xz - vec2(0.0, -12.0)));
    vec3 col = mix(uLine, uSignal, glow * 0.65);
    gl_FragColor = vec4(col, (line * 0.55 + glow * 0.08) * fade);
  }
`;

const HORIZON_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - vUv.y, 3.0) * 0.45 * smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
    gl_FragColor = vec4(uColor, a);
  }
`;

const UV_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function GridFloor({ profile }: { profile: RenderProfile }) {
  const pylonLight = useRef<THREE.PointLight>(null);
  const bulbMat = useRef<THREE.MeshBasicMaterial>(null);
  const towersRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);
  const pings = useRef<(THREE.Mesh | null)[]>([]);

  const plane = useDisposable(() => new THREE.PlaneGeometry(140, 80).rotateX(-Math.PI / 2));
  const grid = useDisposable(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GRID_VERT,
        fragmentShader: GRID_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uLine: { value: new THREE.Color("#aeb6c2") },
          uSignal: { value: new THREE.Color(SIGNAL) },
        },
      })
  );
  const horizonGeo = useDisposable(() => new THREE.PlaneGeometry(140, 18));
  const horizon = useDisposable(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: UV_VERT,
        fragmentShader: HORIZON_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: { uColor: { value: new THREE.Color(SIGNAL) } },
      })
  );

  const tower = useDisposable(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
  const towerMat = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: "#2a2d33", metalness: 0.8, roughness: 0.32, envMapIntensity: 0.8 })
  );
  const cap = useDisposable(() => new THREE.BoxGeometry(0.22, 0.12, 0.22));
  const capMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }));
  const pylon = useDisposable(() => new THREE.CylinderGeometry(0.05, 0.11, 3.4, 8).translate(0, 1.7, 0));
  const chrome = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: "#d9dee6", metalness: 1, roughness: 0.2, envMapIntensity: 1.2 })
  );
  const bulb = useDisposable(() => new THREE.SphereGeometry(0.14, 16, 12));
  const ring = useDisposable(() => new THREE.RingGeometry(0.94, 1, 96).rotateX(-Math.PI / 2));
  const pingMats = useMemo(
    () =>
      [0, 1].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: SIGNAL,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          })
      ),
    []
  );
  useEffect(() => () => pingMats.forEach((m) => m.dispose()), [pingMats]);

  const towerCount = profile.tier === "low" ? 8 : 14;
  const towers = useMemo(() => {
    const rand = mulberry32(5);
    return Array.from({ length: towerCount }, (_, i) => {
      const sideSign = i % 2 === 0 ? 1 : -1;
      const h = 2 + Math.pow(rand(), 1.6) * 9;
      return {
        x: sideSign * (5 + rand() * 22),
        z: -16 - rand() * 22,
        w: 0.8 + rand() * 1.6,
        d: 0.8 + rand() * 1.4,
        h,
        phase: rand() * Math.PI * 2,
      };
    });
  }, [towerCount]);

  useEffect(() => {
    const tm = towersRef.current;
    const lm = lightsRef.current;
    if (!tm || !lm) return;
    const dummy = new THREE.Object3D();
    towers.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z);
      dummy.scale.set(t.w, t.h, t.d);
      dummy.updateMatrix();
      tm.setMatrixAt(i, dummy.matrix);
      dummy.position.set(t.x, t.h + 0.08, t.z);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      lm.setMatrixAt(i, dummy.matrix);
      lm.setColorAt(i, new THREE.Color(SIGNAL));
    });
    tm.instanceMatrix.needsUpdate = true;
    lm.instanceMatrix.needsUpdate = true;
    if (lm.instanceColor) lm.instanceColor.needsUpdate = true;
  }, [towers]);

  const color = useMemo(() => new THREE.Color(), []);
  const signal = useMemo(() => new THREE.Color(SIGNAL), []);

  useFrame(({ clock }) => {
    const t = profile.reducedMotion ? 0.4 : clock.elapsedTime;
    grid.uniforms.uTime.value = profile.reducedMotion ? 0 : t;

    // Aviation-style flash on the pylon: sharp, every ~1.6 s, never fully dark.
    const flash = Math.pow(Math.max(0, Math.sin(t * 3.9)), 10);
    const level = 0.25 + flash * 0.75;
    if (pylonLight.current) pylonLight.current.intensity = 6 + level * 24;
    if (bulbMat.current) bulbMat.current.color.copy(signal).multiplyScalar(0.6 + level * 1.6);

    // Radar pings expanding across the floor.
    pings.current.forEach((m, i) => {
      if (!m) return;
      const k = profile.reducedMotion ? 0.35 + i * 0.3 : ((t * 0.38 + i * 0.5) % 1 + 1) % 1;
      m.scale.setScalar(0.5 + k * 11);
      pingMats[i].opacity = (1 - k) * 0.8;
    });

    const lm = lightsRef.current;
    if (lm) {
      towers.forEach((tw, i) => {
        const b = Math.pow(Math.max(0, Math.sin(t * 1.7 + tw.phase)), 8);
        lm.setColorAt(i, color.copy(signal).multiplyScalar(0.25 + b * 1.4));
      });
      if (lm.instanceColor) lm.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={[0, -DESCENT - 3.2, 0]}>
      <mesh geometry={plane} material={grid} position={[0, 0, -18]} />
      <mesh geometry={horizonGeo} material={horizon} position={[0, 9, -50]} />
      <instancedMesh ref={towersRef} args={[tower, towerMat, towerCount]} frustumCulled={false} />
      <instancedMesh ref={lightsRef} args={[cap, capMat, towerCount]} frustumCulled={false} />
      <group position={[0, 0, -12]}>
        <mesh geometry={pylon} material={chrome} />
        <mesh geometry={bulb} position={[0, 3.5, 0]}>
          <meshBasicMaterial ref={bulbMat} color={SIGNAL} toneMapped={false} />
        </mesh>
        <pointLight ref={pylonLight} color={SIGNAL} intensity={14} distance={20} decay={1.4} position={[0, 3.6, 0.6]} />
        {pingMats.map((m, i) => (
          <mesh
            key={i}
            ref={(el) => {
              pings.current[i] = el;
            }}
            geometry={ring}
            material={m}
            position={[0, 0.02, 0]}
          />
        ))}
      </group>
    </group>
  );
}

/* ────────────────────────── entry ────────────────────────── */

export interface FutureSceneProps {
  profile: RenderProfile;
  pointer: PointerValues;
  scroll: MotionValue<number>;
  active: boolean;
  fallback: React.ReactNode;
}

/** Lazy entry point for the background scene. */
export default function FutureScene({ profile, pointer, scroll, active, fallback }: FutureSceneProps) {
  return (
    <SceneCanvas
      profile={profile}
      active={active}
      fallback={fallback}
      className="!fixed inset-0"
      camera={{ position: [0, 0, CAM_Z], fov: FOV, near: 0.1, far: 140 }}
    >
      <fogExp2 attach="fog" args={[FOG, 0.018]} />
      <Environment />
      <Rig scroll={scroll} pointer={pointer} reduced={profile.reducedMotion} />
      <KeyLights />
      <Planet profile={profile} />
      <ChromeName profile={profile} pointer={pointer} />
      <Prisms profile={profile} />
      <GridFloor profile={profile} />
      <DataParticles profile={profile} pointer={pointer} />
    </SceneCanvas>
  );
}
