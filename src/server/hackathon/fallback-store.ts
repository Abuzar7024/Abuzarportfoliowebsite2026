import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { canTransitionPaymentStatus, type PaymentStatus } from "../avatar-db";
import { ensureEnvLoaded } from "../payu";
import { syncSupabaseRegistration } from "../supabase";
import type { NormalizedTeam } from "../../shared/hackathon-validation";
import { HttpError } from "./http";
import type { ParticipantRow, PaymentRow, TeamRow } from "./service";

interface FallbackStoreData {
  teamSeq: number;
  regSeq: number;
  teams: Record<string, TeamRow>;
  participantsByTeam: Record<string, ParticipantRow[]>;
  paymentsByTxn: Record<string, PaymentRow>;
}

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "avatar-hackathon-data")
  : path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "hk-fallback-store.json");

let memStore: FallbackStoreData = {
  teamSeq: 100,
  regSeq: 1000,
  teams: {},
  participantsByTeam: {},
  paymentsByTxn: {},
};

function loadStore(): FallbackStoreData {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as FallbackStoreData;
      if (parsed && parsed.teams && parsed.participantsByTeam && parsed.paymentsByTxn) {
        memStore = parsed;
      }
    }
  } catch {
    /* use in-memory fallback */
  }
  return memStore;
}

function saveStore(store: FallbackStoreData): void {
  memStore = store;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    /* ignore read-only fs errors */
  }
}

function secretKey(): Buffer {
  ensureEnvLoaded();
  const raw =
    process.env.AVATAR_SIGNING_SECRET ||
    process.env.PAYU_MERCHANT_SALT ||
    process.env.PAYU_MERCHANT_KEY ||
    "avatar-hackathon-2026-fallback-secret";
  return crypto.createHash("sha256").update(raw).digest();
}

/**
 * Encodes a self-contained registration snapshot into an opaque token so
 * stateless Vercel serverless instances can always reconstruct a team even across cold starts.
 */
export function encodeStatelessTeamId(team: TeamRow, members: ParticipantRow[]): string {
  const payload = {
    i: team.id,
    n: team.name,
    o: team.organisation,
    r: team.referral_code,
    c: team.member_count,
    t: team.created_at,
    m: members.map((m) => ({
      i: m.id,
      l: m.is_leader ? 1 : 0,
      f: m.full_name,
      e: m.email,
      p: m.mobile,
      o: m.organisation,
      d: m.course,
      g: m.github,
      k: m.linkedin,
      s: m.skills,
    })),
  };
  const data = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secretKey()).update(data).digest("base64url").slice(0, 22);
  return `fkt_${data}.${sig}`;
}

export function hydrateStatelessTeamId(teamId: string): { team: TeamRow; members: ParticipantRow[] } | null {
  if (!teamId.startsWith("fkt_")) return null;
  const raw = teamId.slice(4);
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const data = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secretKey()).update(data).digest("base64url").slice(0, 22);
  if (sig !== expected) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    const store = loadStore();
    if (store.teams[p.i]) {
      return { team: store.teams[p.i], members: store.participantsByTeam[p.i] || [] };
    }
    const team: TeamRow = {
      id: p.i,
      team_code: null,
      name: p.n,
      mode: "ONLINE",
      city: "",
      state: "",
      organisation: p.o ?? null,
      referral_code: p.r ?? null,
      member_count: Number(p.c) || 1,
      status: "PENDING_PAYMENT",
      emails_sent_at: null,
      created_at: p.t || new Date().toISOString(),
      confirmed_at: null,
    };
    const members: ParticipantRow[] = (Array.isArray(p.m) ? p.m : []).map((m: Record<string, unknown>, idx: number) => ({
      id: String(m.i || crypto.randomUUID()),
      team_id: team.id,
      registration_code: null,
      is_leader: Boolean(m.l ?? idx === 0),
      full_name: String(m.f || "Participant"),
      email: String(m.e || ""),
      email_norm: String(m.e || "").toLowerCase(),
      mobile: String(m.p || ""),
      organisation: m.o ? String(m.o) : null,
      course: m.d ? String(m.d) : null,
      city: null,
      state: null,
      github: m.g ? String(m.g) : null,
      linkedin: m.k ? String(m.k) : null,
      skills: m.s ? String(m.s) : null,
    }));
    store.teams[team.id] = team;
    store.participantsByTeam[team.id] = members;
    saveStore(store);
    return { team, members };
  } catch {
    return null;
  }
}

