import React, { useEffect, useRef } from "react";

/**
 * Signal Run: a small endless runner for the offline screen.
 * Pilot a hover-pod along a neon grid. Jump (Space / ↑ / W / tap) over
 * barriers, pylons and sentinel bots; hold to jump higher, press again
 * mid-air to double-jump, and grab data shards for points.
 *
 * Everything is drawn on one canvas in the site palette. Game state lives in a
 * ref and the loop never touches React state, so it runs at a steady 60 fps.
 */

const H = 300; // logical height; logical width follows the canvas aspect
const GROUND = H - 58;
const GRAVITY = 2300;
const GRAVITY_HOLD = 1250;
const JUMP_V = -720;
const DOUBLE_V = -600;
const PLAYER_X = 92;
const HOVER = 8; // the pod floats this far above the floor
const BEST_KEY = "signalrun-best";

const C = {
  skyTop: "#1b1d22",
  skyBottom: "#131417",
  far: "#202328",
  near: "#272a30",
  floor: "#17191c",
  grid: "rgba(174,182,194,0.18)",
  chrome: "#d9dee6",
  chromeDark: "#7d838d",
  charcoal: "#2d3036",
  ink: "#eef1f5",
  muted: "#8b929d",
  red: "#e3262e",
  redInk: "#ff5058",
};

type Kind = "pylon" | "barrier" | "sentinel";
interface Obstacle {
  kind: Kind;
  x: number;
  w: number;
  h: number;
}
interface Pickup {
  x: number;
  y: number;
  taken: boolean;
  spin: number;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

type Phase = "ready" | "playing" | "over";

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}
function writeBest(v: number) {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    // private mode: the best score just won't persist
  }
}

