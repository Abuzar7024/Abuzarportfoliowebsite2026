import type { IncomingMessage, ServerResponse } from "node:http";
import { getPayUConfig } from "../payu";
import {
  CONTENT_KEYS,
  EVENT_STATUS_LABELS,
  POLICY_SLUGS,
  isRegistrationActuallyOpen,
  mergeContent,
  type ContentKey,
  type EventStatusLabel,
  type HackathonContent,
} from "../../shared/hackathon-content";
import {
  EMAIL_RE,
  cleanText,
  normalizeEmail,
  normalizeGithub,
  normalizeLinkedin,
  normalizeMobile,
  validateTeamInput,
} from "../../shared/hackathon-validation";
import { computeFee } from "../../shared/hackathon-pricing";
import {
  adminRoleFor,
  requireAdmin,
  requireUser,
  verifySupabaseAccessToken,
  type TokenVerifier,
} from "./auth";
import { getSql, hasDatabaseUrl, type Sql } from "./db";
import { fallbackVerifyPass } from "./fallback-store";
import {
  HttpError,
  isLocalOrigin,
  issueToken,
  rateLimit,
  readJson,
  readParams,
  readToken,
  redirect,
  requestOrigin,
  sendJson,
  sendText,
} from "./http";
import {
  applyPaymentOutcome,
  audit,
  buildEmailPayloads,
  getMembers,
  getPayment,
  getTeam,
  handlePayuCallback,
  initiatePayment,
  invalidateContentCache,
  loadContent,
  memberView,
  pricingFrom,
  publicPaymentView,
  publicStats,
  reconcilePayment,
  registerTeam,
  teamView,
  type ParticipantRow,
  type PaymentRow,
} from "./service";

export interface HandlerDeps {
  verifyToken: TokenVerifier;
}

const TEAM_TOKEN_TTL = 2 * 60 * 60 * 1000;
const PAY_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;
const lastReconcileAt = new Map<string, number>();

// ── Content sanitising (admin edits) ─────────────────────────────────────────
function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\u0000/g, "").slice(0, max) : "";
}
function int(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
/** Only https URLs or same-site paths; blocks javascript:/data: URLs. */
function safeImageUrl(v: unknown): string {
  const s = typeof v === "string" ? v.trim().slice(0, 500) : "";
  if (!s) return "";
  return /^(https:\/\/[^\s"'<>]+|\/[^\s"'<>/][^\s"'<>]*)$/.test(s) ? s : "";
}

export function sanitizeContent(key: ContentKey, value: unknown, current: HackathonContent): unknown {
  const bad = () => new HttpError(400, "VALIDATION", `Invalid content for "${key}".`);
  switch (key) {
    case "settings": {
      if (!value || typeof value !== "object") throw bad();
      const v = value as Record<string, unknown>;
      const s = current.settings;
      const tax = (v.tax && typeof v.tax === "object" ? v.tax : {}) as Record<string, unknown>;
      return {
        eventName: str(v.eventName ?? s.eventName, 120),
        editionLabel: str(v.editionLabel ?? s.editionLabel, 80),
        location: str(v.location ?? s.location, 160),
        dateText: str(v.dateText ?? s.dateText, 160),
        venueText: str(v.venueText ?? s.venueText, 200),
        formatText: str(v.formatText ?? s.formatText, 240),
        physicalDurationText: str(v.physicalDurationText ?? s.physicalDurationText, 80),
        expectedPhysicalAttendance: int(v.expectedPhysicalAttendance, 0, 1_000_000, s.expectedPhysicalAttendance),
        targetParticipants: int(v.targetParticipants, 1, 1_000_000, s.targetParticipants),
        maxParticipants: int(v.maxParticipants, 1, 1_000_000, s.maxParticipants),
        feePerPerson: int(v.feePerPerson, 1, 100_000, s.feePerPerson),
        maxTeamSize: int(v.maxTeamSize, 1, 15, s.maxTeamSize),
        tax: {
          enabled: bool(tax.enabled, s.tax.enabled),
          label: str(tax.label ?? s.tax.label, 40),
          ratePercent: Math.min(100, Math.max(0, Number(tax.ratePercent ?? s.tax.ratePercent) || 0)),
        },
        registrationOpen: bool(v.registrationOpen, s.registrationOpen),
        physicalRegistrationAvailable: bool(v.physicalRegistrationAvailable, s.physicalRegistrationAvailable),
        eventStatus: (EVENT_STATUS_LABELS.includes(v.eventStatus as EventStatusLabel)
          ? v.eventStatus
          : s.eventStatus) as EventStatusLabel,
        preRegistrationStatus: str(v.preRegistrationStatus ?? s.preRegistrationStatus, 100),
        officialRegistrationStatus: str(v.officialRegistrationStatus ?? s.officialRegistrationStatus, 100),
        registrationDeadlineText: str(v.registrationDeadlineText ?? s.registrationDeadlineText, 160),
        contactEmail: str(v.contactEmail ?? s.contactEmail, 200),
        contactPhone: str(v.contactPhone ?? s.contactPhone, 40),
        grievanceText: str(v.grievanceText ?? s.grievanceText, 1000),
        submissionInstructions: str(v.submissionInstructions ?? s.submissionInstructions, 3000),
        heroImageUrl: safeImageUrl(v.heroImageUrl ?? s.heroImageUrl),
        secondaryImageUrl: safeImageUrl(v.secondaryImageUrl ?? s.secondaryImageUrl),
        mentorImageUrl: safeImageUrl(v.mentorImageUrl ?? s.mentorImageUrl),
        demoImageUrl: safeImageUrl(v.demoImageUrl ?? s.demoImageUrl),
      };
    }
    case "home": {
      if (!value || typeof value !== "object") throw bad();
      const v = value as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const k of Object.keys(current.home)) out[k] = str(v[k] ?? (current.home as unknown as Record<string, string>)[k], 2000);
      return out;
    }
    case "tracks": {
      if (!Array.isArray(value) || value.length > 20) throw bad();
      return value.map((t, i) => {
        const o = (t ?? {}) as Record<string, unknown>;
        return { id: str(o.id, 40) || `track-${i + 1}`, title: str(o.title, 80), description: str(o.description, 300) };
      });
    }
    case "prizes": {
      if (!value || typeof value !== "object") throw bad();
      const v = value as Record<string, unknown>;
      const items = Array.isArray(v.items) ? v.items.slice(0, 10) : [];
      const add = (v.additional ?? {}) as Record<string, unknown>;
      return {
        notice: str(v.notice, 500),
        items: items.map((p) => {
          const o = (p ?? {}) as Record<string, unknown>;
          return { rank: str(o.rank, 20), title: str(o.title, 80), amount: str(o.amount, 60), ...(o.extra ? { extra: str(o.extra, 120) } : {}) };
        }),
        additional: { title: str(add.title, 100), description: str(add.description, 800) },
      };
    }
    case "schedule": {
      if (!value || typeof value !== "object") throw bad();
      const v = value as Record<string, unknown>;
      const days = Array.isArray(v.days) ? v.days.slice(0, 7) : [];
      return {
        notice: str(v.notice, 400),
        days: days.map((d) => {
          const o = (d ?? {}) as Record<string, unknown>;
          return {
            day: str(o.day, 40),
            title: str(o.title, 120),
            items: (Array.isArray(o.items) ? o.items.slice(0, 20) : []).map((i) => str(i, 200)),
          };
        }),
      };
    }
    case "faqs": {
      if (!Array.isArray(value) || value.length > 40) throw bad();
      return value.map((f) => {
        const o = (f ?? {}) as Record<string, unknown>;
        return { question: str(o.question, 250), answer: str(o.answer, 1500) };
      });
    }
    case "policies": {
      if (!value || typeof value !== "object") throw bad();
      const v = value as Record<string, Record<string, unknown>>;
      const out: Record<string, unknown> = {};
      for (const slug of POLICY_SLUGS) {
        const incoming = v[slug];
        const cur = current.policies[slug];
        if (!incoming) {
          out[slug] = cur;
          continue;
        }
        const body = str(incoming.body ?? cur.body, 20000);
        const title = str(incoming.title ?? cur.title, 120);
        const published = bool(incoming.published, cur.published);
        const changed = body !== cur.body || title !== cur.title || published !== cur.published;
        out[slug] = { title, body, published, updatedAt: changed ? new Date().toISOString() : cur.updatedAt };
      }
      return out;
    }
  }
}

