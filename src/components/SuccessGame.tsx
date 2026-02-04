"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, RotateCcw, Play, Trophy } from "lucide-react";

export const SuccessGame = ({ onReset }: { onReset: () => void }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bird = { x: 50, y: 150, radius: 10, velocity: 0, gravity: 0.25, jump: -5 };
    const pipes: { x: number; top: number; width: number; passed: boolean }[] = [];
    const pipeWidth = 40;
    const pipeGap = 120;
    let frameCount = 0;

    const handleJump = (e: KeyboardEvent | MouseEvent | TouchEvent) => {
      if (e instanceof KeyboardEvent && e.code !== "Space") return;
      bird.velocity = bird.jump;
    };

    window.addEventListener("keydown", handleJump);
    window.addEventListener("mousedown", handleJump);

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Bird Physics
      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      // Draw Bird
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee"; // Cyan
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#22d3ee";
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;

      // Pipe Management
      if (frameCount % 100 === 0) {
        const minPipeHeight = 50;
        const maxPipeHeight = canvas.height - pipeGap - minPipeHeight;
        const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
        pipes.push({ x: canvas.width, top: topHeight, width: pipeWidth, passed: false });
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= 2;

        // Draw Pipes
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
        ctx.lineWidth = 2;
        
        // Top Pipe
        ctx.fillRect(p.x, 0, p.width, p.top);
        ctx.strokeRect(p.x, 0, p.width, p.top);
        
        // Bottom Pipe
        const bottomY = p.top + pipeGap;
        ctx.fillRect(p.x, bottomY, p.width, canvas.height - bottomY);
        ctx.strokeRect(p.x, bottomY, p.width, canvas.height - bottomY);

        // Score
        if (!p.passed && bird.x > p.x + p.width) {
          p.passed = true;
          setScore(s => s + 1);
        }

        // Collision
        if (
          bird.x + bird.radius > p.x &&
          bird.x - bird.radius < p.x + p.width &&
          (bird.y - bird.radius < p.top || bird.y + bird.radius > bottomY)
        ) {
          setGameOver(true);
          setIsPlaying(false);
        }

        if (p.x + p.width < 0) pipes.splice(i, 1);
      }

      // Ground/Ceiling Collision
      if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
        setGameOver(true);
        setIsPlaying(false);
      }

      frameCount++;
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("keydown", handleJump);
      window.removeEventListener("mousedown", handleJump);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameOver]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div className="relative w-full aspect-video bg-black/40 border border-white/10 rounded-2xl overflow-hidden group">
      <div className="absolute top-4 left-6 z-10 font-mono text-cyan-400 text-sm flex items-center gap-4">
        <span className="opacity-50 uppercase tracking-tighter">DATA_RECOVERED:</span>
        <span className="font-bold">{score.toString().padStart(3, '0')}</span>
      </div>
      
      <div className="absolute top-4 right-6 z-10 font-mono text-white/30 text-[10px] flex items-center gap-2 uppercase tracking-widest">
        <Trophy size={10} />
        Record: {highScore}
      </div>

      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-8 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6"
          >
            <Gamepad2 size={32} className="text-emerald-400" />
          </motion.div>
          <h4 className="text-white font-bold mb-2 uppercase tracking-widest">Transmission Successful</h4>
          <p className="text-white/40 text-[10px] mb-6 uppercase tracking-widest leading-relaxed">
            While I process your inquiry,<br />try navigating through the firewall
          </p>
          <div className="flex gap-3">
            <button 
              onClick={startGame}
              className="px-6 py-2 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
            >
              <Play size={12} className="inline mr-2" fill="black" /> INITIALIZE
            </button>
            <button 
              onClick={onReset}
              className="px-6 py-2 border border-white/10 text-white/40 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              CLOSE
            </button>
          </div>
          <p className="mt-4 text-[8px] text-white/20 uppercase tracking-[0.2em]">Press Space or Click to Jump</p>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <h3 className="text-2xl font-black text-red-500 mb-2 italic tracking-tighter uppercase">Signal Jammed</h3>
          <p className="text-white/40 mb-8 font-mono text-[10px] uppercase tracking-widest">Score: {score}</p>
          <div className="flex gap-3">
            <button 
              onClick={startGame}
              className="px-6 py-2 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <RotateCcw size={12} className="inline mr-2" /> REBOOT
            </button>
            <button 
              onClick={onReset}
              className="px-6 py-2 border border-white/10 text-white/40 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              EXIT
            </button>
          </div>
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        width={480} 
        height={270} 
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
