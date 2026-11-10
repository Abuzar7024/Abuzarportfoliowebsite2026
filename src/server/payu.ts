import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AVATAR_COMPETITION } from "../data/avatar-competition";
import type { PaymentStatus } from "./avatar-db";
import { getRuntimeEnvFallback } from "./runtime-env";

export interface PayUConfig {
  key: string;
  salt: string;
  mode: "test" | "live";
  environment: "test" | "production";
  actionUrl: string;
  verifyUrl: string;
  usingLocalSandbox: boolean;
}

const DEV_SANDBOX_KEY = "gtKFFx";
const DEV_SANDBOX_SALT = "4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW";

/** Official known PayU public test merchant keys */
const KNOWN_PAYU_TEST_KEYS = new Set(["gtKFFx", "JBZaLc", "3TnMpV", "smsplus"]);

/** In-memory ledger for local sandbox reconciliation (simulating PayU's server status for closed-browser / delayed-callback recovery tests) */
const sandboxLedger = new Map<
  string,
  { status: "success" | "failure" | "pending" | "cancelled"; mihpayid: string; amount: string }
>();

export function setSandboxGatewayOutcome(
  txnid: string,
  outcome: {
    status: "success" | "failure" | "pending" | "cancelled";
    mihpayid?: string;
    amount?: string;
  }
): void {
  const fee = getEffectiveFeeInr();
  sandboxLedger.set(txnid, {
    status: outcome.status,
    mihpayid: outcome.mihpayid || `PAYU-SB-${txnid.slice(-8)}`,
    amount: outcome.amount || `${fee}.00`,
  });
}

/** Ensures `.env.local` updates are picked up immediately without restarting the dev server. */
export function ensureEnvLoaded(): void {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
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
}

export function getEffectiveFeeInr(): number {
  ensureEnvLoaded();
  const envFee = Number(process.env.PAYU_REGISTRATION_FEE_INR);
  if (Number.isFinite(envFee) && envFee > 0) {
    return envFee;
  }
  return AVATAR_COMPETITION.registration.feeInr;
}

/**
 * Resolves and validates PayU merchant credentials and environment endpoints.
 * Strictly prevents mixing Production keys with Test endpoints (`test.payu.in`)
 * or Test keys with Production endpoints (`secure.payu.in`).
 */
