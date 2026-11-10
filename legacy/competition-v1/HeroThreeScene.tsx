import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NeuralCoreProps {
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}

function NeuralCore({ pointer }: NeuralCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const count = 90;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.8 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      const targetX = pointer.current.y * 0.28;
      const targetY = pointer.current.x * 0.35;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        0.06
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetY,
        0.06
      );
      groupRef.current.position.y = Math.sin(t * 1.3) * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.35;
      innerRef.current.rotation.x += delta * 0.18;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.22;
      wireRef.current.rotation.z += delta * 0.14;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.42;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x -= delta * 0.32;
      ring2Ref.current.rotation.y += delta * 0.25;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central AI Polyhedral Core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial
          color="#111827"
          emissive="#ef233c"
          emissiveIntensity={0.45}
          metalness={0.85}
          roughness={0.2}
          flatShading
        />
      </mesh>

      {/* Outer Futuristic Wireframe Lattice */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.38, 1]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.42}
        />
      </mesh>

      {/* Orbital Ring 1 */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2.6, 0.3, 0]}>
        <torusGeometry args={[1.82, 0.015, 16, 96]} />
        <meshBasicMaterial color="#ef233c" transparent opacity={0.75} />
      </mesh>

      {/* Orbital Ring 2 */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 3, -0.5, 0.2]}>
        <torusGeometry args={[2.12, 0.012, 16, 96]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.5} />
      </mesh>

      {/* Subtle Neural Particle Field */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#e2e8f0"
          size={0.032}
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export function HeroThreeFallback() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      aria-hidden="true"
    >
      <div className="h-56 w-56 rounded-full bg-gradient-to-tr from-[#ef233c]/25 via-[#38bdf8]/15 to-transparent blur-2xl" />
      <svg viewBox="0 0 240 240" className="absolute h-56 w-56">
        <polygon
          points="120,20 206,70 206,170 120,220 34,170 34,70"
          fill="none"
          stroke="#ef233c"
          strokeWidth="1.5"
          strokeOpacity="0.65"
        />
        <polygon
          points="120,48 182,84 182,156 120,192 58,156 58,84"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeDasharray="5 5"
          strokeOpacity="0.55"
        />
        <circle cx="120" cy="120" r="18" fill="#ef233c" fillOpacity="0.85" />
      </svg>
    </div>
  );
}

export default function HeroThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (reducedMotion) {
    return <HeroThreeFallback />;
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      }}
      onPointerLeave={() => {
        pointer.current.x = 0;
        pointer.current.y = 0;
      }}
      className="relative h-[300px] w-full sm:h-[360px] lg:h-[420px]"
      aria-hidden="true"
    >
      {/* Ambient Radial Backglow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-gradient-to-tr from-[#ef233c]/25 via-[#6366f1]/15 to-[#38bdf8]/20 blur-3xl" />
      </div>

      <Canvas
        dpr={[1, 1.5]}
        frameloop={isVisible ? "always" : "never"}
        camera={{ position: [0, 0, 4.9], fov: 44 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 5, 4]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-4, -3, 3]} intensity={1.6} color="#ef233c" />
        <pointLight position={[3, -2, -3]} intensity={1.2} color="#38bdf8" />
        <NeuralCore pointer={pointer} />
      </Canvas>
    </div>
  );
}
