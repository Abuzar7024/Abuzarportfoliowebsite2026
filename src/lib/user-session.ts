export const SESSION_STORAGE_KEY = "portfolio_user_session_v1";
export const CUSTOM_BUDGET_KEY = "__custom_budget__";

export type InquiryType = "freelance" | "job" | "general";

export type GeoLocationStatus =
  | "not_captured"
  | "granted"
  | "denied"
  | "unavailable";

export interface GeoLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: number | null;
  status: GeoLocationStatus;
}

export interface RegionInfo {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  detected: boolean;
}

export interface ContactDraft {
  inquiryType: InquiryType;
  preferCall: boolean;
  dialCode: string;
  dialCodeManual: boolean;
  phoneNumber: string;
  fullName: string;
  email: string;
  message: string;
  projectType: string;
  companyName: string;
  budget: string;
  customBudget: string;
}

export interface ServiceFormDraft {
  name: string;
  email: string;
  company: string;
  description: string;
  budget: string;
  customBudget: string;
  timeline: string;
}

export interface PortfolioSession {
  region: RegionInfo;
  location: GeoLocation;
  contact: ContactDraft;
  serviceForm: ServiceFormDraft;
  updatedAt: number;
}

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  IN: { code: "INR", symbol: "₹" },
  US: { code: "USD", symbol: "$" },
  GB: { code: "GBP", symbol: "£" },
  CA: { code: "CAD", symbol: "CA$" },
  AU: { code: "AUD", symbol: "A$" },
  AE: { code: "AED", symbol: "AED " },
  SA: { code: "SAR", symbol: "SAR " },
  SG: { code: "SGD", symbol: "S$" },
  MY: { code: "MYR", symbol: "RM" },
  JP: { code: "JPY", symbol: "¥" },
  CN: { code: "CNY", symbol: "¥" },
  NZ: { code: "NZD", symbol: "NZ$" },
  CH: { code: "CHF", symbol: "CHF " },
  EU: { code: "EUR", symbol: "€" },
};

const BUDGET_BY_CURRENCY: Record<string, string[]> = {
  INR: [
    "< ₹40,000",
    "₹40,000 – ₹80,000",
    "₹80,000 – ₹2,40,000",
    "₹2,40,000 – ₹4,00,000",
    "₹4,00,000 – ₹8,00,000",
    "₹8,00,000+",
  ],
  USD: [
    "< $500",
    "$500 – $1,000",
    "$1,000 – $3,000",
    "$3,000 – $5,000",
    "$5,000 – $10,000",
    "$10,000+",
  ],
  GBP: [
    "< £400",
    "£400 – £800",
    "£800 – £2,400",
    "£2,400 – £4,000",
    "£4,000 – £8,000",
    "£8,000+",
  ],
  EUR: [
    "< €450",
    "€450 – €900",
    "€900 – €2,700",
    "€2,700 – €4,500",
    "€4,500 – €9,000",
    "€9,000+",
  ],
  CAD: [
    "< CA$700",
    "CA$700 – CA$1,400",
    "CA$1,400 – CA$4,200",
    "CA$4,200 – CA$7,000",
    "CA$7,000 – CA$14,000",
    "CA$14,000+",
  ],
  AUD: [
    "< A$750",
    "A$750 – A$1,500",
    "A$1,500 – A$4,500",
    "A$4,500 – A$7,500",
    "A$7,500 – A$15,000",
    "A$15,000+",
  ],
  AED: [
    "< AED 1,800",
    "AED 1,800 – 3,600",
    "AED 3,600 – 11,000",
    "AED 11,000 – 18,000",
    "AED 18,000 – 37,000",
    "AED 37,000+",
  ],
  SAR: [
    "< SAR 1,900",
    "SAR 1,900 – 3,800",
    "SAR 3,800 – 11,400",
    "SAR 11,400 – 19,000",
    "SAR 19,000 – 38,000",
    "SAR 38,000+",
  ],
  SGD: [
    "< S$700",
    "S$700 – S$1,400",
    "S$1,400 – S$4,200",
    "S$4,200 – S$7,000",
    "S$7,000 – S$14,000",
    "S$14,000+",
  ],
  MYR: [
    "< RM 2,300",
    "RM 2,300 – RM 4,600",
    "RM 4,600 – RM 13,800",
    "RM 13,800 – RM 23,000",
    "RM 23,000 – RM 46,000",
    "RM 46,000+",
  ],
  JPY: [
    "< ¥75,000",
    "¥75,000 – ¥150,000",
    "¥150,000 – ¥450,000",
    "¥450,000 – ¥750,000",
    "¥750,000 – ¥1,500,000",
    "¥1,500,000+",
  ],
  CNY: [
    "< ¥3,500",
    "¥3,500 – ¥7,000",
    "¥7,000 – ¥21,000",
    "¥21,000 – ¥35,000",
    "¥35,000 – ¥70,000",
    "¥70,000+",
  ],
  NZD: [
    "< NZ$800",
    "NZ$800 – NZ$1,600",
    "NZ$1,600 – NZ$4,800",
    "NZ$4,800 – NZ$8,000",
    "NZ$8,000 – NZ$16,000",
    "NZ$16,000+",
  ],
  CHF: [
    "< CHF 450",
    "CHF 450 – 900",
    "CHF 900 – 2,700",
    "CHF 2,700 – 4,500",
    "CHF 4,500 – 9,000",
    "CHF 9,000+",
  ],
};