function publicContent(content: HackathonContent) {
  const policies: Record<string, unknown> = {};
  for (const slug of POLICY_SLUGS) {
    const p = content.policies[slug];
    policies[slug] = p.published
      ? { title: p.title, body: p.body, published: true, updatedAt: p.updatedAt }
      : { title: p.title, body: "", published: false, updatedAt: null };
  }
  const { feePerPerson, maxTeamSize, tax } = content.settings;
  return {
    settings: {
      eventName: content.settings.eventName,
      editionLabel: content.settings.editionLabel,
      location: content.settings.location,
      dateText: content.settings.dateText,
      venueText: content.settings.venueText,
      formatText: content.settings.formatText,
      physicalDurationText: content.settings.physicalDurationText,
      expectedPhysicalAttendance: content.settings.expectedPhysicalAttendance,
      targetParticipants: content.settings.targetParticipants,
      maxParticipants: content.settings.maxParticipants,
      feePerPerson,
      maxTeamSize: Math.min(maxTeamSize || 15, 15),
      tax,
      registrationOpen: content.settings.registrationOpen,
      physicalRegistrationAvailable: content.settings.physicalRegistrationAvailable,
      eventStatus: content.settings.eventStatus,
      preRegistrationStatus: content.settings.preRegistrationStatus,
      officialRegistrationStatus: content.settings.officialRegistrationStatus,
      registrationDeadlineText: content.settings.registrationDeadlineText,
      contactEmail: content.settings.contactEmail,
      contactPhone: content.settings.contactPhone,
      grievanceText: content.settings.grievanceText,
      heroImageUrl: content.settings.heroImageUrl,
      secondaryImageUrl: content.settings.secondaryImageUrl,
      mentorImageUrl: content.settings.mentorImageUrl,
      demoImageUrl: content.settings.demoImageUrl,
    },
    home: content.home,
    tracks: content.tracks,
    prizes: content.prizes,
    schedule: content.schedule,
    faqs: content.faqs,
    policies,
  };
}

// ── CSV ──────────────────────────────────────────────────────────────────────
function csvCell(v: unknown): string {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
}
function toCsv(columns: { key: string; label: string }[], rows: Record<string, unknown>[]): string {
  const head = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(","));
  return "\ufeff" + [head, ...body].join("\r\n");
}

function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

