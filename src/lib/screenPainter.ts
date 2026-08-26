import type { DeviceKind, ScreenSpec } from "../data/types";

/**
 * Paints an illustrative, procedural product UI onto a canvas.
 * Deliberately number-free: shapes, bars and labels only — no fabricated metrics.
 * Used both as a Three.js CanvasTexture and as the <img> in the 2D fallback.
 */

export const SCREEN_SIZE: Record<DeviceKind, { w: number; h: number }> = {
  phone: { w: 480, h: 1024 },
  browser: { w: 1280, h: 800 },
  dashboard: { w: 1280, h: 800 },
};

function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  ink2: string;
  muted: string;
  line: string;
  accent: string;
  accent2: string;
  dark: boolean;
}

const DARK = (accent: string, accent2: string): Palette => ({
  bg: "#0b0d12",
  surface: "#12151c",
  surface2: "#1a1e27",
  ink: "#f3f5f8",
  ink2: "#b8bfcb",
  muted: "#5f6776",
  line: "rgba(255,255,255,0.08)",
  accent,
  accent2,
  dark: true,
});

const LIGHT = (accent: string, accent2: string): Palette => ({
  bg: "#f5f7fa",
  surface: "#ffffff",
  surface2: "#eef1f5",
  ink: "#111827",
  ink2: "#4b5563",
  muted: "#9aa3b2",
  line: "rgba(15,23,42,0.08)",
  accent,
  accent2,
  dark: false,
});

const NAVY = (accent: string, accent2: string): Palette => ({
  bg: "#ffffff",
  surface: "#0f2a44",
  surface2: "#f3f6fa",
  ink: "#0f2a44",
  ink2: "#3e5670",
  muted: "#8ea0b5",
  line: "rgba(15,42,68,0.1)",
  accent,
  accent2,
  dark: false,
});

class Painter {
  ctx: CanvasRenderingContext2D;
  rnd: () => number;
  constructor(ctx: CanvasRenderingContext2D, seed: number) {
    this.ctx = ctx;
    this.rnd = seeded(seed);
  }
  rect(x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
    const c = this.ctx;
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.5;
      c.stroke();
    }
  }
  circle(x: number, y: number, r: number, fill: string) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
  }
  text(x: number, y: number, s: string, size: number, color: string, weight = 500, family = "Inter, system-ui, sans-serif", align: CanvasTextAlign = "left") {
    const c = this.ctx;
    c.font = `${weight} ${size}px ${family}`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "alphabetic";
    c.fillText(s, x, y);
  }
  /** Text placeholder lines (no words). */
  lines(x: number, y: number, w: number, count: number, h: number, gap: number, color: string, lastShort = true) {
    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const width = isLast && lastShort ? w * (0.45 + this.rnd() * 0.25) : w * (0.85 + this.rnd() * 0.15);
      this.rect(x, y + i * (h + gap), width, h, h / 2, color);
    }
  }
  bars(x: number, y: number, w: number, h: number, n: number, color: string, color2?: string) {
    const gap = w / n / 3;
    const bw = (w - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const v = 0.25 + this.rnd() * 0.75;
      const bh = h * v;
      this.rect(x + i * (bw + gap), y + h - bh, bw, bh, bw / 3, i % 3 === 1 && color2 ? color2 : color);
    }
  }
  spark(x: number, y: number, w: number, h: number, color: string, fillTo?: number) {
    const c = this.ctx;
    const n = 14;
    const pts: [number, number][] = [];
    let v = 0.4 + this.rnd() * 0.3;
    for (let i = 0; i < n; i++) {
      v = Math.max(0.1, Math.min(0.95, v + (this.rnd() - 0.45) * 0.3));
      pts.push([x + (w * i) / (n - 1), y + h - h * v]);
    }
    c.beginPath();
    pts.forEach(([px, py], i) => (i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)));
    c.strokeStyle = color;
    c.lineWidth = 2.5;
    c.lineJoin = "round";
    c.stroke();
    if (fillTo !== undefined) {
      c.lineTo(x + w, fillTo);
      c.lineTo(x, fillTo);
      c.closePath();
      const g = c.createLinearGradient(0, y, 0, fillTo);
      g.addColorStop(0, hexToRgba(color, 0.35));
      g.addColorStop(1, hexToRgba(color, 0));
      c.fillStyle = g;
      c.fill();
    }
  }
  donut(x: number, y: number, r: number, thickness: number, segments: { color: string; frac: number }[], track: string) {
    const c = this.ctx;
    c.lineWidth = thickness;
    c.lineCap = "butt";
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.strokeStyle = track;
    c.stroke();
    let a = -Math.PI / 2;
    for (const s of segments) {
      c.beginPath();
      c.arc(x, y, r, a, a + Math.PI * 2 * s.frac);
      c.strokeStyle = s.color;
      c.stroke();
      a += Math.PI * 2 * s.frac;
    }
  }
  icon(x: number, y: number, s: number, color: string) {
    // abstract glyph: rounded square with a dot
    this.rect(x, y, s, s, s * 0.28, color);
    this.circle(x + s / 2, y + s / 2, s * 0.16, "rgba(255,255,255,0.9)");
  }
  heatCells(x: number, y: number, w: number, h: number, cols: number, rows: number, color: string) {
    const cw = w / cols;
    const ch = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c2 = 0; c2 < cols; c2++) {
        const v = this.rnd();
        this.rect(x + c2 * cw + 1, y + r * ch + 1, cw - 2, ch - 2, 3, hexToRgba(color, 0.08 + v * v * 0.8));
      }
    }
  }
}

