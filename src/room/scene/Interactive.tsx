import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { anchors, HOTSPOTS, setState, getState, useRoom } from "../store";
import { pointerGesture } from "./gesture";

const HIGHLIGHT = new THREE.Color("#e3262e");

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
 * Materials inside are cloned on mount so the glow only affects this object.
 */
export function Interactive({ id, anchor = [0, 0.3, 0], views = ["room"], onActivate, children, position, rotation }: InteractiveProps) {
  const group = useRef<THREE.Group>(null);
  const anchorRef = useRef<THREE.Object3D>(null);
  const glow = useRef(0);
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

  // Own copies of the materials, remembering each one's resting emissive colour.
  useEffect(() => {
    const owned: THREE.Material[] = [];
    group.current?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (!m.isMeshStandardMaterial) return;
      const copy = m.clone();
      copy.userData.baseEmissive = copy.emissive.clone();
      mesh.material = copy;
      owned.push(copy);
    });
    return () => owned.forEach((m) => m.dispose());
  }, []);

  useFrame((_, delta) => {
    const hovered = getState().hovered === id && enabled;
    const target = hovered ? 1 : 0;
    if (Math.abs(glow.current - target) < 0.001) return;
    glow.current = THREE.MathUtils.damp(glow.current, target, 12, Math.min(delta, 0.05));
    group.current?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!m?.isMeshStandardMaterial || !m.userData.baseEmissive) return;
      m.emissive.copy(m.userData.baseEmissive).lerp(HIGHLIGHT, glow.current * 0.32);
    });
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

  useEffect(() => {
    if (!enabled && getState().hovered === id) out();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={over}
      onPointerOut={out}
      onClick={(e) => {
        if (!enabled || pointerGesture.dragged) return;
        e.stopPropagation();
        out();
        activate?.();
      }}
    >
      {children}
      <object3D ref={anchorRef} position={anchor} />
    </group>
  );
}
