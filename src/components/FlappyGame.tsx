import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Trophy, Zap } from 'lucide-react';

interface GameProps {
  onClose: () => void;
}

export const FlappyGame: React.FC<GameProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Constants
  const GRAVITY = 0.25;
  const JUMP = -4.5;
  const PIPE_SPEED = 2;
  const PIPE_SPAWN_RATE = 100; // frames
  const PIPE_WIDTH = 50;
  const PIPE_GAP = 160;
  const BIRD_SIZE = 30;

  // Refs for animation values
  const birdY = useRef(200);
  const birdV = useRef(0);
  const pipes = useRef<{ x: number; top: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);
  const animationId = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('flappy_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const resetGame = () => {
    birdY.current = 200;
    birdV.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
    setGameState('PLAYING');
  };

  const update = () => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Bird physics
    birdV.current += GRAVITY;
    birdY.current += birdV.current;

    // Ground/Ceiling collision
    if (birdY.current + BIRD_SIZE > canvas.height || birdY.current < 0) {
      handleGameOver();
    }

    // Pipe logic
    if (frameCount.current % PIPE_SPAWN_RATE === 0) {
      const minPipeHeight = 50;
      const maxPipeHeight = canvas.height - PIPE_GAP - minPipeHeight;
      const top = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;
      pipes.current.push({ x: canvas.width, top, passed: false });
    }

    pipes.current.forEach((pipe, index) => {
      pipe.x -= PIPE_SPEED;

      // Collision
      const birdRect = { x: 50, y: birdY.current, w: BIRD_SIZE, h: BIRD_SIZE };
      const topPipeRect = { x: pipe.x, y: 0, w: PIPE_WIDTH, h: pipe.top };
      const bottomPipeRect = { x: pipe.x, y: pipe.top + PIPE_GAP, w: PIPE_WIDTH, h: canvas.height };

      if (
        (birdRect.x < topPipeRect.x + topPipeRect.w &&
          birdRect.x + birdRect.w > topPipeRect.x &&
          birdRect.y < topPipeRect.y + topPipeRect.h &&
          birdRect.y + birdRect.h > topPipeRect.y) ||
        (birdRect.x < bottomPipeRect.x + bottomPipeRect.w &&
          birdRect.x + birdRect.w > bottomPipeRect.x &&
          birdRect.y < bottomPipeRect.y + bottomPipeRect.h &&
          birdRect.y + birdRect.h > bottomPipeRect.y)
      ) {
        handleGameOver();
      }

      // Score
      if (!pipe.passed && pipe.x < 50) {
        pipe.passed = true;
        setScore(s => {
          const newScore = s + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('flappy_highscore', newScore.toString());
          }
          return newScore;
        });
      }
    });

    // Remove old pipes
    pipes.current = pipes.current.filter(p => p.x + PIPE_WIDTH > 0);
    frameCount.current++;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000000');
    bgGrad.addColorStop(1, '#0c1a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for(let i=0; i<canvas.height; i+=40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Pipes
    pipes.current.forEach(pipe => {
      // Top pipe
      ctx.fillStyle = '#ff2d3f';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff2d3f';
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
      
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height);
      ctx.shadowBlur = 0;
    });

    // Bird
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff2d3f';
    ctx.beginPath();
    ctx.arc(50 + BIRD_SIZE/2, birdY.current + BIRD_SIZE/2, BIRD_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // "A" Logo on Bird
    ctx.fillStyle = '#000000';
    ctx.font = 'black 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('A', 50 + BIRD_SIZE/2, birdY.current + BIRD_SIZE/2 + 5);
  };

  const handleGameOver = () => {
    setGameState('GAMEOVER');
    if (animationId.current) cancelAnimationFrame(animationId.current);
  };

  const loop = () => {
    update();
    draw();
    animationId.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    animationId.current = requestAnimationFrame(loop);
    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [gameState]);

  const handleJump = (e: any) => {
    if (gameState === 'PLAYING') {
      birdV.current = JUMP;
    } else if (gameState === 'IDLE' || gameState === 'GAMEOVER') {
      resetGame();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative bg-[#050505] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-[400px]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Proto_Runner v1.0</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40">
            <X size={18} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="relative aspect-[3/4] cursor-pointer" onClick={handleJump}>
          <canvas
            ref={canvasRef}
            width={400}
            height={533}
            className="w-full h-full"
          />

          <AnimatePresence>
            {gameState === 'IDLE' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-black mb-6 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                    <Zap size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Mini_Game</h3>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-black mb-8">Tap to bypass system security</p>
                <div className="px-8 py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-full animate-bounce">
                    Start Execution
                </div>
              </motion.div>
            )}

            {gameState === 'GAMEOVER' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-center p-8 backdrop-blur-sm"
              >
                <h3 className="text-4xl font-black text-red-500 uppercase italic tracking-tighter mb-1">System Fail</h3>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-black mb-8">Connection Lost</p>
                
                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-[8px] text-white/20 uppercase font-black mb-1">Score</p>
                        <p className="text-2xl font-black text-white italic">{score}</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-[8px] text-white/20 uppercase font-black mb-1">Best</p>
                        <p className="text-2xl font-black text-accent italic">{highScore}</p>
                    </div>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); resetGame(); }}
                    className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-accent transition-colors"
                >
                    <RotateCcw size={14} /> Re-Initialize
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HUD Overlay */}
          <div className="absolute top-6 left-6 pointer-events-none">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-black/50 border border-white/10 rounded-xl backdrop-blur-md">
                    <p className="text-[7px] text-white/40 uppercase font-black mb-0.5">Score</p>
                    <p className="text-xl font-black text-white italic leading-none">{score}</p>
                </div>
                <div className="p-2 bg-black/50 border border-white/10 rounded-xl backdrop-blur-md">
                    <p className="text-[7px] text-white/40 uppercase font-black mb-0.5">High</p>
                    <p className="text-xl font-black text-accent italic leading-none">{highScore}</p>
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-accent" />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Sub_Routine_Flappy_A_Alpha</span>
        </div>
      </div>
    </motion.div>
  );
};
