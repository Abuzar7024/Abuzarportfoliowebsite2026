import React from "react";

/**
 * Night lighting: a low charcoal ambient, cool moon/city light through the
 * window, a signal-red fill from the neon cove, and the ceiling panel.
 * The warm desk lamp, monitor glow and neon sign carry their own lights.
 */
export function LightingRig({ shadows }: { shadows: boolean }) {
  return (
    <>
      <ambientLight color="#8790a0" intensity={0.6} />
      <hemisphereLight color="#9aabc6" groundColor="#1c1d21" intensity={0.65} />
      <directionalLight
        color="#a9bad6"
        intensity={1.3}
        position={[2.5, 6, -9]}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0015}
      />
      <pointLight color="#ff3b44" intensity={1.5} distance={6} decay={1.8} position={[0, 3.1, -2.7]} />
      <pointLight color="#e4e9f0" intensity={5} distance={7.5} decay={1.6} position={[0.2, 3.05, -0.6]} />
    </>
  );
}
