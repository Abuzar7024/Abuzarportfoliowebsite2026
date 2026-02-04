import React, { useState, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "motion/react";

export const MouseGlow = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 700 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      <motion.div
        style={{
          left: springX,
          top: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="fixed inset-0 z-0 pointer-events-none w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"
      />
      <motion.div
        style={{
          left: springX,
          top: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="fixed inset-0 z-[999] pointer-events-none hidden lg:flex items-center justify-center"
      >
        <div className="w-4 h-4 border border-cyan-400/50 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-cyan-400 rounded-full" />
        </div>
        <div className="absolute w-8 h-8 border-[0.5px] border-cyan-400/20 rounded-full animate-ping" />
      </motion.div>
    </>
  );
};