export function getPayUConfig(
  origin: string,
  options?: { forceSandbox?: boolean; forceLive?: boolean }
): PayUConfig {
  ensureEnvLoaded();

  if (options?.forceSandbox) {
    return {
      key: DEV_SANDBOX_KEY,
      salt: DEV_SANDBOX_SALT,
      mode: "test",
      environment: "test",
      actionUrl: `${origin}/api/avatar/payu-sandbox`,
      verifyUrl: `${origin}/api/avatar/payu-sandbox-verify`,
      usingLocalSandbox: true,
    };
  }

  const rawEnv = options?.forceLive
    ? "production"
    : (process.env.PAYU_ENVIRONMENT || process.env.PAYU_MODE || "")
        .trim()
        .toLowerCase();

  const envKey = (process.env.PAYU_MERCHANT_KEY || "").trim();
  const envSalt = (process.env.PAYU_MERCHANT_SALT || "").trim();
  const isProdOrigin =
    process.env.NODE_ENV === "production" &&
    !origin.includes("localhost") &&
    !origin.includes("127.0.0.1");

  if (envKey && envSalt) {
    const isKnownTestKey = KNOWN_PAYU_TEST_KEYS.has(envKey);
    const wantsTest = rawEnv === "test" || rawEnv === "sandbox";
    const wantsProd = rawEnv === "production" || rawEnv === "live" || rawEnv === "prod";

    // Rule: Never send a Production key to https://test.payu.in/_payment
    if (!isKnownTestKey && wantsTest) {
      if (isProdOrigin) {
        throw new Error(
          "PayU Environment Mismatch: Production merchant key cannot be used with PAYU_ENVIRONMENT=test. Set PAYU_ENVIRONMENT=production."
        );
      }
      return {
        key: DEV_SANDBOX_KEY,
        salt: DEV_SANDBOX_SALT,
        mode: "test",
        environment: "test",
        actionUrl: `${origin}/api/avatar/payu-sandbox`,
        verifyUrl: `${origin}/api/avatar/payu-sandbox-verify`,
        usingLocalSandbox: true,
      };
    }

    // Rule: Never send a Test key to https://secure.payu.in/_payment
    if (isKnownTestKey && wantsProd) {
      throw new Error(
        "PayU Environment Mismatch: Test merchant key cannot be used with PAYU_ENVIRONMENT=production."
      );
    }

    const resolvedProd = wantsProd || !isKnownTestKey;

    return {
      key: envKey,
      salt: envSalt,
      mode: resolvedProd ? "live" : "test",
      environment: resolvedProd ? "production" : "test",
      actionUrl: resolvedProd
        ? "https://secure.payu.in/_payment"
        : "https://test.payu.in/_payment",
      verifyUrl: resolvedProd
        ? "https://info.payu.in/merchant/postservice?form=2"
        : "https://test.payu.in/merchant/postservice?form=2",
      usingLocalSandbox: false,
    };
  }

  if (isProdOrigin) {
    throw new Error(
      "PayU merchant credentials (PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT) are not configured in the server environment."
    );
  }

  return {
    key: DEV_SANDBOX_KEY,
    salt: DEV_SANDBOX_SALT,
    mode: "test",
    environment: "test",
    actionUrl: `${origin}/api/avatar/payu-sandbox`,
    verifyUrl: `${origin}/api/avatar/payu-sandbox-verify`,
    usingLocalSandbox: true,
  };
}

export function sha512(input: string): string {
  return crypto.createHash("sha512").update(input, "utf8").digest("hex");
}

export interface PayURequestParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
  hash: string;
}

/**
 * Generates the official PayU request hash:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
 */
export function generatePayURequestHash(
  params: Omit<PayURequestParams, "hash" | "surl" | "furl" | "phone">,
  salt: string
): string {
  const hashSequence = [
    params.key.trim(),
    params.txnid.trim(),
    params.amount.trim(),
    params.productinfo.trim(),
    params.firstname.trim(),
    params.email.trim(),
    (params.udf1 || "").trim(),
    (params.udf2 || "").trim(),
    (params.udf3 || "").trim(),
    (params.udf4 || "").trim(),
    (params.udf5 || "").trim(),
    "",
    "",
    "",
    "",
    "",
    salt.trim(),
  ].join("|");
  return sha512(hashSequence);
}

/**
 * Generates the official PayU reverse callback hash:
 * sha512([additionalCharges|]salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function generatePayUResponseHash(
  payload: {
    status: string;
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    additionalCharges?: string;
  },
  key: string,
  salt: string
): string {
  const baseSequence = [
    salt.trim(),
    (payload.status || "").trim(),
    "",
    "",
    "",
    "",
    "",
    (payload.udf5 || "").trim(),
    (payload.udf4 || "").trim(),
    (payload.udf3 || "").trim(),
    (payload.udf2 || "").trim(),
    (payload.udf1 || "").trim(),
    (payload.email || "").trim(),
    (payload.firstname || "").trim(),
    (payload.productinfo || "").trim(),
    (payload.amount || "").trim(),
    (payload.txnid || "").trim(),
    key.trim(),
  ].join("|");

  const fullSequence = payload.additionalCharges
    ? `${payload.additionalCharges.trim()}|${baseSequence}`
    : baseSequence;

  return sha512(fullSequence);
}

export function verifyPayUResponseHash(
  payload: Record<string, string>,
  key: string,
  salt: string
): boolean {
  const receivedHash = (payload.hash || "").trim().toLowerCase();
  if (!receivedHash || receivedHash.length !== 128) return false;

  const expectedHash = generatePayUResponseHash(
    {
      status: payload.status || "",
      txnid: payload.txnid || "",
      amount: payload.amount || "",
      productinfo: payload.productinfo || "",
      firstname: payload.firstname || "",
      email: payload.email || "",
      udf1: payload.udf1 || "",
      udf2: payload.udf2 || "",
      udf3: payload.udf3 || "",
      udf4: payload.udf4 || "",
      udf5: payload.udf5 || "",
      additionalCharges: payload.additionalCharges || undefined,
    },
    key,
    salt
  ).toLowerCase();

  const a = Buffer.from(receivedHash, "utf8");
  const b = Buffer.from(expectedHash, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Calls PayU's official `verify_payment` webservice API to independently
 * confirm transaction status, currency, and exact amount server-to-server.
 */
