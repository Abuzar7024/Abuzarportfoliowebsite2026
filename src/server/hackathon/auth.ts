import type { IncomingMessage } from "node:http";
import { ensureEnvLoaded } from "../payu";
import { HttpError } from "./http";
import { getSql } from "./db";

export interface AuthUser {
  email: string;
}

export type TokenVerifier = (accessToken: string) => Promise<AuthUser | null>;

/**
 * Verifies a Supabase Auth access token by asking Supabase's Auth server who it belongs to.
 * Only users with a confirmed email are accepted.
 */
export const verifySupabaseAccessToken: TokenVerifier = async (accessToken) => {
  ensureEnvLoaded();
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();
  if (!url || !key) throw new HttpError(500, "SERVER_MISCONFIGURED", "Authentication is not configured.");
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { email?: string; email_confirmed_at?: string | null; confirmed_at?: string | null };
    if (!user.email || !(user.email_confirmed_at || user.confirmed_at)) return null;
    return { email: user.email.trim().toLowerCase() };
  } catch {
    return null;
  }
};

export function bearerToken(req: IncomingMessage): string {
  const h = (req.headers.authorization || "").trim();
  const m = /^Bearer\s+([A-Za-z0-9._~+/=-]{20,4000})$/.exec(h);
  return m ? m[1] : "";
}

export async function requireUser(req: IncomingMessage, verify: TokenVerifier): Promise<AuthUser> {
  const token = bearerToken(req);
  if (!token) throw new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  const user = await verify(token);
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Your session is invalid or has expired. Please sign in again.");
  return user;
}

export type AdminRole = "ADMIN" | "VIEWER";

export async function adminRoleFor(email: string): Promise<AdminRole | null> {
  ensureEnvLoaded();
  const envAdmins = (process.env.HACKATHON_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (envAdmins.includes(email)) return "ADMIN";
  const sql = getSql();
  const rows = await sql<{ role: AdminRole }[]>`select role from hk_admin_users where email = ${email}`;
  return rows[0]?.role ?? null;
}

export async function requireAdmin(
  req: IncomingMessage,
  verify: TokenVerifier,
  opts: { write: boolean }
): Promise<{ email: string; role: AdminRole }> {
  const user = await requireUser(req, verify);
  const role = await adminRoleFor(user.email);
  if (!role) throw new HttpError(403, "FORBIDDEN", "You do not have access to this area.");
  if (opts.write && role !== "ADMIN") throw new HttpError(403, "FORBIDDEN", "Your role is read-only.");
  return { email: user.email, role };
}
