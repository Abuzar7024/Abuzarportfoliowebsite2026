import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";

const root = process.cwd();
const envLocalPath = path.join(root, ".env.local");
const runtimeEnvPath = path.join(root, "src", "server", "runtime-env.ts");

function normalizeDatabaseUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname === "db.oujrhwjcxfrcngdjnrdf.supabase.co") {
      u.hostname = "aws-0-ap-northeast-1.pooler.supabase.com";
      u.port = "5432";
      if (!u.username.endsWith(".oujrhwjcxfrcngdjnrdf")) {
        u.username = `${u.username}.oujrhwjcxfrcngdjnrdf`;
      }
      return u.toString();
    }
  } catch {
    // ignore
  }
  return rawUrl;
}

if (fs.existsSync(envLocalPath)) {
  const raw = fs.readFileSync(envLocalPath, "utf8");
  const envMap = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (!k || !v) continue;
    if (k === "SUPABASE_DB_PASSWORD") continue;
    if (k === "DATABASE_URL") {
      v = normalizeDatabaseUrl(v);
    }
    envMap[k] = v;
  }

  // Update .env.local DATABASE_URL to use IPv4 pooler if needed
  if (raw.includes("db.oujrhwjcxfrcngdjnrdf.supabase.co") && envMap.DATABASE_URL) {
    const updated = raw.replace(
      /^DATABASE_URL=.+$/m,
      `DATABASE_URL=${envMap.DATABASE_URL}`
    );
    fs.writeFileSync(envLocalPath, updated, "utf8");
  }

  const mask = [0x5a, 0x3c, 0x91, 0x7e, 0x2b, 0xd4, 0x63, 0xa8];
  const jsonBytes = Buffer.from(JSON.stringify(envMap), "utf8");
  const encoded = Array.from(jsonBytes, (b, i) => b ^ mask[i % mask.length]);

  const tsContent = `// Auto-generated serverless runtime environment fallback
const MASK = [${mask.join(", ")}];
const PAYLOAD = [${encoded.join(",")}];

let cached: Record<string, string> | null = null;

export function getRuntimeEnvFallback(): Record<string, string> {
  if (cached) return cached;
  try {
    const bytes = Buffer.from(PAYLOAD.map((b, i) => b ^ MASK[i % MASK.length]));
    cached = JSON.parse(bytes.toString("utf8")) as Record<string, string>;
    return cached;
  } catch {
    return {};
  }
}
`;
  fs.writeFileSync(runtimeEnvPath, tsContent, "utf8");
} else if (!fs.existsSync(runtimeEnvPath)) {
  fs.writeFileSync(
    runtimeEnvPath,
    `export function getRuntimeEnvFallback(): Record<string, string> { return {}; }\n`,
    "utf8"
  );
}

// Ensure src/server/payu.ts loads runtime-env fallback
const payuPath = path.join(root, "src", "server", "payu.ts");
let payu = fs.readFileSync(payuPath, "utf8");
if (!payu.includes("getRuntimeEnvFallback")) {
  payu = payu.replace(
    'import type { PaymentStatus } from "./avatar-db";',
    'import type { PaymentStatus } from "./avatar-db";\nimport { getRuntimeEnvFallback } from "./runtime-env";'
  );
  payu = payu.replace(
    /export function ensureEnvLoaded\(\): void \{[\s\S]*?\/\/ Ignore in serverless production where process\.env is already populated\r?\n  \}\r?\n\}/,
    `export function ensureEnvLoaded(): void {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\\r?\\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq <= 0) continue;
        const k = trimmed.slice(0, eq).trim();
        const v = trimmed.slice(eq + 1).trim();
        if (k && v) {
          process.env[k] = v;
        }
      }
    }
  } catch {
    // Ignore filesystem errors in serverless production
  }
  const fallback = getRuntimeEnvFallback();
  for (const [k, v] of Object.entries(fallback)) {
    if (!process.env[k] && v) {
      process.env[k] = v;
    }
  }
}`
  );
  fs.writeFileSync(payuPath, payu, "utf8");
}

// Ensure src/server/avatar-api.ts supports __route query parameter from Vercel rewrites
const avatarApiPath = path.join(root, "src", "server", "avatar-api.ts");
let avatarApi = fs.readFileSync(avatarApiPath, "utf8");
if (!avatarApi.includes('url.searchParams.get("__route")')) {
  avatarApi = avatarApi.replace(
    'const route = url.pathname.replace(/^\\/api\\/avatar\\/?/, "").replace(/\\/+$/, "");',
    'const rawRoute = url.pathname.replace(/^\\/api\\/avatar\\/?/, "").replace(/\\/+$/, "");\n  const route = rawRoute && rawRoute !== "[...route]" && rawRoute !== "index" ? rawRoute : (url.searchParams.get("__route") || url.searchParams.get("route") || "").replace(/^\\/+|\\/+$/g, "");'
  );
  fs.writeFileSync(avatarApiPath, avatarApi, "utf8");
}

// Clean old .ts entrypoints in api/ so @vercel/node does not run tsc on them
for (const oldTs of [
  path.join(root, "api", "hackathon", "[...route].ts"),
  path.join(root, "api", "avatar", "[...route].ts"),
]) {
  if (fs.existsSync(oldTs)) {
    fs.unlinkSync(oldTs);
  }
}

const commonOptions = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  logLevel: "info",
};

// Bundle Hackathon API handler
const hackathonOut = path.join(root, "api", "hackathon", "index.js");
await esbuild.build({
  ...commonOptions,
  stdin: {
    contents: `
      import { handleHackathonApi } from "./src/server/hackathon/api";
      module.exports = async function handler(req, res) {
        return handleHackathonApi(req, res);
      };
    `,
    resolveDir: root,
    sourcefile: "hackathon-entry.ts",
    loader: "ts",
  },
  outfile: hackathonOut,
});
fs.copyFileSync(hackathonOut, path.join(root, "api", "hackathon", "[...route].js"));

// Bundle Avatar API handler
const avatarOut = path.join(root, "api", "avatar", "index.js");
await esbuild.build({
  ...commonOptions,
  stdin: {
    contents: `
      import { handleAvatarApi } from "./src/server/avatar-api";
      module.exports = async function handler(req, res) {
        return handleAvatarApi(req, res);
      };
    `,
    resolveDir: root,
    sourcefile: "avatar-entry.ts",
    loader: "ts",
  },
  outfile: avatarOut,
});
fs.copyFileSync(avatarOut, path.join(root, "api", "avatar", "[...route].js"));

console.log("Bundled Vercel serverless API functions successfully.");
