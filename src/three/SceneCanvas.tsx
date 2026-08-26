import React, { Component, type ReactNode, Suspense } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import type { RenderProfile } from "../hooks/useDeviceTier";

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}
interface BoundaryState {
  failed: boolean;
}

/** Catches WebGL context creation failures (or any scene error) and renders the 2D fallback instead. */
class SceneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };
  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) console.warn("[SceneCanvas] falling back to 2D:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface SceneCanvasProps {
  profile: RenderProfile;
  /** Whether the scene is on screen; when false the render loop is stopped. */
  active: boolean;
  fallback: ReactNode;
  children: ReactNode;
  className?: string;
  camera?: CanvasProps["camera"];
  /** Use "demand" for scenes that only change on interaction. */
  frameloop?: "always" | "demand";
  interactive?: boolean;
  onCreated?: CanvasProps["onCreated"];
}

export function SceneCanvas({
  profile,
  active,
  fallback,
  children,
  className,
  camera,
  frameloop = "always",
  interactive = false,
  onCreated,
}: SceneCanvasProps) {
  if (!profile.use3D) return <>{fallback}</>;

  const loop: CanvasProps["frameloop"] = !active ? "never" : profile.reducedMotion ? "demand" : frameloop;

  return (
    <SceneErrorBoundary fallback={fallback}>
      <Canvas
        className={className}
        dpr={profile.dpr}
        frameloop={loop}
        camera={camera ?? { position: [0, 0, 7], fov: 40, near: 0.1, far: 60 }}
        gl={{
          antialias: profile.antialias,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          stencil: false,
          depth: true,
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ pointerEvents: interactive ? "auto" : "none", touchAction: "pan-y" }}
        eventPrefix="client"
        onCreated={onCreated}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </SceneErrorBoundary>
  );
}
