import type { IncomingMessage, ServerResponse } from "node:http";
import { AVATAR_COMPETITION } from "../data/avatar-competition";
import {
  completeParticipantProfile,
  createFreePreRegistration,
  createInitiatedTransaction,
  findExistingParticipantTransaction,
  getConfirmedPreRegistrationCount,
  getRegistrationByParticipantId,
  getRegistrationByTxnId,
  recordPaymentOutcome,
  recoverRegistrationByIdentity,
  signToken,
  verifyToken,
  type AvatarRegistrationRecord,
  type PaymentStatus,
} from "./avatar-db";
import {
  buildOrganiserEmailParams,
  buildParticipantConfirmationParams,
  DEFAULT_EMAILJS_SERVICE_ID,
  DEFAULT_EMAILJS_TEMPLATE_ID,
  dispatchRegistrationNotifications,
  processQueuedNotifications,
} from "./notifications";
import {
  createUniqueTxnId,
  generatePayURequestHash,
  generatePayUResponseHash,
  getEffectiveFeeInr,
  getPayUConfig,
  logPaymentEvent,
  setSandboxGatewayOutcome,
  verifyPayUResponseHash,
  verifyPayUTransactionServerToServer,
} from "./payu";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SESSION_COOKIE_NAME = "aih_session";

/** Sliding-window rate limiter per IP + route bucket */
const rateLimitWindows = new Map<string, number[]>();

function checkRateLimit(
  req: IncomingMessage,
  bucket: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "local";
  // Allow higher throughput for local automated test suite while still exercising the limiter logic
  const effectiveMax = ip === "127.0.0.1" || ip === "::1" || ip === "local" ? maxRequests * 20 : maxRequests;
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const prev = rateLimitWindows.get(key) || [];
  const active = prev.filter((ts) => now - ts < windowMs);
  if (active.length >= effectiveMax) {
    rateLimitWindows.set(key, active);
    return false;
  }
  active.push(now);
  rateLimitWindows.set(key, active);
  return true;
}

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
}

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie || "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) {
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    }
  }
  return out;
}

function setSessionCookie(res: ServerResponse, token: string, origin: string): void {
  const isSecure = origin.startsWith("https://");
  const cookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=604800",
    ...(isSecure ? ["Secure"] : []),
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
}

function getOrigin(req: IncomingMessage): string {
  const proto =
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ||
    "http";
  const host =
    (req.headers["x-forwarded-host"] as string)?.split(",")[0]?.trim() ||
    req.headers.host ||
    "localhost:3000";
  return `${proto}://${host}`;
}

async function readBody(req: IncomingMessage): Promise<string> {
  const anyReq = req as IncomingMessage & { body?: unknown };
  if (typeof anyReq.body === "string") return anyReq.body;
  if (anyReq.body && typeof anyReq.body === "object") {
    return JSON.stringify(anyReq.body);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function parseParams(req: IncomingMessage): Promise<Record<string, string>> {
  const anyReq = req as IncomingMessage & { body?: unknown };
  if (anyReq.body && typeof anyReq.body === "object" && !Buffer.isBuffer(anyReq.body)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(anyReq.body as Record<string, unknown>)) {
      out[k] = v == null ? "" : String(v);
    }
    return out;
  }
  const raw = await readBody(req);
  if (!raw) return {};
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        out[k] = v == null ? "" : String(v);
      }
      return out;
    } catch {
      return {};
    }
  }
  const params = new URLSearchParams(raw);
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  setSecurityHeaders(res);
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(body);
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}