export function resolveFallbackTeamId(teamIdOrToken: string): string {
  if (teamIdOrToken.startsWith("fkt_")) {
    const hydrated = hydrateStatelessTeamId(teamIdOrToken);
    if (hydrated) return hydrated.team.id;
  }
  return teamIdOrToken;
}

export function fallbackRegisterTeam(team: NormalizedTeam): { teamId: string; statelessTeamId: string } {
  const store = loadStore();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Check for confirmed duplicate team name or participant email/mobile in local fallback store
  for (const existing of Object.values(store.teams)) {
    if (existing.status === "CONFIRMED" && existing.name.toLowerCase() === team.teamName.toLowerCase()) {
      throw new HttpError(409, "NAME_TAKEN", "That team name is already taken. Please choose another.");
    }
    if (existing.status === "CONFIRMED") {
      const existingMembers = store.participantsByTeam[existing.id] || [];
      for (const em of existingMembers) {
        if (team.members.some((m) => m.emailNorm === em.email_norm || m.mobile === em.mobile)) {
          throw new HttpError(
            409,
            "ALREADY_REGISTERED",
            "One of the email addresses or mobile numbers is already registered."
          );
        }
      }
    }
  }

  const teamRow: TeamRow = {
    id,
    team_code: null,
    name: team.teamName,
    mode: "ONLINE",
    city: "",
    state: "",
    organisation: team.organisation || null,
    referral_code: team.referralCode || null,
    member_count: team.memberCount,
    status: "PENDING_PAYMENT",
    emails_sent_at: null,
    created_at: now,
    confirmed_at: null,
  };

  const memberRows: ParticipantRow[] = team.members.map((m, i) => ({
    id: crypto.randomUUID(),
    team_id: id,
    registration_code: null,
    is_leader: i === 0,
    full_name: m.fullName,
    email: m.email,
    email_norm: m.emailNorm,
    mobile: m.mobile,
    organisation: m.organisation || null,
    course: m.course || null,
    city: null,
    state: null,
    github: m.github || null,
    linkedin: m.linkedin || null,
    skills: m.skills || null,
  }));

  store.teams[id] = teamRow;
  store.participantsByTeam[id] = memberRows;
  saveStore(store);

  const statelessTeamId = encodeStatelessTeamId(teamRow, memberRows);
  return { teamId: id, statelessTeamId };
}

export function fallbackGetTeam(teamIdOrToken: string): TeamRow | null {
  const store = loadStore();
  const id = resolveFallbackTeamId(teamIdOrToken);
  return store.teams[id] ?? null;
}

export function fallbackGetMembers(teamIdOrToken: string): ParticipantRow[] {
  const store = loadStore();
  const id = resolveFallbackTeamId(teamIdOrToken);
  return store.participantsByTeam[id] ?? [];
}

export function fallbackCreatePayment(params: {
  teamId: string;
  txnid: string;
  members: number;
  feePerPerson: number;
  subtotal: number;
  tax: number;
  total: number;
  environment: PaymentRow["environment"];
}): PaymentRow {
  const store = loadStore();
  const realTeamId = resolveFallbackTeamId(params.teamId);
  const now = new Date().toISOString();
  const row: PaymentRow = {
    id: crypto.randomUUID(),
    team_id: realTeamId,
    txnid: params.txnid,
    member_count: params.members,
    fee_per_person: params.feePerPerson,
    subtotal_inr: params.subtotal,
    tax_inr: params.tax,
    amount_inr: params.total,
    status: "INITIATED",
    environment: params.environment,
    payu_mihpayid: null,
    failure_reason: null,
    needs_review: false,
    verified_at: null,
    created_at: now,
    updated_at: now,
  };
  store.paymentsByTxn[params.txnid] = row;
  saveStore(store);

  const team = store.teams[realTeamId];
  const leader = (store.participantsByTeam[realTeamId] || []).find((m) => m.is_leader);
  if (team && leader) {
    void syncSupabaseRegistration({
      payuTxnId: params.txnid,
      fullName: leader.full_name,
      email: leader.email,
      whatsappNumber: leader.mobile,
      paymentAmount: `${params.total}.00`,
      paymentStatus: "INITIATED",
      registrationRef: team.id,
      consentStatus: "ACCEPTED",
    }).catch(() => {});
  }

  return row;
}

