import crypto from "node:crypto";
import { canTransitionPaymentStatus, type PaymentStatus } from "../avatar-db";
import {
  generatePayURequestHash,
  getPayUConfig,
  logPaymentEvent,
  setSandboxGatewayOutcome,
  verifyPayUResponseHash,
  verifyPayUTransactionServerToServer,
  type PayUConfig,
} from "../payu";
import { computeFee, type FeeBreakdown, type PricingSettings } from "../../shared/hackathon-pricing";
import {
  isRegistrationActuallyOpen,
  mergeContent,
  type ContentKey,
  type HackathonContent,
} from "../../shared/hackathon-content";
import type { NormalizedTeam } from "../../shared/hackathon-validation";
import { getSql, hasDatabaseUrl, type Sql, type Tx } from "./db";
import {
  encodeStatelessTeamId,
  fallbackApplyPaymentOutcome,
  fallbackCreatePayment,
  fallbackGetMembers,
  fallbackGetOpenPaymentForTeam,
  fallbackGetPayment,
  fallbackGetTeam,
  fallbackHydrateFromCallbackPayload,
  fallbackRegisterTeam,
  fallbackStats,
  resolveFallbackTeamId,
} from "./fallback-store";
import { HttpError } from "./http";

// ── Types ────────────────────────────────────────────────────────────────────
export interface TeamRow {
  id: string;
  team_code: string | null;
  name: string;
  mode: "ONLINE" | "PHYSICAL";
  city: string;
  state: string;
  organisation: string | null;
  referral_code: string | null;
  member_count: number;
  status: "PENDING_PAYMENT" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
  emails_sent_at: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface ParticipantRow {
  id: string;
  team_id: string;
  registration_code: string | null;
  is_leader: boolean;
  full_name: string;
  email: string;
  email_norm: string;
  mobile: string;
  organisation: string | null;
  course: string | null;
  city: string | null;
  state: string | null;
  github: string | null;
  linkedin: string | null;
  skills: string | null;
}

export interface PaymentRow {
  id: string;
  team_id: string;
  txnid: string;
  member_count: number;
  fee_per_person: number;
  subtotal_inr: number;
  tax_inr: number;
  amount_inr: number;
  status: PaymentStatus;
  environment: "production" | "test" | "sandbox";
  payu_mihpayid: string | null;
  failure_reason: string | null;
  needs_review: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

const NOT_FOUND_AT_GATEWAY = new Set(["not_found_yet", "pending_gateway_confirmation", "verify_timeout_pending"]);
const IN_PROGRESS_GRACE_MS = 3 * 60 * 1000;
const STALE_INITIATED_MS = 30 * 60 * 1000;

// ── Content ──────────────────────────────────────────────────────────────────
let contentCache: { at: number; value: HackathonContent } | null = null;

export function invalidateContentCache(): void {
  contentCache = null;
}

export async function loadContent(opts?: { fresh?: boolean }): Promise<{ content: HackathonContent; degraded: boolean }> {
  if (!opts?.fresh && contentCache && Date.now() - contentCache.at < 10_000) {
    return { content: contentCache.value, degraded: false };
  }
  if (!hasDatabaseUrl()) {
    return { content: mergeContent({}), degraded: false };
  }
  try {
    const sql = getSql();
    const rows = await sql<{ key: ContentKey; value: unknown }[]>`select key, value from hk_content`;
    const overrides: Partial<Record<ContentKey, unknown>> = {};
    for (const r of rows) overrides[r.key] = r.value;
    const value = mergeContent(overrides);
    contentCache = { at: Date.now(), value };
    return { content: value, degraded: false };
  } catch {
    return { content: mergeContent({}), degraded: false };
  }
}

export function pricingFrom(content: HackathonContent): PricingSettings {
  return {
    feePerPerson: content.settings.feePerPerson,
    minTeamSize: 1,
    maxTeamSize: Math.min(content.settings.maxTeamSize || 15, 15),
    tax: content.settings.tax,
  };
}

export async function audit(sql: Sql, actor: string, action: string, entity: string, entityId: string | null, detail: Record<string, unknown> = {}): Promise<void> {
  await sql`insert into hk_audit_logs (actor, action, entity, entity_id, detail)
            values (${actor}, ${action}, ${entity}, ${entityId}, ${sql.json(detail as never)})`;
}

async function paymentEvent(sql: Sql | null, txnid: string, event: string, status: string | null, source: string, detail: Record<string, unknown> = {}): Promise<void> {
  if (!sql) return;
  await sql`insert into hk_payment_events (txnid, event, status, source, detail)
            values (${txnid}, ${event}, ${status}, ${source}, ${sql.json(detail as never)})`.catch(() => {});
}

// ── Stats ────────────────────────────────────────────────────────────────────
export async function publicStats(content: HackathonContent) {
  if (!hasDatabaseUrl()) {
    return fallbackStats(content.settings.maxParticipants, content.settings.targetParticipants);
  }
  try {
    const sql = getSql();
    const [row] = await sql<{ participants: number; teams: number }[]>`
      select count(p.id)::int as participants, count(distinct t.id)::int as teams
      from hk_teams t join hk_participants p on p.team_id = t.id
      where t.status = 'CONFIRMED' and p.active`;
    const confirmed = row?.participants ?? 0;
    return {
      confirmedParticipants: confirmed,
      confirmedTeams: row?.teams ?? 0,
      targetParticipants: content.settings.targetParticipants,
      maxParticipants: content.settings.maxParticipants,
      remainingToMax: Math.max(0, content.settings.maxParticipants - confirmed),
    };
  } catch {
    return fallbackStats(content.settings.maxParticipants, content.settings.targetParticipants);
  }
}

// ── Registration (team + participants) ───────────────────────────────────────
function mapUnique(e: unknown): HttpError | null {
  const err = e as { code?: string; constraint_name?: string; constraint?: string };
  if (err?.code !== "23505") return null;
  const c = err.constraint_name || err.constraint || "";
  if (c.includes("hk_teams_name_live")) return new HttpError(409, "NAME_TAKEN", "That team name is already taken. Please choose another.");
  return new HttpError(
    409,
    "ALREADY_REGISTERED",
    "One of the email addresses or mobile numbers is already registered."
  );
}

async function expireTeam(sql: Sql, teamId: string, reason: string): Promise<void> {
  await sql.begin(async (tx) => {
    const q = tx as unknown as Sql;
    await q`update hk_teams set status = 'EXPIRED', updated_at = now() where id = ${teamId} and status = 'PENDING_PAYMENT'`;
    await q`update hk_participants set active = false, updated_at = now() where team_id = ${teamId} and not exists (select 1 from hk_teams t where t.id = ${teamId} and t.status = 'CONFIRMED')`;
    await q`update hk_payments set status = 'EXPIRED', updated_at = now(), failure_reason = coalesce(failure_reason, ${reason})
            where team_id = ${teamId} and status in ('CREATED', 'INITIATED')`;
  });
}

/**
 * Settles teams that conflict with the incoming registration.
 * - confirmed team → reject
 * - unpaid team with no payment started → superseded immediately
 * - unpaid team with a payment started → reconcile with PayU first, never allow a second charge blindly
 */
async function settleConflicts(sql: Sql, team: NormalizedTeam, origin: string, sandbox: boolean): Promise<void> {
  const emails = team.members.map((m) => m.emailNorm);
  const mobiles = team.members.map((m) => m.mobile);
  const rows = await sql<{ id: string; status: string; name_hit: boolean }[]>`
    select distinct t.id, t.status, false as name_hit
    from hk_participants p join hk_teams t on t.id = p.team_id
    where p.active and (p.email_norm = any(${emails}) or p.mobile = any(${mobiles}))
    union
    select t.id, t.status, true as name_hit
    from hk_teams t where lower(t.name) = lower(${team.teamName}) and t.status in ('PENDING_PAYMENT', 'CONFIRMED')`;

  for (const r of rows) {
    if (r.status === "CONFIRMED") {
      throw r.name_hit
        ? new HttpError(409, "NAME_TAKEN", "That team name is already taken. Please choose another.")
        : mapUnique({ code: "23505", constraint_name: "hk_participants_email_live" })!;
    }
    if (r.status !== "PENDING_PAYMENT") continue;

    const [open] = await sql<PaymentRow[]>`
      select * from hk_payments where team_id = ${r.id} and status in ('CREATED', 'INITIATED', 'PENDING')
      order by created_at desc limit 1`;
    if (!open) {
      await expireTeam(sql, r.id, "superseded");
      continue;
    }
    const outcome = await reconcilePayment(open.txnid, origin, { sandbox: open.environment === "sandbox" && sandbox });
    if (outcome.payment.status === "SUCCESS") {
      throw mapUnique({ code: "23505", constraint_name: "hk_participants_email_live" })!;
    }
    if (outcome.payment.status === "PENDING") {
      throw new HttpError(409, "PAYMENT_PENDING", "A payment for this registration is still being confirmed. Please wait for it to resolve before registering again.");
    }
    if (outcome.payment.status === "INITIATED" && Date.now() - Date.parse(outcome.payment.created_at) < IN_PROGRESS_GRACE_MS) {
      throw new HttpError(409, "PAYMENT_IN_PROGRESS", "A payment for this registration was started moments ago. Please wait a few minutes before trying again.");
    }
    await expireTeam(sql, r.id, "superseded_after_reconcile");
  }
}

export async function registerTeam(
  team: NormalizedTeam,
  content: HackathonContent,
  ctx: { origin: string; sandbox: boolean }
): Promise<{ teamId: string; fee: FeeBreakdown }> {
  const state = isRegistrationActuallyOpen(content);
  if (!state.open) throw new HttpError(403, "REGISTRATION_CLOSED", state.reason ?? "Registration is closed.");
  if (team.memberCount > 15 || team.members.length > 15) {
    throw new HttpError(400, "VALIDATION", "A team can have a maximum of 15 members.", {
      memberCount: "A team can have a maximum of 15 members.",
    });
  }
  const fee = computeFee(team.memberCount, pricingFrom(content));

  if (!hasDatabaseUrl()) {
    const fb = fallbackRegisterTeam(team);
    return { teamId: fb.statelessTeamId, fee };
  }

  const sql = getSql();
  await settleConflicts(sql, team, ctx.origin, ctx.sandbox);

  try {
    const teamId = await sql.begin(async (tx) => {
      const q = tx as unknown as Sql;
      // Serialise capacity checks so concurrent registrations cannot exceed the cap.
      await q`select pg_advisory_xact_lock(7331001)`;
      const [cap] = await q<{ n: number }[]>`
        select count(*)::int as n from hk_participants p join hk_teams t on t.id = p.team_id
        where p.active and t.status in ('CONFIRMED', 'PENDING_PAYMENT')`;
      if ((cap?.n ?? 0) + team.memberCount > content.settings.maxParticipants) {
        throw new HttpError(409, "EVENT_FULL", "Registrations are full. No more places are available.");
      }
      const [t] = await q<{ id: string }[]>`
        insert into hk_teams (name, mode, city, state, organisation, referral_code, member_count, consent_at, terms_version)
        values (${team.teamName}, ${"ONLINE"}, ${""}, ${""}, ${team.organisation || null},
                ${team.referralCode || null}, ${team.memberCount}, now(), ${content.policies.terms.updatedAt ?? "draft"})
        returning id`;
      for (let i = 0; i < team.members.length; i++) {
        const m = team.members[i];
        await q`insert into hk_participants
          (team_id, is_leader, full_name, email, email_norm, mobile, organisation, course, city, state, github, linkedin, skills)
          values (${t.id}, ${i === 0}, ${m.fullName}, ${m.email}, ${m.emailNorm}, ${m.mobile}, ${m.organisation},
                  ${m.course}, ${null}, ${null}, ${m.github || null}, ${m.linkedin || null}, ${m.skills || null})`;
      }
      return t.id;
    });
    return { teamId, fee };
  } catch (e) {
    const mapped = mapUnique(e);
    if (mapped) throw mapped;
    throw e;
  }
}

// ── Payments ─────────────────────────────────────────────────────────────────
function createTxnId(): string {
  return `HK${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function safeFirstName(name: string): string {
  const first = name.split(" ")[0].replace(/[^A-Za-z]/g, "").slice(0, 30);
  return first || "Participant";
}

export interface CheckoutPayload {
  actionUrl: string;
  environment: string;
  mode: string;
  usingLocalSandbox: boolean;
  txnid: string;
  fee: { members: number; feePerPerson: number; subtotal: number; tax: number; total: number };
  fields: Record<string, string>;
}

export async function getTeam(teamId: string): Promise<TeamRow | null> {
  if (!hasDatabaseUrl() || teamId.startsWith("fkt_")) {
    return fallbackGetTeam(teamId);
  }
  try {
    const sql = getSql();
    const [t] = await sql<TeamRow[]>`select * from hk_teams where id = ${teamId}`;
    return t ?? fallbackGetTeam(teamId);
  } catch {
    return fallbackGetTeam(teamId);
  }
}

export async function getMembers(teamId: string): Promise<ParticipantRow[]> {
  if (!hasDatabaseUrl() || teamId.startsWith("fkt_")) {
    return fallbackGetMembers(teamId);
  }
  try {
    const sql = getSql();
    const rows = await sql<ParticipantRow[]>`select * from hk_participants where team_id = ${teamId} order by is_leader desc, created_at, id`;
    return rows.length > 0 ? rows : fallbackGetMembers(teamId);
  } catch {
    return fallbackGetMembers(teamId);
  }
}

export async function initiatePayment(
  teamId: string,
  content: HackathonContent,
  ctx: { origin: string; sandbox: boolean }
): Promise<{ alreadyPaid: true; team: TeamRow } | { alreadyPaid: false; checkout: CheckoutPayload }> {
  const state = isRegistrationActuallyOpen(content);
  const useDb = hasDatabaseUrl() && !teamId.startsWith("fkt_");
  const sql = useDb ? getSql() : null;
  const team = await getTeam(teamId);
  if (!team) throw new HttpError(404, "NOT_FOUND", "Registration not found.");
  if (team.status === "CONFIRMED") return { alreadyPaid: true, team };
  if (!state.open) throw new HttpError(403, "REGISTRATION_CLOSED", state.reason ?? "Registration is closed.");
  if (team.status !== "PENDING_PAYMENT") {
    throw new HttpError(409, "REGISTRATION_EXPIRED", "This registration has expired. Please start again.");
  }

  // Never allow a second payment while an earlier one is unresolved.
  const open = sql
    ? (await sql<PaymentRow[]>`
        select * from hk_payments where team_id = ${team.id} and status in ('CREATED', 'INITIATED', 'PENDING') order by created_at desc limit 1`)[0]
    : fallbackGetOpenPaymentForTeam(team.id);

  if (open) {
    const res = await reconcilePayment(open.txnid, ctx.origin, { sandbox: open.environment === "sandbox" });
    if (res.payment.status === "SUCCESS") {
      const refreshed = (await getTeam(team.id))!;
      return { alreadyPaid: true, team: refreshed };
    }
    if (res.payment.status === "PENDING") {
      throw new HttpError(409, "PAYMENT_PENDING", "Your earlier payment is still being confirmed. Please do not pay again; check the status page.");
    }
    if (res.payment.status === "INITIATED") {
      if (Date.now() - Date.parse(res.payment.created_at) < IN_PROGRESS_GRACE_MS) {
        throw new HttpError(409, "PAYMENT_IN_PROGRESS", "A payment was started moments ago. If you completed it, wait a minute and check the status page. Otherwise retry in a few minutes.");
      }
      if (sql) {
        await sql`update hk_payments set status = 'EXPIRED', updated_at = now(), failure_reason = 'superseded_by_retry'
                  where id = ${res.payment.id} and status = 'INITIATED'`;
        await paymentEvent(sql, res.payment.txnid, "SUPERSEDED", "EXPIRED", "initiate", {});
      } else {
        fallbackApplyPaymentOutcome(res.payment.txnid, { status: "EXPIRED", failureReason: "superseded_by_retry" });
      }
    }
  }

  const members = await getMembers(teamId);
  const leader = members.find((m) => m.is_leader);
  if (!leader) throw new HttpError(500, "INTEGRITY", "Team leader is missing.");

  const config = getPayUConfig(ctx.origin, { forceSandbox: ctx.sandbox });
  const fee = computeFee(team.member_count, pricingFrom(content));
  const txnid = createTxnId();
  const environment: PaymentRow["environment"] = config.usingLocalSandbox ? "sandbox" : config.environment === "production" ? "production" : "test";

  if (sql) {
    try {
      await sql`insert into hk_payments (team_id, txnid, member_count, fee_per_person, subtotal_inr, tax_inr, amount_inr, status, environment)
                values (${team.id}, ${txnid}, ${fee.members}, ${fee.feePerPerson}, ${fee.subtotal}, ${fee.tax}, ${fee.total}, 'INITIATED', ${environment})`;
    } catch (e) {
      if ((e as { code?: string }).code === "23505") {
        throw new HttpError(409, "PAYMENT_IN_PROGRESS", "A payment for this team is already in progress.");
      }
      throw e;
    }
    await paymentEvent(sql, txnid, "ORDER_CREATED", "INITIATED", "initiate", { amount: fee.total, members: fee.members, environment });
  } else {
    fallbackCreatePayment({
      teamId: team.id,
      txnid,
      members: fee.members,
      feePerPerson: fee.feePerPerson,
      subtotal: fee.subtotal,
      tax: fee.tax,
      total: fee.total,
      environment,
    });
  }

  logPaymentEvent("ORDER_INITIATED", { txnid, status: "INITIATED", environment: config.environment, mode: config.mode, amount: `${fee.total}.00` });

  const amount = `${fee.total}.00`;
  const productinfo = "AVATAR Hackathon Pre-Registration";
  const firstname = safeFirstName(leader.full_name);
  const callbackUrl = `${ctx.origin}/api/hackathon/payu-callback`;
  const udf2Value = sql ? team.id : teamId.startsWith("fkt_") ? teamId : encodeStatelessTeamId(team, members);
  const udf = { udf1: "AIHACKATHON2026TEAM", udf2: udf2Value, udf3: String(fee.members), udf4: "", udf5: "" };
  const hash = generatePayURequestHash(
    { key: config.key, txnid, amount, productinfo, firstname, email: leader.email, ...udf },
    config.salt
  );

  return {
    alreadyPaid: false,
    checkout: {
      actionUrl: config.actionUrl,
      environment: config.environment,
      mode: config.mode,
      usingLocalSandbox: config.usingLocalSandbox,
      txnid,
      fee: { members: fee.members, feePerPerson: fee.feePerPerson, subtotal: fee.subtotal, tax: fee.tax, total: fee.total },
      fields: {
        key: config.key,
        txnid,
        amount,
        productinfo,
        firstname,
        email: leader.email,
        phone: leader.mobile.replace(/\D/g, "").slice(-10),
        surl: callbackUrl,
        furl: callbackUrl,
        ...udf,
        hash,
      },
    },
  };
}

export async function getPayment(txnid: string): Promise<PaymentRow | null> {
  if (!hasDatabaseUrl()) {
    return fallbackGetPayment(txnid);
  }
  try {
    const sql = getSql();
    const [p] = await sql<PaymentRow[]>`select * from hk_payments where txnid = ${txnid}`;
    return p ?? fallbackGetPayment(txnid);
  } catch {
    return fallbackGetPayment(txnid);
  }
}

interface Outcome {
  status: PaymentStatus;
  mihpayid?: string | null;
  failureReason?: string | null;
  needsReview?: boolean;
  source: string;
}

/**
 * The single place where payment status changes. Atomic, idempotent and state-machine guarded:
 * - a SUCCESS can never be downgraded
 * - SUCCESS is applied at most once; IDs are minted exactly once
 * - a second captured payment for an already-paid team is parked as REFUND_PENDING for review
 */
export async function applyPaymentOutcome(txnid: string, outcome: Outcome): Promise<{ payment: PaymentRow; changed: boolean }> {
  if (!hasDatabaseUrl() || fallbackGetPayment(txnid)) {
    const r = fallbackApplyPaymentOutcome(txnid, outcome);
    if (r.changed) {
      logPaymentEvent("STATUS_RECONCILED", {
        txnid,
        mihpayid: outcome.mihpayid ?? null,
        status: r.payment.status,
        verified: r.payment.status === "SUCCESS",
        reason: r.payment.failure_reason,
      });
    }
    return r;
  }

  const sql = getSql();
  return sql.begin(async (tx) => {
    const q = tx as unknown as Sql;
    const [p] = await q<PaymentRow[]>`select * from hk_payments where txnid = ${txnid} for update`;
    if (!p) throw new HttpError(404, "NOT_FOUND", "Transaction not found.");

    if (p.status === outcome.status) {
      if (outcome.status !== "SUCCESS" || p.verified_at) return { payment: p, changed: false };
    }
    if (p.status === "SUCCESS" && outcome.status !== "REFUND_PENDING" && outcome.status !== "REFUNDED") {
      await paymentEvent(q, txnid, "IGNORED_DOWNGRADE", outcome.status, outcome.source, { current: p.status });
      return { payment: p, changed: false };
    }
    if (!canTransitionPaymentStatus(p.status, outcome.status)) {
      await paymentEvent(q, txnid, "IGNORED_TRANSITION", outcome.status, outcome.source, { current: p.status });
      return { payment: p, changed: false };
    }

    let finalStatus: PaymentStatus = outcome.status;
    let reason = outcome.failureReason ?? null;
    let review = outcome.needsReview ?? p.needs_review;

    if (outcome.status === "SUCCESS") {
      const [other] = await q<{ txnid: string }[]>`
        select txnid from hk_payments where team_id = ${p.team_id} and status = 'SUCCESS' and id <> ${p.id} limit 1`;
      if (other) {
        finalStatus = "REFUND_PENDING";
        reason = "duplicate_payment";
        review = true;
      }
    }

    // A mihpayid may belong to only one transaction.
    let mih = outcome.mihpayid ?? null;
    if (mih) {
      const [dupe] = await q<{ txnid: string }[]>`select txnid from hk_payments where payu_mihpayid = ${mih} and id <> ${p.id}`;
      if (dupe) {
        mih = null;
        review = true;
        reason = reason ?? "duplicate_gateway_reference";
      }
    }

    const [updated] = await q<PaymentRow[]>`
      update hk_payments set
        status = ${finalStatus},
        payu_mihpayid = coalesce(payu_mihpayid, ${mih}),
        failure_reason = ${finalStatus === "SUCCESS" ? null : reason ?? p.failure_reason},
        needs_review = ${review},
        verified_at = ${finalStatus === "SUCCESS" || finalStatus === "REFUND_PENDING" ? new Date().toISOString() : p.verified_at},
        updated_at = now()
      where id = ${p.id} returning *`;

    if (finalStatus === "SUCCESS") {
      const confirmed = await confirmTeam(tx as unknown as Tx, p.team_id);
      if (!confirmed) {
        await q`update hk_payments set needs_review = true, failure_reason = 'confirmed_but_identity_conflict', updated_at = now() where id = ${p.id}`;
        updated.needs_review = true;
      }
    }
    await paymentEvent(q, txnid, "STATUS_CHANGED", finalStatus, outcome.source, { from: p.status, reason, review });
    logPaymentEvent("STATUS_RECONCILED", { txnid, mihpayid: mih, status: finalStatus, verified: finalStatus === "SUCCESS", reason });
    return { payment: updated, changed: true };
  });
}

/** Marks the team CONFIRMED and mints Team/Registration IDs exactly once. Returns false on identity conflict. */
async function confirmTeam(q: Tx, teamId: string): Promise<boolean> {
  const [team] = await q<TeamRow[]>`select * from hk_teams where id = ${teamId} for update`;
  if (!team) return false;
  try {
    await q.savepoint(async (sp) => {
      const s = sp as unknown as Sql;
      // A late payment may arrive after the team was expired: re-activate its members.
      await s`update hk_participants set active = true, updated_at = now() where team_id = ${teamId}`;
      await s`update hk_teams set
                status = 'CONFIRMED',
                confirmed_at = coalesce(confirmed_at, now()),
                team_code = coalesce(team_code, 'AIH-T-' || lpad(nextval('public.hk_team_seq')::text, 6, '0')),
                updated_at = now()
              where id = ${teamId}`;
      const members = await s<{ id: string }[]>`
        select id from hk_participants where team_id = ${teamId} and registration_code is null order by is_leader desc, created_at, id`;
      for (const m of members) {
        await s`update hk_participants set registration_code = 'AIH-R-' || lpad(nextval('public.hk_reg_seq')::text, 6, '0') where id = ${m.id}`;
      }
    });
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return false;
    throw e;
  }
}

function sanitizeReason(v: string | undefined): string | null {
  if (!v) return null;
  return v.replace(/[^\w .,:;'()\-/]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || null;
}

/** Handles PayU's browser callback (surl/furl). Never trusts the redirect itself. */
export async function handlePayuCallback(
  payload: Record<string, string>,
  ctx: { origin: string; localOrigin: boolean }
): Promise<{ txnid: string; known: boolean }> {
  const txnid = (payload.txnid || "").trim().slice(0, 40);
  if (!txnid) return { txnid: "", known: false };
  let payment = await getPayment(txnid);
  if (!payment && !hasDatabaseUrl()) {
    payment = fallbackHydrateFromCallbackPayload(payload);
  }
  if (!payment) return { txnid, known: false };
  const sql = hasDatabaseUrl() && !fallbackGetPayment(txnid) ? getSql() : null;

  const sandbox = ctx.localOrigin && payment.environment === "sandbox" && payload.key === "gtKFFx";
  const config = getPayUConfig(ctx.origin, { forceSandbox: sandbox });
  const raw = (payload.status || "").toLowerCase();

  const keyOk = payload.key === config.key;
  const hashOk = keyOk && verifyPayUResponseHash(payload, config.key, config.salt);
  await paymentEvent(sql, txnid, "CALLBACK_RECEIVED", raw || null, "callback", { hashOk, keyOk });
  logPaymentEvent("CALLBACK_RECEIVED", { txnid, mihpayid: payload.mihpayid || null, status: raw, environment: config.environment, mode: config.mode, amount: payload.amount || null, verified: hashOk });

  if (!hashOk) {
    // Do NOT change status on an unauthenticated callback; ask PayU directly instead.
    logPaymentEvent("CALLBACK_HASH_REJECTED", { txnid, status: raw, environment: config.environment, reason: keyOk ? "hash_mismatch" : "key_mismatch" });
    await reconcilePayment(txnid, ctx.origin, { sandbox: payment.environment === "sandbox" && ctx.localOrigin });
    return { txnid, known: true };
  }

  if (sandbox) {
    setSandboxGatewayOutcome(txnid, {
      status: raw === "success" ? "success" : raw === "pending" ? "pending" : raw === "cancelled" ? "cancelled" : "failure",
      mihpayid: payload.mihpayid || undefined,
      amount: payload.amount,
    });
  }

  if (raw === "success") {
    const claimed = Number.parseFloat(payload.amount || "0");
    if (!Number.isFinite(claimed) || Math.abs(claimed - payment.amount_inr) >= 0.01) {
      await applyPaymentOutcome(txnid, { status: "FAILED", failureReason: "amount_mismatch", needsReview: true, source: "callback" });
      return { txnid, known: true };
    }
    await reconcilePayment(txnid, ctx.origin, { sandbox });
  } else if (raw === "pending" || raw === "in progress") {
    await applyPaymentOutcome(txnid, { status: "PENDING", source: "callback" });
  } else if (raw === "cancelled" || raw === "usercancelled") {
    await applyPaymentOutcome(txnid, { status: "CANCELLED", failureReason: "Cancelled by participant", source: "callback" });
  } else {
    await applyPaymentOutcome(txnid, {
      status: "FAILED",
      failureReason: sanitizeReason(payload.error_Message || payload.field9) ?? "Payment declined by the gateway",
      source: "callback",
    });
  }
  return { txnid, known: true };
}

/** Asks PayU (server-to-server) for the real status and applies it. Safe to call repeatedly. */
export async function reconcilePayment(
  txnid: string,
  origin: string,
  opts: { sandbox: boolean }
): Promise<{ payment: PaymentRow; changed: boolean; gateway: string }> {
  const payment = await getPayment(txnid);
  if (!payment) throw new HttpError(404, "NOT_FOUND", "Transaction not found.");
  if (payment.status === "SUCCESS" || payment.status === "REFUNDED") return { payment, changed: false, gateway: "final" };

  const config: PayUConfig = getPayUConfig(origin, { forceSandbox: opts.sandbox && payment.environment === "sandbox" });
  const check = await verifyPayUTransactionServerToServer(txnid, config, undefined, payment.amount_inr);
  logPaymentEvent("SERVER_VERIFY_RESULT", { txnid, mihpayid: check.mihpayid, status: check.status, environment: config.environment, mode: config.mode, amount: check.amount, verified: check.verified, reason: check.rawStatus });
  const sql = hasDatabaseUrl() && !fallbackGetPayment(txnid) ? getSql() : null;
  await paymentEvent(sql, txnid, "GATEWAY_VERIFY", check.status, "verify", { raw: check.rawStatus, verified: check.verified });

  if (check.verified && check.status === "SUCCESS") {
    const r = await applyPaymentOutcome(txnid, { status: "SUCCESS", mihpayid: check.mihpayid, source: "verify" });
    return { ...r, gateway: check.rawStatus };
  }
  if (check.rawStatus === "amount_mismatch") {
    const r = await applyPaymentOutcome(txnid, { status: "FAILED", failureReason: "amount_mismatch", mihpayid: check.mihpayid, needsReview: true, source: "verify" });
    return { ...r, gateway: check.rawStatus };
  }
  if (check.status === "FAILED" || check.status === "CANCELLED") {
    const r = await applyPaymentOutcome(txnid, { status: check.status, mihpayid: check.mihpayid, failureReason: check.status === "CANCELLED" ? "Cancelled by participant" : "Payment declined by the gateway", source: "verify" });
    return { ...r, gateway: check.rawStatus };
  }
  if (NOT_FOUND_AT_GATEWAY.has(check.rawStatus)) {
    // PayU has no record. Only expire clearly abandoned INITIATED payments, never on a gateway outage.
    const age = Date.now() - Date.parse(payment.created_at);
    if (check.rawStatus === "not_found_yet" && payment.status === "INITIATED" && age > STALE_INITIATED_MS) {
      const r = await applyPaymentOutcome(txnid, { status: "EXPIRED", failureReason: "No payment was completed at the gateway", source: "verify" });
      return { ...r, gateway: check.rawStatus };
    }
    return { payment, changed: false, gateway: check.rawStatus };
  }
  if (check.status === "PENDING") {
    const r = await applyPaymentOutcome(txnid, { status: "PENDING", mihpayid: check.mihpayid, source: "verify" });
    return { ...r, gateway: check.rawStatus };
  }
  return { payment, changed: false, gateway: check.rawStatus };
}

// ── Presentation helpers ─────────────────────────────────────────────────────
export function publicPaymentView(p: PaymentRow) {
  const failureReason =
    p.status === "FAILED" || p.status === "CANCELLED" || p.status === "EXPIRED"
      ? p.failure_reason === "amount_mismatch"
        ? "The payment amount did not match. Our team will review it."
        : p.failure_reason && !/[_]/.test(p.failure_reason)
        ? p.failure_reason
        : "The payment was not completed."
      : null;
  return {
    txnid: p.txnid,
    status: p.status,
    amount: p.amount_inr,
    members: p.member_count,
    feePerPerson: p.fee_per_person,
    createdAt: p.created_at,
    verifiedAt: p.verified_at,
    failureReason,
    needsReview: p.needs_review,
  };
}

export function memberView(m: ParticipantRow, opts: { contact: boolean }) {
  return {
    id: m.id,
    registrationCode: m.registration_code,
    role: m.is_leader ? "Team Leader" : "Team Member",
    isLeader: m.is_leader,
    fullName: m.full_name,
    organisation: m.organisation,
    course: m.course,
    city: m.city,
    state: m.state,
    github: m.github,
    linkedin: m.linkedin,
    skills: m.skills,
    ...(opts.contact ? { email: m.email, mobile: m.mobile } : {}),
  };
}

export function teamView(t: TeamRow) {
  return {
    id: t.id,
    teamCode: t.team_code,
    name: t.name,
    mode: t.mode,
    city: t.city,
    state: t.state,
    organisation: t.organisation,
    memberCount: t.member_count,
    status: t.status,
    confirmedAt: t.confirmed_at,
    createdAt: t.created_at,
  };
}

/** EmailJS payloads for a confirmed team (sent by the browser; the server records completion). */
export function buildEmailPayloads(team: TeamRow, members: ParticipantRow[], payment: PaymentRow, origin: string) {
  const leader = members.find((m) => m.is_leader)!;
  const lines = members.map((m) => `${m.registration_code} · ${m.full_name} (${m.is_leader ? "Team Leader" : "Member"})`).join("\n");
  const summary = [
    `Hackathon: AVATAR — DESIGN. BUILD. SELL. IN ONE DAY.`,
    `Participant / Leader: ${leader.full_name}`,
    `Registration ID: ${leader.registration_code ?? "—"}`,
    `Team: ${team.name} (${team.team_code})`,
    `Members: ${team.member_count}`,
    `Amount paid: ₹${payment.amount_inr}`,
    `Payment status: SUCCESS (Verified)`,
    `Transaction ID: ${payment.txnid}`,
    "",
    "Official Participant Passes:",
    lines,
  ].join("\n");
  return {
    leader: {
      to_name: leader.full_name,
      to_email: leader.email,
      reply_to: "",
      subject: `AVATAR Registration Confirmed — ${team.team_code} | DESIGN. BUILD. SELL. IN ONE DAY.`,
      message: `Hello ${leader.full_name},\n\nPAYMENT SUCCESSFUL! Your registration and official participant pass for AVATAR (DESIGN. BUILD. SELL. IN ONE DAY.) are confirmed.\n\n${summary}\n\nCheck live event updates & status: ${origin}/competition/status\nOfficial Website: https://abuzarcode.in/`,
      from_name: leader.full_name,
      from_email: leader.email,
      form_type: "AVATAR — Registration & Participant Pass Confirmed",
    },
    organiser: {
      subject: `AVATAR New Registration — ${team.team_code} (${team.member_count} members, ₹${payment.amount_inr})`,
      form_type: "AVATAR — New team registration",
      from_name: leader.full_name,
      from_email: leader.email,
      reply_to: leader.email,
      message: summary,
    },
  };
}

export { resolveFallbackTeamId };
