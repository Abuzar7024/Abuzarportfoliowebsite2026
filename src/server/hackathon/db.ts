import postgres from "postgres";
import { ensureEnvLoaded } from "../payu";

export type Sql = ReturnType<typeof postgres>;
export type Tx = postgres.TransactionSql & Sql;

let client: Sql | null = null;

export function hasDatabaseUrl(): boolean {
  ensureEnvLoaded();
  return Boolean((process.env.DATABASE_URL || "").trim());
}

/**
 * Normalizes direct Supabase IPv6-only DB URLs (`db.<ref>.supabase.co`) to the
 * IPv4-compatible Supabase Session Pooler (`aws-0-ap-northeast-1.pooler.supabase.com:5432`)
 * so Vercel IPv4 serverless functions can connect reliably.
 */
function normalizeDatabaseUrl(rawUrl: string): string {
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
    // Keep original URL if parsing fails
  }
  return rawUrl;
}

/**
 * Lazily creates the server-side Postgres client.
 * DATABASE_URL must use the least-privilege `aih_app` role (see scripts/migrate-hackathon.mjs).
 * On serverless hosts without IPv6 use the Supabase pooler connection string.
 */
export function getSql(): Sql {
  ensureEnvLoaded();
  const rawUrl = (process.env.DATABASE_URL || "").trim();
  if (!rawUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }
  const url = normalizeDatabaseUrl(rawUrl);
  if (!client) {
    client = postgres(url, {
      ssl: "require",
      max: process.env.VERCEL ? 1 : 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      onnotice: () => {},
    });
  }
  return client;
}

export async function closeSql(): Promise<void> {
  if (client) {
    await client.end({ timeout: 2 });
    client = null;
  }
}
