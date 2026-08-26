import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Project } from "../data/types";
import type { RenderProfile } from "../hooks/useDeviceTier";
import { useInViewport } from "../hooks/useInViewport";
import { DeviceFallback } from "./Fallbacks";

const DeviceScene = lazy(() => import("../three/DeviceScene"));

interface DeviceFigureProps {
  project: Pick<Project, "device" | "screen" | "accent" | "title">;
  profile: RenderProfile;
  className?: string;
  scale?: number;
  interactive?: boolean;
  /** Mount the WebGL scene immediately instead of waiting for viewport entry. */
  eager?: boolean;
}

/**
 * A 3D device mockup that:
 * - only loads three.js when it first enters the viewport
 * - pauses its render loop while off screen
 * - degrades to a CSS-3D framed image when WebGL is unavailable
 */
export function DeviceFigure({ project, profile, className = "", scale, interactive = true, eager = false }: DeviceFigureProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewport(ref, "20%");
  const [seen, setSeen] = useState(eager);
  useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);

  const fallback = <DeviceFallback kind={project.device} screen={project.screen} accent={project.accent} className="h-full w-full" />;

  return (
    <div ref={ref} className={className || "relative"} role="img" aria-label={`3D mockup of ${project.title}`}>
      {/* ambient glow behind the device */}
      <div
        className="pointer-events-none absolute inset-[10%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${project.accent}26, transparent 60%)` }}
        aria-hidden="true"
      />
      {profile.use3D && seen ? (
        <Suspense fallback={fallback}>
          <DeviceScene
            kind={project.device}
            screen={project.screen}
            accent={project.accent}
            profile={profile}
            active={inView}
            fallback={fallback}
            scale={scale}
            interactive={interactive}
            className="!absolute inset-0"
          />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}