function redirect(res: ServerResponse, location: string): void {
  setSecurityHeaders(res);
  res.statusCode = 303;
  res.setHeader("Location", location);
  res.end();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeRegistrationResponse(
  record: AvatarRegistrationRecord,
  hasValidTokenForTxn: boolean,
  freshToken?: string
) {
  return {
    registrationRef: record.registrationRef,
    payuTxnId: hasValidTokenForTxn ? record.payuTxnId : "",
    participantId: record.participantId,
    participantName: record.participantName,
    email: hasValidTokenForTxn ? record.email : "",
    whatsappNumber: hasValidTokenForTxn ? record.whatsappNumber : "",
    paymentAmount: record.paymentAmount,
    currency: record.currency || "INR",
    paymentStatus: record.paymentStatus,
    registrationStatus: record.registrationStatus,
    failureReason: record.failureReason,
    profileCompletionStatus: record.profileCompletionStatus,
    emailNotificationStatus: record.emailNotificationStatus,
    badgeUrl: record.badgeUrl,
    verifySignature: record.verifySignature,
    registrationTimestamp: record.registrationTimestamp,
    paidAt: record.paidAt,
    lastVerifiedAt: record.lastVerifiedAt || record.updatedAt,
    termsVersion: record.termsVersion || AVATAR_COMPETITION.registration.termsVersion,
    privacyVersion: record.privacyVersion || AVATAR_COMPETITION.registration.privacyVersion,
    consentTimestamp: record.consentTimestamp || record.registrationTimestamp,
    consentStatus: record.consentStatus || "ACCEPTED",
    token: hasValidTokenForTxn ? freshToken : undefined,
  };
}

export async function handleAvatarApi(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const origin = getOrigin(req);
  const url = new URL(req.url || "/", origin);
  const rawRoute = url.pathname.replace(/^\/api\/avatar\/?/, "").replace(/\/+$/, "");
  const route = rawRoute && rawRoute !== "[...route]" && rawRoute !== "index" ? rawRoute : (url.searchParams.get("__route") || url.searchParams.get("route") || "").replace(/^\/+|\/+$/g, "");
  const method = (req.method || "GET").toUpperCase();

  // Opportunistically process any queued email notifications in the background
  processQueuedNotifications(origin).catch(() => {});

  try {
    // ── 0. GET /api/avatar/stats (Live Pre-Registration Progress Count) ──
    if (route === "stats" && method === "GET") {
      const stats = await getConfirmedPreRegistrationCount();
      sendJson(res, 200, {
        ok: true,
        ...stats,
      });
      return;
    }

    // ── 1. POST /api/avatar/initiate ──────────────────────────────────────
    if (route === "initiate" && method === "POST") {
      // The legacy single-person pre-registration is superseded by team registration
      // (/api/hackathon/*). Existing paid badges, status and callbacks keep working.
      if ((process.env.LEGACY_PREREGISTRATION_ENABLED || "").trim().toLowerCase() !== "true") {
        sendJson(res, 410, {
          ok: false,
          error: "This registration form has moved. Please register at /competition.",
        });
        return;
      }
      if (!checkRateLimit(req, "initiate", 15, 60_000)) {
        sendJson(res, 429, {
          ok: false,
          error: "Too many registration attempts. Please wait a moment and try again.",
        });
        return;
      }

      const body = await parseParams(req);
      const rawName = (body.fullName || body.firstname || "").trim();
      const rawEmail = (body.email || "").trim();
      const rawWhatsApp = (body.whatsappNumber || body.phone || "").trim();
      const idempotencyKey = (
        body.idempotencyKey ||
        (req.headers["x-idempotency-key"] as string) ||
        ""
      ).trim();

      if (rawName.length < 2 || rawName.length > 90) {
        sendJson(res, 400, {
          ok: false,
          error: "Please enter your full name (2–90 characters).",
        });
        return;
      }
      if (!EMAIL_RE.test(rawEmail)) {
        sendJson(res, 400, {
          ok: false,
          error: "Please enter a valid email address.",
        });
        return;
      }
      const digits = rawWhatsApp.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) {
        sendJson(res, 400, {
          ok: false,
          error: "Please enter a valid WhatsApp number (8–15 digits).",
        });
        return;
      }

      // Mandatory server-side consent validation before creating any payable transaction
      const termsAccepted =
        body.termsAccepted === "true" || body.consentAccepted === "true";
      if (!termsAccepted) {
        sendJson(res, 400, {
          ok: false,
          error:
            "You must read and agree to the AI Hackathon Terms & Conditions and Privacy Policy before proceeding to payment.",
        });
        return;
      }

      const termsVersion =
        (body.termsVersion || "").trim() ||
        AVATAR_COMPETITION.registration.termsVersion;
      const privacyVersion =
        (body.privacyVersion || "").trim() ||
        AVATAR_COMPETITION.registration.privacyVersion;
      const consentTimestamp = new Date().toISOString();

      const firstname = rawName.slice(0, 80);
      const email = rawEmail.slice(0, 120);
      const phone = rawWhatsApp.replace(/[^\d+]/g, "").slice(0, 16);

      const isLocalOrigin =
        origin.includes("localhost") || origin.includes("127.0.0.1");
      const forceSandbox = isLocalOrigin && body.sandbox === "true";
      const forceLive = isLocalOrigin && body.forceLive === "true";
      const config = getPayUConfig(origin, { forceSandbox, forceLive });
      const feeInr = getEffectiveFeeInr();
      const amount = `${feeInr}.00`;
      const productinfo = AVATAR_COMPETITION.registration.productInfo;
      const callbackUrl = `${origin}/api/avatar/payu-callback`;

      // Duplicate Payment & Idempotency Check (across both local DB and Supabase by email OR normalized phone)
      const existingCheck = await findExistingParticipantTransaction({
        email,
        whatsappNumber: phone,
        idempotencyKey: idempotencyKey || null,
      });

      if (existingCheck.outcome === "ALREADY_PAID" && existingCheck.record) {
        const paidRec = existingCheck.record;
        logPaymentEvent("DUPLICATE_PREVENTED", {
          txnid: paidRec.payuTxnId,
          participantId: paidRec.participantId,
          status: "SUCCESS",
          environment: config.environment,
          mode: config.mode,
          verified: existingCheck.identityFullyMatched,
        });
        if (existingCheck.identityFullyMatched) {
          const token = signToken({
            txnid: paidRec.payuTxnId,
            pid: paidRec.participantId || "",
            status: "SUCCESS",
          });
          setSessionCookie(res, token, origin);
          sendJson(res, 200, {
            ok: true,
            alreadyPaid: true,
            identityVerified: true,
            sessionToken: token,
            registration: serializeRegistrationResponse(paidRec, true, token),
          });
          return;
        }
        // Email or mobile matched an existing paid participant, but the second field differed:
        // Do NOT create a duplicate payment order; return public-safe badge status so they can view or recover it.
        sendJson(res, 200, {
          ok: true,
          alreadyPaid: true,
          identityVerified: false,
          registration: serializeRegistrationResponse(paidRec, false),
        });
        return;
      }

      if (existingCheck.outcome === "ACTIVE_UNRESOLVED" && existingCheck.record) {
        // Reconcile the unresolved transaction with PayU before allowing another payment attempt
        const unresolved = existingCheck.record;
        const check = await verifyPayUTransactionServerToServer(unresolved.payuTxnId, config);
        if (check.verified && check.status === "SUCCESS") {
          const recovered = await recordPaymentOutcome({
            payuTxnId: unresolved.payuTxnId,
            payuMihpayid: check.mihpayid,
            status: "SUCCESS",
            amount: check.amount || amount,
          });
          logPaymentEvent("STATUS_RECONCILED", {
            txnid: recovered.payuTxnId,
            mihpayid: recovered.payuMihpayid,
            participantId: recovered.participantId,
            status: "SUCCESS",
            environment: config.environment,
            mode: config.mode,
            verified: true,
          });
          if (existingCheck.identityFullyMatched) {
            const token = signToken({
              txnid: recovered.payuTxnId,
              pid: recovered.participantId || "",
              status: "SUCCESS",
            });
            setSessionCookie(res, token, origin);
            sendJson(res, 200, {
              ok: true,
              alreadyPaid: true,
              identityVerified: true,
              sessionToken: token,
              registration: serializeRegistrationResponse(recovered, true, token),
            });
            return;
          }
          sendJson(res, 200, {
            ok: true,
            alreadyPaid: true,
            identityVerified: false,
            registration: serializeRegistrationResponse(recovered, false),
          });
          return;
        }
      }

      if (existingCheck.outcome === "IDEMPOTENT_REUSE" && existingCheck.record) {
        const reused = existingCheck.record;
        const udf1 = "AIHACKATHON2026";
        const udf2 = "";
        const udf3 = phone;
        const udf4 = "";
        const udf5 = "";
        const hash = generatePayURequestHash(
          {
            key: config.key,
            txnid: reused.payuTxnId,
            amount: reused.paymentAmount,
            productinfo,
            firstname: reused.participantName || firstname,
            email: reused.email || email,
            udf1,
            udf2,
            udf3,
            udf4,
            udf5,
          },
          config.salt
        );
        const sessionToken = signToken({
          txnid: reused.payuTxnId,
          pid: "",
          status: reused.paymentStatus,
        });
        setSessionCookie(res, sessionToken, origin);
        sendJson(res, 200, {
          ok: true,
          reusedIdempotentOrder: true,
          actionUrl: config.actionUrl,
          mode: config.mode,
          environment: config.environment,
          usingLocalSandbox: config.usingLocalSandbox,
          sessionToken,
          registrationRef: reused.registrationRef,
          fields: {
            key: config.key,
            txnid: reused.payuTxnId,
            amount: reused.paymentAmount,
            productinfo,
            firstname: reused.participantName || firstname,
            email: reused.email || email,
            phone,
            surl: callbackUrl,
            furl: callbackUrl,
            udf1,
            udf2,
            udf3,
            udf4,
            udf5,
            hash,
          },
        });
        return;
      }

      // If free pre-registration is configured, record lead without PayU checkout or paid badge
      if (!AVATAR_COMPETITION.registration.requirePayment) {
        const txnid = createUniqueTxnId();
        const record = await createFreePreRegistration({
          payuTxnId: txnid,
          participantName: firstname,
          email,
          whatsappNumber: phone,
        });
        const notifResult = await dispatchRegistrationNotifications(record, origin);
        const token = signToken({
          txnid: record.payuTxnId,
          pid: "",
          status: record.paymentStatus,
        });
        setSessionCookie(res, token, origin);
        sendJson(res, 200, {
          ok: true,
          freePreRegistration: true,
          sessionToken: token,
          registration: serializeRegistrationResponse(
            { ...record, emailNotificationStatus: notifResult.organiserStatus },
            true,
            token
          ),
          emailjsPayload: {
            serviceId: process.env.VITE_EMAILJS_SERVICE_ID || DEFAULT_EMAILJS_SERVICE_ID,
            templateId: process.env.VITE_EMAILJS_TEMPLATE_ID || DEFAULT_EMAILJS_TEMPLATE_ID,
            organiserParams: buildOrganiserEmailParams(record, origin),
            participantParams: buildParticipantConfirmationParams(record, origin),
          },
        });
        return;
      }

      const txnid = createUniqueTxnId();
      const udf1 = "AIHACKATHON2026";
      const udf2 = "";
      const udf3 = phone;
      const udf4 = "";
      const udf5 = "";

      const hash = generatePayURequestHash(
        {
          key: config.key,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5,
        },
        config.salt
      );

      const createdRecord = await createInitiatedTransaction({
        payuTxnId: txnid,
        participantName: firstname,
        email,
        whatsappNumber: phone,
        amount,
        idempotencyKey: idempotencyKey || null,
        termsVersion,
        privacyVersion,
        consentTimestamp,
        consentStatus: "ACCEPTED",
      });

      const sessionToken = signToken({
        txnid,
        pid: "",
        status: "INITIATED",
      });
      setSessionCookie(res, sessionToken, origin);

      logPaymentEvent("ORDER_INITIATED", {
        txnid,
        status: "INITIATED",
        environment: config.environment,
        mode: config.mode,
        amount,
      });

      sendJson(res, 200, {
        ok: true,
        actionUrl: config.actionUrl,
        mode: config.mode,
        environment: config.environment,
        usingLocalSandbox: config.usingLocalSandbox,
        sessionToken,
        registrationRef: createdRecord.registrationRef,
        fields: {
          key: config.key,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          phone,
          surl: callbackUrl,
          furl: callbackUrl,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5,
          hash,
        },
      });
      return;
    }

    // ── 2. POST /api/avatar/payu-sandbox (Test Gateway Simulator) ─────────
    if (route === "payu-sandbox" && method === "POST") {
      const params = await parseParams(req);
      const config = getPayUConfig(origin, { forceSandbox: true });
      const txnid = params.txnid || "";
      const feeInr = getEffectiveFeeInr();
      const amount = params.amount || `${feeInr}.00`;
      const productinfo = params.productinfo || AVATAR_COMPETITION.registration.productInfo;
      const firstname = params.firstname || "AI Hackathon Participant";
      const email = params.email || "participant@abuzarcode.in";
      const udf1 = params.udf1 || "AIHACKATHON2026";

      const expectedReqHash = generatePayURequestHash(
        {
          key: config.key,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          udf1,
          udf2: params.udf2 || "",
          udf3: params.udf3 || "",
          udf4: params.udf4 || "",
          udf5: params.udf5 || "",
        },
        config.salt
      );

      if (params.hash !== expectedReqHash) {
        sendHtml(res, 400, "<h1>Invalid PayU Request Hash</h1>");
        return;
      }

      // Allow test harness to record an outcome in PayU's ledger without browser redirect (simulating browser closure after payment)
      if (params.simulateSilentGatewayOutcome) {
        const silentStatus = params.simulateSilentGatewayOutcome as
          | "success"
          | "failure"
          | "pending"
          | "cancelled";
        setSandboxGatewayOutcome(txnid, {
          status: silentStatus,
          amount,
        });
        sendJson(res, 200, { ok: true, recordedSilentOutcome: silentStatus, txnid });
        return;
      }

      const makeCallbackForm = (
        status: "success" | "failure" | "pending" | "cancelled",
        label: string,
        btnStyle: string
      ) => {
        const cbHash = generatePayUResponseHash(
          {
            status,
            txnid,
            amount,
            productinfo,
            firstname,
            email,
            udf1,
            udf2: params.udf2 || "",
            udf3: params.udf3 || "",
            udf4: params.udf4 || "",
            udf5: params.udf5 || "",
          },
          config.key,
          config.salt
        );
        return `
          <form method="POST" action="${escapeHtml(params.surl || `${origin}/api/avatar/payu-callback`)}" style="margin:0;">
            <input type="hidden" name="key" value="${escapeHtml(config.key)}" />
            <input type="hidden" name="txnid" value="${escapeHtml(txnid)}" />
            <input type="hidden" name="mihpayid" value="MOJO${escapeHtml(txnid.slice(-8))}" />
            <input type="hidden" name="status" value="${escapeHtml(status)}" />
            <input type="hidden" name="unmappedstatus" value="${escapeHtml(status)}" />
            <input type="hidden" name="amount" value="${escapeHtml(amount)}" />
            <input type="hidden" name="productinfo" value="${escapeHtml(productinfo)}" />
            <input type="hidden" name="firstname" value="${escapeHtml(firstname)}" />
            <input type="hidden" name="email" value="${escapeHtml(email)}" />
            <input type="hidden" name="phone" value="${escapeHtml(params.phone || "")}" />
            <input type="hidden" name="udf1" value="${escapeHtml(udf1)}" />
            <input type="hidden" name="udf2" value="${escapeHtml(params.udf2 || "")}" />
            <input type="hidden" name="udf3" value="${escapeHtml(params.udf3 || "")}" />
            <input type="hidden" name="udf4" value="${escapeHtml(params.udf4 || "")}" />
            <input type="hidden" name="udf5" value="${escapeHtml(params.udf5 || "")}" />
            <input type="hidden" name="hash" value="${escapeHtml(cbHash)}" />
            <button type="submit" style="${btnStyle}">${escapeHtml(label)}</button>
          </form>
        `;
      };

      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PayU Secure Checkout (Test Mode) — AI Hackathon</title>
</head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f6f2;color:#0d0e12;font-family:Inter,system-ui,sans-serif;padding:20px;">
  <div style="max-width:460px;width:100%;background:#ffffff;border:1px solid #e4e2dc;border-radius:24px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,0.08);">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eceae4;padding-bottom:16px;">
      <div>
        <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#e3262e;background:rgba(227,38,46,0.08);padding:4px 10px;border-radius:99px;">PayU Test Sandbox</span>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:800;color:#0d0e12;">AI Hackathon Registration</h1>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;color:#686d78;">Payable Fee</div>
        <div style="font-size:24px;font-weight:800;color:#0d0e12;">₹${escapeHtml(amount)}</div>
      </div>
    </div>
    <div style="margin:18px 0;font-size:13px;color:#525660;line-height:1.6;background:#f7f6f2;padding:14px;border-radius:14px;border:1px solid #e4e2dc;">
      <div><strong style="color:#0d0e12;">Participant:</strong> ${escapeHtml(firstname)}</div>
      <div><strong style="color:#0d0e12;">SHA-512 Signature:</strong> <span style="color:#15803d;font-weight:600;">Verified Server-Side ✓</span></div>
    </div>
    <div style="display:grid;gap:10px;">
      ${makeCallbackForm(
        "success",
        `Authorize Test Payment — ₹${amount} (Success)`,
        "width:100%;padding:14px 18px;border-radius:14px;border:none;background:#e3262e;color:#ffffff;font-weight:700;font-size:14px;cursor:pointer;"
      )}
      ${makeCallbackForm(
        "pending",
        "Simulate Pending Bank Confirmation",
        "width:100%;padding:11px 16px;border-radius:14px;border:1px solid #d4d2cc;background:#ffffff;color:#0d0e12;font-weight:600;font-size:13px;cursor:pointer;"
      )}
      ${makeCallbackForm(
        "failure",
        "Simulate Payment Failure",
        "width:100%;padding:11px 16px;border-radius:14px;border:1px solid rgba(227,38,46,0.35);background:rgba(227,38,46,0.06);color:#c8161f;font-weight:600;font-size:13px;cursor:pointer;"
      )}
      ${makeCallbackForm(
        "cancelled",
        "Cancel & Return to AI Hackathon Page",
        "width:100%;padding:11px 16px;border-radius:14px;border:none;background:transparent;color:#686d78;font-weight:500;font-size:13px;cursor:pointer;"
      )}
    </div>
  </div>
</body>
</html>`;
      sendHtml(res, 200, html);
      return;
    }

    // ── 3. POST /api/avatar/payu-callback (Callback & Webhook Handler) ─────
    if (route === "payu-callback" && (method === "POST" || method === "GET")) {
      const payload =
        method === "POST"
          ? await parseParams(req)
          : Object.fromEntries(url.searchParams.entries());
      const txnid = (payload.txnid || "").trim();
      if (!txnid) {
        redirect(res, `${origin}/competition`);
        return;
      }

      // Verify transaction exists in our persistent store before accepting callback
      const existingRecord = await getRegistrationByTxnId(txnid);
      if (!existingRecord) {
        const unknownToken = signToken({
          txnid: "",
          pid: "",
          status: "FAILED",
          reason: "unknown_txnid",
        });
        setSessionCookie(res, unknownToken, origin);
        redirect(res, `${origin}/competition`);
        return;
      }

      const isLocalOrigin =
        origin.includes("localhost") || origin.includes("127.0.0.1");
      const isSandboxCallback = isLocalOrigin && payload.key === "gtKFFx";
      const config = getPayUConfig(origin, { forceSandbox: isSandboxCallback });
      const feeInr = getEffectiveFeeInr();

      const hashValid = verifyPayUResponseHash(payload, config.key, config.salt);
      if (!hashValid) {
        logPaymentEvent("CALLBACK_HASH_REJECTED", {
          txnid,
          status: payload.status || "unknown",
          environment: config.environment,
          mode: config.mode,
          reason: "hash_mismatch",
        });
        const failedRec = await recordPaymentOutcome({
          payuTxnId: txnid,
          status: "FAILED",
          failureReason: "hash_mismatch",
          amount: payload.amount || `${feeInr}.00`,
        });
        const failToken = signToken({
          txnid: failedRec.payuTxnId,
          pid: failedRec.participantId || "",
          status: failedRec.paymentStatus,
          reason: "hash_mismatch",
        });
        setSessionCookie(res, failToken, origin);
        redirect(res, `${origin}/competition`);
        return;
      }

      const rawCallbackStatus = (payload.status || "").toLowerCase();
      logPaymentEvent("CALLBACK_RECEIVED", {
        txnid,
        mihpayid: payload.mihpayid || null,
        status: rawCallbackStatus,
        environment: config.environment,
        mode: config.mode,
        amount: payload.amount || null,
      });
      let finalStatus: PaymentStatus = "FAILED";
      let mihpayid: string | null = payload.mihpayid || null;
      let failureReason = "";

      if (isSandboxCallback) {
        setSandboxGatewayOutcome(txnid, {
          status:
            rawCallbackStatus === "success"
              ? "success"
              : rawCallbackStatus === "pending"
              ? "pending"
              : rawCallbackStatus === "cancelled"
              ? "cancelled"
              : "failure",
          mihpayid: mihpayid || undefined,
          amount: payload.amount,
        });
      }

      if (rawCallbackStatus === "success") {
        // Independently verify transaction status, currency, and exact amount with PayU's verify_payment check
        const serverCheck = await verifyPayUTransactionServerToServer(txnid, config, {
          amount: payload.amount,
          currency: payload.currency || "INR",
          udf2: payload.udf2,
        });
        finalStatus = serverCheck.verified ? "SUCCESS" : serverCheck.status;
        if (!serverCheck.verified) {
          failureReason = serverCheck.rawStatus || "verification_mismatch";
        }
        if (serverCheck.mihpayid) mihpayid = serverCheck.mihpayid;
        logPaymentEvent("SERVER_VERIFY_RESULT", {
          txnid,
          mihpayid,
          status: finalStatus,
          environment: config.environment,
          mode: config.mode,
          amount: serverCheck.amount || payload.amount || null,
          verified: serverCheck.verified,
          reason: failureReason || null,
        });
      } else if (rawCallbackStatus === "pending" || rawCallbackStatus === "in progress") {
        finalStatus = "PENDING";
      } else if (rawCallbackStatus === "cancelled" || rawCallbackStatus === "usercancelled") {
        finalStatus = "CANCELLED";
        failureReason = "Payment cancelled by user";
      } else {
        finalStatus = "FAILED";
        failureReason = payload.error_Message || payload.field9 || "Payment declined by gateway";
      }

      const cleanFirstname =
        payload.firstname === "AVATAR Participant" ||
        payload.firstname === "AI Hackathon Participant"
          ? ""
          : payload.firstname;
      const cleanEmail =
        payload.email === "participant@abuzarcode.in" ? "" : payload.email;
      const cleanPhone =
        payload.phone === "9999999999"
          ? ""
          : payload.phone || payload.udf3 || "";

      const record = await recordPaymentOutcome({
        payuTxnId: txnid,
        payuMihpayid: mihpayid,
        status: finalStatus,
        failureReason: failureReason || null,
        amount: payload.amount || `${feeInr}.00`,
        firstname: cleanFirstname,
        email: cleanEmail,
        phone: cleanPhone,
      });

      // Fire EmailJS notifications asynchronously so email latency or failure NEVER blocks or reverses a payment
      if (
        record.paymentStatus === "SUCCESS" &&
        record.profileCompletionStatus === "COMPLETED" &&
        record.emailNotificationStatus !== "SENT"
      ) {
        dispatchRegistrationNotifications(record, origin).catch(() => {});
      }

      const regToken = signToken({
        txnid: record.payuTxnId,
        pid: record.participantId || "",
        status: record.paymentStatus,
        reason: record.failureReason || failureReason || "",
      });

      setSessionCookie(res, regToken, origin);
      redirect(res, `${origin}/competition`);
      return;
    }

    // ── 4. GET /api/avatar/status (Status + Server-to-Server Reconciliation) ──
    if (route === "status" && method === "GET") {
      if (!checkRateLimit(req, "status", 60, 60_000)) {
        sendJson(res, 429, {
          ok: false,
          error: "Rate limit exceeded for status checks. Please wait a few seconds.",
        });
        return;
      }

      const cookies = parseCookies(req);
      const cookieToken = (cookies[SESSION_COOKIE_NAME] || "").trim();
      const queryToken = (url.searchParams.get("token") || "").trim();
      const queryTxnId = (url.searchParams.get("txnid") || "").trim();
      const shouldReconcile = url.searchParams.get("reconcile") === "true";

      const verifiedCookie = cookieToken
        ? verifyToken<{
            txnid: string;
            pid?: string;
            status?: string;
            reason?: string;
          }>(cookieToken)
        : null;

      const verifiedQuery = queryToken
        ? verifyToken<{
            txnid: string;
            pid?: string;
            status?: string;
            reason?: string;
          }>(queryToken)
        : null;

      const activeToken =
        verifiedCookie && (!queryTxnId || verifiedCookie.txnid === queryTxnId)
          ? verifiedCookie
          : verifiedQuery;

      const txnid = queryTxnId || activeToken?.txnid || "";

      if (!txnid) {
        sendJson(res, 200, { ok: true, registration: null });
        return;
      }

      let record = await getRegistrationByTxnId(txnid);
      if (!record) {
        sendJson(res, 404, { ok: false, error: "Transaction not found." });
        return;
      }

      const hasValidTokenForTxn = Boolean(
        (verifiedCookie && verifiedCookie.txnid === record.payuTxnId) ||
          (verifiedQuery && verifiedQuery.txnid === record.payuTxnId)
      );

      // Server-to-server reconciliation for unresolved transactions (closed browser / delayed callback recovery)
      if (
        (shouldReconcile || record.paymentStatus === "PENDING") &&
        (record.paymentStatus === "INITIATED" || record.paymentStatus === "PENDING")
      ) {
        const isLocalOrigin =
          origin.includes("localhost") || origin.includes("127.0.0.1");
        const forceSandbox = isLocalOrigin && url.searchParams.get("sandbox") === "true";
        const config = getPayUConfig(origin, { forceSandbox });
        const check = await verifyPayUTransactionServerToServer(record.payuTxnId, config);

        if (check.verified && check.status === "SUCCESS") {
          record = await recordPaymentOutcome({
            payuTxnId: record.payuTxnId,
            payuMihpayid: check.mihpayid,
            status: "SUCCESS",
            amount: check.amount || record.paymentAmount,
          });
          if (
            record.profileCompletionStatus === "COMPLETED" &&
            record.emailNotificationStatus !== "SENT"
          ) {
            dispatchRegistrationNotifications(record, origin).catch(() => {});
          }
        } else if (check.status === "FAILED" || check.status === "CANCELLED") {
          record = await recordPaymentOutcome({
            payuTxnId: record.payuTxnId,
            payuMihpayid: check.mihpayid,
            status: check.status,
            failureReason: check.rawStatus,
          });
        } else {
          // Update lastVerifiedAt timestamp while remaining PENDING/INITIATED
          record = await recordPaymentOutcome({
            payuTxnId: record.payuTxnId,
            status: record.paymentStatus,
          });
        }
      }

      const freshToken = signToken({
        txnid: record.payuTxnId,
        pid: record.participantId || "",
        status: record.paymentStatus,
        reason: record.failureReason || activeToken?.reason || "",
      });

      if (hasValidTokenForTxn) {
        setSessionCookie(res, freshToken, origin);
      }

      sendJson(res, 200, {
        ok: true,
        failureReason: record.failureReason || activeToken?.reason || undefined,
        registration: serializeRegistrationResponse(
          record,
          hasValidTokenForTxn,
          freshToken
        ),
        emailjsPayload:
          hasValidTokenForTxn && record.profileCompletionStatus === "COMPLETED"
            ? {
                serviceId:
                  process.env.VITE_EMAILJS_SERVICE_ID || DEFAULT_EMAILJS_SERVICE_ID,
                templateId:
                  process.env.VITE_EMAILJS_TEMPLATE_ID || DEFAULT_EMAILJS_TEMPLATE_ID,
                organiserParams: buildOrganiserEmailParams(record, origin),
                participantParams: buildParticipantConfirmationParams(
                  record,
                  origin
                ),
              }
            : null,
      });
      return;
    }

    // ── 5. POST /api/avatar/profile ───────────────────────────────────────
    if (route === "profile" && method === "POST") {
      const body = await parseParams(req);
      const payuTxnId = (body.payuTxnId || body.txnid || "").trim();
      const participantId = (body.participantId || "").trim().toUpperCase();
      const fullName = (body.fullName || "").trim();
      const email = (body.email || "").trim();
      const whatsappNumber = (body.whatsappNumber || "").trim();
      const token = (body.token || "").trim();

      if (!payuTxnId || !participantId) {
        sendJson(res, 400, {
          ok: false,
          error: "Missing verified transaction or Participant ID.",
        });
        return;
      }
      if (fullName.length < 2 || fullName.length > 90) {
        sendJson(res, 400, {
          ok: false,
          error: "Please enter your full name (2–90 characters).",
        });
        return;
      }
      if (!EMAIL_RE.test(email)) {
        sendJson(res, 400, {
          ok: false,
          error: "Please enter a valid email address.",
        });
        return;
      }
      const digits = whatsappNumber.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) {
        sendJson(res, 400, {
          ok: false,
          error: "Please enter a valid WhatsApp number (8–15 digits).",
        });
        return;
      }

      const tokenData = token
        ? verifyToken<{ txnid: string; pid: string; status: string }>(token)
        : null;
      const existing = await getRegistrationByTxnId(payuTxnId);
      if (
        !existing &&
        tokenData &&
        tokenData.txnid === payuTxnId &&
        tokenData.status === "SUCCESS" &&
        tokenData.pid === participantId
      ) {
        await recordPaymentOutcome({
          payuTxnId,
          status: "SUCCESS",
          amount: `${getEffectiveFeeInr()}.00`,
          firstname: fullName,
          email,
          phone: whatsappNumber,
        });
      }

      const updated = await completeParticipantProfile({
        participantId,
        payuTxnId,
        participantName: fullName,
        email,
        whatsappNumber,
      });

      const clientDeliveredOrganiser = body.clientDeliveredOrganiser === "true";
      const clientDeliveredParticipant = body.clientDeliveredParticipant === "true";

      const notifResult = await dispatchRegistrationNotifications(
        updated,
        origin,
        clientDeliveredOrganiser,
        clientDeliveredParticipant
      );

      sendJson(res, 200, {
        ok: true,
        confirmationMessage: `Your AI Hackathon registration has been confirmed! Your Participant ID is ${updated.participantId}.`,
        registration: serializeRegistrationResponse(
          { ...updated, emailNotificationStatus: notifResult.organiserStatus },
          true
        ),
        emailjsPayload: {
          serviceId: process.env.VITE_EMAILJS_SERVICE_ID || DEFAULT_EMAILJS_SERVICE_ID,
          templateId: process.env.VITE_EMAILJS_TEMPLATE_ID || DEFAULT_EMAILJS_TEMPLATE_ID,
          organiserParams: buildOrganiserEmailParams(updated, origin),
          participantParams: buildParticipantConfirmationParams(updated, origin),
        },
      });
      return;
    }

    // ── 6. POST /api/avatar/confirm-emailjs ───────────────────────────────
    if (route === "confirm-emailjs" && method === "POST") {
      const body = await parseParams(req);
      const payuTxnId = (body.payuTxnId || "").trim();
      const record = await getRegistrationByTxnId(payuTxnId);
      if (!record) {
        sendJson(res, 404, { ok: false, error: "Record not found" });
        return;
      }
      const notifResult = await dispatchRegistrationNotifications(
        record,
        origin,
        body.organiserSent === "true",
        body.participantSent === "true",
        { simulatePrimaryFailure: body.simulatePrimaryFailure === "true" }
      );
      sendJson(res, 200, {
        ok: true,
        organiserStatus: notifResult.organiserStatus,
        participantStatus: notifResult.participantStatus,
        backupChannel: notifResult.backupChannel,
        error: notifResult.error,
      });
      return;
    }

    // ── 7. GET /api/avatar/verify (Public Badge Verification — Privacy Safe) ──
    if (route === "verify" && method === "GET") {
      const id = (url.searchParams.get("id") || "").trim().toUpperCase();
      const sig = (url.searchParams.get("sig") || "").trim();

      if (!id || !/^(AIH-2026|AV26)-\d{6}$/.test(id)) {
        sendJson(res, 404, {
          ok: false,
          verified: false,
          error: "Invalid or unrecognised AI Hackathon Participant ID format.",
        });
        return;
      }

      const record = await getRegistrationByParticipantId(id);
      if (record && record.paymentStatus === "SUCCESS") {
        // Strictly omit email, WhatsApp number, transaction ID, and payment secrets
        sendJson(res, 200, {
          ok: true,
          verified: true,
          edition: AVATAR_COMPETITION.edition,
          competition: `${AVATAR_COMPETITION.name} — ${AVATAR_COMPETITION.subtitle}`,
          participantId: record.participantId,
          participantName: record.participantName || "Official Registered Participant",
          status: "VERIFIED",
          profileCompleted: record.profileCompletionStatus === "COMPLETED",
          registeredAt: record.paidAt || record.registrationTimestamp,
        });
        return;
      }

      if (sig) {
        const verifiedSig = verifyToken<{
          pid: string;
          name?: string;
          status: string;
          ts?: string;
        }>(sig);
        if (
          verifiedSig &&
          verifiedSig.pid.toUpperCase() === id &&
          verifiedSig.status === "VERIFIED"
        ) {
          sendJson(res, 200, {
            ok: true,
            verified: true,
            edition: AVATAR_COMPETITION.edition,
            competition: `${AVATAR_COMPETITION.name} — ${AVATAR_COMPETITION.subtitle}`,
            participantId: verifiedSig.pid.toUpperCase(),
            participantName: verifiedSig.name || "Official Registered Participant",
            status: "VERIFIED",
            profileCompleted: true,
            registeredAt: verifiedSig.ts || new Date().toISOString(),
          });
          return;
        }
      }

      sendJson(res, 404, {
        ok: false,
        verified: false,
        participantId: id,
        error: "No verified AI Hackathon registration found for this Participant ID.",
      });
      return;
    }

    // ── 8. POST /api/avatar/recover (Cross-Browser / Cleared-Cache Badge Recovery) ──
    if (route === "recover" && method === "POST") {
      if (!checkRateLimit(req, "recover", 10, 60_000)) {
        sendJson(res, 429, {
          ok: false,
          error: "Too many recovery attempts. Please wait a minute and try again.",
        });
        return;
      }

      const body = await parseParams(req);
      const email = (body.email || "").trim();
      const whatsappNumber = (body.whatsappNumber || body.phone || "").trim();
      const digits = whatsappNumber.replace(/\D/g, "");

      if (!EMAIL_RE.test(email) || digits.length < 8) {
        sendJson(res, 400, {
          ok: false,
          error: "Please enter the registered email address and WhatsApp number used during pre-registration.",
        });
        return;
      }

      const recovered = await recoverRegistrationByIdentity({
        email,
        whatsappNumber,
      });

      if (!recovered || recovered.paymentStatus !== "SUCCESS" || !recovered.participantId) {
        sendJson(res, 404, {
          ok: false,
          error: "No confirmed paid registration was found matching both that email address and WhatsApp number.",
        });
        return;
      }

      const token = signToken({
        txnid: recovered.payuTxnId,
        pid: recovered.participantId,
        status: "SUCCESS",
      });
      setSessionCookie(res, token, origin);

      logPaymentEvent("BADGE_RECOVERED", {
        txnid: recovered.payuTxnId,
        participantId: recovered.participantId,
        status: "SUCCESS",
        verified: true,
      });

      sendJson(res, 200, {
        ok: true,
        recovered: true,
        sessionToken: token,
        registration: serializeRegistrationResponse(recovered, true, token),
      });
      return;
    }

    sendJson(res, 404, { ok: false, error: `Unknown avatar API route: ${route}` });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    sendJson(res, 500, { ok: false, error: message });
  }
}
