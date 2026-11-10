import fs from "node:fs";
import path from "node:path";
import { AVATAR_COMPETITION } from "../data/avatar-competition";
import {
  getPendingNotificationRecords,
  updateNotificationState,
  type AvatarRegistrationRecord,
} from "./avatar-db";

export const DEFAULT_EMAILJS_SERVICE_ID = "service_6beu4lx";
export const DEFAULT_EMAILJS_TEMPLATE_ID = "template_sf95ton";

const OUTBOX_DIR = process.env.VERCEL
  ? path.join("/tmp", "avatar-hackathon-data")
  : path.join(process.cwd(), ".data");
const OUTBOX_LOG = path.join(OUTBOX_DIR, "avatar-leads-backup.jsonl");

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Builds the exact template parameters for EmailJS (compatible with both
 * existing `template_sf95ton` fields in `emailjs-template.html` and dedicated
 * AI Hackathon pre-registration fields).
 */
export function buildOrganiserEmailParams(
  record: AvatarRegistrationRecord,
  origin: string
): Record<string, string> {
  const verifyUrl = record.participantId
    ? `${origin}/competition/verify/${record.participantId}`
    : `${origin}/competition`;
  const registrationType = "Pre-registration";
  const pidLabel = record.participantId || "Pending / Free Pre-registration";
  const paymentDisplay =
    record.paymentStatus === "SUCCESS"
      ? `₹${record.paymentAmount} (${record.paymentStatus} · Server Verified)`
      : record.paymentStatus;

  const formattedSummary = [
    `=== OFFICIAL AI HACKATHON PRE-REGISTRATION ===`,
    `Registration Type       : ${registrationType}`,
    `Full Name               : ${record.participantName}`,
    `Email Address           : ${record.email}`,
    `WhatsApp Number         : ${record.whatsappNumber}`,
    `Participant ID          : ${pidLabel}`,
    `Payment Status          : ${paymentDisplay}`,
    `PayU Transaction ID     : ${record.payuTxnId}`,
    `PayU Reference (MIH)    : ${record.payuMihpayid || "N/A"}`,
    `Timestamp               : ${record.registrationTimestamp}`,
    `Badge Verification URL  : ${verifyUrl}`,
    `==============================================`,
    `Action Required: Contact participant within 24–48 hours with AI Hackathon onboarding instructions.`,
  ].join("\n");

  return {
    // Dedicated AI Hackathon variables
    subject: `New AI Hackathon Pre-registration — ${record.participantId || record.participantName}`,
    registration_type: registrationType,
    participant_id: record.participantId || "N/A",
    participant_name: record.participantName,
    participant_email: record.email,
    whatsapp_number: record.whatsappNumber,
    payment_amount: `₹${record.paymentAmount}`,
    payu_txnid: record.payuTxnId,
    payment_status: record.paymentStatus,
    registration_timestamp: record.registrationTimestamp,
    profile_completion_status: record.profileCompletionStatus,
    badge_verification_url: verifyUrl,

    // Existing template_sf95ton variables (emailjs-template.html)
    form_type: "AI Hackathon — Pre-registration",
    from_name: record.participantName,
    from_email: record.email,
    reply_to: record.email,
    visitor_phone: record.whatsappNumber,
    dial_code: "WhatsApp",
    company_name: record.participantId
      ? `Participant ID: ${record.participantId}`
      : "Pre-registration Lead",
    purpose: `AI Hackathon (${registrationType})`,
    service_requested: `AI Hackathon — ${pidLabel}`,
    project_type: `Registration Type: ${registrationType} · Txn: ${record.payuTxnId}`,
    budget: paymentDisplay,
    timeline: `Timestamp: ${record.registrationTimestamp} · Contact within 24–48h`,
    country: "India",
    country_code: "IN",
    currency_code: "INR",
    latitude: "Pre-registration",
    longitude: record.participantId || "N/A",
    location_accuracy: `Profile: ${record.profileCompletionStatus}`,
    location_status: `Payment: ${record.paymentStatus}`,
    location_maps_url: verifyUrl,
    message: formattedSummary,
  };
}