/** Deterministic skyline: tower height for a given slot index. */
function towerHeight(i: number, seed: number) {
  const s = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

export function SignalRun({ label = "Signal Run game" }: { label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let W = 800;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      W = (H * rect.width) / Math.max(rect.height, 1);
      const scale = (rect.height / H) * dpr;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const dust = Array.from({ length: 50 }, () => ({ x: Math.random() * 1600, y: Math.random() * GROUND, s: 0.4 + Math.random() * 1.2 }));

    const s = {
      phase: "ready" as Phase,
      t: 0,
      dist: 0,
      speed: 340,
      bonus: 0,
      y: GROUND,
      vy: 0,
      holding: false,
      holdT: 0,
      jumps: 0,
      obstacles: [] as Obstacle[],
      pickups: [] as Pickup[],
      sparks: [] as Spark[],
      nextObstacle: 520,
      nextPickup: 300,
      best: readBest(),
      crashedAt: 0,
    };

    const score = () => Math.floor(s.dist / 12) + s.bonus;

    const reset = () => {
      Object.assign(s, {
        phase: "playing" as Phase,
        dist: 0,
        speed: 340,
        bonus: 0,
        y: GROUND,
        vy: 0,
        jumps: 0,
        obstacles: [],
        pickups: [],
        sparks: [],
        nextObstacle: 600,
        nextPickup: 380,
      });
    };

    const press = () => {
      if (s.phase === "ready") {
        reset();
        return;
      }
      if (s.phase === "over") {
        if (s.t - s.crashedAt > 0.45) reset();
        return;
      }
      const grounded = s.y >= GROUND - 0.5;
      if (grounded) {
        s.vy = JUMP_V;
        s.jumps = 1;
      } else if (s.jumps < 2) {
        s.vy = DOUBLE_V;
        s.jumps = 2;
      } else return;
      s.holding = true;
      s.holdT = 0;
    };
    const release = () => {
      s.holding = false;
    };

    const isTyping = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    };
    const isJumpKey = (e: KeyboardEvent) => e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW";
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e) || !isJumpKey(e)) return;
      e.preventDefault();
      if (!e.repeat) press();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (isJumpKey(e)) release();
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      press();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", release);

    const spawnObstacle = () => {
      const r = Math.random();
      const kind: Kind = r < 0.45 ? "pylon" : r < 0.78 ? "barrier" : "sentinel";
      const dims = {
        pylon: { w: 18 + Math.random() * 6, h: 52 + Math.random() * 24 },
        barrier: { w: 44 + Math.random() * 18, h: 22 + Math.random() * 8 },
        sentinel: { w: 30, h: 44 },
      }[kind];
      s.obstacles.push({ kind, x: W + 40, ...dims });
      // Gaps shrink a little as speed rises but always leave room to land.
      s.nextObstacle = 300 + s.speed * 0.45 + Math.random() * 420;
    };

    const crash = () => {
      s.phase = "over";
      s.crashedAt = s.t;
      for (let i = 0; i < 26; i++) {
        s.sparks.push({
          x: PLAYER_X + 22,
          y: s.y - HOVER - 12,
          vx: (Math.random() - 0.3) * 360,
          vy: -Math.random() * 380,
          life: 0.5 + Math.random() * 0.5,
        });
      }
      const sc = score();
      if (sc > s.best) {
        s.best = sc;
        writeBest(sc);
      }
    };

    const update = (dt: number) => {
      s.t += dt;
      const drift = s.phase === "playing" ? s.speed : 60;
      for (const d of dust) {
        d.x -= drift * dt * 0.3 * d.s + 8 * dt;
        d.y -= 6 * dt * d.s;
        if (d.x < -10) d.x += W + 20;
        if (d.y < 0) d.y = GROUND;
      }
      s.sparks = s.sparks.filter((p) => {
        p.life -= dt;
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y = Math.min(p.y + p.vy * dt, GROUND);
        return p.life > 0;
      });
      if (s.phase !== "playing") return;

      s.speed = Math.min(760, s.speed + 11 * dt);
      const dx = s.speed * dt;
      s.dist += dx;

      // Variable-height jump: holding softens gravity for a short window.
      s.holdT += dt;
      const g = s.holding && s.vy < 0 && s.holdT < 0.24 ? GRAVITY_HOLD : GRAVITY;
      s.vy += g * dt;
      s.y += s.vy * dt;
      if (s.y >= GROUND) {
        s.y = GROUND;
        s.vy = 0;
        s.jumps = 0;
      }

      s.nextObstacle -= dx;
      if (s.nextObstacle <= 0) spawnObstacle();
      s.nextPickup -= dx;
      if (s.nextPickup <= 0) {
        s.pickups.push({ x: W + 30, y: GROUND - 70 - Math.random() * 90, taken: false, spin: Math.random() * 6 });
        s.nextPickup = 500 + Math.random() * 700;
      }

      for (const o of s.obstacles) o.x -= dx;
      for (const p of s.pickups) {
        p.x -= dx;
        p.spin += dt * 2.5;
      }
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -40);
      s.pickups = s.pickups.filter((p) => p.x > -40 && !p.taken);

      // Forgiving hitboxes: the pod is narrower than it looks.
      const px1 = PLAYER_X + 8;
      const px2 = PLAYER_X + 40;
      const py1 = s.y - HOVER - 24;
      const py2 = s.y - HOVER;
      for (const o of s.obstacles) {
        const inset = o.kind === "pylon" ? o.w * 0.2 : 5;
        const ox1 = o.x + inset;
        const ox2 = o.x + o.w - inset;
        const oy1 = GROUND - o.h + 4;
        if (px2 > ox1 && px1 < ox2 && py2 > oy1 && py1 < GROUND) {
          crash();
          return;
        }
      }
      for (const p of s.pickups) {
        if (Math.abs(p.x - (PLAYER_X + 24)) < 26 && Math.abs(p.y - (s.y - HOVER - 12)) < 30) {
          p.taken = true;
          s.bonus += 10;
        }
      }
    };

    const blink = (phase: number) => Math.pow(Math.max(0, Math.sin(s.t * 3.4 + phase)), 8);

    const drawPylon = (o: Obstacle) => {
      const cx = o.x + o.w / 2;
      const grad = ctx.createLinearGradient(o.x, 0, o.x + o.w, 0);
      grad.addColorStop(0, C.chromeDark);
      grad.addColorStop(0.45, C.chrome);
      grad.addColorStop(1, C.chromeDark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, GROUND - o.h);
      ctx.lineTo(o.x + o.w, GROUND);
      ctx.lineTo(o.x, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255,80,88,${0.5 + blink(o.x * 0.01) * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, GROUND - o.h, 3, 0, Math.PI * 2);
      ctx.fill();
    };
    const drawBarrier = (o: Obstacle) => {
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
      // Hazard stripes in signal red.
      ctx.save();
      ctx.beginPath();
      ctx.rect(o.x + 3, GROUND - o.h + 4, o.w - 6, 8);
      ctx.clip();
      ctx.fillStyle = C.red;
      for (let x = o.x - 10; x < o.x + o.w; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND - o.h + 12);
        ctx.lineTo(x + 6, GROUND - o.h + 4);
        ctx.lineTo(x + 12, GROUND - o.h + 4);
        ctx.lineTo(x + 6, GROUND - o.h + 12);
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = C.chromeDark;
      ctx.fillRect(o.x, GROUND - o.h, o.w, 2);
    };
    const drawSentinel = (o: Obstacle) => {
      const cx = o.x + o.w / 2;
      ctx.fillStyle = C.chromeDark;
      ctx.fillRect(cx - 2, GROUND - 14, 4, 14);
      ctx.fillStyle = C.chrome;
      ctx.beginPath();
      ctx.roundRect(o.x, GROUND - o.h, o.w, o.h - 12, 8);
      ctx.fill();
      ctx.fillStyle = C.charcoal;
      ctx.fillRect(o.x + 5, GROUND - o.h + 10, o.w - 10, 9);
      ctx.fillStyle = C.redInk;
      const scanX = o.x + 7 + ((Math.sin(s.t * 4 + o.x) + 1) / 2) * (o.w - 18);
      ctx.fillRect(scanX, GROUND - o.h + 12, 4, 5);
    };

    const drawPlayer = () => {
      const bob = s.phase === "playing" && s.y >= GROUND - 0.5 ? Math.sin(s.t * 9) * 1.5 : 0;
      const y = s.y - HOVER + bob;
      const tilt = s.phase === "playing" ? Math.max(-0.3, Math.min(0.25, s.vy / 2400)) : 0;

      // Hover shadow on the floor, smaller the higher the pod flies.
      const lift = Math.min(1, (GROUND - s.y) / 140);
      ctx.fillStyle = `rgba(227,38,46,${0.35 - lift * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(PLAYER_X + 24, GROUND + 1, 20 - lift * 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(PLAYER_X + 24, y);
      ctx.rotate(tilt);
      // Thruster trail.
      const flame = 14 + Math.sin(s.t * 30) * 4 + (s.phase === "playing" ? s.speed / 80 : 0);
      const trail = ctx.createLinearGradient(-22 - flame, 0, -22, 0);
      trail.addColorStop(0, "rgba(227,38,46,0)");
      trail.addColorStop(1, "rgba(255,80,88,0.9)");
      ctx.fillStyle = trail;
      ctx.beginPath();
      ctx.moveTo(-22, -15);
      ctx.lineTo(-22 - flame, -10);
      ctx.lineTo(-22, -5);
      ctx.closePath();
      ctx.fill();
      // Hull.
      const hull = ctx.createLinearGradient(0, -24, 0, 0);
      hull.addColorStop(0, C.ink);
      hull.addColorStop(0.5, C.chrome);
      hull.addColorStop(1, C.chromeDark);
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(-22, -4);
      ctx.lineTo(-20, -18);
      ctx.quadraticCurveTo(-4, -26, 14, -18);
      ctx.quadraticCurveTo(26, -12, 24, -4);
      ctx.closePath();
      ctx.fill();
      // Cockpit and signal stripe.
      ctx.fillStyle = C.charcoal;
      ctx.beginPath();
      ctx.moveTo(-2, -19);
      ctx.quadraticCurveTo(8, -23, 15, -17);
      ctx.lineTo(4, -15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.red;
      ctx.fillRect(-18, -9, 30, 2.5);
      ctx.restore();
    };

    const text = (str: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "center", weight = 600) => {
      ctx.font = `${weight} ${size}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.fillText(str, x, y);
    };

    const skyline = (offset: number, base: number, maxH: number, slot: number, color: string, seed: number, lights: boolean) => {
      ctx.fillStyle = color;
      const first = Math.floor(offset / slot);
      for (let i = first; i * slot - offset < W + slot; i++) {
        const x = i * slot - offset;
        const r = towerHeight(i, seed);
        const h = 18 + r * maxH;
        const w = slot * (0.55 + towerHeight(i, seed + 1) * 0.4);
        ctx.fillRect(x, base - h, w, h);
        if (lights && r > 0.55) {
          ctx.fillStyle = `rgba(255,80,88,${0.25 + blink(i * 1.7) * 0.75})`;
          ctx.fillRect(x + w / 2 - 1.5, base - h - 4, 3, 3);
          ctx.fillStyle = color;
        }
      }
    };

    const draw = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
      sky.addColorStop(0, C.skyTop);
      sky.addColorStop(1, C.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Ringed planet, top right.
      const px = W - 110;
      ctx.strokeStyle = "rgba(201,207,216,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, 70, 30, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.ellipse(px, 70, 30 * Math.cos((k * Math.PI) / 7), 30, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(217,222,230,0.55)";
      ctx.beginPath();
      ctx.ellipse(px, 70, 54, 12, -0.35, 0, Math.PI * 2);
      ctx.stroke();

      // Horizon glow and two skyline layers.
      const glow = ctx.createLinearGradient(0, GROUND - 70, 0, GROUND);
      glow.addColorStop(0, "rgba(227,38,46,0)");
      glow.addColorStop(1, "rgba(227,38,46,0.16)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, GROUND - 70, W, 70);
      skyline(s.dist * 0.08, GROUND, 110, 46, C.far, 1, true);
      skyline(s.dist * 0.25, GROUND, 52, 64, C.near, 2, false);

      // Grid floor: horizontal lines plus verticals converging on the horizon.
      ctx.fillStyle = C.floor;
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      const vx = W / 2;
      const spacing = 48;
      const shift = s.dist % spacing;
      for (let x = -W; x < W * 2; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(vx + (x - shift - vx) * 0.25, GROUND);
        ctx.lineTo(x - shift, H);
        ctx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        const k = ((i - ((s.dist / 90) % 1)) / 6) ** 2;
        const y = GROUND + k * (H - GROUND);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.fillStyle = C.red;
      ctx.fillRect(0, GROUND, W, 1.5);

      for (const o of s.obstacles) {
        if (o.kind === "pylon") drawPylon(o);
        else if (o.kind === "barrier") drawBarrier(o);
        else drawSentinel(o);
      }
      for (const p of s.pickups) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = "rgba(201,210,224,0.14)";
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.scale(Math.cos(p.spin), 1);
        ctx.fillStyle = C.chrome;
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(7, 0);
        ctx.lineTo(0, 11);
        ctx.lineTo(-7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C.red;
        ctx.fillRect(-1.5, -1.5, 3, 3);
        ctx.restore();
      }

      const since = s.t - s.crashedAt;
      if (s.phase !== "over" || since > 0.6 || Math.floor(since * 10) % 2 === 0) drawPlayer();

      for (const p of s.sparks) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = Math.random() < 0.3 ? C.redInk : C.ink;
        ctx.fillRect(p.x, p.y, 2.5, 2.5);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(217,222,230,0.45)";
      for (const d of dust) ctx.fillRect(d.x % (W + 20), d.y, d.s, d.s);

      text(`HI ${String(s.best).padStart(5, "0")}  ${String(score()).padStart(5, "0")}`, W - 18, 28, 14, C.ink, "right");

      if (s.phase === "ready") {
        ctx.fillStyle = "rgba(19,20,23,0.55)";
        ctx.fillRect(0, 0, W, H);
        text("SIGNAL RUN", W / 2, H / 2 - 22, 26, C.ink, "center", 700);
        text("Press Space or tap to launch", W / 2, H / 2 + 10, 13, C.muted, "center", 500);
        text("Hold to jump higher · tap again to double-jump", W / 2, H / 2 + 32, 11, C.muted, "center", 400);
      } else if (s.phase === "over") {
        ctx.fillStyle = "rgba(19,20,23,0.5)";
        ctx.fillRect(0, 0, W, H);
        text("SIGNAL LOST", W / 2, H / 2 - 18, 24, C.redInk, "center", 700);
        text(
          score() >= s.best && score() > 0 ? `New best: ${score()}` : `Score ${score()} · Best ${s.best}`,
          W / 2,
          H / 2 + 10,
          13,
          C.ink,
          "center",
          500
        );
        text("Space or tap to relaunch", W / 2, H / 2 + 32, 11, C.muted, "center", 400);
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", release);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`${label}. Press Space, the up arrow, or tap to jump over obstacles.`}
      className="block h-[clamp(220px,46vw,320px)] w-full touch-none select-none rounded-xl"
    />
  );
}
