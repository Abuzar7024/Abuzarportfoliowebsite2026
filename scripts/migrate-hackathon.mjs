/**
 * Applies db/001_hackathon_event.sql and provisions the least-privilege `aih_app`
 * database role used by the server.
 *
 * Usage:  node scripts/migrate-hackathon.mjs
 * Needs:  SUPABASE_DB_PASSWORD (admin, used only by this script) in .env.local or the environment.
 * Output: writes DATABASE_URL (aih_app credentials) to .env.local if it is not set yet.
 *         The password is never printed.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import postgres from "postgres";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function readEnvFile() {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const env = { ...readEnvFile(), ...process.env };
const adminPassword = env.SUPABASE_DB_PASSWORD;
const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
const ref = (supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
if (!adminPassword || !ref) {
  console.error("SUPABASE_DB_PASSWORD and SUPABASE_URL are required.");
  process.exit(1);
}

const admin = postgres({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: adminPassword,
  ssl: "require",
  max: 1,
});

async function main() {
  const ddl = fs.readFileSync(path.join(root, "db", "001_hackathon_event.sql"), "utf8");
  await admin.unsafe(ddl);

  const existingUrl = env.DATABASE_URL;
  const appPassword = existingUrl ? null : crypto.randomBytes(24).toString("hex");

  const roleExists = (await admin`select 1 from pg_roles where rolname = 'aih_app'`).length > 0;
  if (!roleExists) {
    const pw = appPassword ?? crypto.randomBytes(24).toString("hex");
    await admin.unsafe(`create role aih_app login password '${pw}' nosuperuser nocreatedb nocreaterole nobypassrls`);
    if (!existingUrl) {
      const url = `postgresql://aih_app:${pw}@db.${ref}.supabase.co:5432/postgres`;
      fs.appendFileSync(envPath, `\n# Least-privilege DB role for the National AI Hackathon API (server-only)\nDATABASE_URL=${url}\n`);
      console.log("Created role aih_app and wrote DATABASE_URL to .env.local");
    } else {
      await admin.unsafe(`alter role aih_app password '${pw}'`);
      console.log("Created role aih_app. Update DATABASE_URL manually (existing value does not match a new role).");
    }
  } else if (!existingUrl) {
    const pw = crypto.randomBytes(24).toString("hex");
    await admin.unsafe(`alter role aih_app password '${pw}'`);
    const url = `postgresql://aih_app:${pw}@db.${ref}.supabase.co:5432/postgres`;
    fs.appendFileSync(envPath, `\n# Least-privilege DB role for the National AI Hackathon API (server-only)\nDATABASE_URL=${url}\n`);
    console.log("Reset aih_app password and wrote DATABASE_URL to .env.local");
  }

  const tables = [
    "hk_content", "hk_announcements", "hk_admin_users", "hk_teams", "hk_participants",
    "hk_payments", "hk_payment_events", "hk_refunds", "hk_change_requests", "hk_audit_logs",
  ];
  await admin.unsafe(`grant usage on schema public to aih_app`);
  for (const t of tables) {
    await admin.unsafe(`grant select, insert, update, delete on public.${t} to aih_app`);
    await admin.unsafe(`drop policy if exists aih_app_all on public.${t}`);
    await admin.unsafe(`create policy aih_app_all on public.${t} for all to aih_app using (true) with check (true)`);
  }
  await admin.unsafe(`grant usage, select on all sequences in schema public to aih_app`);
  // Explicitly make sure anon / authenticated cannot touch these tables.
  for (const t of tables) {
    await admin.unsafe(`revoke all on public.${t} from anon, authenticated`);
  }
  // Audit and payment-event logs are append-only for the app role.
  await admin.unsafe(`revoke update, delete on public.hk_audit_logs from aih_app`);
  await admin.unsafe(`revoke update, delete on public.hk_payment_events from aih_app`);

  console.log("Hackathon schema ready.");
  await admin.end();
}

main().catch(async (e) => {
  console.error("Migration failed:", e.message);
  await admin.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
});