export function fallbackHydrateFromCallbackPayload(payload: Record<string, string>): PaymentRow | null {
  const txnid = (payload.txnid || "").trim();
  if (!txnid) return null;
  const store = loadStore();
  if (store.paymentsByTxn[txnid]) return store.paymentsByTxn[txnid];

  // Reconstruct from udf2 (statelessTeamId or teamId) and udf3 (member count) if callback hit a different serverless instance
  const udf2 = (payload.udf2 || "").trim();
  const hydrated = udf2.startsWith("fkt_") ? hydrateStatelessTeamId(udf2) : null;
  const teamId = hydrated ? hydrated.team.id : udf2 || crypto.randomUUID();
  const memberCount = Number(payload.udf3) || hydrated?.team.member_count || 1;
  const amountNum = Math.round(Number.parseFloat(payload.amount || "499")) || 499;
  const feePerPerson = Math.round(amountNum / Math.max(1, memberCount));

  if (!store.teams[teamId]) {
    const now = new Date().toISOString();
    store.teams[teamId] = {
      id: teamId,
      team_code: null,
      name: payload.firstname ? `${payload.firstname}'s Team` : "AVATAR Team",
      mode: "ONLINE",
      city: "",
      state: "",
      organisation: null,
      referral_code: null,
      member_count: memberCount,
      status: "PENDING_PAYMENT",
      emails_sent_at: null,
      created_at: now,
      confirmed_at: null,
    };
    store.participantsByTeam[teamId] = [
      {
        id: crypto.randomUUID(),
        team_id: teamId,
        registration_code: null,
        is_leader: true,
        full_name: payload.firstname || "Participant",
        email: payload.email || "participant@abuzarcode.in",
        email_norm: (payload.email || "participant@abuzarcode.in").toLowerCase(),
        mobile: payload.phone || "",
        organisation: null,
        course: null,
        city: null,
        state: null,
        github: null,
        linkedin: null,
        skills: null,
      },
    ];
  }

  const now = new Date().toISOString();
  const payment: PaymentRow = {
    id: crypto.randomUUID(),
    team_id: teamId,
    txnid,
    member_count: memberCount,
    fee_per_person: feePerPerson,
    subtotal_inr: amountNum,
    tax_inr: 0,
    amount_inr: amountNum,
    status: "INITIATED",
    environment: payload.key === "gtKFFx" ? "sandbox" : "production",
    payu_mihpayid: null,
    failure_reason: null,
    needs_review: false,
    verified_at: null,
    created_at: now,
    updated_at: now,
  };
  store.paymentsByTxn[txnid] = payment;
  saveStore(store);
  return payment;
}

export function fallbackGetPayment(txnid: string): PaymentRow | null {
  const store = loadStore();
  return store.paymentsByTxn[txnid] ?? null;
}

export function fallbackGetOpenPaymentForTeam(teamIdOrToken: string): PaymentRow | null {
  const store = loadStore();
  const teamId = resolveFallbackTeamId(teamIdOrToken);
  const list = Object.values(store.paymentsByTxn).filter(
    (p) => p.team_id === teamId && ["CREATED", "INITIATED", "PENDING"].includes(p.status)
  );
  list.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return list[0] ?? null;
}

function deterministicCode(prefix: "AIH-T-" | "AIH-R-", seed: string): string {
  const num = (parseInt(crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8), 16) % 900000) + 100000;
  return `${prefix}${String(num).padStart(6, "0")}`;
}

