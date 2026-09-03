/** Verifies the deployed site: console errors, overflow, 3D, project count. Usage: OUT=<dir> node scripts/livecheck.mjs */
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const URL_ = process.env.SITE ?? "https://abuzar7024.github.io/Abuzarportfoliowebsite2026/";
const OUT = process.env.OUT ?? ".";
const exe = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
].filter(Boolean).find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: "new",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});

for (const [name, w, h, mobile] of [["desktop", 1440, 900, false], ["mobile", 390, 844, true]]) {
  const page = await browser.newPage();
  const errs = [];
  const fails = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 140)));
  page.on("console", (m) => {
    if (m.type() === "error" && !(m.location()?.url || "").includes("api.github.com")) errs.push(m.text().slice(0, 140));
  });
  page.on("requestfailed", (r) => fails.push(r.url().slice(-70)));

  await page.setViewport({ width: w, height: h, isMobile: mobile, hasTouch: mobile });
  await page.goto(URL_, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4200));

  const title = await page.$eval("#hero-title", (el) => el.textContent.trim()).catch(() => null);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const canvas = await page.$("canvas").then(Boolean);
  await page.evaluate(() => document.getElementById("work")?.scrollIntoView());
  await new Promise((r) => setTimeout(r, 1500));
  const projects = await page.$$eval("#work article", (n) => n.length);
  await page.screenshot({ path: `${OUT}/live-${name}.png` });

  console.log(`${name}: title=${JSON.stringify(title)} overflow=${overflow} canvas=${canvas} projects=${projects} errors=${errs.length} failedReq=${fails.length}`);
  errs.slice(0, 3).forEach((e) => console.log("   ERR:", e));
  fails.slice(0, 3).forEach((f) => console.log("   FAIL:", f));
  await page.close();
}

await browser.close();