/* ───────────────────────── Variants ───────────────────────── */

function browserChrome(p: Painter, pal: Palette, W: number, title: string) {
  const barH = 44;
  p.rect(0, 0, W, barH, 0, pal.dark ? "#14171e" : "#e9edf2");
  p.circle(20, barH / 2, 5, "#ff5f57");
  p.circle(38, barH / 2, 5, "#febc2e");
  p.circle(56, barH / 2, 5, "#28c840");
  p.rect(90, 10, W - 180, 24, 12, pal.dark ? "#0b0d12" : "#ffffff");
  p.text(W / 2, 27, title, 12, pal.dark ? "#8a93a3" : "#6b7482", 500, "JetBrains Mono, ui-monospace, monospace", "center");
  return barH;
}

function phoneStatusBar(p: Painter, pal: Palette, W: number) {
  const h = 54;
  p.text(28, 36, "9:41", 20, pal.ink, 600);
  p.rect(W - 92, 22, 22, 12, 3, pal.ink);
  p.rect(W - 64, 22, 22, 12, 3, pal.ink);
  p.rect(W - 36, 20, 12, 16, 3, pal.ink);
  return h;
}

function paintDashboard(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = DARK(spec.accent, spec.accent2 ?? spec.accent);
  p.rect(0, 0, W, H, 0, pal.bg);
  const top = browserChrome(p, pal, W, "app.digitopia.live");
  const sideW = 220;
  // sidebar
  p.rect(0, top, sideW, H - top, 0, pal.surface);
  p.rect(24, top + 28, 34, 34, 10, pal.accent);
  p.text(70, top + 52, spec.title, 17, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  const items = ["Screens", "Campaigns", "Playlists", "Audience", "Analytics", "Locations", "Settings"];
  items.forEach((it, i) => {
    const y = top + 110 + i * 46;
    if (i === 0) p.rect(14, y - 22, sideW - 28, 38, 10, hexToRgba(pal.accent, 0.14));
    p.rect(30, y - 13, 18, 18, 5, i === 0 ? pal.accent : pal.muted);
    p.text(60, y + 1, it, 14, i === 0 ? pal.ink : pal.ink2, i === 0 ? 600 : 500);
  });
  // header
  const cx = sideW + 32;
  p.text(cx, top + 56, "Network overview", 24, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.text(cx, top + 80, spec.subtitle ?? "", 13, pal.muted, 500);
  p.rect(W - 200, top + 30, 168, 38, 19, pal.accent);
  p.text(W - 116, top + 55, "New campaign", 13, "#0b0d12", 700, undefined, "center");
  // KPI cards (no numbers)
  const kpiLabels = ["Screens online", "Active campaigns", "Audience today", "Content uptime"];
  const cw = (W - cx - 32 - 3 * 16) / 4;
  kpiLabels.forEach((l, i) => {
    const x = cx + i * (cw + 16);
    const y = top + 104;
    p.rect(x, y, cw, 104, 14, pal.surface, pal.line);
    p.text(x + 18, y + 30, l, 12, pal.muted, 500);
    p.rect(x + 18, y + 44, cw * 0.45, 18, 6, pal.ink2);
    p.spark(x + 18, y + 68, cw - 36, 24, i % 2 === 0 ? pal.accent : pal.accent2);
  });
  // main chart
  const chY = top + 232;
  const chW = W - cx - 32 - 300 - 16;
  p.rect(cx, chY, chW, H - chY - 28, 16, pal.surface, pal.line);
  p.text(cx + 20, chY + 32, "Impressions by daypart", 14, pal.ink, 600);
  p.lines(cx + 20, chY + 46, 180, 1, 8, 0, pal.muted);
  p.bars(cx + 20, chY + 80, chW - 40, H - chY - 28 - 110, 18, hexToRgba(pal.accent, 0.85), hexToRgba(pal.accent2, 0.85));
  // right panel: audience
  const rx = cx + chW + 16;
  p.rect(rx, chY, 300, 250, 16, pal.surface, pal.line);
  p.text(rx + 20, chY + 32, "Live audience", 14, pal.ink, 600);
  p.circle(rx + 262, chY + 26, 5, "#34d399");
  p.donut(rx + 150, chY + 140, 62, 18, [
    { color: pal.accent, frac: 0.42 },
    { color: pal.accent2, frac: 0.3 },
    { color: hexToRgba(pal.ink2, 0.6), frac: 0.18 },
  ], hexToRgba(pal.ink2, 0.12));
  p.text(rx + 150, chY + 146, "age · gender", 11, pal.muted, 500, "JetBrains Mono, monospace", "center");
  // heatmap
  const hy = chY + 266;
  p.rect(rx, hy, 300, H - hy - 28, 16, pal.surface, pal.line);
  p.text(rx + 20, hy + 32, "Dwell-time heatmap", 14, pal.ink, 600);
  p.heatCells(rx + 20, hy + 48, 260, H - hy - 28 - 68, 12, 5, pal.accent);
}

function paintLanding(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = NAVY(spec.accent, spec.accent2 ?? spec.accent);
  p.rect(0, 0, W, H, 0, pal.bg);
  const top = browserChrome(p, pal, W, "ebani-landing-page.prod.digitopia.live");
  // nav
  p.rect(48, top + 26, 28, 28, 8, pal.surface);
  p.text(86, top + 47, spec.title, 18, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  const nav = ["Solutions", "Technology", "Results", "Process"];
  nav.forEach((n, i) => p.text(W - 560 + i * 110, top + 46, n, 13, pal.ink2, 500));
  p.rect(W - 218, top + 22, 170, 38, 19, pal.surface);
  p.text(W - 133, top + 46, "Book a consultation", 12, "#ffffff", 600, undefined, "center");
  // hero
  const hy = top + 120;
  p.text(64, hy + 20, "AI-POWERED DIGITAL SCREENS", 11, pal.accent, 700, "JetBrains Mono, monospace");
  p.text(64, hy + 78, "Turn any space into", 46, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.text(64, hy + 130, "a digital experience", 46, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.lines(64, hy + 162, 420, 3, 10, 10, hexToRgba(pal.ink, 0.18));
  p.rect(64, hy + 236, 200, 44, 22, pal.surface);
  p.text(164, hy + 264, "Book a Free Consultation", 12, "#fff", 600, undefined, "center");
  p.rect(280, hy + 236, 190, 44, 22, "transparent", hexToRgba(pal.ink, 0.35));
  p.text(375, hy + 264, "Get Product Catalogue", 12, pal.ink, 600, undefined, "center");
  // device illustration (totem)
  const tx = W - 430;
  const ty = top + 90;
  p.rect(tx + 120, ty, 180, 360, 14, "#0e1a2b");
  p.rect(tx + 132, ty + 12, 156, 320, 8, hexToRgba(pal.accent, 0.35));
  p.rect(tx + 140, ty + 24, 140, 90, 8, hexToRgba(pal.accent2, 0.55));
  p.lines(tx + 148, ty + 130, 120, 4, 8, 8, "rgba(255,255,255,0.5)");
  p.rect(tx + 148, ty + 250, 120, 60, 8, hexToRgba(pal.accent, 0.7));
  p.rect(tx + 170, ty + 360, 80, 14, 4, "#0e1a2b");
  p.rect(tx + 130, ty + 374, 160, 10, 5, "#0e1a2b");
  // stats row (labels only)
  const sy = hy + 330;
  ["1 – 1,000 screens per network", "6 industry environments", "1 team, end to end"].forEach((s, i) => {
    const x = 64 + i * 260;
    p.rect(x, sy, 240, 70, 12, pal.surface2, pal.line);
    p.text(x + 18, sy + 42, s, 13, pal.ink, 600);
  });
  // product grid
  const gy = sy + 100;
  for (let i = 0; i < 6; i++) {
    const x = 64 + i * 194;
    p.rect(x, gy, 176, H - gy - 24, 12, pal.surface2, pal.line);
    p.rect(x + 40, gy + 18, 96, 70, 8, hexToRgba(pal.surface, 0.9));
    p.lines(x + 16, gy + 104, 140, 2, 8, 8, hexToRgba(pal.ink, 0.25));
  }
}

function paintForm(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = LIGHT(spec.accent, spec.accent2 ?? spec.accent);
  p.rect(0, 0, W, H, 0, pal.bg);
  const top = phoneStatusBar(p, pal, W);
  // app bar
  p.rect(0, top, W, 96, 0, pal.surface);
  p.rect(28, top + 30, 34, 34, 17, pal.surface2);
  p.text(80, top + 44, spec.title, 22, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.text(80, top + 70, spec.subtitle ?? "", 13, pal.muted, 500);
  // stepper
  const sy = top + 130;
  for (let i = 0; i < 6; i++) {
    const x = 28 + i * ((W - 56) / 6);
    p.rect(x, sy, (W - 56) / 6 - 8, 6, 3, i < 3 ? pal.accent : hexToRgba(pal.ink, 0.1));
  }
  // section title
  p.text(28, sy + 56, "Personal information", 17, pal.ink, 600);
  // fields
  const fields = ["Full name", "Emirates ID", "Date of birth", "Nationality", "Mobile number"];
  fields.forEach((f, i) => {
    const y = sy + 84 + i * 96;
    p.text(28, y, f, 12, pal.ink2, 600);
    p.rect(28, y + 12, W - 56, 56, 14, pal.surface, i === 1 ? pal.accent : pal.line);
    p.lines(46, y + 34, 220, 1, 10, 0, hexToRgba(pal.ink, i === 1 ? 0.55 : 0.18));
    if (i === 2 || i === 3) p.rect(W - 76, y + 30, 18, 18, 5, pal.muted);
  });
  // checkbox
  const cy = sy + 84 + fields.length * 96 + 8;
  p.rect(28, cy, 22, 22, 6, pal.accent);
  p.lines(64, cy + 4, W - 120, 2, 9, 8, hexToRgba(pal.ink, 0.25));
  // buttons
  p.rect(28, H - 130, (W - 72) / 2, 58, 29, pal.surface2);
  p.text(28 + (W - 72) / 4, H - 94, "Save draft", 14, pal.ink, 600, undefined, "center");
  p.rect(44 + (W - 72) / 2, H - 130, (W - 72) / 2, 58, 29, pal.accent);
  p.text(44 + (W - 72) * 0.75, H - 94, "Continue", 14, "#082f49", 700, undefined, "center");
  // home indicator
  p.rect(W / 2 - 60, H - 22, 120, 6, 3, hexToRgba(pal.ink, 0.6));
}

function paintServices(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = LIGHT(spec.accent, spec.accent2 ?? spec.accent);
  p.rect(0, 0, W, H, 0, pal.bg);
  const top = phoneStatusBar(p, pal, W);
  p.text(28, top + 44, "Good morning", 14, pal.muted, 500);
  p.text(28, top + 76, spec.title, 30, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.circle(W - 52, top + 56, 24, pal.surface2);
  // search
  p.rect(28, top + 104, W - 56, 56, 18, pal.surface, pal.line);
  p.circle(56, top + 132, 9, "transparent");
  p.text(76, top + 138, "What do you need help with?", 14, pal.muted, 500);
  // promo card
  p.rect(28, top + 184, W - 56, 130, 22, pal.accent);
  p.text(52, top + 232, "50+ services", 22, "#1f1300", 700, "Space Grotesk, Inter, sans-serif");
  p.text(52, top + 258, "Background-verified professionals", 13, "#3b2a00", 500);
  p.text(52, top + 280, "Pre-approved pricing", 13, "#3b2a00", 500);
  p.rect(W - 130, top + 210, 80, 80, 20, "rgba(255,255,255,0.35)");
  // categories
  p.text(28, top + 360, "Categories", 17, pal.ink, 600);
  const cats = ["Cleaning", "Plumbing", "Electric", "AC repair", "Painting", "Moving", "Pest", "More"];
  cats.forEach((c, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 28 + col * ((W - 56) / 4);
    const y = top + 384 + row * 118;
    p.rect(x + 8, y, (W - 56) / 4 - 16, 70, 18, pal.surface, pal.line);
    p.icon(x + (W - 56) / 8 - 16, y + 19, 32, i % 2 === 0 ? pal.accent : pal.accent2);
    p.text(x + (W - 56) / 8, y + 96, c, 12, pal.ink2, 500, undefined, "center");
  });
  // popular
  p.text(28, top + 650, "Popular near you", 17, pal.ink, 600);
  for (let i = 0; i < 2; i++) {
    const y = top + 672 + i * 108;
    p.rect(28, y, W - 56, 92, 18, pal.surface, pal.line);
    p.rect(44, y + 16, 60, 60, 14, pal.surface2);
    p.lines(120, y + 22, 240, 2, 10, 10, hexToRgba(pal.ink, 0.22));
    p.rect(W - 120, y + 30, 76, 32, 16, pal.accent);
    p.text(W - 82, y + 51, "Book", 12, "#1f1300", 700, undefined, "center");
  }
  // bottom nav
  p.rect(0, H - 92, W, 92, 0, pal.surface);
  for (let i = 0; i < 4; i++) {
    const x = W / 8 + (i * W) / 4;
    p.circle(x, H - 56, 12, i === 0 ? pal.accent : hexToRgba(pal.ink, 0.15));
  }
  p.rect(W / 2 - 60, H - 14, 120, 5, 3, hexToRgba(pal.ink, 0.6));
}

function paintProvider(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = DARK(spec.accent, spec.accent2 ?? spec.accent);
  p.rect(0, 0, W, H, 0, pal.bg);
  const top = phoneStatusBar(p, pal, W);
  p.text(28, top + 44, "Provider dashboard", 14, pal.muted, 500);
  p.text(28, top + 78, spec.title, 28, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.rect(W - 92, top + 32, 64, 32, 16, hexToRgba("#34d399", 0.18));
  p.text(W - 60, top + 53, "Online", 11, "#34d399", 700, undefined, "center");
  // earnings card
  p.rect(28, top + 110, W - 56, 150, 22, pal.surface, pal.line);
  p.text(52, top + 146, "Earnings this week", 13, pal.muted, 500);
  p.rect(52, top + 160, 190, 26, 8, pal.ink2);
  p.spark(52, top + 200, W - 104, 40, pal.accent, top + 244);
  // stats
  ["Jobs", "Rating", "Response"].forEach((s, i) => {
    const x = 28 + i * ((W - 56) / 3);
    p.rect(x + (i === 0 ? 0 : 8), top + 280, (W - 56) / 3 - (i === 1 ? 16 : 8), 78, 18, pal.surface, pal.line);
    p.text(x + (i === 0 ? 16 : 24), top + 308, s, 12, pal.muted, 500);
    p.rect(x + (i === 0 ? 16 : 24), top + 322, 60, 16, 6, i === 1 ? pal.accent2 : pal.accent);
  });
  // job list
  p.text(28, top + 404, "Today's jobs", 17, pal.ink, 600);
  const statuses = ["In progress", "Scheduled", "Scheduled", "Completed"];
  statuses.forEach((s, i) => {
    const y = top + 424 + i * 112;
    p.rect(28, y, W - 56, 96, 18, pal.surface, pal.line);
    p.rect(44, y + 20, 56, 56, 16, pal.surface2);
    p.lines(116, y + 26, 200, 2, 10, 10, hexToRgba(pal.ink, 0.3));
    const chipColor = i === 0 ? pal.accent : i === 3 ? "#34d399" : pal.muted;
    p.rect(W - 150, y + 32, 106, 30, 15, hexToRgba(chipColor, 0.16));
    p.text(W - 97, y + 52, s, 11, chipColor, 700, undefined, "center");
  });
  // chat fab
  p.circle(W - 64, H - 150, 32, pal.accent);
  p.rect(0, H - 92, W, 92, 0, pal.surface);
  for (let i = 0; i < 4; i++) {
    const x = W / 8 + (i * W) / 4;
    p.circle(x, H - 56, 12, i === 0 ? pal.accent : hexToRgba(pal.ink, 0.15));
  }
  p.rect(W / 2 - 60, H - 14, 120, 5, 3, hexToRgba(pal.ink, 0.6));
}

function paintHealth(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = LIGHT(spec.accent, spec.accent2 ?? spec.accent);
  p.rect(0, 0, W, H, 0, pal.bg);
  const top = phoneStatusBar(p, pal, W);
  p.rect(0, top, W, 90, 0, pal.surface);
  p.text(28, top + 42, spec.title, 24, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.text(28, top + 66, spec.subtitle ?? "", 12, pal.muted, 500);
  p.circle(W - 52, top + 44, 22, pal.surface2);
  // next appointment
  p.rect(28, top + 116, W - 56, 140, 22, pal.accent);
  p.text(52, top + 150, "NEXT APPOINTMENT", 11, "#052e1c", 700, "JetBrains Mono, monospace");
  p.rect(52, top + 166, 220, 22, 8, "rgba(5,46,28,0.35)");
  p.rect(52, top + 198, 150, 14, 6, "rgba(5,46,28,0.25)");
  p.rect(W - 132, top + 200, 80, 34, 17, "#052e1c");
  p.text(W - 92, top + 222, "Details", 12, "#ffffff", 600, undefined, "center");
  // tiles
  ["Patients", "Appointments", "Reports", "Messages"].forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 28 + col * ((W - 56) / 2 + 8);
    const y = top + 280 + row * 104;
    p.rect(x, y, (W - 56) / 2 - 8, 90, 18, pal.surface, pal.line);
    p.icon(x + 16, y + 16, 28, i % 2 === 0 ? pal.accent : pal.accent2);
    p.text(x + 16, y + 74, t, 13, pal.ink2, 600);
  });
  // patient list
  p.text(28, top + 520, "Recent patients", 17, pal.ink, 600);
  for (let i = 0; i < 4; i++) {
    const y = top + 540 + i * 84;
    p.rect(28, y, W - 56, 72, 18, pal.surface, pal.line);
    p.circle(64, y + 36, 22, i % 2 === 0 ? hexToRgba(pal.accent, 0.35) : hexToRgba(pal.accent2, 0.35));
    p.lines(102, y + 22, 200, 2, 9, 9, hexToRgba(pal.ink, 0.22));
    p.rect(W - 104, y + 26, 60, 20, 10, hexToRgba(pal.accent, 0.18));
  }
  p.rect(0, H - 92, W, 92, 0, pal.surface);
  for (let i = 0; i < 4; i++) {
    const x = W / 8 + (i * W) / 4;
    p.circle(x, H - 56, 12, i === 0 ? pal.accent : hexToRgba(pal.ink, 0.15));
  }
  p.rect(W / 2 - 60, H - 14, 120, 5, 3, hexToRgba(pal.ink, 0.6));
}

function paintPortfolio(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = DARK(spec.accent, spec.accent2 ?? spec.accent);
  p.rect(0, 0, W, H, 0, "#07080a");
  const top = browserChrome(p, pal, W, "abuzar-khan · portfolio");
  // nav pill
  p.rect(W / 2 - 220, top + 22, 440, 42, 21, "rgba(255,255,255,0.05)", pal.line);
  ["Home", "About", "Work", "Resume", "Contact"].forEach((n, i) => p.text(W / 2 - 180 + i * 88, top + 49, n, 12, i === 0 ? pal.ink : pal.muted, 600, undefined, "center"));
  // sphere sketch
  const cx = W * 0.72;
  const cy = top + 330;
  const c = p.ctx;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(cx, cy, 190, 190 * (0.35 + i * 0.3), (i * Math.PI) / 5, 0, Math.PI * 2);
    c.strokeStyle = hexToRgba(pal.accent, 0.35);
    c.lineWidth = 1.5;
    c.stroke();
  }
  c.beginPath();
  c.arc(cx, cy, 90, 0, Math.PI * 2);
  const g = c.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, 110);
  g.addColorStop(0, hexToRgba(pal.accent, 0.5));
  g.addColorStop(1, "rgba(12,14,18,1)");
  c.fillStyle = g;
  c.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    p.circle(cx + Math.cos(a) * 190, cy + Math.sin(a) * 80, 5, i % 2 ? pal.accent : pal.accent2);
  }
  // copy
  p.text(64, top + 150, "OPEN TO SOFTWARE DEVELOPMENT ROLES", 11, pal.accent, 700, "JetBrains Mono, monospace");
  p.text(64, top + 220, "Building digital", 54, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.text(64, top + 280, "products that", 54, pal.ink, 700, "Space Grotesk, Inter, sans-serif");
  p.text(64, top + 340, "actually ship.", 54, pal.accent, 700, "Space Grotesk, Inter, sans-serif");
  p.lines(64, top + 372, 420, 2, 10, 10, "rgba(255,255,255,0.18)");
  p.rect(64, top + 430, 170, 46, 23, pal.ink);
  p.text(149, top + 459, "View projects", 13, "#07080a", 700, undefined, "center");
  p.rect(250, top + 430, 190, 46, 23, "transparent", "rgba(255,255,255,0.2)");
  p.text(345, top + 459, "Download resume", 13, pal.ink, 600, undefined, "center");
  // bottom cards
  for (let i = 0; i < 4; i++) {
    const x = 64 + i * 292;
    p.rect(x, H - 190, 268, 150, 18, "rgba(255,255,255,0.04)", pal.line);
    p.rect(x + 18, H - 168, 34, 34, 10, i % 2 ? pal.accent2 : pal.accent);
    p.lines(x + 18, H - 118, 220, 3, 9, 9, "rgba(255,255,255,0.18)");
  }
}


function paintWardrobe(p: Painter, spec: ScreenSpec, W: number, H: number) {
  const pal = LIGHT(spec.accent, spec.accent2 ?? spec.accent);
  pal.bg = "#faf7f5";
  p.rect(0, 0, W, H, 0, pal.bg);
  const top = phoneStatusBar(p, pal, W);
  p.text(28, top + 44, "Good evening", 14, pal.muted, 500);
  p.text(28, top + 76, spec.title, 30, pal.ink, 700, "Manrope, Inter, sans-serif");
  p.circle(W - 52, top + 56, 24, pal.surface2);
  // daily look forecast card
  p.rect(28, top + 104, W - 56, 168, 24, "#1a1418");
  p.text(52, top + 138, "TODAY'S LOOK", 11, hexToRgba("#ffffff", 0.6), 700, "JetBrains Mono, monospace");
  p.text(52, top + 170, "Dinner in the city", 22, "#ffffff", 700, "Manrope, Inter, sans-serif");
  p.lines(52, top + 188, 200, 2, 9, 9, "rgba(255,255,255,0.35)");
  p.rect(52, top + 226, 120, 32, 16, pal.accent);
  p.text(112, top + 247, "Style it", 12, "#ffffff", 700, undefined, "center");
  for (let i = 0; i < 3; i++) {
    p.rect(W - 176 + i * 44, top + 136, 40, 56, 10, hexToRgba(i === 1 ? pal.accent : "#ffffff", 0.22));
  }
  // calendar strip
  p.text(28, top + 312, "This week", 17, pal.ink, 600);
  for (let i = 0; i < 7; i++) {
    const x = 28 + i * ((W - 56) / 7);
    const w = (W - 56) / 7 - 8;
    p.rect(x + 4, top + 328, w, 64, 14, i === 2 ? pal.accent : pal.surface, i === 2 ? undefined : pal.line);
    p.circle(x + 4 + w / 2, top + 372, 4, i === 2 ? "#ffffff" : hexToRgba(pal.ink, 0.2));
  }
  // wardrobe grid
  p.text(28, top + 440, "Your wardrobe", 17, pal.ink, 600);
  p.text(W - 28, top + 440, "See all", 12, pal.accent, 600, undefined, "right");
  const tones = ["#2b2b33", "#c9a27e", "#e8e4df", "#7a2e3a", "#3c4a5c", "#d8b4a0"];
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 28 + col * ((W - 56) / 3);
    const w = (W - 56) / 3 - 10;
    const y = top + 460 + row * 150;
    p.rect(x + 5, y, w, 132, 18, pal.surface, pal.line);
    p.rect(x + 25, y + 16, w - 40, 76, 14, tones[i]);
    p.lines(x + 18, y + 106, w - 36, 1, 8, 0, hexToRgba(pal.ink, 0.2));
  }
  // community looks
  p.text(28, top + 796, "Community looks", 17, pal.ink, 600);
  for (let i = 0; i < 2; i++) {
    const x = 28 + i * ((W - 56) / 2);
    p.rect(x + (i ? 6 : 0), top + 816, (W - 56) / 2 - 6, 96, 18, pal.surface, pal.line);
    p.circle(x + (i ? 6 : 0) + 30, top + 846, 14, hexToRgba(pal.accent, 0.35));
    p.lines(x + (i ? 6 : 0) + 54, top + 838, 100, 2, 8, 8, hexToRgba(pal.ink, 0.22));
    p.rect(x + (i ? 6 : 0) + 16, top + 876, 90, 24, 12, hexToRgba(pal.accent, 0.15));
  }
  p.rect(0, H - 92, W, 92, 0, pal.surface);
  for (let i = 0; i < 5; i++) {
    const x = W / 10 + (i * W) / 5;
    p.circle(x, H - 56, 11, i === 0 ? pal.accent : hexToRgba(pal.ink, 0.15));
  }
  p.rect(W / 2 - 60, H - 14, 120, 5, 3, hexToRgba(pal.ink, 0.6));
}

export function paintScreen(canvas: HTMLCanvasElement, spec: ScreenSpec, kind: DeviceKind): HTMLCanvasElement {
  const { w, h } = SCREEN_SIZE[kind];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const seed = Array.from(spec.title + spec.variant).reduce((a, c) => a + c.charCodeAt(0), 7);
  const p = new Painter(ctx, seed);
  switch (spec.variant) {
    case "dashboard":
      paintDashboard(p, spec, w, h);
      break;
    case "landing":
      paintLanding(p, spec, w, h);
      break;
    case "form":
      paintForm(p, spec, w, h);
      break;
    case "services":
      paintServices(p, spec, w, h);
      break;
    case "provider":
      paintProvider(p, spec, w, h);
      break;
    case "health":
      paintHealth(p, spec, w, h);
      break;
    case "portfolio":
      paintPortfolio(p, spec, w, h);
      break;
    case "wardrobe":
      paintWardrobe(p, spec, w, h);
      break;
  }
  return canvas;
}

const urlCache = new Map<string, string>();

/** Data URL of the painted screen, cached per project/kind (for 2D fallbacks and previews). */
export function screenDataUrl(spec: ScreenSpec, kind: DeviceKind): string {
  const key = `${spec.variant}|${spec.title}|${kind}|${spec.accent}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  if (typeof document === "undefined") return "";
  const canvas = paintScreen(document.createElement("canvas"), spec, kind);
  const url = canvas.toDataURL("image/png");
  urlCache.set(key, url);
  return url;
}
