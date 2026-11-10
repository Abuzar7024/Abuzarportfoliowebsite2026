import * as THREE from "three";

/**
 * Procedural textures for the room, drawn on canvases at load time.
 * Everything is seeded so the room looks the same on every visit, and each
 * texture is generated once and shared (see `cached`).
 */

export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scale down procedural texture sizes on low-memory / mobile devices to save RAM & CPU. */
function getTexScale(): number {
  if (typeof window === "undefined") return 0.65;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const mem = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const eff = nav.connection?.effectiveType ?? "";
  if (nav.connection?.saveData || eff === "slow-2g" || eff === "2g" || mem <= 2 || cores <= 2) {
    return 0.4;
  }
  if (window.matchMedia?.("(max-width: 767px)").matches || mem <= 4) {
    return 0.5;
  }
  return 0.65;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function toTexture(c: HTMLCanvasElement, repeat: [number, number] = [1, 1], color = true) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = getTexScale() < 1 ? 2 : 4;
  return t;
}

const cache = new Map<string, THREE.Texture>();
/** Generates a texture once per key; `disposeTextures` frees them when the room unmounts. */
export function cached(key: string, make: () => THREE.Texture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

const noiseTileCache = new Map<string, HTMLCanvasElement>();

export function disposeTextures() {
  cache.forEach((t) => t.dispose());
  cache.clear();
  noiseTileCache.clear();
}

/**
 * Fast speckle noise: generates a small 128x128 ImageData tile once per seed/alpha
 * and tiles it across the target canvas in a single pattern fill instead of
 * thousands of individual fillRect() calls on the main thread.
 */
function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, alpha: number, seed: number) {
  const key = `${seed}:${alpha.toFixed(3)}`;
  let tile = noiseTileCache.get(key);
  if (!tile) {
    const T = 128;
    tile = document.createElement("canvas");
    tile.width = T;
    tile.height = T;
    const tctx = tile.getContext("2d")!;
    const img = tctx.createImageData(T, T);
    const data = img.data;
    const rand = mulberry32(seed);
    const density = Math.min(0.45, count / (512 * 512));
    const totalPixels = T * T;
    const dots = Math.max(250, Math.round(totalPixels * density));
    for (let i = 0; i < dots; i++) {
      const idx = Math.floor(rand() * totalPixels) * 4;
      const v = rand() > 0.5 ? 255 : 0;
      const a = Math.round(rand() * alpha * 255);
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = a;
    }
    tctx.putImageData(img, 0, 0);
    noiseTileCache.set(key, tile);
  }
  const pat = ctx.createPattern(tile, "repeat");
  if (pat) {
    ctx.save();
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/** Dark walnut with flowing grain lines and a few knots. */
export function woodTexture() {
  return cached("wood", () => {
    const scale = getTexScale();
    const W = Math.round(1024 * scale);
    const H = Math.round(512 * scale);
    const { c, ctx } = canvas(W, H);
    const rand = mulberry32(3);
    ctx.fillStyle = "#3a2a20";
    ctx.fillRect(0, 0, W, H);
    const lines = Math.round(110 * scale + 30);
    for (let i = 0; i < lines; i++) {
      const y0 = rand() * H;
      const amp = (2 + rand() * 7) * scale;
      const freq = (0.004 + rand() * 0.008) / scale;
      const phase = rand() * 10;
      ctx.strokeStyle = rand() > 0.5 ? `rgba(20,12,8,${0.15 + rand() * 0.3})` : `rgba(120,88,62,${0.08 + rand() * 0.18})`;
      ctx.lineWidth = (0.6 + rand() * 2.2) * scale;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const y = y0 + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const kx = rand() * W;
      const ky = rand() * H;
      for (let r = 2; r < 18; r += 3) {
        ctx.strokeStyle = `rgba(25,15,10,${0.35 - r / 60})`;
        ctx.beginPath();
        ctx.ellipse(kx, ky, r * 2.2 * scale, r * 0.8 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    speckle(ctx, W, H, 9000, 0.06, 4);
    return toTexture(c);
  });
}

/** Charcoal-stained oak planks for the floor. */
export function floorTexture() {
  return cached("floor", () => {
    const scale = getTexScale();
    const W = Math.round(1024 * scale);
    const H = Math.round(1024 * scale);
    const { c, ctx } = canvas(W, H);
    const rand = mulberry32(8);
    const rows = 8;
    const ph = H / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 300 * scale;
      while (x < W) {
        const len = (260 + rand() * 340) * scale;
        const shade = 34 + Math.floor(rand() * 12);
        ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 4})`;
        ctx.fillRect(x, r * ph, len, ph);
        for (let g = 0; g < 8; g++) {
          ctx.strokeStyle = `rgba(0,0,0,${0.05 + rand() * 0.1})`;
          ctx.lineWidth = 1;
          const gy = r * ph + rand() * ph;
          ctx.beginPath();
          ctx.moveTo(x, gy);
          ctx.bezierCurveTo(x + len * 0.3, gy + rand() * 6 - 3, x + len * 0.6, gy + rand() * 6 - 3, x + len, gy);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x, r * ph, 2, ph);
        x += len;
      }
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, r * ph, W, 2);
    }
    speckle(ctx, W, H, 12000, 0.05, 9);
    return toTexture(c, [3, 3]);
  });
}

/** Slightly mottled plaster for the walls. */
export function plasterTexture() {
  return cached("plaster", () => {
    const scale = getTexScale();
    const S = Math.round(512 * scale);
    const { c, ctx } = canvas(S, S);
    ctx.fillStyle = "#2a2d32";
    ctx.fillRect(0, 0, S, S);
    const rand = mulberry32(12);
    const blotches = Math.round(120 * scale + 40);
    for (let i = 0; i < blotches; i++) {
      const cx = rand() * S;
      const cy = rand() * S;
      const rad = (20 + rand() * 60) * scale;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const v = rand() > 0.5 ? "255,255,255" : "0,0,0";
      g.addColorStop(0, `rgba(${v},${0.02 + rand() * 0.025})`);
      g.addColorStop(1, `rgba(${v},0)`);
      ctx.fillStyle = g;
      // Only fill the gradient's bounding box instead of the entire canvas!
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    speckle(ctx, S, S, 14000, 0.05, 13);
    return toTexture(c, [4, 2]);
  });
}

/** Woven fabric: a fine cross-hatch with fibre noise. */
export function fabricTexture(base = "#2f3238", key = "fabric") {
  return cached(key, () => {
    const S = 256;
    const { c, ctx } = canvas(S, S);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    for (let y = 0; y < S; y += 3) {
      ctx.fillStyle = `rgba(255,255,255,${y % 6 === 0 ? 0.035 : 0.015})`;
      ctx.fillRect(0, y, S, 1);
    }
    for (let x = 0; x < S; x += 3) {
      ctx.fillStyle = `rgba(0,0,0,${x % 6 === 0 ? 0.12 : 0.06})`;
      ctx.fillRect(x, 0, 1, S);
    }
    speckle(ctx, S, S, 3000, 0.08, 21);
    return toTexture(c, [4, 4]);
  });
}

/** Rug: charcoal field, silver border, one signal-red stripe. */
export function rugTexture() {
  return cached("rug", () => {
    const W = 512;
    const H = 384;
    const { c, ctx } = canvas(W, H);
    ctx.drawImage(fabricTexture("#24272c", "rug-base").image as HTMLCanvasElement, 0, 0, W, H);
    ctx.strokeStyle = "rgba(201,207,216,0.35)";
    ctx.lineWidth = 6;
    ctx.strokeRect(22, 22, W - 44, H - 44);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(38, 38, W - 76, H - 76);
    ctx.fillStyle = "rgba(227,38,46,0.75)";
    ctx.fillRect(38, H - 76, W - 76, 8);
    speckle(ctx, W, H, 6000, 0.07, 31);
    return toTexture(c);
  });
}

/** Brushed metal: horizontal streaks, used as a bump map for the hardware. */
export function brushedTexture() {
  return cached("brushed", () => {
    const S = 256;
    const { c, ctx } = canvas(S, S);
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, S, S);
    const rand = mulberry32(41);
    for (let i = 0; i < 450; i++) {
      const v = Math.floor(100 + rand() * 60);
      ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
      ctx.fillRect(0, rand() * S, S, 1);
    }
    return toTexture(c, [1, 1], false);
  });
}

/** Waits for a web font so canvas text renders in it rather than the fallback. */
export async function fontsReady(fonts: string[]): Promise<boolean> {
  try {
    if (fonts.every((f) => document.fonts.check(f))) return false;
    await Promise.all(fonts.map((f) => document.fonts.load(f)));
    return true;
  } catch {
    return false;
  }
}

/**
 * A project poster: abstract orbit art, the project name and category. The
 * poster is decorative; clicking it opens the readable HTML details.
 */
export function posterTexture(id: string, index: number, title: string, category: string, host: string) {
  return cached(`poster-${id}`, () => {
    const W = 512;
    const H = 720;
    const { c, ctx } = canvas(W, H);
    const tex = toTexture(c);
    const draw = () => {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#22252a");
      bg.addColorStop(1, "#141518");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // Orbit art.
      const cx = W * 0.62;
      const cy = H * 0.36;
      ctx.lineWidth = 1.2;
      for (let r = 30; r < 330; r += 26) {
        ctx.strokeStyle = `rgba(201,207,216,${0.32 - r / 1200})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * (0.55 + index * 0.12), -0.4 + index * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#e3262e";
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(227,38,46,0.18)";
      ctx.beginPath();
      ctx.arc(cx, cy, 64, 0, Math.PI * 2);
      ctx.fill();
      // Index.
      ctx.strokeStyle = "rgba(201,207,216,0.4)";
      ctx.lineWidth = 2;
      ctx.font = '700 150px "Michroma", "Space Grotesk", sans-serif';
      ctx.textBaseline = "alphabetic";
      ctx.strokeText(String(index + 1).padStart(2, "0"), 30, 190);
      // Title + meta.
      ctx.fillStyle = "#eef1f5";
      let size = 64;
      ctx.font = `${size}px "Michroma", "Space Grotesk", sans-serif`;
      while (ctx.measureText(title.toUpperCase()).width > W - 70 && size > 30) {
        size -= 2;
        ctx.font = `${size}px "Michroma", "Space Grotesk", sans-serif`;
      }
      ctx.fillText(title.toUpperCase(), 34, H - 190);
      ctx.fillStyle = "#e3262e";
      ctx.fillRect(34, H - 165, 90, 5);
      ctx.fillStyle = "#c4cad3";
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillText(category.toUpperCase(), 34, H - 120);
      ctx.fillStyle = "#8b929d";
      ctx.font = '400 19px "JetBrains Mono", monospace';
      ctx.fillText(host, 34, H - 84);
      ctx.fillText("TAP TO VIEW DETAILS →", 34, H - 44);
      speckle(ctx, W, H, 5000, 0.06, 50 + index);
      tex.needsUpdate = true;
    };
    draw();
    fontsReady(['64px "Michroma"', '22px "JetBrains Mono"']).then((loadedLater) => {
      if (loadedLater) draw();
    });
    return tex;
  });
}

/** A framed certificate card for an education entry. */
export function certificateTexture(id: string, lines: { title: string; school: string; meta: string }) {
  return cached(`cert-${id}`, () => {
    const W = 640;
    const H = 460;
    const { c, ctx } = canvas(W, H);
    const tex = toTexture(c);
    const draw = () => {
      ctx.fillStyle = "#e9ebee";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#9aa1ab";
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.strokeRect(32, 32, W - 64, H - 64);
      ctx.fillStyle = "#b3141c";
      ctx.beginPath();
      ctx.arc(W / 2, 96, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e9ebee";
      ctx.font = '700 22px "Michroma", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("AK", W / 2, 104);
      ctx.fillStyle = "#1a1c20";
      let size = 30;
      ctx.font = `${size}px "Michroma", "Space Grotesk", sans-serif`;
      while (ctx.measureText(lines.title).width > W - 100 && size > 16) {
        size -= 1;
        ctx.font = `${size}px "Michroma", "Space Grotesk", sans-serif`;
      }
      ctx.fillText(lines.title, W / 2, 200);
      ctx.fillStyle = "#3a3e45";
      ctx.font = '500 24px "Inter", sans-serif';
      ctx.fillText(lines.school, W / 2, 262);
      ctx.fillStyle = "#6a707a";
      ctx.font = '400 19px "JetBrains Mono", monospace';
      ctx.fillText(lines.meta, W / 2, 312);
      ctx.strokeStyle = "#9aa1ab";
      ctx.beginPath();
      ctx.moveTo(W / 2 - 110, 372);
      ctx.lineTo(W / 2 + 110, 372);
      ctx.stroke();
      speckle(ctx, W, H, 4000, 0.05, 70);
      tex.needsUpdate = true;
    };
    draw();
    fontsReady(['30px "Michroma"', '24px "Inter"']).then((loadedLater) => {
      if (loadedLater) draw();
    });
    return tex;
  });
}
