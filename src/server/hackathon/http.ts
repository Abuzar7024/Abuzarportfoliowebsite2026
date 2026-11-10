import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

// ── Rate limiting (per instance; sliding window) ─────────────────────────────
const windows = new Map<string, number[]>();

export function clientIp(req: IncomingMessage): string {
  const fwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return fwd || req.socket?.remoteAddress || "local";
}

/** Throws 429 when `max` requests per `windowMs` are exceeded for ip+bucket. */
export function rateLimit(req: IncomingMessage, bucket: string, max: number, windowMs: number): void {
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const active = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (active.length >= max) {
    windows.set(key, active);
    throw new HttpError(429, "RATE_LIMITED", "Too many requests. Please wait a moment and try again.");
  }
  active.push(now);
  windows.set(key, active);
  // Opportunistic cleanup so the map cannot grow without bound.
  if (windows.size > 5000) {
    for (const [k, v] of windows) {
      if (!v.some((t) => now - t < windowMs)) windows.delete(k);
    }
  }
}

export function resetRateLimits(): void {
  windows.clear();
}

// ── Request helpers ──────────────────────────────────────────────────────────
export function requestOrigin(req: IncomingMessage): string {
  const configured = (process.env.SITE_URL || process.env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() || "http";
  const host =
    (req.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim() ||
    req.headers.host ||
    "localhost:3000";
  return `${proto}://${host}`;
}

export function isLocalOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

const MAX_BODY_BYTES = 256 * 1024;

export async function readRawBody(req: IncomingMessage): Promise<string> {
  const anyReq = req as IncomingMessage & { body?: unknown };
  if (typeof anyReq.body === "string") return anyReq.body;
  if (anyReq.body && typeof anyReq.body === "object" && !Buffer.isBuffer(anyReq.body)) {
    return JSON.stringify(anyReq.body);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c) => {
      const buf = Buffer.isBuffer(c) ? c : Buffer.from(c);
      size += buf.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, "PAYLOAD_TOO_LARGE", "Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await readRawBody(req);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    throw new HttpError(400, "BAD_JSON", "Request body must be valid JSON.");
  }
}

/** Parses either JSON or application/x-www-form-urlencoded (PayU callbacks). */
export async function readParams(req: IncomingMessage): Promise<Record<string, string>> {
  const anyReq = req as IncomingMessage & { body?: unknown };
  const out: Record<string, string> = {};
  if (anyReq.body && typeof anyReq.body === "object" && !Buffer.isBuffer(anyReq.body)) {
    for (const [k, v] of Object.entries(anyReq.body as Record<string, unknown>)) out[k] = v == null ? "" : String(v);
    return out;
  }
  const raw = await readRawBody(req);
  if (!raw) return out;
  if ((req.headers["content-type"] || "").toLowerCase().includes("application/json")) {
    try {
      for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, unknown>)) out[k] = v == null ? "" : String(v);
    } catch {
      /* ignore */
    }
    return out;
  }
  new URLSearchParams(raw).forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

// ── Responses ────────────────────────────────────────────────────────────────
export function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
}

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function sendText(res: ServerResponse, status: number, contentType: string, body: string, filename?: string): void {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  if (filename) res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.end(body);
}

export function redirect(res: ServerResponse, location: string): void {
  setSecurityHeaders(res);
  res.statusCode = 303;
  res.setHeader("Location", location);
  res.end();
}

// ── Signed, expiring tokens (HMAC-SHA256) ────────────────────────────────────
function signingSecret(): string {
  const s = (
    process.env.HACKATHON_SIGNING_SECRET ||
    process.env.AVATAR_SIGNING_SECRET ||
    process.env.PAYU_MERCHANT_SALT ||
    ""
  ).trim();
  if (!s) throw new HttpError(500, "SERVER_MISCONFIGURED", "Server signing secret is not configured.");
  return s;
}

export type TokenKind = "team" | "pay";

export function issueToken(kind: TokenKind, subject: string, ttlMs: number): string {
  const payload = Buffer.from(JSON.stringify({ k: kind, s: subject, e: Date.now() + ttlMs }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Returns the subject if the token is authentic, unexpired and of the expected kind. */
export function readToken(token: string | undefined | null, kind: TokenKind): string | null {
  if (!token || typeof token !== "string" || token.length > 600 || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { k: string; s: string; e: number };
    if (data.k !== kind || typeof data.s !== "string" || typeof data.e !== "number" || data.e < Date.now()) return null;
    return data.s;
  } catch {
    return null;
  }
}
