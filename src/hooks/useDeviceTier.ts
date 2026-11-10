import { useEffect, useMemo, useState } from "react";
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

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorExtra extends Navigator {
  deviceMemory?: number;
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  const nav = navigator as NavigatorExtra;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

export interface RenderProfile {
  webgl: boolean;
  tier: DeviceTier;
  reducedMotion: boolean;
  /** True when Network Information API reports Save-Data, 2G/3G, low downlink, or high RTT. */
  slowNetwork: boolean;
  /** Whether to mount WebGL scenes by default. */
  use3D: boolean;
  dpr: [number, number];
  particleScale: number;
  antialias: boolean;
}

export function useRenderProfile(): RenderProfile {
  const reducedMotion = usePrefersReducedMotion();
  const isSmall = useMediaQuery("(max-width: 767px)");
  const coarse = useMediaQuery("(pointer: coarse)");
  const [netTick, setNetTick] = useState(0);

  useEffect(() => {
    const conn = getConnection();
    if (!conn?.addEventListener) return;
    const onChange = () => setNetTick((n) => n + 1);
    conn.addEventListener("change", onChange);
    return () => conn.removeEventListener?.("change", onChange);
  }, []);

  return useMemo(() => {
    const webgl = detectWebGL();
    const nav = (typeof navigator !== "undefined" ? navigator : undefined) as NavigatorExtra | undefined;
    const conn = getConnection();
    const cores = nav?.hardwareConcurrency ?? 4;
    const memory = nav?.deviceMemory ?? 4;
    const saveData = !!conn?.saveData;
    const effectiveType = conn?.effectiveType ?? "";
    const downlink = conn?.downlink;
    const rtt = conn?.rtt;

    const is2G = effectiveType === "slow-2g" || effectiveType === "2g";
    const is3G = effectiveType === "3g";
    const veryLowBandwidth =
      saveData ||
      is2G ||
      (downlink !== undefined && downlink > 0 && downlink < 0.8) ||
      (rtt !== undefined && rtt > 750);
    const slowNetwork =
      veryLowBandwidth ||
      is3G ||
      (downlink !== undefined && downlink > 0 && downlink < 2.0) ||
      (rtt !== undefined && rtt > 400);

    let tier: DeviceTier = "high";
    if (veryLowBandwidth || memory <= 2 || cores <= 2 || (isSmall && (memory <= 4 || cores <= 4))) {
      tier = "low";
    } else if (slowNetwork || isSmall || coarse || memory <= 4 || cores <= 4) {
      tier = "medium";
    }

    const use3D = webgl && !veryLowBandwidth;
    const dpr: [number, number] =
      tier === "high" ? [1, 1.5] : tier === "medium" ? [0.85, 1.15] : [0.75, 1];
    const particleScale = tier === "high" ? 1 : tier === "medium" ? 0.55 : 0.3;

    return {
      webgl,
      tier,
      reducedMotion,
      slowNetwork,
      use3D,
      dpr,
      particleScale,
      antialias: tier === "high",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, isSmall, coarse, netTick]);
}