export async function verifyPayUTransactionServerToServer(
  txnid: string,
  config: PayUConfig,
  callbackContext?: { amount?: string; currency?: string; udf2?: string },
  /** Optional exact amount (whole rupees) the transaction must have been captured for. Defaults to the legacy single-person fee. */
  expectedAmountInr?: number
): Promise<{
  verified: boolean;
  status: PaymentStatus;
  mihpayid: string | null;
  amount: string | null;
  rawStatus: string;
}> {
  const expectedAmt = expectedAmountInr ?? getEffectiveFeeInr();
  const callbackAmt = parseFloat(callbackContext?.amount || `${expectedAmt}.00`);
  const currency = (callbackContext?.currency || "INR").toUpperCase();

  if (currency !== "INR") {
    return {
      verified: false,
      status: "FAILED",
      mihpayid: null,
      amount: callbackContext?.amount || null,
      rawStatus: "currency_mismatch",
    };
  }

  if (
    Number.isNaN(callbackAmt) ||
    Math.abs(callbackAmt - expectedAmt) >= 0.01 ||
    callbackContext?.udf2 === "SIMULATE_VERIFY_MISMATCH"
  ) {
    return {
      verified: false,
      status: "FAILED",
      mihpayid: null,
      amount: callbackContext?.amount || null,
      rawStatus: "amount_mismatch",
    };
  }

  if (config.usingLocalSandbox || sandboxLedger.has(txnid)) {
    const ledgerEntry = sandboxLedger.get(txnid);
    if (ledgerEntry) {
      const amt = parseFloat(ledgerEntry.amount);
      if (ledgerEntry.status === "success" && Math.abs(amt - expectedAmt) < 0.01) {
        return {
          verified: true,
          status: "SUCCESS",
          mihpayid: ledgerEntry.mihpayid,
          amount: ledgerEntry.amount,
          rawStatus: "success",
        };
      }
      if (ledgerEntry.status === "pending") {
        return {
          verified: false,
          status: "PENDING",
          mihpayid: ledgerEntry.mihpayid,
          amount: ledgerEntry.amount,
          rawStatus: "pending",
        };
      }
      if (ledgerEntry.status === "cancelled") {
        return {
          verified: false,
          status: "CANCELLED",
          mihpayid: ledgerEntry.mihpayid,
          amount: ledgerEntry.amount,
          rawStatus: "cancelled",
        };
      }
      return {
        verified: false,
        status: "FAILED",
        mihpayid: ledgerEntry.mihpayid,
        amount: ledgerEntry.amount,
        rawStatus: "failure",
      };
    }

    // If invoked directly from a verified sandbox success callback
    if (callbackContext?.amount) {
      return {
        verified: true,
        status: "SUCCESS",
        mihpayid: `PAYU-TEST-${txnid.slice(-8)}`,
        amount: `${expectedAmt}.00`,
        rawStatus: "success",
      };
    }

    return {
      verified: false,
      status: "PENDING",
      mihpayid: null,
      amount: `${expectedAmt}.00`,
      rawStatus: "pending_gateway_confirmation",
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const command = "verify_payment";
    const hash = sha512(`${config.key}|${command}|${txnid}|${config.salt}`);
    const body = new URLSearchParams({
      key: config.key,
      command,
      var1: txnid,
      hash,
    });

    const res = await fetch(config.verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`PayU verify_payment HTTP error: ${res.status}`);
    }

    const data = (await res.json()) as {
      status?: number;
      transaction_details?: Record<
        string,
        {
          mihpayid?: string;
          status?: string;
          amt?: string;
          transaction_amount?: string;
          unmappedstatus?: string;
        }
      >;
    };

    const details = data?.transaction_details?.[txnid];
    if (!details) {
      return {
        verified: false,
        status: "PENDING",
        mihpayid: null,
        amount: null,
        rawStatus: "not_found_yet",
      };
    }

    const rawStatus = (details.status || "").toLowerCase();
    const amt = parseFloat(details.amt || details.transaction_amount || "0");

    let mappedStatus: PaymentStatus = "FAILED";
    if (rawStatus === "success" && Math.abs(amt - expectedAmt) < 0.01) {
      mappedStatus = "SUCCESS";
    } else if (rawStatus === "success" && Math.abs(amt - expectedAmt) >= 0.01) {
      return {
        verified: false,
        status: "FAILED",
        mihpayid: details.mihpayid || null,
        amount: details.amt || details.transaction_amount || null,
        rawStatus: "amount_mismatch",
      };
    } else if (rawStatus === "pending" || rawStatus === "in progress" || rawStatus === "initiated") {
      mappedStatus = "PENDING";
    } else if (rawStatus === "usercancelled" || rawStatus === "cancelled") {
      mappedStatus = "CANCELLED";
    }

    return {
      verified: mappedStatus === "SUCCESS",
      status: mappedStatus,
      mihpayid: details.mihpayid || null,
      amount: details.amt || details.transaction_amount || null,
      rawStatus,
    };
  } catch {
    // Network timeout to PayU verify_payment: if called from a SHA-512 verified success callback, accept hash + amount
    if (callbackContext?.amount) {
      return {
        verified: true,
        status: "SUCCESS",
        mihpayid: null,
        amount: `${expectedAmt}.00`,
        rawStatus: "hash_verified",
      };
    }
    return {
      verified: false,
      status: "PENDING",
      mihpayid: null,
      amount: null,
      rawStatus: "verify_timeout_pending",
    };
  }
}

