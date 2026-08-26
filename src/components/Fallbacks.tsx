import React, { useMemo } from "react";
import type { DeviceKind, ScreenSpec } from "../data/types";
import { screenDataUrl } from "../lib/screenPainter";

/** SVG version of the signature crystal for environments without WebGL. */
export function MonolithFallback({ animate = true }: { animate?: boolean }) {
  return (
    <div className="relative aspect-square w-full" aria-hidden="true">
      <div className="absolute inset-[10%] rounded-full bg-accent/20 blur-3xl" />
      <svg viewBox="-110 -110 220 220" className="relative h-full w-full" style={{ animation: animate ? "monolith-float 6s ease-in-out infinite" : undefined }}>
        <defs>
          <linearGradient id="f1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2a2830" />
            <stop offset="100%" stopColor="#101013" />
          </linearGradient>
          <linearGradient id="f2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a1a20" />
            <stop offset="100%" stopColor="#120f12" />
          </linearGradient>
          <linearGradient id="f3" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a1a1f" />
            <stop offset="100%" stopColor="#0c0c0f" />
          </linearGradient>
        </defs>
        <polygon points="0,-96 72,-38 44,64 -44,64 -72,-38" fill="url(#f1)" stroke="rgba(255,43,61,0.35)" />
        <polygon points="0,-96 72,-38 0,-6" fill="url(#f2)" stroke="rgba(255,43,61,0.35)" />
        <polygon points="0,-96 -72,-38 0,-6" fill="url(#f3)" stroke="rgba(255,43,61,0.35)" />
        <polygon points="72,-38 44,64 0,-6" fill="url(#f3)" stroke="rgba(255,43,61,0.35)" />
        <polygon points="-72,-38 -44,64 0,-6" fill="url(#f2)" stroke="rgba(255,43,61,0.35)" />
        <polygon points="44,64 -44,64 0,-6" fill="url(#f1)" stroke="rgba(255,43,61,0.35)" />
        <circle cx="0" cy="-6" r="10" fill="#ff2b3d" opacity="0.9" />
        <circle cx="0" cy="-6" r="22" fill="#ff2b3d" opacity="0.18" />
      </svg>
      <style>{`@keyframes monolith-float { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(2deg); } }`}</style>
    </div>
  );
}

/** CSS-3D device frame with the same procedural screen as the WebGL version. */
export function DeviceFallback({ kind, screen, accent, className = "" }: { kind: DeviceKind; screen: ScreenSpec; accent: string; className?: string }) {
  const src = useMemo(() => screenDataUrl(screen, kind === "dashboard" ? "dashboard" : kind), [screen, kind]);
  const isPhone = kind === "phone";
  return (
    <div className={`perspective-1600 flex items-center justify-center ${className}`} aria-hidden="true">
      <div
        className="preserve-3d device-shadow relative"
        style={{
          transform: isPhone ? "rotateY(-18deg) rotateX(6deg)" : "rotateY(-14deg) rotateX(5deg)",
          width: isPhone ? "min(58%, 240px)" : "min(92%, 640px)",
        }}
      >
        <div
          className="overflow-hidden border border-white/10 bg-[#171a20]"
          style={{
            borderRadius: isPhone ? "2rem" : "0.9rem",
            padding: isPhone ? "8px" : "6px",
            boxShadow: `0 0 0 1px ${accent}22, 0 30px 80px -20px ${accent}33`,
          }}
        >
          <img src={src} alt="" className="w-full" style={{ borderRadius: isPhone ? "1.6rem" : "0.5rem" }} loading="lazy" decoding="async" />
        </div>
      </div>
    </div>
  );
}
