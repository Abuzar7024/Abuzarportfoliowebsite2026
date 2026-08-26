import React from "react";
import type { MotionValue } from "motion/react";
import { SceneCanvas } from "./SceneCanvas";
import { Monolith, type MonolithControls } from "./Monolith";
import type { RenderProfile } from "../hooks/useDeviceTier";
import type { PointerValues } from "../hooks/usePointer";

export interface MonolithSceneProps {
  profile: RenderProfile;
  pointer: PointerValues;
  reveal: MotionValue<number>;
  stage: MotionValue<number>;
  scroll: MotionValue<number>;
  controls: MonolithControls;
  active: boolean;
  fallback: React.ReactNode;
}

/** Lazy entry for the signature object layer (intro + hero). */
export default function MonolithScene({ profile, pointer, reveal, stage, scroll, controls, active, fallback }: MonolithSceneProps) {
  return (
    <SceneCanvas profile={profile} active={active} fallback={fallback} className="!fixed inset-0" camera={{ position: [0, 0, 6], fov: 40, near: 0.1, far: 30 }}>
      <Monolith profile={profile} pointer={pointer} reveal={reveal} stage={stage} scroll={scroll} controls={controls} />
    </SceneCanvas>
  );
}