// ── Router ───────────────────────────────────────────────────────────────────
export function createHackathonHandler(deps: HandlerDeps = { verifyToken: verifySupabaseAccessToken }) {
  return async function handleHackathonApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const origin = requestOrigin(req);
    const url = new URL(req.url || "/", origin);
    const rawRoute = url.pathname.replace(/^\/api\/hackathon\/?/, "").replace(/\/+$/, "");
    const route =
      rawRoute && rawRoute !== "[...route]" && rawRoute !== "index"
        ? rawRoute
        : (url.searchParams.get("__route") || url.searchParams.get("route") || "").replace(/^\/+|\/+$/g, "");
    const method = (req.method || "GET").toUpperCase();
    const local = isLocalOrigin(origin);

    try {
      // ── Public: content + stats ───────────────────────────────────────────
      if (route === "content" && method === "GET") {
        rateLimit(req, "content", 120, 60_000);
        const { content, degraded } = await loadContent();
        const stats = await publicStats(content).catch(() => null);
        let announcements: unknown[] = [];
        if (hasDatabaseUrl()) {
          announcements = await getSql()`select id, title, body, created_at from hk_announcements where published order by created_at desc limit 10`.catch(() => []);
        }
        const open = isRegistrationActuallyOpen(content);
        sendJson(res, 200, {
          ok: true,
          degraded,
          content: publicContent(content),
          registration: { open: open.open, reason: open.reason },
          stats,
          announcements,
        });
        return;
      }

      // ── Public: verify a Hackathon Pass (AIH-R-XXXXXX or AIH-T-XXXXXX) ────
      if (route === "verify" && method === "GET") {
        rateLimit(req, "verify", 60, 60_000);
        const code = (url.searchParams.get("id") || "").trim().toUpperCase();
        if (!/^AIH-[RT]-\d{6}$/.test(code)) {
          sendJson(res, 404, { ok: false, verified: false, participantId: code, error: "Pass ID not found." });
          return;
        }
        // Built-in demo passes for previewing QR verification
        if (code === "AIH-R-000101" || code === "AIH-R-000102" || code === "AIH-R-000219") {
          const demoNames: Record<string, string> = {
            "AIH-R-000101": "Aarav Sharma (Demo Team Leader · Bhopal Neural Labs)",
            "AIH-R-000102": "Ananya Verma (Demo Team Member · Bhopal Neural Labs)",
            "AIH-R-000219": "Rohan Deshmukh (Demo Solo Builder · Indore Solo Systems)",
          };
          sendJson(res, 200, {
            ok: true,
            verified: true,
            edition: "DESIGN. BUILD. SELL. IN ONE DAY.",
            competition: "AVATAR",
            participantId: code,
            participantName: demoNames[code],
            status: "VERIFIED",
            registeredAt: new Date().toISOString(),
          });
          return;
        }

        if (hasDatabaseUrl()) {
          const rows = await getSql()<{
            registration_code: string;
            full_name: string;
            is_leader: boolean;
            organisation: string | null;
            course: string | null;
            team_code: string;
            team_name: string;
            member_count: number;
            confirmed_at: string | null;
          }[]>`
            select p.registration_code, p.full_name, p.is_leader, p.organisation, p.course,
                   t.team_code, t.name as team_name, t.member_count, t.confirmed_at
            from hk_participants p
            join hk_teams t on t.id = p.team_id
            where t.status = 'CONFIRMED' and p.active
              and (p.registration_code = ${code} or (t.team_code = ${code} and p.is_leader))
            limit 1`.catch(() => []);
          const hit = rows[0];
          if (hit) {
            sendJson(res, 200, {
              ok: true,
              verified: true,
              edition: "DESIGN. BUILD. SELL. IN ONE DAY.",
              competition: "AVATAR",
              participantId: hit.registration_code,
              participantName: `${hit.full_name} (${hit.is_leader ? "Team Leader" : "Team Member"} · ${hit.team_name} · ${hit.team_code})`,
              status: "VERIFIED",
              registeredAt: hit.confirmed_at,
              pass: {
                registrationCode: hit.registration_code,
                teamCode: hit.team_code,
                teamName: hit.team_name,
                fullName: hit.full_name,
                role: hit.is_leader ? "Team Leader" : "Team Member",
                organisation: hit.organisation,
                course: hit.course,
                memberCount: hit.member_count,
                verifiedAt: hit.confirmed_at,
              },
            });
            return;
          }
        }

        const fbHit = fallbackVerifyPass(code);
        if (fbHit) {
          sendJson(res, 200, fbHit);
          return;
        }

        sendJson(res, 404, { ok: false, verified: false, participantId: code, error: "No confirmed AVATAR Pass matches this ID." });
        return;
      }

      // ── Public: create team (step 3 → payment) ────────────────────────────
      if (route === "register" && method === "POST") {
        rateLimit(req, "register", 8, 10 * 60_000);
        const body = await readJson(req);
        const { content } = await loadContent();
        const v = validateTeamInput(body, {
          maxTeamSize: content.settings.maxTeamSize,
          physicalAvailable: content.settings.physicalRegistrationAvailable,
        });
        if (!v.ok) throw new HttpError(400, "VALIDATION", "Please correct the highlighted fields.", v.errors);
        const sandbox = local && body.sandbox === true;
        const { teamId, fee } = await registerTeam(v.value, content, { origin, sandbox });
        sendJson(res, 200, {
          ok: true,
          teamToken: issueToken("team", teamId, TEAM_TOKEN_TTL),
          fee,
        });
        return;
      }

      // ── Public: start (or retry) payment ──────────────────────────────────
      if (route === "payment/initiate" && method === "POST") {
        rateLimit(req, "initiate", 12, 10 * 60_000);
        const body = await readJson(req);
        const teamId = readToken(typeof body.teamToken === "string" ? body.teamToken : "", "team");
        if (!teamId) throw new HttpError(401, "INVALID_TOKEN", "Your registration session expired. Please start again.");
        const { content } = await loadContent();
        const sandbox = local && body.sandbox === true;
        const result = await initiatePayment(teamId, content, { origin, sandbox });
        if (result.alreadyPaid) {
          let payment: PaymentRow | undefined;
          if (hasDatabaseUrl() && !teamId.startsWith("fkt_")) {
            payment = (await getSql()<PaymentRow[]>`select * from hk_payments where team_id = ${result.team.id} and status = 'SUCCESS' limit 1`.catch(() => []))[0];
          }
          sendJson(res, 200, {
            ok: true,
            alreadyPaid: true,
            payToken: payment ? issueToken("pay", payment.txnid, PAY_TOKEN_TTL) : null,
            txn: payment?.txnid ?? null,
          });
          return;
        }
        sendJson(res, 200, {
          ok: true,
          alreadyPaid: false,
          checkout: result.checkout,
          payToken: issueToken("pay", result.checkout.txnid, PAY_TOKEN_TTL),
        });
        return;
      }

      // ── PayU callback (browser redirect + webhook style) ──────────────────
      if (route === "payu-callback" && (method === "POST" || method === "GET")) {
        rateLimit(req, "callback", 60, 60_000);
        const payload = method === "POST" ? await readParams(req) : Object.fromEntries(url.searchParams.entries());
        const { txnid, known } = await handlePayuCallback(payload, { origin, localOrigin: local });
        if (!txnid || !known) {
          redirect(res, `${origin}/competition/payment`);
          return;
        }
        redirect(res, `${origin}/competition/payment?txn=${encodeURIComponent(txnid)}&t=${encodeURIComponent(issueToken("pay", txnid, PAY_TOKEN_TTL))}`);
        return;
      }

      // ── Public (token): payment status + reconciliation ───────────────────
      if (route === "payment/status" && method === "GET") {
        rateLimit(req, "status", 60, 60_000);
        const txn = (url.searchParams.get("txn") || "").trim();
        const subject = readToken(url.searchParams.get("t"), "pay");
        if (!txn || subject !== txn) throw new HttpError(401, "INVALID_TOKEN", "This payment link is invalid or has expired.");
        let payment = await getPayment(txn);
        if (!payment) throw new HttpError(404, "NOT_FOUND", "Transaction not found.");

        const wantsReconcile = url.searchParams.get("reconcile") === "1";
        if (wantsReconcile && ["INITIATED", "PENDING"].includes(payment.status)) {
          const last = lastReconcileAt.get(txn) ?? 0;
          if (Date.now() - last > 8000) {
            lastReconcileAt.set(txn, Date.now());
            const r = await reconcilePayment(txn, origin, { sandbox: local && payment.environment === "sandbox" });
            payment = r.payment;
          }
        }

        const team = (await getTeam(payment.team_id))!;
        const confirmed = payment.status === "SUCCESS" && team.status === "CONFIRMED";
        const members = confirmed ? await getMembers(team.id) : [];
        sendJson(res, 200, {
          ok: true,
          payment: publicPaymentView(payment),
          team: confirmed ? teamView(team) : { name: team.name, status: team.status, memberCount: team.member_count },
          members: members.map((m) => memberView(m, { contact: false })),
          teamToken: team.status === "PENDING_PAYMENT" ? issueToken("team", team.id, TEAM_TOKEN_TTL) : null,
          emails:
            confirmed && !team.emails_sent_at
              ? buildEmailPayloads(team, members, payment, origin)
              : null,
          emailJs: confirmed && !team.emails_sent_at
            ? { serviceId: process.env.VITE_EMAILJS_SERVICE_ID || "", templateId: process.env.VITE_EMAILJS_TEMPLATE_ID || "" }
            : null,
        });
        return;
      }

      if (route === "payment/emails-sent" && method === "POST") {
        rateLimit(req, "emails", 20, 60_000);
        const body = await readJson(req);
        const txn = typeof body.txn === "string" ? body.txn : "";
        const subject = readToken(typeof body.t === "string" ? body.t : "", "pay");
        if (!txn || subject !== txn) throw new HttpError(401, "INVALID_TOKEN", "Invalid token.");
        const payment = await getPayment(txn);
        if (!payment || payment.status !== "SUCCESS") throw new HttpError(409, "NOT_CONFIRMED", "Payment is not confirmed.");
        if (hasDatabaseUrl()) {
          await getSql()`update hk_teams set emails_sent_at = now() where id = ${payment.team_id} and emails_sent_at is null`.catch(() => {});
        }
        sendJson(res, 200, { ok: true });
        return;
      }

      // ── Sign-in link (Supabase magic link), enumeration-safe ──────────────
      if (route === "auth/login-link" && method === "POST") {
        rateLimit(req, "login", 5, 10 * 60_000);
        const body = await readJson(req);
        const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
        if (!EMAIL_RE.test(email)) throw new HttpError(400, "VALIDATION", "Enter a valid email address.");
        if (hasDatabaseUrl()) {
          const sql = getSql();
          const known =
            (await sql`select 1 from hk_participants where email_norm = ${email} and active limit 1`.catch(() => [])).length > 0 ||
            (await adminRoleFor(email)) !== null;
          if (known) {
            const base = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
            const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();
            if (base && key) {
              await fetch(`${base}/auth/v1/otp?redirect_to=${encodeURIComponent(`${origin}/competition/dashboard`)}`, {
                method: "POST",
                headers: { apikey: key, "Content-Type": "application/json" },
                body: JSON.stringify({ email, create_user: true }),
                signal: AbortSignal.timeout(10_000),
              }).catch(() => undefined);
            }
          }
        }
        sendJson(res, 200, { ok: true, message: "If this email is registered, a sign-in link has been sent." });
        return;
      }

      // ── Authenticated participant ─────────────────────────────────────────
      if (route === "me" && method === "GET") {
        rateLimit(req, "me", 60, 60_000);
        const user = await requireUser(req, deps.verifyToken);
        const sql = getSql();
        const role = await adminRoleFor(user.email);
        const [me] = await sql<ParticipantRow[]>`select * from hk_participants where email_norm = ${user.email} and active limit 1`;
        const announcements = await sql`select id, title, body, created_at from hk_announcements where published order by created_at desc limit 20`;
        const { content } = await loadContent();
        if (!me) {
          sendJson(res, 200, { ok: true, email: user.email, adminRole: role, team: null, announcements });
          return;
        }
        const team = (await getTeam(me.team_id))!;
        const members = await getMembers(team.id);
        const [payment] = await sql<PaymentRow[]>`
          select * from hk_payments where team_id = ${team.id}
          order by (status = 'SUCCESS') desc, created_at desc limit 1`;
        const requests = me.is_leader
          ? await sql`select id, kind, payload, status, admin_note, created_at, resolved_at from hk_change_requests where team_id = ${team.id} order by created_at desc limit 20`
          : [];
        sendJson(res, 200, {
          ok: true,
          email: user.email,
          adminRole: role,
          me: memberView(me, { contact: true }),
          team: teamView(team),
          members: members.map((m) => memberView(m, { contact: me.is_leader || m.id === me.id })),
          payment: payment ? publicPaymentView(payment) : null,
          requests,
          announcements,
          schedule: content.schedule,
          submissionInstructions: team.status === "CONFIRMED" ? content.settings.submissionInstructions : null,
          settings: { dateText: content.settings.dateText, venueText: content.settings.venueText, eventName: content.settings.eventName },
        });
        return;
      }

      if (route === "me/profile" && method === "POST") {
        rateLimit(req, "profile", 20, 60_000);
        const user = await requireUser(req, deps.verifyToken);
        const body = await readJson(req);
        const github = normalizeGithub(typeof body.github === "string" ? body.github : "");
        const linkedin = normalizeLinkedin(typeof body.linkedin === "string" ? body.linkedin : "");
        if (github === null || linkedin === null) {
          throw new HttpError(400, "VALIDATION", "Profile links must be github.com / linkedin.com URLs.");
        }
        const sql = getSql();
        const rows = await sql<{ id: string }[]>`
          update hk_participants set
            organisation = ${cleanText(body.organisation, 120) || null},
            course = ${cleanText(body.course, 120) || null},
            city = ${cleanText(body.city, 80) || null},
            state = ${cleanText(body.state, 80) || null},
            github = ${github || null}, linkedin = ${linkedin || null},
            skills = ${cleanText(body.skills, 300) || null},
            updated_at = now()
          where email_norm = ${user.email} and active returning id`;
        if (!rows.length) throw new HttpError(404, "NOT_FOUND", "No registration found for this account.");
        sendJson(res, 200, { ok: true });
        return;
      }

      if (route === "me/change-requests" && method === "POST") {
        rateLimit(req, "change", 10, 10 * 60_000);
        const user = await requireUser(req, deps.verifyToken);
        const body = await readJson(req);
        const sql = getSql();
        const [me] = await sql<ParticipantRow[]>`select * from hk_participants where email_norm = ${user.email} and active limit 1`;
        if (!me || !me.is_leader) throw new HttpError(403, "FORBIDDEN", "Only the team leader can request changes.");
        const team = (await getTeam(me.team_id))!;
        if (team.status !== "CONFIRMED") throw new HttpError(409, "NOT_CONFIRMED", "Changes can be requested after registration is confirmed.");
        const kind = body.kind === "REPLACE_MEMBER" ? "REPLACE_MEMBER" : body.kind === "UPDATE_TEAM" ? "UPDATE_TEAM" : "OTHER";
        let payload: Record<string, unknown> = { note: cleanText(body.note, 500) };
        if (kind === "REPLACE_MEMBER") {
          const code = cleanText(body.registrationCode, 30);
          const mobile = normalizeMobile(typeof body.mobile === "string" ? body.mobile : "");
          const email = cleanText(body.email, 254);
          const fullName = cleanText(body.fullName, 90);
          if (!code || !EMAIL_RE.test(email) || !mobile || fullName.length < 2) {
            throw new HttpError(400, "VALIDATION", "Provide the member's registration ID and the new member's name, email and mobile number.");
          }
          const target = (await getMembers(team.id)).find((m) => m.registration_code === code);
          if (!target || target.is_leader) throw new HttpError(400, "VALIDATION", "Choose a non-leader team member to replace.");
          payload = { ...payload, registrationCode: code, fullName, email, mobile };
        }
        const [row] = await sql<{ id: number }[]>`
          insert into hk_change_requests (team_id, requested_by, kind, payload)
          values (${team.id}, ${user.email}, ${kind}, ${sql.json(payload as never)}) returning id`;
        sendJson(res, 200, { ok: true, id: row.id });
        return;
      }

      // ── Admin ─────────────────────────────────────────────────────────────
      if (route.startsWith("admin/")) {
        return await handleAdmin(req, res, route.slice("admin/".length), method, url, origin, local, deps);
      }

      throw new HttpError(404, "NOT_FOUND", "Unknown API route.");
    } catch (err) {
      if (err instanceof HttpError) {
        sendJson(res, err.status, { ok: false, code: err.code, error: err.message, fields: err.fields });
        return;
      }
      const msg = err instanceof Error ? err.message : "";
      // Log a short, secret-free diagnostic. Never log request bodies.
      console.error(`[hackathon-api] ${method} ${route} failed: ${msg.slice(0, 200)}`);
      if (/DATABASE_URL|ECONN|ENOTFOUND|ETIMEDOUT|CONNECT_TIMEOUT|EAI_AGAIN/i.test(msg)) {
        sendJson(res, 503, { ok: false, code: "UNAVAILABLE", error: "The service is temporarily unavailable. Please try again shortly." });
        return;
      }
      if (/PayU/i.test(msg)) {
        sendJson(res, 502, { ok: false, code: "PAYMENT_CONFIG", error: "Payment is temporarily unavailable. Please try again shortly." });
        return;
      }
      sendJson(res, 500, { ok: false, code: "INTERNAL", error: "Something went wrong. Please try again." });
    }
  };
}

