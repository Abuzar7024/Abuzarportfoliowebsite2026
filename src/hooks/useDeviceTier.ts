import { useMemo } from "react";
import { useMediaQuery, usePrefersReducedMotion } from "./useMediaQuery";

export type DeviceTier = "high" | "medium" | "low";

let cachedWebGL: boolean | null = null;

/** Detects WebGL support once (WebGL2 preferred, WebGL1 accepted). */
export function detectWebGL(): boolean {
  if (cachedWebGL !== null) return cachedWebGL;
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    cachedWebGL = !!gl && !!(window as unknown as { WebGLRenderingContext?: unknown }).WebGLRenderingContext;
  } catch {
    cachedWebGL = false;
  }
  return cachedWebGL;
}

interface NavigatorExtra extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

export interface RenderProfile {
  webgl: boolean;
  tier: DeviceTier;
  reducedMotion: boolean;
  /** Whether to mount WebGL scenes at all. */
  use3D: boolean;
  dpr: [number, number];
  particleScale: number;
  antialias: boolean;
}

export function useRenderProfile(): RenderProfile {
  const reducedMotion = usePrefersReducedMotion();
  const isSmall = useMediaQuery("(max-width: 767px)");
  const coarse = useMediaQuery("(pointer: coarse)");

  return useMemo(() => {
    const webgl = detectWebGL();
    const nav = (typeof navigator !== "undefined" ? navigator : undefined) as NavigatorExtra | undefined;
    const cores = nav?.hardwareConcurrency ?? 4;
    const memory = nav?.deviceMemory ?? 4;
    const saveData = !!nav?.connection?.saveData;

    let tier: DeviceTier = "high";
    if (saveData || memory <= 2 || cores <= 2) tier = "low";
    else if (isSmall || coarse || memory <= 4 || cores <= 4) tier = "medium";

    const use3D = webgl && !saveData;
    const dpr: [number, number] = tier === "high" ? [1, 1.75] : tier === "medium" ? [1, 1.25] : [1, 1];
    const particleScale = tier === "high" ? 1 : tier === "medium" ? 0.55 : 0.3;

    return {
      webgl,
      tier,
      reducedMotion,
      use3D,
      dpr,
      particleScale,
      antialias: tier === "high",
    };
  }, [reducedMotion, isSmall, coarse]);
}