export function fallbackApplyPaymentOutcome(
  txnid: string,
  outcome: {
    status: PaymentStatus;
    mihpayid?: string | null;
    failureReason?: string | null;
    needsReview?: boolean;
  }
): { payment: PaymentRow; changed: boolean } {
  const store = loadStore();
  const p = store.paymentsByTxn[txnid];
  if (!p) throw new HttpError(404, "NOT_FOUND", "Transaction not found.");

  if (p.status === outcome.status && (outcome.status !== "SUCCESS" || p.verified_at)) {
    return { payment: p, changed: false };
  }
  if (p.status === "SUCCESS" && outcome.status !== "REFUND_PENDING" && outcome.status !== "REFUNDED") {
    return { payment: p, changed: false };
  }
  if (!canTransitionPaymentStatus(p.status, outcome.status)) {
    return { payment: p, changed: false };
  }

  const now = new Date().toISOString();
  p.status = outcome.status;
  if (outcome.mihpayid) p.payu_mihpayid = p.payu_mihpayid || outcome.mihpayid;
  p.failure_reason = outcome.status === "SUCCESS" ? null : outcome.failureReason ?? p.failure_reason;
  p.needs_review = outcome.needsReview ?? p.needs_review;
  if (outcome.status === "SUCCESS" || outcome.status === "REFUND_PENDING") {
    p.verified_at = p.verified_at || now;
  }
  p.updated_at = now;

  const team = store.teams[p.team_id];
  const members = store.participantsByTeam[p.team_id] || [];
  if (outcome.status === "SUCCESS" && team) {
    team.status = "CONFIRMED";
    team.confirmed_at = team.confirmed_at || now;
    team.team_code = team.team_code || deterministicCode("AIH-T-", `${team.id}:${txnid}`);
    members.forEach((m, idx) => {
      if (!m.registration_code) {
        m.registration_code = deterministicCode("AIH-R-", `${team.id}:${m.id}:${idx}`);
      }
    });
  }

  saveStore(store);

  const leader = members.find((m) => m.is_leader);
  if (team && leader) {
    void syncSupabaseRegistration({
      payuTxnId: p.txnid,
      fullName: leader.full_name,
      email: leader.email,
      whatsappNumber: leader.mobile,
      paymentAmount: `${p.amount_inr}.00`,
      paymentStatus: p.status,
      participantId: leader.registration_code,
      payuMihpayid: p.payu_mihpayid,
      paidAt: p.verified_at,
      registrationRef: team.team_code || team.id,
      consentStatus: "ACCEPTED",
    }).catch(() => {});
  }

  return { payment: p, changed: true };
}

export function fallbackStats(maxParticipants: number, targetParticipants: number) {
  const store = loadStore();
  let teams = 0;
  let participants = 0;
  for (const t of Object.values(store.teams)) {
    if (t.status === "CONFIRMED") {
      teams += 1;
      participants += (store.participantsByTeam[t.id] || []).length || t.member_count;
    }
  }
  return {
    confirmedParticipants: participants,
    confirmedTeams: teams,
    targetParticipants,
    maxParticipants,
    remainingToMax: Math.max(0, maxParticipants - participants),
  };
}

export function fallbackVerifyPass(code: string) {
  const store = loadStore();
  for (const t of Object.values(store.teams)) {
    if (t.status !== "CONFIRMED") continue;
    const members = store.participantsByTeam[t.id] || [];
    const payments = Object.values(store.paymentsByTxn).filter((p) => p.team_id === t.id && p.status === "SUCCESS");
    const feePaidInr = payments[0]?.amount_inr ?? t.member_count * 499;
    if (code.startsWith("AIH-T-") && t.team_code === code) {
      const leader = members.find((m) => m.is_leader) || members[0];
      if (!leader) continue;
      return {
        ok: true,
        verified: true,
        edition: "AVATAR — DESIGN. BUILD. SELL. IN ONE DAY.",
        competition: "AVATAR",
        participantId: t.team_code,
        participantName: `${t.name} (${t.member_count} ${t.member_count === 1 ? "member" : "members"})`,
        status: "VERIFIED" as const,
        profileCompleted: true,
        registeredAt: t.confirmed_at,
        pass: {
          registrationCode: leader.registration_code || code,
          teamCode: t.team_code,
          teamName: t.name,
          fullName: leader.full_name,
          role: "Team Leader",
          organisation: leader.organisation ?? t.organisation,
          course: leader.course,
          memberCount: t.member_count,
          feePaidInr,
          verifiedAt: t.confirmed_at,
        },
      };
    }
    for (const m of members) {
      if (m.registration_code === code) {
        return {
          ok: true,
          verified: true,
          edition: "AVATAR — DESIGN. BUILD. SELL. IN ONE DAY.",
          competition: "AVATAR",
          participantId: m.registration_code,
          participantName: `${m.full_name} · Team ${t.name} (${t.team_code})`,
          status: "VERIFIED" as const,
          profileCompleted: true,
          registeredAt: t.confirmed_at,
          pass: {
            registrationCode: m.registration_code,
            teamCode: t.team_code || "AIH-T-VERIFIED",
            teamName: t.name,
            fullName: m.full_name,
            role: m.is_leader ? "Team Leader" : "Team Member",
            organisation: m.organisation,
            course: m.course,
            memberCount: t.member_count,
            feePaidInr,
            verifiedAt: t.confirmed_at,
          },
        };
      }
    }
  }
  return null;
}
