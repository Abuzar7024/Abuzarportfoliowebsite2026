/**
 * Single source of truth for team pricing.
 *
 * The browser imports this only to PREVIEW the total. The server recomputes the
 * amount from the stored member count + settings and never trusts a client amount.
 * All amounts are whole rupees (integers) so there is no floating-point drift.
 */

export interface TaxPolicy {
  enabled: boolean;
  label: string;
  /** Percentage, e.g. 18 for 18%. Ignored when `enabled` is false. */
  ratePercent: number;
}

export interface PricingSettings {
  feePerPerson: number;
  minTeamSize: 1;
  maxTeamSize: number;
  tax: TaxPolicy;
}

export interface FeeBreakdown {
  members: number;
  feePerPerson: number;
  subtotal: number;
  taxLabel: string | null;
  tax: number;
  total: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  feePerPerson: 499,
  minTeamSize: 1,
  maxTeamSize: 15,
  tax: { enabled: false, label: "", ratePercent: 0 },
};

export function validateMemberCount(value: unknown, settings: PricingSettings): number | null {
  const n = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isInteger(n)) return null;
  if (n < settings.minTeamSize || n > settings.maxTeamSize) return null;
  return n;
}

export function computeFee(members: number, settings: PricingSettings): FeeBreakdown {
  if (!Number.isInteger(members) || members < settings.minTeamSize || members > settings.maxTeamSize) {
    throw new RangeError(`Team size must be between ${settings.minTeamSize} and ${settings.maxTeamSize}.`);
  }
  if (!Number.isInteger(settings.feePerPerson) || settings.feePerPerson <= 0) {
    throw new RangeError("Fee per person must be a positive whole number of rupees.");
  }
  const subtotal = members * settings.feePerPerson;
  const taxApplies = settings.tax.enabled && settings.tax.ratePercent > 0;
  const tax = taxApplies ? Math.round((subtotal * settings.tax.ratePercent) / 100) : 0;
  return {
    members,
    feePerPerson: settings.feePerPerson,
    subtotal,
    taxLabel: taxApplies ? settings.tax.label || "Tax" : null,
    tax,
    total: subtotal + tax,
  };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
