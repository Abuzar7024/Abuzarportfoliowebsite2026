import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { anchors, HOTSPOTS, setState, getState, useRoom } from "../store";
import { pointerGesture } from "./gesture";

const HIGHLIGHT = new THREE.Color("#e3262e");
const NOOP_RAYCAST = () => {};
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });

interface InteractiveProps {
  id: string;
  /** Where the hotspot pin sits, relative to this group. */
  anchor?: [number, number, number];
  /** Only clickable while the camera is in one of these views. */
  views?: string[];
  onActivate?: () => void;
  children: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Makes a group of meshes clickable: a pointer cursor and a red emissive glow
 * on hover, a click (but not a drag) activates the matching hotspot, and the
 * group registers an anchor for its keyboard-accessible DOM pin.
 *
 * Uses a single bounding-box hit proxy so pointer movement raycasts against 12
 * triangles per hotspot instead of dozens of decorative child meshes.
 */
export function Interactive({ id, anchor = [0, 0.3, 0], views = ["room"], onActivate, children, position, rotation }: InteractiveProps) {
  const group = useRef<THREE.Group>(null);
  const anchorRef = useRef<THREE.Object3D>(null);
  const ownedMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const glow = useRef(0);
  const [hitBox, setHitBox] = useState<{ center: [number, number, number]; size: [number, number, number] } | null>(null);
  const view = useRoom((s) => s.view);
  const enabled = views.includes(view);
  const def = HOTSPOTS.find((h) => h.id === id);
  const activate = onActivate ?? def?.activate;

  useEffect(() => {
    if (anchorRef.current) anchors.set(id, anchorRef.current);
    return () => {
      anchors.delete(id);
    };
  }, [id]);

  // Share one cloned material per unique source material inside this interactive group,
  // and build a single bounding-box proxy for fast raycasting.
  useEffect(() => {
    const grp = group.current;
    if (!grp) return;
    grp.updateWorldMatrix(true, true);
    const inv = grp.matrixWorld.clone().invert();
    const box = new THREE.Box3();
    const childBox = new THREE.Box3();
    const keepChildRaycast = id === "posters";

    const map = new Map<THREE.MeshStandardMaterial, THREE.MeshStandardMaterial>();
    grp.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.isHitProxy) return;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      if (mesh.geometry.boundingBox) {
        childBox.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);
        box.union(childBox);
      }
      if (!keepChildRaycast) {
        mesh.raycast = NOOP_RAYCAST;
      }
      if (Array.isArray(mesh.material)) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (!m.isMeshStandardMaterial) return;
      let copy = map.get(m);
      if (!copy) {
        copy = m.clone();
        copy.userData.baseEmissive = copy.emissive.clone();
        map.set(m, copy);
      }
      mesh.material = copy;
    });

    if (!box.isEmpty()) {
      const c = new THREE.Vector3();
      const s = new THREE.Vector3();
      box.getCenter(c);
      box.getSize(s);
      setHitBox({
        center: [c.x, c.y, c.z],
        size: [Math.max(s.x + 0.04, 0.12), Math.max(s.y + 0.04, 0.12), Math.max(s.z + 0.04, 0.12)],
      });
    }

    const list = Array.from(map.values());
    ownedMats.current = list;
    return () => {
      ownedMats.current = [];
      list.forEach((m) => m.dispose());
    };
  }, [id]);

  useFrame((_, delta) => {
    const hovered = getState().hovered === id && enabled;
    const target = hovered ? 1 : 0;
    if (Math.abs(glow.current - target) < 0.001) return;
    glow.current = THREE.MathUtils.damp(glow.current, target, 12, Math.min(delta, 0.05));
    const k = glow.current * 0.32;
    for (const m of ownedMats.current) {
      if (m.userData.baseEmissive) {
        m.emissive.copy(m.userData.baseEmissive).lerp(HIGHLIGHT, k);
      }
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    setState({ hovered: id });
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (getState().hovered === id) setState({ hovered: null });
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!enabled || pointerGesture.dragged) return;
    e.stopPropagation();
    out();
    activate?.();
  };

  useEffect(() => {
    if (!enabled && getState().hovered === id) out();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <group ref={group} position={position} rotation={rotation}>
      {children}
      {hitBox && enabled && (
        <mesh
          userData={{ isHitProxy: true }}
          position={hitBox.center}
          material={HIT_MAT}
          onPointerOver={over}
          onPointerOut={out}
          onClick={click}
        >
          <boxGeometry args={hitBox.size} />
        </mesh>
      )}
      <object3D ref={anchorRef} position={anchor} />
    </group>
  );
}