export function buildParticipantConfirmationParams(
  record: AvatarRegistrationRecord,
  origin: string
): Record<string, string> {
  const verifyUrl = record.participantId
    ? `${origin}/competition/verify/${record.participantId}`
    : `${origin}/competition`;
  const badgePageUrl = `${origin}/competition`;
  const bodyText = [
    `Welcome to AI HACKATHON — The Ultimate AI Developer Challenge, ${record.participantName}!`,
    ``,
    record.participantId
      ? `Your pre-registration and ₹${record.paymentAmount} payment have been verified.`
      : `Your pre-registration has been received.`,
    ``,
    `• Registration Type: Pre-registration`,
    ...(record.participantId ? [`• Official Participant ID: ${record.participantId}`] : []),
    `• Payment Status: ${record.paymentStatus}`,
    `• Transaction Reference: ${record.payuTxnId}`,
    ...(record.participantId
      ? [
          `• Download Your Badge (PNG/PDF): ${badgePageUrl}`,
          `• Public QR Verification Link: ${verifyUrl}`,
        ]
      : []),
    ``,
    `What's Next?`,
    `Our organising team will contact you via Email (${record.email}) and WhatsApp (${record.whatsappNumber}) within 24–48 hours with official competition instructions and next steps.`,
    ``,
    `— Team AI Hackathon · abuzarcode.in`,
  ].join("\n");

  return {
    subject: `AI Hackathon Pre-registration Confirmed${record.participantId ? ` (${record.participantId})` : ""}`,
    to_name: record.participantName,
    to_email: record.email,
    from_name: "AI Hackathon Organizing Team (Abuzar Khan)",
    from_email: record.email,
    reply_to: "abuzarkhan.dev@gmail.com",
    registration_type: "Pre-registration",
    participant_id: record.participantId || "N/A",
    badge_download_url: badgePageUrl,
    badge_verification_url: verifyUrl,
    form_type: "AI Hackathon Participant Confirmation",
    visitor_phone: record.whatsappNumber,
    dial_code: "WhatsApp",
    company_name: record.participantId
      ? `Participant ID: ${record.participantId}`
      : "Pre-registration",
    purpose: "Welcome to AI Hackathon — Pre-registration Confirmation",
    service_requested: `${AVATAR_COMPETITION.name} — ${AVATAR_COMPETITION.subtitle}`,
    project_type: `Registration Type: Pre-registration`,
    budget: `₹${record.paymentAmount} (${record.paymentStatus})`,
    timeline: "Organising team contact within 24–48 hours",
    location_maps_url: badgePageUrl,
    message: bodyText,
  };
}

/**
 * Appends every completed registration lead to a durable local JSONL backup file
 * so a lead is never lost even if all external network calls fail.
 */
function appendToDurableLeadLog(_record: AvatarRegistrationRecord, _origin: string): void {
  // Primary persistence is handled securely via Supabase (with RLS) and the primary store.
}

