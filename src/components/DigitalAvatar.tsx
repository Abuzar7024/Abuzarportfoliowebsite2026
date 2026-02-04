import React from "react";
import { motion } from "motion/react";

interface DigitalAvatarProps {
  src: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const DigitalAvatar = ({ src, size = "md", className = "" }: DigitalAvatarProps) => {
  const dimensions = {
    sm: "w-24 h-24",
    md: "w-32 h-32 md:w-44 md:h-44",
    lg: "w-40 h-40 md:w-56 md:h-56"
  };

  return (
    <div className={`relative ${dimensions[size]} ${className}`}>
      {/* 3D Rotating Rings */}
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-15%] border border-cyan-500/20 rounded-full"
      />
      <motion.div 
        animate={{ rotate: -360, scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-25%] border border-white/5 rounded-full"
      />
      
      {/* Corner Brackets */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm z-20" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm z-20" />

      {/* Main Image Container with "Vector" Filter */}
      <div className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] bg-black">
        {/* The Vectorizing SVG Filter Effect */}
        <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay opacity-50 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)]" />
        
        <img 
          src={src} 
          alt="Avatar" 
          className="w-full h-full object-cover scale-110 grayscale brightness-125 contrast-125"
          style={{ 
            filter: "url(#vectorize) contrast(1.2) brightness(1.1)" 
          }}
        />

        {/* Scanning Line */}
        <motion.div 
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-20 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
        />

        {/* Digital Overlay */}
        <div className="absolute inset-0 bg-cyan-500/5 mix-blend-color" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
      </div>

      {/* SVG Filter Definition (Invisible) */}
      <svg className="absolute w-0 h-0">
        <filter id="vectorize">
          <feColorMatrix type="matrix" values="0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.5 1" />
            <feFuncG type="discrete" tableValues="0 0.5 1" />
            <feFuncB type="discrete" tableValues="0 0.5 1" />
          </feComponentTransfer>
        </filter>
      </svg>

      {/* Coordinate Display */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-1 opacity-20">
        <div className="text-[6px] font-mono text-white">X: 742.11</div>
        <div className="text-[6px] font-mono text-white">Y: 108.45</div>
        <div className="text-[6px] font-mono text-white">Z: 0.002</div>
      </div>
    </div>
  );
};