const DEFAULT_LOCATION: GeoLocation = {
  latitude: null,
  longitude: null,
  accuracy: null,
  capturedAt: null,
  status: "not_captured",
};

const DEFAULT_REGION: RegionInfo = {
  countryCode: "IN",
  countryName: "India",
  currencyCode: "INR",
  currencySymbol: "₹",
  detected: false,
};

const DEFAULT_CONTACT: ContactDraft = {
  inquiryType: "general",
  preferCall: false,
  dialCode: "+91",
  dialCodeManual: false,
  phoneNumber: "",
  fullName: "",
  email: "",
  message: "",
  projectType: "mobile",
  companyName: "",
  budget: "",
  customBudget: "",
};

const DEFAULT_SERVICE_FORM: ServiceFormDraft = {
  name: "",
  email: "",
  company: "",
  description: "",
  budget: "",
  customBudget: "",
  timeline: "",
};

export function getDefaultSession(): PortfolioSession {
  return {
    region: { ...DEFAULT_REGION },
    location: { ...DEFAULT_LOCATION },
    contact: { ...DEFAULT_CONTACT },
    serviceForm: { ...DEFAULT_SERVICE_FORM },
    updatedAt: Date.now(),
  };
}

export function loadSession(): PortfolioSession {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return getDefaultSession();
    const parsed = JSON.parse(raw) as Partial<PortfolioSession>;
    return {
      region: { ...DEFAULT_REGION, ...parsed.region },
      location: { ...DEFAULT_LOCATION, ...parsed.location },
      contact: { ...DEFAULT_CONTACT, ...parsed.contact },
      serviceForm: { ...DEFAULT_SERVICE_FORM, ...parsed.serviceForm },
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return getDefaultSession();
  }
}

export function saveSession(partial: Partial<PortfolioSession>): PortfolioSession {
  const current = loadSession();
  const next: PortfolioSession = {
    region: { ...current.region, ...partial.region },
    location: { ...current.location, ...partial.location },
    contact: { ...current.contact, ...partial.contact },
    serviceForm: { ...current.serviceForm, ...partial.serviceForm },
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

export function resolveCurrency(countryCode: string) {
  const upper = countryCode.toUpperCase();
  if (CURRENCY_MAP[upper]) return CURRENCY_MAP[upper];
  if (EU_COUNTRIES.has(upper)) return CURRENCY_MAP.EU;
  return CURRENCY_MAP.US;
}

export function getBudgetRanges(currencyCode: string): string[] {
  return BUDGET_BY_CURRENCY[currencyCode] ?? BUDGET_BY_CURRENCY.USD;
}

export function formatBudgetValue(
  budget: string,
  customBudget: string,
  currencySymbol: string
): string {
  if (budget === CUSTOM_BUDGET_KEY) {
    const trimmed = customBudget.trim();
    if (!trimmed) return "Not specified";
    return trimmed.startsWith(currencySymbol.trim())
      ? trimmed
      : `${currencySymbol}${trimmed}`;
  }
  return budget || "Not specified";
}

export function isBudgetValid(budget: string, customBudget: string): boolean {
  if (!budget) return false;
  if (budget === CUSTOM_BUDGET_KEY) return customBudget.trim().length >= 2;
  return true;
}

function regionFromCountryCode(countryCode: string, countryName?: string): RegionInfo {
  const upper = countryCode.toUpperCase();
  const currency = resolveCurrency(upper);
  return {
    countryCode: upper,
    countryName: countryName ?? upper,
    currencyCode: currency.code,
    currencySymbol: currency.symbol,
    detected: true,
  };
}

function detectFromLocale(): RegionInfo | null {
  const locales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const locale of locales) {
    const match = locale.match(/-([A-Za-z]{2})$/);
    if (match) {
      return regionFromCountryCode(match[1]);
    }
    if (locale.toLowerCase() === "hi" || locale.toLowerCase() === "hi-in") {
      return regionFromCountryCode("IN", "India");
    }
  }
  return null;
}

export async function detectRegion(): Promise<RegionInfo> {
  const cached = loadSession();
  if (cached.region.detected && cached.region.countryCode) {
    return cached.region;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = (await res.json()) as { country_code?: string; country_name?: string };
      if (data.country_code) {
        return regionFromCountryCode(data.country_code, data.country_name);
      }
    }
  } catch {
    // fall through to locale / default
  }

  return detectFromLocale() ?? regionFromCountryCode("IN", "India");
}
