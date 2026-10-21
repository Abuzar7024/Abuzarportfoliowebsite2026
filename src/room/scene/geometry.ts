import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Cached primitive geometries. Many objects share the same shapes (keys,
 * books, wheels, bolts...), so each distinct size is built once and reused.
 * `disposeGeometries` frees them when the room unmounts.
 */

const cache = new Map<string, THREE.BufferGeometry>();

function get<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g as T;
}

const k = (...n: number[]) => n.map((v) => v.toFixed(4)).join(",");

export const geo = {
  box: (w: number, h: number, d: number) => get(`box:${k(w, h, d)}`, () => new THREE.BoxGeometry(w, h, d)),
  rbox: (w: number, h: number, d: number, r: number, seg = 3) =>
    get(`rbox:${k(w, h, d, r, seg)}`, () => new RoundedBoxGeometry(w, h, d, seg, r)),
  cyl: (rt: number, rb: number, h: number, seg = 24) =>
    get(`cyl:${k(rt, rb, h, seg)}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)),
  sphere: (r: number, ws = 24, hs = 16) => get(`sph:${k(r, ws, hs)}`, () => new THREE.SphereGeometry(r, ws, hs)),
  capsule: (r: number, len: number, seg = 8) => get(`cap:${k(r, len, seg)}`, () => new THREE.CapsuleGeometry(r, len, seg, 16)),
  torus: (r: number, t: number, rs = 12, ts = 32, arc = Math.PI * 2) =>
    get(`tor:${k(r, t, rs, ts, arc)}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc)),
  cone: (r: number, h: number, seg = 16) => get(`cone:${k(r, h, seg)}`, () => new THREE.ConeGeometry(r, h, seg)),
  plane: (w: number, h: number) => get(`pl:${k(w, h)}`, () => new THREE.PlaneGeometry(w, h)),
  circle: (r: number, seg = 32) => get(`circ:${k(r, seg)}`, () => new THREE.CircleGeometry(r, seg)),
  /** A tube along a smooth path through the given points (cables, tails). */
  tube: (key: string, points: [number, number, number][], radius: number, seg = 48) =>
    get(`tube:${key}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), seg, radius, 8)),
  custom: <T extends THREE.BufferGeometry>(key: string, make: () => T) => get(`custom:${key}`, make),
};

export function disposeGeometries() {
  cache.forEach((g) => g.dispose());
  cache.clear();
}
