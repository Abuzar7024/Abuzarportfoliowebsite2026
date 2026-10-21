import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { getMaterials } from "./materials";
import { geo } from "./geometry";
import { Interactive } from "./Interactive";
import { getState } from "../store";

/**
 * AK-Bot: an original desk-side robot built from primitives and rigged as a
 * hierarchy of groups (pelvis → torso → shoulders → elbows → hands, neck →
 * head). Idle: breathing, blinking, antenna pulse, head tracking the pointer.
 * Clicked (robotPing): a two-second wave with happy eyes.
 */

const WAVE_SECONDS = 2;

function Arm({ side, armRef, foreRef }: { side: 1 | -1; armRef: React.Ref<THREE.Group>; foreRef: React.Ref<THREE.Group> }) {
  const m = getMaterials();
  return (
    <group position={[side * 0.235, 0.29, 0]}>
      <mesh geometry={geo.sphere(0.055, 20, 14)} material={m.chrome} />
      {/* Shoulder pivot: the whole arm hangs from here. */}
      <group ref={armRef} rotation={[0, 0, side * 0.12]}>
        <mesh geometry={geo.capsule(0.035, 0.14, 6)} material={m.plastic} position={[0, -0.11, 0]} />
        <mesh geometry={geo.cyl(0.04, 0.04, 0.03, 16)} material={m.red} position={[0, -0.05, 0]} />
        <group ref={foreRef} position={[0, -0.22, 0]} rotation={[-0.3, 0, 0]}>
          <mesh geometry={geo.sphere(0.042, 18, 12)} material={m.chrome} />
          <mesh geometry={geo.capsule(0.032, 0.13, 6)} material={m.plasticLight} position={[0, -0.1, 0]} />
          {/* Hand: palm, three fingers and a thumb */}
          <group position={[0, -0.21, 0]}>
            <mesh geometry={geo.rbox(0.06, 0.055, 0.035, 0.012)} material={m.plastic} />
            {[-0.018, 0, 0.018].map((fx) => (
              <mesh key={fx} geometry={geo.capsule(0.007, 0.03, 4)} material={m.metal} position={[fx, -0.045, 0]} />
            ))}
            <mesh geometry={geo.capsule(0.007, 0.022, 4)} material={m.metal} position={[side * -0.035, -0.012, 0.01]} rotation={[0, 0, side * 0.7]} />
          </group>
        </group>
      </group>
    </group>
  );
}

function Leg({ side }: { side: 1 | -1 }) {
  const m = getMaterials();
  return (
    <group position={[side * 0.09, 0.5, 0]}>
      <mesh geometry={geo.sphere(0.045, 16, 12)} material={m.chrome} />
      <mesh geometry={geo.capsule(0.04, 0.16, 6)} material={m.plastic} position={[0, -0.12, 0]} />
      <mesh geometry={geo.sphere(0.042, 16, 12)} material={m.chrome} position={[0, -0.25, 0]} />
      <mesh geometry={geo.capsule(0.036, 0.15, 6)} material={m.plasticLight} position={[0, -0.36, 0]} />
      <mesh geometry={geo.cyl(0.042, 0.042, 0.03, 16)} material={m.red} position={[0, -0.3, 0]} />
      <mesh geometry={geo.rbox(0.1, 0.05, 0.16, 0.02)} material={m.plasticDark} position={[0, -0.475, 0.025]} castShadow />
    </group>
  );
}

