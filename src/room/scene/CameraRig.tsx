import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { getState, setState, screen, type View } from "../store";
import { pointerGesture } from "./gesture";
import { SCREEN } from "./ComputerMonitor";

interface Pose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  /** World axis that a horizontal drag pans along, and how far. */
  panAxis: THREE.Vector3;
  panLimit: number;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const lerp = THREE.MathUtils.lerp;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 0 for a tall phone, 1 for a wide desktop. */
const wideness = (aspect: number) => THREE.MathUtils.clamp((aspect - 0.5) / (1.6 - 0.5), 0, 1);

const screenCenter = new THREE.Vector3();
const screenNormal = new THREE.Vector3();
const quat = new THREE.Quaternion();

function poseFor(view: View, aspect: number): Pose {
  const k = wideness(aspect);
  switch (view) {
    case "monitor": {
      const mesh = screen.mesh;
      if (mesh) {
        mesh.getWorldPosition(screenCenter);
        mesh.getWorldQuaternion(quat);
        screenNormal.set(0, 0, 1).applyQuaternion(quat);
      } else {
        screenCenter.set(0, 1.2, -2.4);
        screenNormal.set(0, 0, 1);
      }
      const fov = 40;
      const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
      // Fit the screen to ~86% of the height, or ~94% of the width on narrow views.
      const d = Math.max(SCREEN.h / 2 / tan / 0.86, SCREEN.w / 2 / (tan * aspect) / 0.94);
      return { pos: screenCenter.clone().addScaledVector(screenNormal, d), target: screenCenter.clone(), fov, panAxis: v(1, 0, 0), panLimit: 0 };
    }
    case "posters":
      return { pos: v(lerp(-0.9, -1.45, k), 1.7, -1.6), target: v(-4, 1.68, -1.6), fov: lerp(68, 56, k), panAxis: v(0, 0, -1), panLimit: lerp(1.1, 0.3, k) };
    case "shelf":
      return { pos: v(1.3, 1.62, -0.45), target: v(4, 1.6, -2.15), fov: lerp(70, 55, k), panAxis: v(-0.55, 0, -0.84), panLimit: lerp(1.0, 0.3, k) };
    default:
      return {
        pos: v(lerp(0, -0.15, k), lerp(1.95, 1.75, k), lerp(4.9, 3.9, k)),
        target: v(lerp(0, -0.35, k), lerp(1.2, 1.3, k), -2.3),
        fov: lerp(66, 50, k),
        panAxis: v(1, 0, 0),
        panLimit: lerp(1.9, 0.8, k),
      };
  }
}

/**
 * Flies the camera between views with an eased tween, then keeps following
 * the view's pose with drag-to-pan and (on desktop) a little pointer parallax.
 * Sets `arrived` in the store when a flight lands.
 */
export function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size, pointer } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const target = useMemo(() => new THREE.Vector3(0, 1.28, -2.3), []);
  const flight = useRef({ view: getState().view, t: 1, fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), fromFov: 50 });
  const pan = useRef(0);
  const lastPan = useRef(0);
  const fine = useMemo(() => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches, []);

  // Start at the room pose without a flight.
  useEffect(() => {
    const p = poseFor("room", size.width / size.height);
    cam.position.copy(p.pos);
    target.copy(p.target);
    cam.fov = p.fov;
    cam.updateProjectionMatrix();
    cam.lookAt(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = getState();
    const f = flight.current;
    const aspect = size.width / size.height;

    if (s.view !== f.view) {
      f.view = s.view;
      f.t = 0;
      f.fromPos.copy(cam.position);
      f.fromTarget.copy(target);
      f.fromFov = cam.fov;
      pan.current = 0;
    }

    const pose = poseFor(s.view, aspect);

    // Drag pans along the current wall; the gesture accumulates pixels.
    const dragPx = pointerGesture.pan - lastPan.current;
    lastPan.current = pointerGesture.pan;
    if (pose.panLimit > 0 && f.t >= 1) {
      pan.current = THREE.MathUtils.clamp(pan.current - (dragPx / size.width) * 3, -pose.panLimit, pose.panLimit);
    }
    pose.pos.addScaledVector(pose.panAxis, pan.current);
    pose.target.addScaledVector(pose.panAxis, pan.current);

    if (fine && !reduced && s.view === "room") {
      pose.pos.x += pointer.x * 0.18;
      pose.pos.y += pointer.y * 0.08;
    }

    if (f.t < 1) {
      // Flights advance on (lightly clamped) real time so they take ~1.2 s even on slow devices.
      f.t = reduced ? 1 : Math.min(1, f.t + Math.min(delta, 0.25) / 1.15);
      const e = easeInOut(f.t);
      cam.position.lerpVectors(f.fromPos, pose.pos, e);
      target.lerpVectors(f.fromTarget, pose.target, e);
      cam.fov = lerp(f.fromFov, pose.fov, e);
      if (f.t >= 1) setState({ arrived: true });
    } else {
      cam.position.x = THREE.MathUtils.damp(cam.position.x, pose.pos.x, 5, dt);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, pose.pos.y, 5, dt);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, pose.pos.z, 5, dt);
      target.x = THREE.MathUtils.damp(target.x, pose.target.x, 5, dt);
      target.y = THREE.MathUtils.damp(target.y, pose.target.y, 5, dt);
      target.z = THREE.MathUtils.damp(target.z, pose.target.z, 5, dt);
      cam.fov = THREE.MathUtils.damp(cam.fov, pose.fov, 5, dt);
    }
    cam.updateProjectionMatrix();
    cam.lookAt(target);
  });

  return null;
}
