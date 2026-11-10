import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ensureEnvLoaded } from "./payu";

export interface SupabaseHackathonRow {
  id: number;
  participant_id: string | null;
  full_name: string;
  email: string;
  whatsapp_number: string;
  payment_amount: string;
  payment_status: string;
  payu_txnid: string;
  payu_mihpayid: string | null;
  registered_at: string;
  paid_at: string | null;
  registration_ref?: string | null;
  terms_version?: string | null;
  privacy_version?: string | null;
  consent_timestamp?: string | null;
  consent_status?: string | null;
}

let serverClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  ensureEnvLoaded();
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();

  if (!url || !key) return null;
  if (!serverClient) {
    serverClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

function getRpcSecret(): string {
  ensureEnvLoaded();
  return (process.env.PAYU_MERCHANT_SALT || "").trim();
}

/**
 * Saves ONLY the clean, useful registration fields to Supabase
 * (`public.ai_hackathon_registrations`) via the authenticated server RPC.
 */
export async function syncSupabaseRegistration(params: {
  payuTxnId: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  paymentAmount: string;
  paymentStatus: string;
  participantId?: string | null;
  payuMihpayid?: string | null;
  paidAt?: string | null;
  registrationRef?: string | null;
  termsVersion?: string | null;
  privacyVersion?: string | null;
  consentTimestamp?: string | null;
  consentStatus?: string | null;
}): Promise<SupabaseHackathonRow | null> {
  const client = getSupabaseServerClient();
  const secret = getRpcSecret();
  if (!client || !secret) return null;

  try {
    const { data, error } = await client.rpc("upsert_ai_hackathon_registration", {
      p_server_secret: secret,
      p_payu_txnid: params.payuTxnId,
      p_full_name: params.fullName,
      p_email: params.email,
      p_whatsapp_number: params.whatsappNumber,
      p_payment_amount: parseFloat(params.paymentAmount || "499.00"),
      p_payment_status: params.paymentStatus,
      p_participant_id: params.participantId || null,
      p_payu_mihpayid: params.payuMihpayid || null,
      p_paid_at: params.paidAt || null,
      p_registration_ref: params.registrationRef || null,
      p_terms_version: params.termsVersion || null,
      p_privacy_version: params.privacyVersion || null,
      p_consent_timestamp: params.consentTimestamp || null,
      p_consent_status: params.consentStatus || "ACCEPTED",
    });
    if (error || !data) return null;
    return data as SupabaseHackathonRow;
  } catch {
    return null;
  }
}

export async function fetchSupabaseConfirmedCount(): Promise<number | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  try {
    const { data, error } = await client.rpc("get_ai_hackathon_confirmed_count");
    if (error || typeof data !== "number") return null;
    return Math.max(0, data);
  } catch {
    return null;
  }
}

export async function fetchSupabaseByTxnId(
  payuTxnId: string
): Promise<SupabaseHackathonRow | null> {
  const client = getSupabaseServerClient();
  const secret = getRpcSecret();
  if (!client || !secret) return null;

  try {
    const { data, error } = await client.rpc("get_ai_hackathon_by_txnid", {
      p_server_secret: secret,
      p_payu_txnid: payuTxnId,
    });
    if (error || !data) return null;
    return data as SupabaseHackathonRow;
  } catch {
    return null;
  }
}

export async function fetchSupabaseByIdentity(
  email: string,
  whatsappNumber: string
): Promise<SupabaseHackathonRow | null> {
  const client = getSupabaseServerClient();
  const secret = getRpcSecret();
  if (!client || !secret) return null;

  try {
    const normEmail = email.trim().toLowerCase();
    const digits = whatsappNumber.replace(/\D/g, "");
    const normPhone = digits.length >= 10 ? digits.slice(-10) : digits;
    const { data, error } = await client.rpc("find_ai_hackathon_by_identity", {
      p_server_secret: secret,
      p_email: normEmail,
      p_whatsapp_digits: normPhone,
    });
    if (error || !data) return null;
    return data as SupabaseHackathonRow;
  } catch {
    return null;
  }
}

export async function verifySupabaseBadgePublic(participantId: string): Promise<{
  verified: boolean;
  participant_id?: string;
  full_name?: string;
  payment_status?: string;
  registered_at?: string;
} | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  try {
    const { data, error } = await client.rpc("verify_ai_hackathon_badge", {
      p_participant_id: participantId,
    });
    if (error || !data) return null;
    return data as {
      verified: boolean;
      participant_id?: string;
      full_name?: string;
      payment_status?: string;
      registered_at?: string;
    };
  } catch {
    return null;
  }
}