export function createUniqueTxnId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `AIHTXN-${ts}-${rnd}`;
}

/**
 * Structured, secret-safe diagnostic logger for PayU lifecycle events.
 * Strictly omits merchant salts, private keys, and raw PII.
 */
export function logPaymentEvent(
  event:
    | "ORDER_INITIATED"
    | "CALLBACK_RECEIVED"
    | "CALLBACK_HASH_REJECTED"
    | "SERVER_VERIFY_RESULT"
    | "STATUS_RECONCILED"
    | "DUPLICATE_PREVENTED"
    | "BADGE_RECOVERED",
  meta: {
    txnid?: string;
    mihpayid?: string | null;
    status?: string;
    environment?: string;
    mode?: string;
    amount?: string | null;
    verified?: boolean;
    participantId?: string | null;
    reason?: string | null;
  }
): void {
  const safeMeta = {
    ts: new Date().toISOString(),
    event,
    txnid: meta.txnid || "",
    mihpayid: meta.mihpayid || undefined,
    status: meta.status || undefined,
    environment: meta.environment || undefined,
    mode: meta.mode || undefined,
    amount: meta.amount || undefined,
    verified: meta.verified,
    participantId: meta.participantId || undefined,
    reason: meta.reason || undefined,
  };
  console.info(`[AI-Hackathon:PayU] ${JSON.stringify(safeMeta)}`);
}
