import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/**
 * Bloom with three's own post-processing (no extra dependency): anything
 * brighter than the threshold (neon, the lamp bulb, screens, city windows)
 * gets a soft glow. Taking over rendering with useFrame priority 1.
 */
export function Bloom({ strength = 0.6, radius = 0.55, threshold = 0.82 }: { strength?: number; radius?: number; threshold?: number }) {
  const { gl, scene, camera, size, viewport } = useThree();

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), strength, radius, threshold));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, strength, radius, threshold]);

  useEffect(() => {
    composer.setPixelRatio(viewport.dpr);
    composer.setSize(size.width, size.height);
  }, [composer, size, viewport.dpr]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, delta) => composer.render(delta), 1);
  return null;
}
