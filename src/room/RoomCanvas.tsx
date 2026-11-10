import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { RenderProfile } from "../hooks/useDeviceTier";
import { SceneErrorBoundary } from "../three/SceneErrorBoundary";
import { Room } from "./scene/Room";
import { CitySkyline } from "./scene/CitySkyline";
import { Desk } from "./scene/Desk";
import { ComputerMonitor } from "./scene/ComputerMonitor";
import { Keyboard } from "./scene/Keyboard";
import { Chair } from "./scene/Chair";
import { RobotCharacter } from "./scene/RobotCharacter";
import { AvatarTrophy } from "./scene/AvatarTrophy";
import { SleepingCat } from "./scene/SleepingCat";
import { ProjectPosters } from "./scene/ProjectPosters";
import { Shelf } from "./scene/Shelf";
import { LightingRig } from "./scene/LightingRig";
import { CameraRig } from "./scene/CameraRig";
import { AdaptiveQuality, Projector } from "./scene/Projector";
import { Bloom } from "./scene/Effects";
import { Hologram, LedStrips, WindowRain } from "./scene/Atmosphere";
import { attachGesture } from "./scene/gesture";
import { disposeMaterials } from "./scene/materials";
import { disposeGeometries } from "./scene/geometry";
import { disposeTextures } from "./scene/textures";
import { setState, subscribe, useRoom } from "./store";

export type LoadStage = "engine" | "building" | "lighting" | "ready";

/** Reports "ready" after a few frames have actually been drawn. */
function FirstFrames({ onReady }: { onReady: () => void }) {
  const n = useRef(0);
  const done = useRef(false);
  const { invalidate } = useThree();
  useFrame(() => {
    if (done.current) return;
    n.current++;
    if (n.current >= 1) {
      done.current = true;
      onReady();
    } else {
      invalidate();
    }
  });
  return null;
}

/** On-demand rendering: redraw a few frames whenever room state or viewport size changes. */
function DemandInvalidate() {
  const { invalidate } = useThree();
  useEffect(() => {
    const unsub = subscribe(() => invalidate(4));
    const onResize = () => invalidate(4);
    window.addEventListener("resize", onResize);
    return () => {
      unsub();
      window.removeEventListener("resize", onResize);
    };
  }, [invalidate]);
  return null;
}

export interface RoomCanvasProps {
  profile: RenderProfile;
  active: boolean;
  fallback: React.ReactNode;
  onStage: (stage: LoadStage) => void;
}

/** The whole 3D room. Lazy-loaded; frees every GPU resource on unmount. */
export default function RoomCanvas({ profile, active, fallback, onStage }: RoomCanvasProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [lowFps, setLowFps] = useState(false);
  const shadows = profile.tier === "high" && !lowFps;
  const lite = profile.tier === "low" || lowFps;
  const overlayIdle = useRoom(
    (s) => (s.view === "monitor" && s.arrived) || s.posterProject !== null || (s.competitionOpen && s.arrived)
  );

  useEffect(() => {
    onStage("building");
    const detach = wrap.current ? attachGesture(wrap.current) : undefined;
    return () => {
      detach?.();
      document.body.style.cursor = "";
      setState({ hovered: null });
      disposeMaterials();
      disposeGeometries();
      disposeTextures();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLowFps = useCallback(() => setLowFps(true), []);
  const frameloop = !active
    ? "never"
    : profile.reducedMotion || overlayIdle
      ? "demand"
      : "always";

  return (
    <div ref={wrap} className="absolute inset-0 touch-pan-y">
      <SceneErrorBoundary fallback={fallback}>
        <Canvas
          dpr={profile.dpr}
          frameloop={frameloop}
          shadows={shadows ? { type: THREE.PCFSoftShadowMap } : false}
          camera={{ position: [-0.15, 1.75, 3.9], fov: 50, near: 0.05, far: 160 }}
          gl={{
            antialias: profile.antialias && !lowFps,
            powerPreference: profile.tier === "low" ? "default" : "high-performance",
            stencil: false,
            depth: true,
          }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.3;
            onStage("lighting");
          }}
          style={{ touchAction: "pan-y" }}
        >
          <color attach="background" args={["#101216"]} />
          <fog attach="fog" args={["#101216", 30, 110]} />
          <CameraRig reduced={profile.reducedMotion} />
          <LightingRig shadows={shadows} />
          <CitySkyline count={profile.tier === "high" && !lowFps ? 160 : profile.tier === "medium" && !lowFps ? 100 : 56} />
          <Room lite={lite} />
          <Desk shadows={shadows} />
          <ComputerMonitor />
          <Keyboard />
          <Chair />
          <SleepingCat />
          <RobotCharacter />
          <AvatarTrophy reduced={profile.reducedMotion} lite={lite} />
          <ProjectPosters />
          <Shelf />
          <Hologram reduced={profile.reducedMotion} lite={lite} />
          {!lite && <WindowRain reduced={profile.reducedMotion} />}
          <LedStrips lite={lite} />
          {profile.tier === "high" && !lowFps && <Bloom />}
          <Projector />
          <AdaptiveQuality max={profile.dpr[1]} onLowFps={handleLowFps} />
          <FirstFrames onReady={() => onStage("ready")} />
          <DemandInvalidate />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
