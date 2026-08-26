/**
 * Automated runtime verification against the production build.
 *  - console errors / page errors / failed requests at desktop, tablet, mobile
 *  - project detail overlay open/close, keyboard nav
 *  - WebGL-disabled fallback, reduced-motion, print mode
 *  - axe-core accessibility audit
 *  - every external link responds
 * Screenshots go to OUT_DIR (default: ./.smoke).
 *
 * Usage: npm run build && node scripts/smoke-test.mjs
 */
import puppeteer from "puppeteer-core";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(process.env.OUT_DIR ?? resolve(root, ".smoke"));
mkdirSync(OUT, { recursive: true });
const PORT = 4181;
const BASE = `http://127.0.0.1:${PORT}`;

const CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = CANDIDATES.find((p) => existsSync(p));
if (!executablePath) throw new Error("No Chromium browser found; set BROWSER_PATH");

const report = { pages: [], links: [], axe: [], ok: true };
const log = (...a) => console.log(...a);

const preview = spawn(process.execPath, [resolve(root, "node_modules", "vite", "bin", "vite.js"), "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { cwd: root, stdio: "ignore" });
async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("preview not up");
}

function attach(page, entry) {
  page.on("console", (msg) => {
    const type = msg.type();
    const url = msg.location()?.url ?? "";
    if (url.includes("api.github.com")) return; // unauthenticated rate limit (403) is expected in CI runs
    if (type === "error" || type === "warning") entry.console.push({ type, text: msg.text().slice(0, 500) });
  });
  page.on("pageerror", (err) => entry.pageErrors.push(String(err).slice(0, 500)));
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (url.startsWith(BASE)) entry.failedRequests.push({ url, reason: req.failure()?.errorText });
  });
}

async function scrollThrough(page, steps = 14, delay = 350) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (height * i) / steps);
    await new Promise((r) => setTimeout(r, delay));
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await new Promise((r) => setTimeout(r, 400));
}

/** Viewport screenshots at each section (fixed/sticky layers make fullPage captures unreliable). */
async function fullPageShot(page, name) {
  const ids = ["home", "about", "stack", "work", "experience", "activity", "resume", "services", "contact"];
  for (const id of ids) {
    const ok = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ behavior: "instant", block: "start" });
      if (id !== "home") window.scrollBy(0, -20);
      return true;
    }, id);
    if (!ok) continue;
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: resolve(OUT, `${name}-${id}.png`) });
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
}

