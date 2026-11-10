import postgres from "postgres";
import { ensureEnvLoaded } from "../payu";

export type Sql = ReturnType<typeof postgres>;
export type Tx = postgres.TransactionSql & Sql;

let client: Sql | null = null;

/**
 * Lazily creates the server-side Postgres client.
 * DATABASE_URL must use the least-privilege `aih_app` role (see scripts/migrate-hackathon.mjs).
 * On serverless hosts without IPv6 use the Supabase pooler connection string.
 */
export function getSql(): Sql {
  ensureEnvLoaded();
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!client) {
    client = postgres(url, {
      ssl: "require",
      max: process.env.VERCEL ? 1 : 5,
      idle_timeout: 20,
      connect_timeout: 15,
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
