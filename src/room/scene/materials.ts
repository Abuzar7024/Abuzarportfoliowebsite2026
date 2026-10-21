import * as THREE from "three";
import { brushedTexture, fabricTexture, floorTexture, plasterTexture, rugTexture, woodTexture } from "./textures";

/**
 * One shared set of materials for the whole room: every object reuses these
 * instead of creating its own, which keeps shader programs and GPU memory low.
 * Created lazily on first use; `disposeMaterials` frees them on unmount.
 */

function make() {
  const wood = woodTexture();
  const brushed = brushedTexture();
  return {
    wood: new THREE.MeshStandardMaterial({ map: wood, bumpMap: wood, bumpScale: 0.6, roughness: 0.55, metalness: 0.05 }),
    floor: new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.48, metalness: 0.1 }),
    wall: new THREE.MeshStandardMaterial({ map: plasterTexture(), roughness: 0.96 }),
    ceiling: new THREE.MeshStandardMaterial({ color: "#1b1d21", roughness: 1 }),
    trim: new THREE.MeshStandardMaterial({ color: "#16171a", roughness: 0.6, metalness: 0.3 }),
    plastic: new THREE.MeshStandardMaterial({ color: "#2b2e34", roughness: 0.42, metalness: 0.08 }),
    plasticDark: new THREE.MeshStandardMaterial({ color: "#17181b", roughness: 0.5, metalness: 0.05 }),
    plasticLight: new THREE.MeshStandardMaterial({ color: "#c9ced6", roughness: 0.38, metalness: 0.05 }),
    metal: new THREE.MeshStandardMaterial({ color: "#c3c9d2", roughness: 0.32, metalness: 0.9, bumpMap: brushed, bumpScale: 0.3 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#e6eaf0", roughness: 0.14, metalness: 1 }),
    red: new THREE.MeshStandardMaterial({ color: "#c81d25", roughness: 0.38, metalness: 0.1, emissive: "#3a0306" }),
    neon: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ff3b44").multiplyScalar(2.2), toneMapped: false }),
    neonSoft: new THREE.MeshBasicMaterial({ color: "#ff5058", toneMapped: false, transparent: true, opacity: 0.35 }),
    fabric: new THREE.MeshStandardMaterial({ map: fabricTexture(), roughness: 1 }),
    rug: new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 1 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#101113", roughness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({
      color: "#9fb0c4",
      roughness: 0.05,
      metalness: 0.3,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
    }),
    leaf: new THREE.MeshStandardMaterial({ color: "#47624e", roughness: 0.65, side: THREE.DoubleSide, flatShading: true }),
    leafDark: new THREE.MeshStandardMaterial({ color: "#2f4637", roughness: 0.7, side: THREE.DoubleSide, flatShading: true }),
    ceramic: new THREE.MeshStandardMaterial({ color: "#d9dde3", roughness: 0.35 }),
    soil: new THREE.MeshStandardMaterial({ color: "#2a211b", roughness: 1 }),
    screenOff: new THREE.MeshStandardMaterial({ color: "#0b0c0e", roughness: 0.2, metalness: 0.5 }),
    paper: new THREE.MeshStandardMaterial({ color: "#d8dbe0", roughness: 0.9 }),
  };
}

export type Materials = ReturnType<typeof make>;

let mats: Materials | null = null;

export function getMaterials(): Materials {
  if (!mats) mats = make();
  return mats;
}

export function disposeMaterials() {
  if (!mats) return;
  Object.values(mats).forEach((m) => m.dispose());
  mats = null;
}
