import React from "react";
import { SceneCanvas } from "./SceneCanvas";
import { DeviceMock } from "./DeviceMock";
import type { DeviceKind, ScreenSpec } from "../data/types";
import type { RenderProfile } from "../hooks/useDeviceTier";

export interface DeviceSceneProps {
  kind: DeviceKind;
  screen: ScreenSpec;
  accent: string;
  profile: RenderProfile;
  active: boolean;
  fallback: React.ReactNode;
  scale?: number;
  interactive?: boolean;
  className?: string;
}

/** Lazy-loaded entry for a single 3D device mockup. */
export default function DeviceScene({ kind, screen, accent, profile, active, fallback, scale, interactive = true, className }: DeviceSceneProps) {
  const camZ = kind === "phone" ? 4.6 : 5.2;
  return (
    <SceneCanvas
      profile={profile}
      active={active}
      fallback={fallback}
      className={className}
      interactive={interactive}
      camera={{ position: [0, 0, camZ], fov: 35, near: 0.1, far: 40 }}
    >
      <DeviceMock kind={kind} screen={screen} accent={accent} profile={profile} scale={scale} interactive={interactive} />
    </SceneCanvas>
  );
}
