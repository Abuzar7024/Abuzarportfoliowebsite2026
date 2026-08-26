/**
 * Generates the static assets that are derived from the site itself:
 *  - public/Abuzar-Khan-Resume.pdf  (print of the vector resume, via headless Edge/Chrome)
 *  - public/og.png                   (1200×630 Open Graph card)
 *  - public/apple-touch-icon.png     (180×180)
 *
 * Usage:  npm run build && npm run assets
 * Requires Microsoft Edge or Google Chrome installed (or set BROWSER_PATH).
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync, copyFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}`;

const CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);

const browser = CANDIDATES.find((p) => existsSync(p));
if (!browser) {
  console.error("No Chromium-based browser found. Set BROWSER_PATH to msedge.exe / chrome.exe.");
  process.exit(1);
}

const publicDir = resolve(root, "public");
const buildDir = resolve(root, "build");
mkdirSync(publicDir, { recursive: true });

if (!existsSync(resolve(buildDir, "index.html"))) {
  console.log("No build found — running `vite build` first…");
  execFileSync(process.execPath, [resolve(root, "node_modules", "vite", "bin", "vite.js"), "build"], { cwd: root, stdio: "inherit" });
}

function run(args) {
  const common = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    `--user-data-dir=${resolve(root, "node_modules", ".cache", "headless-profile")}`,
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=8000",
  ];
  execFileSync(browser, [...common, ...args], { stdio: "pipe", timeout: 120000 });
}

async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Preview server did not start at ${url}`);
}

const preview = spawn(process.execPath, [resolve(root, "node_modules", "vite", "bin", "vite.js"), "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore",
});

try {
  await waitFor(`${BASE}/`);

  // 1) Resume PDF
  const pdfOut = resolve(publicDir, "Abuzar-Khan-Resume.pdf");
  console.log("Printing resume →", pdfOut);
  run([`--print-to-pdf=${pdfOut}`, "--no-pdf-header-footer", `${BASE}/?print=resume`]);
  copyFileSync(pdfOut, resolve(buildDir, "Abuzar-Khan-Resume.pdf"));

  // 2) Open Graph image
  const ogOut = resolve(publicDir, "og.png");
  console.log("Rendering OG image →", ogOut);
  run([`--screenshot=${ogOut}`, "--window-size=1200,630", pathToFileURL(resolve(root, "scripts", "og.html")).href]);
  copyFileSync(ogOut, resolve(buildDir, "og.png"));

  // 3) Apple touch icon
  const iconOut = resolve(publicDir, "apple-touch-icon.png");
  console.log("Rendering touch icon →", iconOut);
  run([`--screenshot=${iconOut}`, "--window-size=180,180", pathToFileURL(resolve(root, "scripts", "icon.html")).href]);
  copyFileSync(iconOut, resolve(buildDir, "apple-touch-icon.png"));

  console.log("Assets generated.");
} finally {
  preview.kill();
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      /* already gone */
    }
  }
}
