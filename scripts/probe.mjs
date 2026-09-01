/** Quick layout probe: reports elements inside #stack wider than the viewport at 390px. */
import puppeteer from "puppeteer-core";
import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4187;
const BASE = `http://127.0.0.1:${PORT}`;
const executablePath = [process.env.BROWSER_PATH, "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].filter(Boolean).find((p) => existsSync(p));
const preview = spawn(process.execPath, [resolve(root, "node_modules", "vite", "bin", "vite.js"), "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"], { cwd: root, stdio: "ignore" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {}
  await wait(500);
}
try {
  const browser = await puppeteer.launch({ executablePath, headless: "new", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await wait(3800);
  await page.evaluate(() => document.getElementById("stack")?.scrollIntoView({ behavior: "instant" }));
  await wait(1200);
  const out = await page.evaluate(() => {
    const vw = window.innerWidth;
    const rows = [];
    const sec = document.getElementById("stack");
    if (!sec) return ["no #stack"];
    for (const el of sec.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width > vw + 1 || r.right > vw + 1) {
        const cs = getComputedStyle(el);
        rows.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 4).join(".")} w=${Math.round(r.width)} right=${Math.round(r.right)} sw=${el.scrollWidth} ws=${cs.whiteSpace} minw=${cs.minWidth}`);
      }
      if (rows.length > 14) break;
    }
    const card = sec.querySelector(".card");
    const cr = card?.getBoundingClientRect();
    rows.unshift(`viewport=${vw} sectionW=${Math.round(sec.getBoundingClientRect().width)} cardW=${cr ? Math.round(cr.width) : "-"}`);
    return rows;
  });
  console.log(out.join("\n"));
  await browser.close();
} finally {
  preview.kill();
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
    } catch {}
  }
}
