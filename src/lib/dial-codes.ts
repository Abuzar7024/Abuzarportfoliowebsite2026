export interface DialCodeOption {
  countryCode: string;
  dialCode: string;
  label: string;
  flag: string;
}

/** ISO country code → international dial prefix */
const DIAL_BY_COUNTRY: Record<string, string> = {
  IN: "+91",
  US: "+1",
  CA: "+1",
  GB: "+44",
  AE: "+971",
  SA: "+966",
  AU: "+61",
  DE: "+49",
  FR: "+33",
  JP: "+81",
  CN: "+86",
  SG: "+65",
  MY: "+60",
  NZ: "+64",
  CH: "+41",
  IT: "+39",
  ES: "+34",
  NL: "+31",
  BR: "+55",
  MX: "+52",
  PK: "+92",
  BD: "+880",
  LK: "+94",
  NP: "+977",
  QA: "+974",
  KW: "+965",
  BH: "+973",
  OM: "+968",
  ZA: "+27",
  NG: "+234",
  KE: "+254",
  PH: "+63",
  ID: "+62",
  TH: "+66",
  VN: "+84",
  KR: "+82",
  RU: "+7",
  TR: "+90",
  PL: "+48",
  SE: "+46",
  NO: "+47",
  DK: "+45",
  IE: "+353",
  PT: "+351",
  AT: "+43",
  BE: "+32",
};

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export const DIAL_CODE_OPTIONS: DialCodeOption[] = [
  { countryCode: "IN", dialCode: "+91", label: "India", flag: "🇮🇳" },
  { countryCode: "US", dialCode: "+1", label: "United States", flag: "🇺🇸" },
  { countryCode: "GB", dialCode: "+44", label: "United Kingdom", flag: "🇬🇧" },
  { countryCode: "AE", dialCode: "+971", label: "UAE", flag: "🇦🇪" },
  { countryCode: "SA", dialCode: "+966", label: "Saudi Arabia", flag: "🇸🇦" },
  { countryCode: "AU", dialCode: "+61", label: "Australia", flag: "🇦🇺" },
  { countryCode: "DE", dialCode: "+49", label: "Germany", flag: "🇩🇪" },
  { countryCode: "FR", dialCode: "+33", label: "France", flag: "🇫🇷" },
  { countryCode: "JP", dialCode: "+81", label: "Japan", flag: "🇯🇵" },
  { countryCode: "CN", dialCode: "+86", label: "China", flag: "🇨🇳" },
  { countryCode: "SG", dialCode: "+65", label: "Singapore", flag: "🇸🇬" },
  { countryCode: "MY", dialCode: "+60", label: "Malaysia", flag: "🇲🇾" },
  { countryCode: "CA", dialCode: "+1", label: "Canada", flag: "🇨🇦" },
  { countryCode: "PK", dialCode: "+92", label: "Pakistan", flag: "🇵🇰" },
  { countryCode: "BD", dialCode: "+880", label: "Bangladesh", flag: "🇧🇩" },
];

export function getDialCodeForCountry(countryCode: string): string {
  const upper = countryCode.toUpperCase();
  if (DIAL_BY_COUNTRY[upper]) return DIAL_BY_COUNTRY[upper];
  if (EU_COUNTRIES.has(upper)) return "+44";
  return "+1";
}

export function getPhonePlaceholder(dialCode: string): string {
  if (dialCode === "+91") return "9876543210";
  if (dialCode === "+1") return "2025550123";
  if (dialCode === "+44") return "7911123456";
  return "Phone number";
}

export function formatVisitorPhone(dialCode: string, phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  if (!trimmed) return "Not provided";
  return `${dialCode} ${trimmed}`;
}