async function runViewport(browser, { name, width, height, mobile = false, reducedMotion = false }) {
  const entry = { name, console: [], pageErrors: [], failedRequests: [], checks: {} };
  const page = await browser.newPage();
  attach(page, entry);
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  if (reducedMotion) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3600)); // cinematic opening
  entry.checks.heroTitle = await page.$eval("#hero-title", (el) => el.textContent?.trim()).catch(() => null);
  entry.checks.canvasInHero = await page.$("canvas").then(Boolean);
  entry.checks.overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  entry.checks.overflowers = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 2 || r.left < -2) {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed") continue;
        out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
      if (out.length >= 8) break;
    }
    return out;
  });
  await scrollThrough(page);
  await fullPageShot(page, `${name}-full`);

  // Project detail flow
  await page.evaluate(() => document.getElementById("work")?.scrollIntoView({ behavior: "instant", block: "start" }));
  await new Promise((r) => setTimeout(r, 800));
  await page.click("#work article");
  await new Promise((r) => setTimeout(r, 1500));
  entry.checks.detailOpen = await page.$("[role='dialog'][aria-modal='true']").then(Boolean);
  entry.checks.detailHash = await page.evaluate(() => location.hash);
  await page.screenshot({ path: resolve(OUT, `${name}-detail.png`) });
  await page.keyboard.press("ArrowRight");
  await new Promise((r) => setTimeout(r, 900));
  entry.checks.detailNextTitle = await page.$eval("[role='dialog'] h2", (el) => el.textContent?.trim()).catch(() => null);
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 1600));
  entry.checks.detailClosed = !(await page.$("[role='dialog'][aria-modal='true']"));
  entry.checks.hashCleared = await page.evaluate(() => location.hash);

  // Identity scene process diagram + skill chip interaction
  await page.evaluate(() => document.getElementById("about")?.scrollIntoView({ behavior: "instant", block: "center" }));
  await new Promise((r) => setTimeout(r, 800));
  entry.checks.approachDiagram = await page.$("#about svg path").then(Boolean);
  await page.evaluate(() => {
    document.getElementById("stack")?.scrollIntoView({ behavior: "instant", block: "start" });
    const chip = document.querySelector("#stack button[aria-pressed]");
    chip?.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  entry.checks.skillChipOpened = await page.$eval("#stack button[aria-pressed='true']", (el) => el.textContent?.trim()).catch(() => null);

  // Fullscreen menu (all widths)
  {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await new Promise((r) => setTimeout(r, 400));
    entry.checks.menuButtonRect = await page.$eval("button[aria-controls='site-menu']", (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), display: cs.display, visibility: cs.visibility, opacity: cs.opacity };
    });
    try {
      await page.click("button[aria-controls='site-menu']");
    } catch (e) {
      entry.checks.menuClickError = String(e).slice(0, 120);
      await page.$eval("button[aria-controls='site-menu']", (el) => el.click());
    }
    await new Promise((r) => setTimeout(r, 600));
    entry.checks.mobileMenu = await page.$("#site-menu").then(Boolean);
    await page.screenshot({ path: resolve(OUT, `${name}-menu.png`) });
    await page.keyboard.press("Escape");
  }

  // Resume + contact visible
  entry.checks.resumePaper = await page.$(".resume-paper h1").then(Boolean);
  entry.checks.contactForm = await page.$("#contact form").then(Boolean);
  entry.checks.githubSection = await page.$eval("#activity", (el) => el.textContent?.includes("Public repos")).catch(() => false);

  // Direct deep link
  await page.goto(`${BASE}/#project=ebani`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 4200));
  entry.checks.deepLinkTitle = await page.$eval("[role='dialog'] h2", (el) => el.textContent?.trim()).catch(() => null);

  await page.close();
  report.pages.push(entry);
  return entry;
}

async function runAxe(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 3600));
  await scrollThrough(page, 10, 150);
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const results = await page.evaluate(async () => {
    // @ts-ignore
    const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"], rules: { "color-contrast": { enabled: true } } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(" ")) , count: v.nodes.length }));
  });
  report.axe = results;
  await page.close();
}

async function runNoWebGL() {
  const b = await puppeteer.launch({ executablePath, headless: "new", args: ["--disable-3d-apis", "--disable-gpu", "--no-sandbox"] });
  const entry = { name: "no-webgl", console: [], pageErrors: [], failedRequests: [], checks: {} };
  const page = await b.newPage();
  attach(page, entry);
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 3600));
  entry.checks.canvasInHero = await page.$("canvas").then(Boolean);
  entry.checks.svgFallback = await page.$("svg polygon").then(Boolean);
  await scrollThrough(page, 8, 200);
  entry.checks.deviceFallbackImgs = (await page.$$("#work img[src^='data:image/png']")).length;
  await page.screenshot({ path: resolve(OUT, "no-webgl.png") });
  await page.close();
  await b.close();
  report.pages.push(entry);
}

async function runPrint(browser) {
  const entry = { name: "print", console: [], pageErrors: [], failedRequests: [], checks: {} };
  const page = await browser.newPage();
  attach(page, entry);
  await page.setViewport({ width: 900, height: 1200 });
  await page.goto(`${BASE}/?print=resume`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 800));
  entry.checks.printRoot = await page.$("#resume-print-root .resume-paper").then(Boolean);
  entry.checks.noNav = !(await page.$("nav"));
  await page.screenshot({ path: resolve(OUT, "print-resume.png"), fullPage: true });
  await page.close();
  report.pages.push(entry);
}

