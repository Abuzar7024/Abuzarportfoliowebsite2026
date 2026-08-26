/** Captures the opening sequence at several moments (desktop + phone). Usage: node scripts/capture-intro.mjs [outDir] */
import puppeteer from "puppeteer-core";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(process.argv[2] ?? resolve(root, ".smoke"));
mkdirSync(OUT, { recursive: true });
const PORT = 4183;
const BASE = `http://127.0.0.1:${PORT}`;
const executablePath = [process.env.BROWSER_PATH, "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "/usr/bin/google-chrome"].filter(Boolean).find((p) => existsSync(p));

const preview = spawn(process.execPath, [resolve(root, "node_modules", "vite", "bin", "vite.js"), "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { cwd: root, stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {}
  await wait(500);
}

try {
  const browser = await puppeteer.launch({ executablePath, headless: "new", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
  for (const [name, w, h, mobile] of [["desktop", 1440, 900, false], ["mobile", 390, 844, true]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const t0 = Date.now();
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    const marks = [700, 1500, 2300, 3300, 4600];
    for (const m of marks) {
      const delta = m - (Date.now() - t0);
      if (delta > 0) await wait(delta);
      await page.screenshot({ path: resolve(OUT, `intro-${name}-${m}.png`) });
    }
    await page.close();
  }
  await browser.close();
} finally {
  preview.kill();
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {}
  }
}
console.log("captured →", OUT);