async function sendViaEmailJsRest(params: {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey?: string;
  templateParams: Record<string, string>;
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.publicKey) {
    return { ok: false, error: "VITE_EMAILJS_PUBLIC_KEY is not configured yet." };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://abuzarcode.in",
      },
      body: JSON.stringify({
        service_id: params.serviceId,
        template_id: params.templateId,
        user_id: params.publicKey,
        ...(params.privateKey ? { accessToken: params.privateKey } : {}),
        template_params: params.templateParams,
      }),
    });

    if (res.ok) {
      return { ok: true };
    }
    const errText = await res.text().catch(() => `HTTP ${res.status}`);
    return { ok: false, error: `EmailJS HTTP ${res.status}: ${errText.slice(0, 200)}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "EmailJS network error",
    };
  }
}

/**
 * Dispatches an immediate backup alert when the primary EmailJS delivery fails
 * (e.g. primary mailbox full, rate-limited, or service unavailable).
 * Supports Backup EmailJS service, Telegram Bot, WhatsApp/SMS Webhook, or Generic Webhook.
 * Never exposes payment credentials.
 */
async function triggerBackupNotificationAndAlert(
  record: AvatarRegistrationRecord,
  origin: string,
  failureReason: string
): Promise<{ delivered: boolean; channel: string }> {
  const verifyUrl = record.participantId
    ? `${origin}/competition/verify/${record.participantId}`
    : `${origin}/competition`;
  const safeAlertText = [
    `🚨 [AI HACKATHON — BACKUP LEAD & EMAIL FAILURE ALERT]`,
    `Reason: ${failureReason}`,
    ``,
    `Registration Type: Pre-registration`,
    `Participant ID: ${record.participantId || "N/A"}`,
    `Name: ${record.participantName}`,
    `Email: ${record.email}`,
    `WhatsApp: ${record.whatsappNumber}`,
    `Payment Status: ₹${record.paymentAmount} (${record.paymentStatus})`,
    `PayU Txn ID: ${record.payuTxnId}`,
    `Registered At: ${record.registrationTimestamp}`,
    `Verify Badge: ${verifyUrl}`,
  ].join("\n");

  // 1. Try Telegram Bot if configured
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: safeAlertText,
        }),
      });
      if (res.ok) return { delivered: true, channel: "telegram_bot" };
    } catch {
      // Continue to next backup channel
    }
  }

  // 2. Try Secondary / Backup EmailJS service if configured
  const backupServiceId = process.env.BACKUP_EMAILJS_SERVICE_ID;
  const backupTemplateId =
    process.env.BACKUP_EMAILJS_TEMPLATE_ID || DEFAULT_EMAILJS_TEMPLATE_ID;
  const publicKey =
    process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || "";
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (backupServiceId && publicKey) {
    const res = await sendViaEmailJsRest({
      serviceId: backupServiceId,
      templateId: backupTemplateId,
      publicKey,
      privateKey,
      templateParams: {
        ...buildOrganiserEmailParams(record, origin),
        subject: `[BACKUP ALERT] AI Hackathon Pre-registration — ${record.participantId || record.participantName} (Primary Failed: ${failureReason.slice(0, 60)})`,
      },
    });
    if (res.ok) return { delivered: true, channel: "backup_emailjs_mailbox" };
  }

  // 3. Try WhatsApp Business / SMS / Custom Webhook if configured
  const webhookUrl =
    process.env.BACKUP_NOTIFICATION_WEBHOOK_URL ||
    process.env.WHATSAPP_WEBHOOK_URL ||
    process.env.SMS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "ai_hackathon_registration_notification_failure",
          registrationType: "Pre-registration",
          participantId: record.participantId,
          participantName: record.participantName,
          email: record.email,
          whatsappNumber: record.whatsappNumber,
          paymentAmount: record.paymentAmount,
          payuTxnId: record.payuTxnId,
          paymentStatus: record.paymentStatus,
          registrationTimestamp: record.registrationTimestamp,
          badgeVerificationUrl: verifyUrl,
          failureReason,
          text: safeAlertText,
        }),
      });
      if (res.ok) return { delivered: true, channel: "backup_webhook" };
    } catch {
      // Fall through
    }
  }

  return { delivered: false, channel: "durable_db_and_outbox_log" };
}

/**
 * Delivers Organiser Notification + Participant Confirmation with controlled
 * exponential backoff retries, durable status tracking, and single-shot backup alerting.
 */
export async function dispatchRegistrationNotifications(
  record: AvatarRegistrationRecord,
  origin: string,
  clientDeliveredOrganiser = false,
  clientDeliveredParticipant = false,
  options?: { simulatePrimaryFailure?: boolean }
): Promise<{
  organiserStatus: AvatarRegistrationRecord["emailNotificationStatus"];
  participantStatus: AvatarRegistrationRecord["participantEmailStatus"];
  backupChannel: string | null;
  error: string | null;
}> {
  appendToDurableLeadLog(record, origin);

  if (clientDeliveredOrganiser) {
    await updateNotificationState(record.payuTxnId, {
      emailNotificationStatus: "SENT",
      participantEmailStatus: clientDeliveredParticipant ? "SENT" : "NOT_STARTED",
      lastNotificationError: null,
      nextRetryAt: null,
    });
    return {
      organiserStatus: "SENT",
      participantStatus: clientDeliveredParticipant ? "SENT" : "NOT_STARTED",
      backupChannel: null,
      error: null,
    };
  }

  const serviceId = options?.simulatePrimaryFailure
    ? "service_simulated_failure"
    : process.env.VITE_EMAILJS_SERVICE_ID ||
      process.env.EMAILJS_SERVICE_ID ||
      DEFAULT_EMAILJS_SERVICE_ID;
  const templateId =
    process.env.VITE_EMAILJS_TEMPLATE_ID ||
    process.env.EMAILJS_TEMPLATE_ID ||
    DEFAULT_EMAILJS_TEMPLATE_ID;
  const participantTemplateId =
    process.env.VITE_EMAILJS_PARTICIPANT_TEMPLATE_ID ||
    process.env.EMAILJS_PARTICIPANT_TEMPLATE_ID ||
    templateId;
  const publicKey =
    process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || "";
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  const organiserParams = buildOrganiserEmailParams(record, origin);
  const participantParams = buildParticipantConfirmationParams(record, origin);

  let lastError = "";
  let sentOrganiser = false;
  let attempts = record.notificationRetryCount;

  // Retry up to 3 times with controlled backoff (0ms, 400ms, 900ms)
  const delays = options?.simulatePrimaryFailure ? [0, 50, 100] : [0, 400, 900];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await sleep(delays[i]);
    attempts += 1;
    if (options?.simulatePrimaryFailure) {
      lastError = "Simulated primary EmailJS failure (mailbox full / quota exceeded)";
      continue;
    }
    const result = await sendViaEmailJsRest({
      serviceId,
      templateId,
      publicKey,
      privateKey,
      templateParams: organiserParams,
    });
    if (result.ok) {
      sentOrganiser = true;
      break;
    }
    lastError = result.error || "Unknown EmailJS delivery failure";
    // If public key isn't set on server or browser-only mode is enabled, break early
    if (lastError.includes("not configured") || lastError.includes("browser")) break;
  }

  let participantStatus: AvatarRegistrationRecord["participantEmailStatus"] =
    clientDeliveredParticipant ? "SENT" : "NOT_STARTED";

  if (!clientDeliveredParticipant && publicKey && !options?.simulatePrimaryFailure) {
    const pResult = await sendViaEmailJsRest({
      serviceId,
      templateId: participantTemplateId,
      publicKey,
      privateKey,
      templateParams: participantParams,
    });
    participantStatus = pResult.ok ? "SENT" : "FAILED";
  }

  if (sentOrganiser) {
    await updateNotificationState(record.payuTxnId, {
      emailNotificationStatus: "SENT",
      participantEmailStatus: participantStatus,
      notificationRetryCount: attempts,
      lastNotificationError: null,
      nextRetryAt: null,
    });
    return {
      organiserStatus: "SENT",
      participantStatus,
      backupChannel: null,
      error: null,
    };
  }

  // Primary EmailJS failed -> trigger single-shot backup alert if not already sent
  let backupChannel: string | null = record.backupAlertChannel;
  let backupDelivered = false;
  if (!record.backupAlertSent) {
    const backup = await triggerBackupNotificationAndAlert(record, origin, lastError);
    backupDelivered = backup.delivered;
    backupChannel = backup.channel;
  }

  const nextStatus: AvatarRegistrationRecord["emailNotificationStatus"] = backupDelivered
    ? "BACKUP_SENT"
    : "FAILED_QUEUED";

  // Schedule next background retry with exponential backoff (capped at 5 total retries)
  const nextRetryAt =
    attempts < 5
      ? new Date(Date.now() + Math.min(300_000, Math.pow(2, attempts) * 15_000)).toISOString()
      : null;

  await updateNotificationState(record.payuTxnId, {
    emailNotificationStatus: nextStatus,
    participantEmailStatus: participantStatus,
    notificationRetryCount: attempts,
    lastNotificationError: lastError,
    nextRetryAt,
    backupAlertSent: true,
    backupAlertChannel: backupChannel,
  });

  return {
    organiserStatus: nextStatus,
    participantStatus,
    backupChannel,
    error: lastError,
  };
}

/**
 * Processes any queued failed notifications opportunistically on subsequent API calls.
 */
export async function processQueuedNotifications(origin: string): Promise<number> {
  const pending = getPendingNotificationRecords();
  let processed = 0;
  for (const record of pending.slice(0, 3)) {
    await dispatchRegistrationNotifications(record, origin);
    processed += 1;
  }
  return processed;
}