async function checkLinks(browser) {
  const page = await browser.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 3600));
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")));
  // include links only present inside project detail / data
  const data = await import(resolve(root, "build", "links.json").replace(/\\/g, "/")).catch(() => null);
  const set = new Set(hrefs.filter(Boolean));
  if (data?.default) data.default.forEach((h) => set.add(h));
  await page.close();
  for (const href of set) {
    if (href.startsWith("mailto:") || href.startsWith("#") || href.startsWith("tel:")) continue;
    const url = href.startsWith("http") ? href : `${BASE}${href}`;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      let res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (portfolio-link-check)" } });
      clearTimeout(t);
      report.links.push({ href, status: res.status });
    } catch (e) {
      report.links.push({ href, status: "ERR", error: String(e).slice(0, 120) });
    }
  }
}

try {
  await waitFor(`${BASE}/`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox", "--disable-dev-shm-usage"],
  });
  await runViewport(browser, { name: "desktop", width: 1440, height: 900 });
  await runViewport(browser, { name: "tablet", width: 834, height: 1112, mobile: true });
  await runViewport(browser, { name: "mobile", width: 390, height: 844, mobile: true });
  await runViewport(browser, { name: "mobile-reduced-motion", width: 390, height: 844, mobile: true, reducedMotion: true });
  // Breakpoint sweep: overflow + screenshots only
  for (const [w, h, mobile] of [[320, 568, true], [375, 667, true], [414, 896, true], [768, 1024, true], [1024, 768, false], [1280, 800, false], [1920, 1080, false], [2560, 1440, false]]) {
    const entry = { name: `bp-${w}`, console: [], pageErrors: [], failedRequests: [], checks: {} };
    const page = await browser.newPage();
    attach(page, entry);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3600));
    await scrollThrough(page, 10, 200);
    entry.checks.overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    entry.checks.minFont = await page.evaluate(() => {
      let min = 99;
      for (const el of document.querySelectorAll("main p, main span, main li, main a, main button, main dd, main dt")) {
        if (!el.textContent?.trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        min = Math.min(min, parseFloat(getComputedStyle(el).fontSize));
      }
      return min;
    });
    for (const id of ["home", "about", "work", "contact"]) {
      await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" }), id);
      await new Promise((r) => setTimeout(r, 700));
      await page.screenshot({ path: resolve(OUT, `bp-${w}-${id}.png`) });
    }
    await page.close();
    report.pages.push(entry);
  }
  await runPrint(browser);
  await runAxe(browser);
  await checkLinks(browser);
  await browser.close();
  await runNoWebGL();
} finally {
  preview.kill();
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {}
  }
}

for (const p of report.pages) {
  const bad = p.pageErrors.length + p.failedRequests.length + p.console.filter((c) => c.type === "error").length;
  if (bad) report.ok = false;
  log(`\n== ${p.name}: errors=${p.pageErrors.length} consoleErrors=${p.console.filter((c) => c.type === "error").length} warnings=${p.console.filter((c) => c.type === "warning").length} failedReq=${p.failedRequests.length}`);
  log("   checks:", JSON.stringify(p.checks));
  p.pageErrors.forEach((e) => log("   PAGEERROR:", e));
  p.console.forEach((c) => log(`   ${c.type.toUpperCase()}:`, c.text));
  p.failedRequests.forEach((f) => log("   FAILED:", f.url, f.reason));
}
log("\n== axe violations:", report.axe.length);
report.axe.forEach((v) => log(`   [${v.impact}] ${v.id} (${v.count}): ${v.help} -> ${v.nodes.join(" | ")}`));
log("\n== links:");
report.links.forEach((l) => log(`   ${l.status}  ${l.href}${l.error ? "  " + l.error : ""}`));
writeFileSync(resolve(OUT, "report.json"), JSON.stringify(report, null, 2));
log(`\nScreenshots + report.json in ${OUT}`);
process.exit(report.ok ? 0 : 1);