// ── Admin routes ─────────────────────────────────────────────────────────────
async function handleAdmin(
  req: IncomingMessage,
  res: ServerResponse,
  route: string,
  method: string,
  url: URL,
  origin: string,
  local: boolean,
  deps: HandlerDeps
): Promise<void> {
  const write = method !== "GET";
  const admin = await requireAdmin(req, deps.verifyToken, { write });
  const sql = getSql();
  rateLimit(req, "admin", 240, 60_000);

  if (route === "overview" && method === "GET") {
    const [totals] = await sql<{ participants: number; teams: number; revenue: number; refunded: number; pending: number; failed: number; review: number }[]>`
      select
        (select count(*)::int from hk_participants p join hk_teams t on t.id = p.team_id where t.status = 'CONFIRMED' and p.active) as participants,
        (select count(*)::int from hk_teams where status = 'CONFIRMED') as teams,
        (select coalesce(sum(amount_inr), 0)::int from hk_payments where status = 'SUCCESS') as revenue,
        (select coalesce(sum(r.amount_inr), 0)::int from hk_refunds r where r.status = 'PROCESSED') as refunded,
        (select count(*)::int from hk_payments where status in ('INITIATED', 'PENDING')) as pending,
        (select count(*)::int from hk_payments where status in ('FAILED', 'CANCELLED', 'EXPIRED')) as failed,
        (select count(*)::int from hk_payments where needs_review) as review`;
    const daily = await sql`
      select (confirmed_at at time zone 'Asia/Kolkata')::date as day, count(*)::int as teams, sum(member_count)::int as participants
      from hk_teams where status = 'CONFIRMED' and confirmed_at > now() - interval '30 days'
      group by 1 order by 1 desc`;
    const byMode = await sql`
      select mode, count(*)::int as teams, coalesce(sum(member_count), 0)::int as participants
      from hk_teams where status = 'CONFIRMED' group by mode`;
    sendJson(res, 200, { ok: true, adminEmail: admin.email, role: admin.role, totals, daily, byMode });
    return;
  }

  if ((route === "registrations" || route === "registrations.csv") && method === "GET") {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
    const mode = url.searchParams.get("mode") === "ONLINE" ? "ONLINE" : url.searchParams.get("mode") === "PHYSICAL" ? "PHYSICAL" : "";
    const pay = (url.searchParams.get("paymentStatus") || "").toUpperCase();
    const size = url.searchParams.get("teamSize") || "";
    const csv = route.endsWith(".csv");
    const limit = csv ? 20000 : Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
    const offset = csv ? 0 : Math.max(0, Number(url.searchParams.get("offset")) || 0);
    const sizeCond =
      size === "1" ? sql`and t.member_count = 1` :
      size === "2-3" ? sql`and t.member_count between 2 and 3` :
      size === "4+" ? sql`and t.member_count >= 4` : sql``;
    const rows = await sql`
      select p.registration_code, p.is_leader, p.full_name, p.email, p.mobile, p.organisation, p.course, p.city, p.state,
             p.github, p.linkedin, t.id as team_id, t.team_code, t.name as team_name, t.mode, t.member_count,
             t.status as team_status, pay.status as payment_status, pay.txnid, pay.amount_inr, pay.created_at as payment_at
      from hk_participants p
      join hk_teams t on t.id = p.team_id
      left join lateral (
        select * from hk_payments x where x.team_id = t.id order by (x.status = 'SUCCESS') desc, x.created_at desc limit 1
      ) pay on true
      where t.status in ('PENDING_PAYMENT', 'CONFIRMED')
        ${q ? sql`and (p.full_name ilike ${likePattern(q)} or p.email ilike ${likePattern(q)} or p.mobile ilike ${likePattern(q)}
                   or t.name ilike ${likePattern(q)} or t.team_code ilike ${likePattern(q)} or p.registration_code ilike ${likePattern(q)})` : sql``}
        ${mode ? sql`and t.mode = ${mode}` : sql``}
        ${pay ? sql`and pay.status = ${pay}` : sql``}
        ${sizeCond}
      order by t.created_at desc, p.is_leader desc, p.created_at
      limit ${limit} offset ${offset}`;
    if (csv) {
      await audit(sql, admin.email, "EXPORT_REGISTRATIONS", "registrations", null, { rows: rows.length });
      sendText(res, 200, "text/csv; charset=utf-8", toCsv(
        [
          { key: "team_code", label: "Team ID" }, { key: "team_name", label: "Team name" },
          { key: "registration_code", label: "Registration ID" }, { key: "is_leader", label: "Team leader" },
          { key: "full_name", label: "Name" }, { key: "email", label: "Email" }, { key: "mobile", label: "Mobile" },
          { key: "organisation", label: "College / organisation" }, { key: "course", label: "Course / designation" },
          { key: "city", label: "City" }, { key: "state", label: "State" }, { key: "github", label: "GitHub" },
          { key: "linkedin", label: "LinkedIn" }, { key: "mode", label: "Mode" }, { key: "member_count", label: "Team size" },
          { key: "team_status", label: "Registration status" }, { key: "payment_status", label: "Payment status" },
          { key: "txnid", label: "Payment reference" }, { key: "amount_inr", label: "Team amount (INR)" },
        ],
        rows as unknown as Record<string, unknown>[]
      ), "registrations.csv");
      return;
    }
    sendJson(res, 200, { ok: true, rows, limit, offset });
    return;
  }

  const teamMatch = route.match(/^teams\/([0-9a-f-]{36})(?:\/(status))?$/);
  if (teamMatch && method === "GET" && !teamMatch[2]) {
    const team = await getTeam(teamMatch[1]);
    if (!team) throw new HttpError(404, "NOT_FOUND", "Team not found.");
    const members = await getMembers(team.id);
    const payments = await sql`select * from hk_payments where team_id = ${team.id} order by created_at desc`;
    const requests = await sql`select * from hk_change_requests where team_id = ${team.id} order by created_at desc`;
    sendJson(res, 200, { ok: true, team: teamView(team), members: members.map((m) => memberView(m, { contact: true })), payments, requests });
    return;
  }
  if (teamMatch && method === "POST" && teamMatch[2] === "status") {
    const body = await readJson(req);
    const status = body.status === "CANCELLED" ? "CANCELLED" : body.status === "CONFIRMED" ? "CONFIRMED" : null;
    if (!status) throw new HttpError(400, "VALIDATION", "Status must be CONFIRMED or CANCELLED.");
    const team = await getTeam(teamMatch[1]);
    if (!team) throw new HttpError(404, "NOT_FOUND", "Team not found.");
    if (status === "CONFIRMED") {
      const [paid] = await sql`select 1 from hk_payments where team_id = ${team.id} and status = 'SUCCESS' limit 1`;
      if (!paid) throw new HttpError(409, "NO_VERIFIED_PAYMENT", "A team can only be confirmed through a verified payment.");
    }
    await sql.begin(async (tx) => {
      const q = tx as unknown as Sql;
      await q`update hk_teams set status = ${status}, updated_at = now() where id = ${team.id}`;
      await q`update hk_participants set active = ${status === "CONFIRMED"}, updated_at = now() where team_id = ${team.id}`;
    });
    await audit(sql, admin.email, "TEAM_STATUS", "team", team.id, { from: team.status, to: status });
    sendJson(res, 200, { ok: true });
    return;
  }

  if ((route === "payments" || route === "payments.csv") && method === "GET") {
    const status = (url.searchParams.get("status") || "").toUpperCase();
    const review = url.searchParams.get("review") === "1";
    const csv = route.endsWith(".csv");
    const rows = await sql`
      select p.txnid, p.status, p.amount_inr, p.member_count, p.fee_per_person, p.tax_inr, p.environment, p.payu_mihpayid,
             p.failure_reason, p.needs_review, p.created_at, p.updated_at, p.verified_at,
             t.name as team_name, t.team_code, t.status as team_status,
             (select email from hk_participants x where x.team_id = t.id and x.is_leader limit 1) as leader_email
      from hk_payments p join hk_teams t on t.id = p.team_id
      where true ${status ? sql`and p.status = ${status}` : sql``} ${review ? sql`and p.needs_review` : sql``}
      order by p.created_at desc limit ${csv ? 20000 : 200}`;
    if (csv) {
      await audit(sql, admin.email, "EXPORT_PAYMENTS", "payments", null, { rows: rows.length });
      sendText(res, 200, "text/csv; charset=utf-8", toCsv(
        [
          { key: "created_at", label: "Created" }, { key: "txnid", label: "Payment reference" },
          { key: "payu_mihpayid", label: "PayU ID" }, { key: "team_code", label: "Team ID" }, { key: "team_name", label: "Team" },
          { key: "leader_email", label: "Leader email" }, { key: "member_count", label: "Members" },
          { key: "fee_per_person", label: "Fee per person" }, { key: "tax_inr", label: "Tax" }, { key: "amount_inr", label: "Amount (INR)" },
          { key: "status", label: "Status" }, { key: "environment", label: "Environment" }, { key: "needs_review", label: "Needs review" },
          { key: "verified_at", label: "Verified at" },
        ],
        rows as unknown as Record<string, unknown>[]
      ), "payments.csv");
      return;
    }
    sendJson(res, 200, { ok: true, rows });
    return;
  }

  const payMatch = route.match(/^payments\/([A-Za-z0-9]{6,40})\/(reconcile|refund|events)$/);
  if (payMatch) {
    const txn = payMatch[1];
    const payment = await getPayment(txn);
    if (!payment) throw new HttpError(404, "NOT_FOUND", "Transaction not found.");
    if (payMatch[2] === "events" && method === "GET") {
      const events = await sql`select event, status, source, detail, created_at from hk_payment_events where txnid = ${txn} order by id`;
      sendJson(res, 200, { ok: true, payment, events });
      return;
    }
    if (payMatch[2] === "reconcile" && method === "POST") {
      const r = await reconcilePayment(txn, origin, { sandbox: local && payment.environment === "sandbox" });
      await audit(sql, admin.email, "RECONCILE", "payment", txn, { result: r.payment.status, gateway: r.gateway });
      sendJson(res, 200, { ok: true, status: r.payment.status, gateway: r.gateway });
      return;
    }
    if (payMatch[2] === "refund" && method === "POST") {
      const body = await readJson(req);
      const reason = cleanText(body.reason, 300);
      const amount = int(body.amountInr, 1, payment.amount_inr, 0);
      if (!reason || !amount) throw new HttpError(400, "VALIDATION", "Provide a reason and a valid refund amount.");
      if (payment.status !== "SUCCESS") throw new HttpError(409, "INVALID_STATE", "Only a successful payment can be refunded.");
      const [refund] = await sql<{ id: number }[]>`
        insert into hk_refunds (payment_id, amount_inr, reason, recorded_by) values (${payment.id}, ${amount}, ${reason}, ${admin.email}) returning id`;
      await applyPaymentOutcome(txn, { status: "REFUND_PENDING", source: "admin" });
      await audit(sql, admin.email, "REFUND_REQUESTED", "payment", txn, { amount, refundId: refund.id });
      sendJson(res, 200, { ok: true, refundId: refund.id });
      return;
    }
  }

  const refundMatch = route.match(/^refunds\/(\d+)\/resolve$/);
  if (refundMatch && method === "POST") {
    const body = await readJson(req);
    const action = body.action === "processed" ? "processed" : body.action === "rejected" ? "rejected" : null;
    if (!action) throw new HttpError(400, "VALIDATION", "Action must be processed or rejected.");
    const gatewayRef = cleanText(body.gatewayRef, 80);
    if (action === "processed" && !gatewayRef) throw new HttpError(400, "VALIDATION", "Enter the PayU refund reference.");
    const id = Number(refundMatch[1]);
    await sql.begin(async (tx) => {
      const q = tx as unknown as Sql;
      const [r] = await q<{ id: number; payment_id: string; amount_inr: number; status: string }[]>`select * from hk_refunds where id = ${id} for update`;
      if (!r || r.status !== "REQUESTED") throw new HttpError(409, "INVALID_STATE", "Refund is not awaiting resolution.");
      const [p] = await q<PaymentRow[]>`select * from hk_payments where id = ${r.payment_id} for update`;
      if (action === "processed") {
        await q`update hk_refunds set status = 'PROCESSED', gateway_ref = ${gatewayRef}, processed_at = now() where id = ${id}`;
        if (r.amount_inr >= p.amount_inr) {
          await q`update hk_payments set status = 'REFUNDED', updated_at = now() where id = ${p.id}`;
          await q`update hk_teams set status = 'CANCELLED', updated_at = now() where id = ${p.team_id}`;
          await q`update hk_participants set active = false, updated_at = now() where team_id = ${p.team_id}`;
        } else {
          await q`update hk_payments set status = 'SUCCESS', updated_at = now() where id = ${p.id}`;
        }
      } else {
        await q`update hk_refunds set status = 'REJECTED', processed_at = now() where id = ${id}`;
        await q`update hk_payments set status = 'SUCCESS', updated_at = now() where id = ${p.id}`;
      }
    });
    await audit(sql, admin.email, `REFUND_${action.toUpperCase()}`, "refund", String(id), { gatewayRef });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (route === "refunds" && method === "GET") {
    const rows = await sql`
      select r.*, p.txnid, t.name as team_name, t.team_code from hk_refunds r
      join hk_payments p on p.id = r.payment_id join hk_teams t on t.id = p.team_id order by r.created_at desc limit 200`;
    sendJson(res, 200, { ok: true, rows });
    return;
  }

  if (route === "change-requests" && method === "GET") {
    const rows = await sql`
      select c.*, t.name as team_name, t.team_code from hk_change_requests c
      join hk_teams t on t.id = c.team_id order by (c.status = 'PENDING') desc, c.created_at desc limit 200`;
    sendJson(res, 200, { ok: true, rows });
    return;
  }

  const crMatch = route.match(/^change-requests\/(\d+)\/resolve$/);
  if (crMatch && method === "POST") {
    const body = await readJson(req);
    const approve = body.approve === true;
    const note = cleanText(body.note, 300);
    const id = Number(crMatch[1]);
    await sql.begin(async (tx) => {
      const q = tx as unknown as Sql;
      const [c] = await q<{ id: number; team_id: string; kind: string; payload: Record<string, string>; status: string }[]>`
        select * from hk_change_requests where id = ${id} for update`;
      if (!c || c.status !== "PENDING") throw new HttpError(409, "INVALID_STATE", "Request is already resolved.");
      if (approve && c.kind === "REPLACE_MEMBER") {
        const p = c.payload;
        const emailNorm = normalizeEmail(p.email);
        try {
          const rows = await q`
            update hk_participants set full_name = ${p.fullName}, email = ${p.email}, email_norm = ${emailNorm},
              mobile = ${p.mobile}, updated_at = now()
            where team_id = ${c.team_id} and registration_code = ${p.registrationCode} and not is_leader returning id`;
          if (!rows.length) throw new HttpError(409, "INVALID_STATE", "The member to replace no longer exists.");
        } catch (e) {
          if ((e as { code?: string }).code === "23505") {
            throw new HttpError(409, "ALREADY_REGISTERED", "The new member's email or mobile number is already registered.");
          }
          throw e;
        }
      }
      await q`update hk_change_requests set status = ${approve ? "APPROVED" : "REJECTED"}, admin_note = ${note || null},
              resolved_at = now(), resolved_by = ${admin.email} where id = ${id}`;
    });
    await audit(sql, admin.email, approve ? "CHANGE_APPROVED" : "CHANGE_REJECTED", "change_request", String(id), {});
    sendJson(res, 200, { ok: true });
    return;
  }

  // CMS
  if (route === "content" && method === "GET") {
    const { content } = await loadContent({ fresh: true });
    sendJson(res, 200, { ok: true, keys: CONTENT_KEYS, content, registration: isRegistrationActuallyOpen(content), payu: payuSummary(origin) });
    return;
  }
  const contentMatch = route.match(/^content\/([a-z]+)$/);
  if (contentMatch && method === "PUT") {
    const key = contentMatch[1] as ContentKey;
    if (!CONTENT_KEYS.includes(key)) throw new HttpError(404, "NOT_FOUND", "Unknown content section.");
    const body = await readJson(req);
    const { content } = await loadContent({ fresh: true });
    const clean = sanitizeContent(key, body.value, content);
    await sql`insert into hk_content (key, value, updated_by) values (${key}, ${sql.json(clean as never)}, ${admin.email})
              on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`;
    invalidateContentCache();
    await audit(sql, admin.email, "CONTENT_UPDATE", "content", key, {});
    const fresh = (await loadContent({ fresh: true })).content;
    sendJson(res, 200, { ok: true, content: fresh, registration: isRegistrationActuallyOpen(fresh) });
    return;
  }

  if (route === "announcements" && method === "POST") {
    const body = await readJson(req);
    const title = cleanText(body.title, 200);
    const text = typeof body.body === "string" ? body.body.slice(0, 5000) : "";
    if (!title || !text.trim()) throw new HttpError(400, "VALIDATION", "Title and message are required.");
    const [row] = await sql<{ id: number }[]>`insert into hk_announcements (title, body, created_by) values (${title}, ${text}, ${admin.email}) returning id`;
    await audit(sql, admin.email, "ANNOUNCEMENT_CREATE", "announcement", String(row.id), {});
    sendJson(res, 200, { ok: true, id: row.id });
    return;
  }
  if (route === "announcements" && method === "GET") {
    const rows = await sql`select * from hk_announcements order by created_at desc limit 100`;
    sendJson(res, 200, { ok: true, rows });
    return;
  }
  const annMatch = route.match(/^announcements\/(\d+)$/);
  if (annMatch && method === "DELETE") {
    await sql`delete from hk_announcements where id = ${Number(annMatch[1])}`;
    await audit(sql, admin.email, "ANNOUNCEMENT_DELETE", "announcement", annMatch[1], {});
    sendJson(res, 200, { ok: true });
    return;
  }

  throw new HttpError(404, "NOT_FOUND", "Unknown admin route.");
}

function payuSummary(origin: string) {
  try {
    const c = getPayUConfig(origin);
    return { environment: c.environment, mode: c.mode, usingLocalSandbox: c.usingLocalSandbox, endpoint: c.usingLocalSandbox ? "local simulator" : c.actionUrl };
  } catch (e) {
    return { error: (e as Error).message.slice(0, 160) };
  }
}

export const handleHackathonApi = createHackathonHandler();

// Re-exports used by tests
export { computeFee, mergeContent, pricingFrom };