export function RobotCharacter({ position = [2.05, 0, -1.8], rotation = -0.55 }: { position?: [number, number, number]; rotation?: number }) {
  const m = getMaterials();
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const antenna = useRef<THREE.MeshBasicMaterial>(null);
  const chest = useRef<(THREE.Mesh | null)[]>([]);
  const nextBlink = useRef(2);
  const waveStart = useRef(-10);
  const lastPing = useRef(getState().robotPing);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const headWorld = useMemo(() => new THREE.Vector3(), []);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#dfe8f5").multiplyScalar(1.6), toneMapped: false }), []);
  React.useEffect(() => () => eyeMat.dispose(), [eyeMat]);

  useFrame(({ clock, camera, pointer }, delta) => {
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const s = getState();
    if (s.robotPing !== lastPing.current) {
      lastPing.current = s.robotPing;
      waveStart.current = t;
    }
    const waving = t - waveStart.current < WAVE_SECONDS;
    const hovered = s.hovered === "robot";

    if (torso.current) {
      torso.current.position.y = 0.56 + Math.sin(t * 1.8) * 0.006;
      torso.current.rotation.z = Math.sin(t * 0.9) * 0.015;
    }

    // Head: look towards a point between the camera and the pointer.
    if (head.current) {
      head.current.getWorldPosition(headWorld);
      lookTarget.set(camera.position.x + pointer.x * 1.5, camera.position.y + pointer.y * 0.8, camera.position.z);
      const dx = lookTarget.x - headWorld.x;
      const dz = lookTarget.z - headWorld.z;
      const yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz) - rotation, -0.7, 0.7);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(lookTarget.y - headWorld.y, Math.hypot(dx, dz)) * 0.6, -0.3, 0.3);
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, yaw, 4, dt);
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, pitch + (hovered ? -0.08 : 0), 4, dt);
      head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, waving ? Math.sin(t * 6) * 0.12 : hovered ? 0.12 : 0, 5, dt);
    }

    // Blink every few seconds; squint happily while waving.
    if (eyes.current) {
      let sy = 1;
      if (t > nextBlink.current) {
        const k = (t - nextBlink.current) / 0.14;
        sy = k < 1 ? Math.abs(1 - 2 * k) * 0.9 + 0.1 : 1;
        if (k >= 1) nextBlink.current = t + 2.5 + Math.random() * 3;
      }
      eyes.current.scale.y = waving ? 0.35 : sy;
    }

    // Right arm: wave on ping, otherwise a lazy idle sway. Left arm mirrors the idle.
    if (armR.current && foreR.current) {
      const targetZ = waving ? 2.6 : 0.12 + Math.sin(t * 1.1) * 0.03;
      armR.current.rotation.z = THREE.MathUtils.damp(armR.current.rotation.z, targetZ, 6, dt);
      foreR.current.rotation.z = waving ? Math.sin(t * 10) * 0.45 : THREE.MathUtils.damp(foreR.current.rotation.z, 0, 6, dt);
      foreR.current.rotation.x = THREE.MathUtils.damp(foreR.current.rotation.x, waving ? 0 : -0.3, 6, dt);
    }
    if (armL.current && foreL.current) {
      armL.current.rotation.z = -0.12 - Math.sin(t * 1.1 + 1) * 0.03;
      foreL.current.rotation.x = -0.3 + Math.sin(t * 0.8) * 0.05;
    }

    if (antenna.current) {
      const pulse = Math.pow(Math.max(0, Math.sin(t * 2.4)), 6);
      antenna.current.color.setRGB(0.6 + pulse * 1.8, 0.08 + pulse * 0.2, 0.1 + pulse * 0.2);
    }
    eyeMat.color.setScalar(hovered || waving ? 2.1 : 1.6);

    // Chest status bars bounce like a level meter.
    chest.current.forEach((bar, i) => {
      if (bar) bar.scale.x = 0.35 + 0.65 * Math.abs(Math.sin(t * (1.3 + i * 0.7) + i));
    });
  });

  return (
    <Interactive id="robot" anchor={[0, 1.42, 0]} position={position} rotation={[0, rotation, 0]}>
      <Leg side={1} />
      <Leg side={-1} />
      <mesh geometry={geo.rbox(0.26, 0.1, 0.18, 0.04)} material={m.plasticDark} position={[0, 0.52, 0]} />

      <group ref={torso} position={[0, 0.56, 0]}>
        <mesh geometry={geo.rbox(0.4, 0.38, 0.25, 0.08, 4)} material={m.plasticLight} position={[0, 0.2, 0]} castShadow />
        <mesh geometry={geo.rbox(0.42, 0.06, 0.27, 0.03)} material={m.red} position={[0, 0.03, 0]} />
        {/* Chest display */}
        <mesh geometry={geo.rbox(0.22, 0.13, 0.02, 0.02)} material={m.plasticDark} position={[0, 0.23, 0.126]} />
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(el) => {
              chest.current[i] = el;
            }}
            geometry={geo.box(0.16, 0.014, 0.005)}
            material={i === 1 ? m.neon : m.chrome}
            position={[0, 0.27 - i * 0.035, 0.138]}
          />
        ))}
        <mesh geometry={geo.cyl(0.02, 0.02, 0.01, 16)} material={m.metal} rotation={[Math.PI / 2, 0, 0]} position={[0.13, 0.33, 0.126]} />

        <Arm side={1} armRef={armR} foreRef={foreR} />
        <Arm side={-1} armRef={armL} foreRef={foreL} />

        {/* Neck and head */}
        <mesh geometry={geo.cyl(0.045, 0.06, 0.07, 16)} material={m.chrome} position={[0, 0.42, 0]} />
        <group ref={head} position={[0, 0.6, 0]}>
          <mesh geometry={geo.rbox(0.38, 0.29, 0.29, 0.09, 5)} material={m.plasticLight} castShadow />
          <mesh geometry={geo.rbox(0.31, 0.17, 0.04, 0.06, 4)} material={m.plasticDark} position={[0, 0, 0.13]} />
          <group ref={eyes} position={[0, 0.005, 0.152]}>
            <mesh geometry={geo.capsule(0.022, 0.03, 4)} material={eyeMat} position={[-0.07, 0, 0]} />
            <mesh geometry={geo.capsule(0.022, 0.03, 4)} material={eyeMat} position={[0.07, 0, 0]} />
          </group>
          <mesh geometry={geo.circle(0.016, 16)} material={m.neonSoft} position={[-0.12, -0.06, 0.146]} />
          <mesh geometry={geo.circle(0.016, 16)} material={m.neonSoft} position={[0.12, -0.06, 0.146]} />
          {/* Ear discs */}
          {[-1, 1].map((sx) => (
            <group key={sx} position={[sx * 0.195, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh geometry={geo.cyl(0.06, 0.06, 0.03, 24)} material={m.chrome} />
              <mesh geometry={geo.cyl(0.035, 0.035, 0.035, 20)} material={m.red} />
            </group>
          ))}
          {/* Antenna */}
          <mesh geometry={geo.cyl(0.007, 0.007, 0.12, 8)} material={m.metal} position={[0.06, 0.2, 0]} />
          <mesh geometry={geo.sphere(0.022, 16, 12)} position={[0.06, 0.27, 0]}>
            <meshBasicMaterial ref={antenna} color="#e3262e" toneMapped={false} />
          </mesh>
        </group>
      </group>
    </Interactive>
  );
}
