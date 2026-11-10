/**
 * Shared validation/normalisation for team registration.
 * Used by the browser for inline feedback and by the server as the authority.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MAX_TEAM_MEMBERS = 15;
export const MAX_TEAM_SIZE_MESSAGE = "A team can have a maximum of 15 members.";

export interface ParticipantInput {
  fullName: string;
  email: string;
  mobile: string;
  organisation: string;
  course: string;
  github: string;
  linkedin: string;
  skills: string;
}

export interface TeamInput {
  teamName: string;
  memberCount: number;
  organisation: string;
  referralCode: string;
  consent: boolean;
  members: ParticipantInput[];
}

export type FieldErrors = Record<string, string>;

/** Collapses whitespace, strips control characters and caps length. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizeEmail(value: string): string {
  return cleanText(value, 254).toLowerCase();
}

/**
 * Normalises a mobile number to `+<country><digits>`.
 * Requires an explicit country code. Indian numbers must be +91 followed by a 10-digit
 * number starting with 6–9. Returns null when invalid.
 */
export function normalizeMobile(value: string): string | null {
  const raw = cleanText(value, 32).replace(/[\s().-]/g, "");
  if (!/^\+\d{8,15}$/.test(raw)) return null;
  if (raw.startsWith("+91")) {
    return /^\+91[6-9]\d{9}$/.test(raw) ? raw : null;
  }
  return raw;
}

function normalizeProfileUrl(value: string, hosts: string[]): string | null {
  const raw = cleanText(value, 200);
  if (!raw) return "";
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!hosts.includes(host)) return null;
    if (url.pathname.replace(/\//g, "").length < 1) return null;
    return `https://${host}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

export function normalizeGithub(value: string): string | null {
  return normalizeProfileUrl(value, ["github.com"]);
}
export function normalizeLinkedin(value: string): string | null {
  return normalizeProfileUrl(value, ["linkedin.com", "in.linkedin.com"]);
}

export interface NormalizedParticipant {
  fullName: string;
  email: string;
  emailNorm: string;
  mobile: string;
  organisation: string;
  course: string;
  github: string;
  linkedin: string;
  skills: string;
}

export interface NormalizedTeam {
  teamName: string;
  memberCount: number;
  organisation: string;
  referralCode: string;
  members: NormalizedParticipant[];
}

export function validateTeamInput(
  input: unknown,
  opts: { maxTeamSize?: number; physicalAvailable?: boolean } = {}
): { ok: true; value: NormalizedTeam } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const maxAllowed = Math.min(opts.maxTeamSize ?? MAX_TEAM_MEMBERS, MAX_TEAM_MEMBERS);

  const teamName = cleanText(src.teamName, 80);
  if (teamName.length < 2) errors.teamName = "Enter a team name (at least 2 characters).";

  const rawCount =
    typeof src.memberCount === "string" && /^\d+$/.test(src.memberCount.trim())
      ? Number(src.memberCount.trim())
      : src.memberCount;
  const memberCount =
    typeof rawCount === "number" && Number.isInteger(rawCount) ? rawCount : NaN;

  const membersRaw = Array.isArray(src.members) ? src.members : [];

  if (memberCount > maxAllowed || membersRaw.length > maxAllowed) {
    errors.memberCount = MAX_TEAM_SIZE_MESSAGE;
  } else if (!(memberCount >= 1 && memberCount <= maxAllowed)) {
    errors.memberCount = `Team size must be a whole number between 1 and ${maxAllowed}.`;
  }

  if (src.consent !== true) {
    errors.consent = "The team leader must accept the terms and communication consent.";
  }

  if (Number.isFinite(memberCount) && memberCount >= 1 && memberCount <= maxAllowed && membersRaw.length !== memberCount) {
    errors.members = "Participant details must be provided for every team member.";
  }

  const members: NormalizedParticipant[] = [];
  const seenEmails = new Set<string>();
  const seenMobiles = new Set<string>();

  membersRaw.slice(0, maxAllowed).forEach((m, i) => {
    const p = (m && typeof m === "object" ? m : {}) as Record<string, unknown>;
    const key = (f: string) => `members.${i}.${f}`;
    const fullName = cleanText(p.fullName, 90);
    const email = cleanText(p.email, 254);
    const mobile = normalizeMobile(typeof p.mobile === "string" ? p.mobile : "");
    const github = normalizeGithub(typeof p.github === "string" ? p.github : "");
    const linkedin = normalizeLinkedin(typeof p.linkedin === "string" ? p.linkedin : "");

    if (fullName.length < 2) errors[key("fullName")] = "Enter the full name.";
    if (!EMAIL_RE.test(email)) errors[key("email")] = "Enter a valid email address.";
    if (!mobile) errors[key("mobile")] = "Enter a valid mobile number with country code (e.g. +91 98765 43210).";
    if (github === null) errors[key("github")] = "Enter a valid github.com profile link.";
    if (linkedin === null) errors[key("linkedin")] = "Enter a valid linkedin.com profile link.";

    const emailNorm = normalizeEmail(email);
    if (EMAIL_RE.test(email)) {
      if (seenEmails.has(emailNorm)) errors[key("email")] = "This email is used twice in your team.";
      seenEmails.add(emailNorm);
    }
    if (mobile) {
      if (seenMobiles.has(mobile)) errors[key("mobile")] = "This mobile number is used twice in your team.";
      seenMobiles.add(mobile);
    }

    const organisation = cleanText(p.organisation, 120);
    const course = cleanText(p.course, 120);
    if (!organisation) errors[key("organisation")] = "Enter college or organisation.";
    if (!course) errors[key("course")] = "Enter course or designation.";

    members.push({
      fullName,
      email,
      emailNorm,
      mobile: mobile ?? "",
      organisation,
      course,
      github: github ?? "",
      linkedin: linkedin ?? "",
      skills: cleanText(p.skills, 300),
    });
  });

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      teamName,
      memberCount,
      organisation: cleanText(src.organisation, 120),
      referralCode: cleanText(src.referralCode, 40).toUpperCase(),
      members,
    },
  };
}
