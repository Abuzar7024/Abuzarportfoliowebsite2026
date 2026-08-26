import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import type { DeviceKind, ScreenSpec } from "../data/types";
import { paintScreen, SCREEN_SIZE } from "../lib/screenPainter";
import type { RenderProfile } from "../hooks/useDeviceTier";

function useScreenTexture(spec: ScreenSpec, kind: DeviceKind, maxAnisotropy: number) {
  const texture = useMemo(() => {
    const canvas = paintScreen(document.createElement("canvas"), spec, kind);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, maxAnisotropy);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }, [spec, kind, maxAnisotropy]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

interface DeviceProps {
  kind: DeviceKind;
  screen: ScreenSpec;
  accent: string;
  profile: RenderProfile;
  /** Overall scale multiplier. */
  scale?: number;
  /** Whether the device tilts toward the pointer. */
  interactive?: boolean;
}

function Phone({ accent, profile, tex }: { accent: string; profile: RenderProfile; tex: THREE.Texture }) {
  const { w, h } = SCREEN_SIZE.phone;
  const H = 2.15;
  const W = (H * w) / h;
  return (
    <group>
      <RoundedBox args={[W + 0.09, H + 0.09, 0.09]} radius={0.1} smoothness={profile.tier === "high" ? 6 : 3}>
        <meshStandardMaterial color="#171a20" metalness={0.75} roughness={0.32} />
      </RoundedBox>
      {/* frame highlight */}
      <RoundedBox args={[W + 0.095, H + 0.095, 0.02]} radius={0.1} smoothness={3} position={[0, 0, -0.04]}>
        <meshStandardMaterial color={accent} metalness={0.9} roughness={0.2} emissive={accent} emissiveIntensity={0.08} />
      </RoundedBox>
      <mesh position={[0, 0, 0.0461]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* camera cutout */}
      <mesh position={[0, H / 2 - 0.09, 0.047]}>
        <circleGeometry args={[0.028, 16]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {/* side buttons */}
      <mesh position={[W / 2 + 0.055, 0.35, 0]}>
        <boxGeometry args={[0.02, 0.22, 0.04]} />
        <meshStandardMaterial color="#20242b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-W / 2 - 0.055, 0.2, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.04]} />
        <meshStandardMaterial color="#20242b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-W / 2 - 0.055, 0.45, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.04]} />
        <meshStandardMaterial color="#20242b" metalness={0.8} roughness={0.3} />
      </mesh>
      <ScreenGlow color={accent} width={W} height={H} z={-0.2} intensity={0.5} />
    </group>
  );
}

function Browser({ accent, profile, tex, floating }: { accent: string; profile: RenderProfile; tex: THREE.Texture; floating: boolean }) {
  const { w, h } = SCREEN_SIZE.browser;
  const W = 3.1;
  const H = (W * h) / w;
  return (
    <group>
      <RoundedBox args={[W + 0.08, H + 0.08, 0.07]} radius={0.06} smoothness={profile.tier === "high" ? 5 : 3}>
        <meshStandardMaterial color="#171a20" metalness={0.7} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0, 0.0361]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <ScreenGlow color={accent} width={W} height={H} z={-0.25} intensity={0.45} />
      {floating && (
        <>
          <FloatingCard position={[-W / 2 + 0.25, -H / 2 + 0.45, 0.45]} size={[0.95, 0.5]} accent={accent} profile={profile} delay={0.4} />
          <FloatingCard position={[W / 2 - 0.15, H / 2 - 0.35, 0.55]} size={[0.8, 0.44]} accent={accent} profile={profile} delay={1.1} />
        </>
      )}
    </group>
  );
}

/** Soft glow plane behind the device to lift it off the background. */
function ScreenGlow({ color, width, height, z, intensity }: { color: string; width: number; height: number; z: number; intensity: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[0, 0, z]}>
      <planeGeometry args={[width * 2.4, height * 2.2]} />
      <meshBasicMaterial map={tex} color={color} transparent opacity={intensity * 0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function FloatingCard({ position, size, accent, profile, delay }: { position: [number, number, number]; size: [number, number]; accent: string; profile: RenderProfile; delay: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 380;
    c.height = Math.round((380 * size[1]) / size[0]);
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#12151c";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(22, 22, 34, 34, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.roundRect(70, 24, 160, 12, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.roundRect(70, 44, 110, 10, 5);
      ctx.fill();
      // bars
      const n = 9;
      const bw = (c.width - 44) / n - 6;
      for (let i = 0; i < n; i++) {
        const v = 0.3 + ((i * 37) % 11) / 16;
        const bh = (c.height - 90) * v;
        ctx.fillStyle = i % 3 === 1 ? "rgba(255,255,255,0.35)" : accent;
        ctx.beginPath();
        ctx.roundRect(22 + i * (bw + 6), c.height - 18 - bh, bw, bh, 4);
        ctx.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [accent, size]);
  useEffect(() => () => tex.dispose(), [tex]);

  const inner = (
    <group position={position}>
      <RoundedBox args={[size[0] + 0.04, size[1] + 0.04, 0.04]} radius={0.04} smoothness={3}>
        <meshStandardMaterial color="#1a1e27" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={size} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );

  if (profile.reducedMotion) return inner;
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.06, 0.06]}>
      <group position={[0, Math.sin(delay) * 0.02, 0]}>{inner}</group>
    </Float>
  );
}

/** Pointer-following tilt wrapper (uses the canvas-local pointer). */
function Tilt({ children, enabled, intensity = 0.28 }: { children: React.ReactNode; enabled: boolean; intensity?: number }) {
  const g = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame((_, dt) => {
    if (!g.current) return;
    const t = Math.min(dt, 0.05);
    const tx = enabled ? -pointer.y * intensity : 0;
    const ty = enabled ? pointer.x * intensity * 1.4 : 0;
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, tx, 5, t);
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, ty, 5, t);
  });
  return <group ref={g}>{children}</group>;
}

export function DeviceMock({ kind, screen, accent, profile, scale = 1, interactive = true }: DeviceProps) {
  const { gl } = useThree();
  const tex = useScreenTexture(screen, kind === "dashboard" ? "dashboard" : kind, gl.capabilities.getMaxAnisotropy());

  const body =
    kind === "phone" ? (
      <Phone accent={accent} profile={profile} tex={tex} />
    ) : (
      <Browser accent={accent} profile={profile} tex={tex} floating={kind === "dashboard" && profile.tier !== "low"} />
    );

  const content = (
    <Tilt enabled={interactive && !profile.reducedMotion}>
      <group scale={scale} rotation={kind === "phone" ? [0.05, -0.35, 0.03] : [0.06, -0.22, 0]}>
        {body}
      </group>
    </Tilt>
  );

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 6]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-4, -2, 3]} intensity={0.6} color={accent} />
      <pointLight position={[0, 2, 4]} intensity={1.2} color="#ffe9e6" distance={12} />
      {profile.reducedMotion ? content : (
        <Float speed={1.1} rotationIntensity={0.18} floatIntensity={0.5} floatingRange={[-0.08, 0.08]}>
          {content}
        </Float>
      )}
    </>
  );
}
