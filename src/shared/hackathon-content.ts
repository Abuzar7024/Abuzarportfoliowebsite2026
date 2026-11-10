/**
 * Default (seed) content for the National AI Hackathon website.
 *
 * Everything here is overridable from the admin panel (stored in `hk_content`).
 * Nothing in this file states a confirmed date, venue, sponsor, judge or mentor:
 * unresolved items are shown as "To be announced".
 */
import { DEFAULT_PRICING, type TaxPolicy } from "./hackathon-pricing";

export type EventStatusLabel =
  | "Pre-Registrations Open"
  | "Registrations Open"
  | "Registrations Closed"
  | "Coming Soon"
  | "Event Live"
  | "Event Completed";

export const EVENT_STATUS_LABELS: EventStatusLabel[] = [
  "Pre-Registrations Open",
  "Registrations Open",
  "Registrations Closed",
  "Coming Soon",
  "Event Live",
  "Event Completed",
];

export interface HackathonSettings {
  eventName: string;
  editionLabel: string;
  location: string;
  dateText: string;
  venueText: string;
  formatText: string;
  physicalDurationText: string;
  expectedPhysicalAttendance: number;
  targetParticipants: number;
  maxParticipants: number;
  feePerPerson: number;
  maxTeamSize: number;
  tax: TaxPolicy;
  /** Master switch. Registration also requires the legal policies to be published. */
  registrationOpen: boolean;
  physicalRegistrationAvailable: boolean;
  /** Dynamic status fields displayed on the public Hackathon Status page. */
  eventStatus: EventStatusLabel;
  preRegistrationStatus: string;
  officialRegistrationStatus: string;
  registrationDeadlineText: string;
  contactEmail: string;
  contactPhone: string;
  grievanceText: string;
  submissionInstructions: string;
  /** Optional photographs (https URL or /path). Empty = a labelled placeholder is shown. */
  heroImageUrl: string;
  secondaryImageUrl: string;
  mentorImageUrl: string;
  demoImageUrl: string;
}

export interface HomeCopy {
  heroHeadline: string;
  heroText: string;
  overviewWhat: string;
  overviewWho: string;
  overviewOnline: string;
  overviewPhysical: string;
  overviewBuild: string;
  overviewGain: string;
  ctaHeadline: string;
}

export interface Track {
  id: string;
  title: string;
  description: string;
}

export interface PrizeItem {
  rank: string;
  title: string;
  amount: string;
  extra?: string;
}

export interface PrizesContent {
  notice: string;
  items: PrizeItem[];
  additional: { title: string; description: string };
}

export interface ScheduleDay {
  day: string;
  title: string;
  items: string[];
}

export interface ScheduleContent {
  notice: string;
  days: ScheduleDay[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Policy {
  title: string;
  body: string;
  published: boolean;
  updatedAt: string | null;
}

export type PolicySlug =
  | "terms"
  | "privacy"
  | "refund"
  | "conduct"
  | "eligibility"
  | "payment"
  | "contact";

export interface HackathonContent {
  settings: HackathonSettings;
  home: HomeCopy;
  tracks: Track[];
  prizes: PrizesContent;
  schedule: ScheduleContent;
  faqs: FaqItem[];
  policies: Record<PolicySlug, Policy>;
}

export const CONTENT_KEYS = [
  "settings",
  "home",
  "tracks",
  "prizes",
  "schedule",
  "faqs",
  "policies",
] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

export const POLICY_SLUGS: PolicySlug[] = [
  "terms",
  "privacy",
  "refund",
  "conduct",
  "eligibility",
  "payment",
  "contact",
];

export const REQUIRED_POLICIES_FOR_REGISTRATION: PolicySlug[] = ["terms", "privacy", "refund"];

function policy(title: string, body: string): Policy {
  return { title, body, published: true, updatedAt: null };
}

export const DEFAULT_CONTENT: HackathonContent = {
  settings: {
    eventName: "AVATAR",
    editionLabel: "DESIGN. BUILD. SELL. IN ONE DAY.",
    location: "Bhopal, Madhya Pradesh, India",
    dateText: "To be announced",
    venueText: "To be announced",
    formatText: "Hybrid: online across India, with an optional 1-day physical event in Bhopal",
    physicalDurationText: "1 day",
    expectedPhysicalAttendance: 1500,
    targetParticipants: 1500,
    maxParticipants: 7500,
    feePerPerson: DEFAULT_PRICING.feePerPerson,
    maxTeamSize: 15,
    tax: DEFAULT_PRICING.tax,
    registrationOpen: true,
    physicalRegistrationAvailable: true,
    eventStatus: "Pre-Registrations Open",
    preRegistrationStatus: "Pre-Registrations Open",
    officialRegistrationStatus: "Pre-Registrations Open",
    registrationDeadlineText: "Open now · Closing date to be announced",
    contactEmail: "",
    contactPhone: "",
    grievanceText: "For registration or payment queries, check the public Hackathon Status page or use the contact details updated by the organisers.",
    submissionInstructions:
      "Submission and live pitch instructions will be shared with confirmed participants once the competition schedule is announced.",
    heroImageUrl: "/images/hackathon/hero-team-coding.jpg",
    secondaryImageUrl: "/images/hackathon/venue-workshop.jpg",
    mentorImageUrl: "/images/hackathon/mentor-review.jpg",
    demoImageUrl: "/images/hackathon/jury-demo.jpg",
  },
  home: {
    heroHeadline: "DESIGN. BUILD. SELL. IN ONE DAY.",
    heroText:
      "AVATAR is a high-intensity one-day challenge where developers, designers, students and founders turn an idea into a real product — designing it, building it, and presenting or selling it in one day.",
    overviewWhat:
      "AVATAR is an intensive one-day product hackathon. Participants take an idea from zero to a working product — designing the user experience, building the functional prototype, and pitching or selling its value to a jury in a single day.",
    overviewWho:
      "Developers, designers, students, founders and makers across India. You can register solo (1 member) or with a team.",
    overviewOnline:
      "Online participants compete from anywhere in India, build and ship their product during the one-day sprint, and submit their live demo and pitch digitally.",
    overviewPhysical:
      "A high-energy one-day physical event in Bhopal where participants design, build and pitch alongside fellow builders and mentors, subject to venue capacity and confirmation.",
    overviewBuild:
      "Real, market-ready AI and software products designed, built and pitched within a single day.",
    overviewGain:
      "Prizes, real-world product feedback from a jury, experience shipping and selling under a one-day deadline, and an official AVATAR participant pass.",
    ctaHeadline: "PRE-REGISTRATIONS ARE NOW OPEN!",
  },
  tracks: [
    { id: "genai", title: "Generative AI Products", description: "Customer-ready products built on text, image, audio, video or code generation." },
    { id: "saas", title: "AI SaaS & Micro-Products", description: "Software tools designed, built and ready to sell to real users or businesses in one day." },
    { id: "auto", title: "Autonomous Agents & Workflows", description: "AI agents and automation pipelines that eliminate repetitive work." },
    { id: "edu", title: "AI for Education", description: "Products that help students, teachers or professionals learn and upskill faster." },
    { id: "health", title: "AI for Healthcare", description: "Practical digital tools for patients, clinicians and health workflows." },
    { id: "fin", title: "FinTech & Commerce AI", description: "Smart commerce, payments, pricing and business intelligence tools." },
    { id: "social", title: "AI for Bharat & Social Impact", description: "Multilingual, accessible solutions built for Indian communities and public services." },
    { id: "open", title: "Open Innovation", description: "Any bold product idea you can design, build and sell in one day." },
  ],
  prizes: {
    notice: "Proposed prize pool. Subject to official confirmation. Final prizes, eligibility and terms will be published before registration closes.",
    items: [
      { rank: "1st", title: "First prize", amount: "₹5,00,000" },
      { rank: "2nd", title: "Second prize", amount: "₹3,00,000" },
      { rank: "3rd", title: "Third prize", amount: "₹1,00,000", extra: "+ ₹10,000 Amazon voucher" },
    ],
    additional: {
      title: "Top 100 performers",
      description:
        "Proposed: a one-month Claude subscription benefit (advertised value $100) for each of the top 100 performers, subject to eligibility, availability and final terms. This is arranged by the organisers; Anthropic and Amazon are not event partners.",
    },
  },
  schedule: {
    notice: "Provisional one-day sprint format — DESIGN. BUILD. SELL. IN ONE DAY. Exact date, timings and venue are yet to be announced.",
    days: [
      {
        day: "Phase 01 · Morning",
        title: "DESIGN — Ideate, Architect & Validate",
        items: [
          "Check-in, opening keynote & challenge reveal",
          "Problem selection & user value proposition",
          "Product UX/UI wireframing & system architecture",
          "Mentor check-in on product scope",
        ],
      },
      {
        day: "Phase 02 · Afternoon",
        title: "BUILD — Code, Integrate & Ship",
        items: [
          "Rapid full-stack & AI model implementation",
          "Working prototype integration & testing",
          "1-on-1 technical & product mentoring rounds",
          "Live deployment & product polish",
        ],
      },
      {
        day: "Phase 03 · Evening",
        title: "SELL — Pitch, Demo & Finale",
        items: [
          "Final product & pitch deck submission",
          "Live product demonstrations & sales pitch to jury",
          "Finalist stage showcase & Q&A",
          "Winner announcement & closing awards ceremony",
        ],
      },
    ],
  },
  faqs: [
    { question: "What is AVATAR?", answer: "AVATAR (DESIGN. BUILD. SELL. IN ONE DAY.) is a one-day hackathon where solo builders and teams turn an idea into a working product by designing it, building it, and pitching or selling it in a single day." },
    { question: "Are pre-registrations open right now?", answer: "Yes — PRE-REGISTRATIONS ARE NOW OPEN! Complete the registration form and verified payment to receive your official AVATAR participant pass." },
    { question: "Can I register individually or with a team?", answer: "Both. You can register as a solo participant (1 member) or with a team of up to 15 members." },
    { question: "Is online participation available?", answer: "Yes. You can participate online from anywhere in India or opt for the physical event in Bhopal." },
    { question: "Where will the physical event happen?", answer: "The physical event will be held in Bhopal, Madhya Pradesh. The exact venue and date will be announced." },
    { question: "What happens after my payment is verified?", answer: "Once your payment is verified with PayU, you immediately receive your confirmation, Registration ID, Transaction ID, and your downloadable AVATAR participant pass with a scannable QR code." },
    { question: "What if my payment is pending or fails?", answer: "If a payment is pending, the system automatically checks with PayU and updates your status without generating a duplicate charge. If a payment fails, no pass is generated and you can safely retry payment from the status page." },
    { question: "How can I check the current hackathon status or announcements?", answer: "Visit the public Hackathon Status section in the navigation bar at any time — no login or account is required to view live registration counts, event status, deadlines and official announcements." },
    { question: "Do I need prior AI experience?", answer: "Builders of all backgrounds — developers, designers, product thinkers and students — are welcome." },
  ],
  policies: {
    terms: policy(
      "Terms and Conditions",
      "1. About the event\nAVATAR (DESIGN. BUILD. SELL. IN ONE DAY.) is organised from Bhopal, Madhya Pradesh, India, with nationwide online participation and an optional one-day physical event in Bhopal. Exact date and venue are to be announced.\n\n2. Registration & Verification\nA registration is confirmed and an official AVATAR participant pass is issued only after the payment has been independently verified server-to-server with PayU.\n\n3. Proposed Prizes\nPrizes shown on the website are proposed and are subject to official confirmation and eligibility rules published before registration closes.\n\n4. Changes & Updates\nThe organisers may update the schedule, format and rules. Material changes will be communicated to registered participants by email and published on the public Hackathon Status page."
    ),
    privacy: policy(
      "Privacy Policy",
      "What we collect\nTeam name, optional college or organisation and referral code, and for each participant: full name, email address, mobile number, college or organisation, course or designation, and optional GitHub profile, LinkedIn profile and skill/domain.\n\nWhy we collect it\nTo process registration and payment, issue your official AVATAR pass, prevent duplicate registrations, communicate event updates, and administer the hackathon.\n\nWhat we do not collect\nWe do not collect device identifiers, contact lists, SIM information or files from your device.\n\nWho can see it\nOnly the organising team and your own team members. Participant contact details are never shown publicly.\n\nPayments\nCard, UPI and netbanking details are entered on PayU and are never stored on our servers.\n\nRetention\nRegistration data is retained for the duration of the event and a reasonable period afterwards for participant support and accounting."
    ),
    refund: policy(
      "Refund and Cancellation Policy",
      "1. Duplicate or Failed-but-Debited Payments\nIf your bank account is debited more than once for the same registration or if a payment is captured after a registration is already confirmed, the duplicate capture is flagged for refund and returned to the original payment source after verification.\n\n2. Event Cancellation\nIf the organisers cancel the event, confirmed participants will be eligible for a refund of the registration fee in accordance with the official announcement.\n\n3. Voluntary Cancellation & Team Changes\nFor any team or registration support requests, contact the organisers using the official contact channels."
    ),
    conduct: policy(
      "Code of Conduct",
      "Be respectful to all participants, mentors, judges and organisers. Harassment, discrimination or plagiarism of any kind is not tolerated. Participants must submit original work created during the competition or work they have the legal right to use. The organisers may disqualify teams that violate these rules."
    ),
    eligibility: policy(
      "Participant Eligibility",
      "Open to developers, designers, students, founders and technology enthusiasts across India. You may register individually (1 member) or as a team up to 15 members. Detailed track-specific eligibility rules will be published before registration closes."
    ),
    payment: policy(
      "Payment and Registration Policy",
      "Registration payments are processed securely online through PayU. A registration is confirmed and an AVATAR participant pass is generated only after the payment is verified server-to-server with PayU. If your bank shows a debit but the website shows processing, do not pay again: use the payment status page to check status."
    ),
    contact: policy(
      "Contact and Grievance Information",
      "Visitors and participants can check live updates on the public Hackathon Status page (/competition/status). Official contact email, phone and grievance officer details configured in the Admin Panel appear automatically on this page and in the website footer."
    ),
  },
};

export function mergeContent(overrides: Partial<Record<ContentKey, unknown>>): HackathonContent {
  const base = structuredClone(DEFAULT_CONTENT) as HackathonContent;
  const o = overrides as Record<string, unknown>;
  if (o.settings && typeof o.settings === "object") {
    base.settings = { ...base.settings, ...(o.settings as Partial<HackathonSettings>) };
    base.settings.tax = { ...DEFAULT_CONTENT.settings.tax, ...(base.settings.tax ?? {}) };
  }
  if (o.home && typeof o.home === "object") base.home = { ...base.home, ...(o.home as Partial<HomeCopy>) };
  if (Array.isArray(o.tracks)) base.tracks = o.tracks as Track[];
  if (o.prizes && typeof o.prizes === "object") base.prizes = { ...base.prizes, ...(o.prizes as Partial<PrizesContent>) };
  if (o.schedule && typeof o.schedule === "object") base.schedule = { ...base.schedule, ...(o.schedule as Partial<ScheduleContent>) };
  if (Array.isArray(o.faqs)) base.faqs = o.faqs as FaqItem[];
  if (o.policies && typeof o.policies === "object") {
    for (const slug of POLICY_SLUGS) {
      const p = (o.policies as Record<string, Partial<Policy>>)[slug];
      if (p) base.policies[slug] = { ...base.policies[slug], ...p };
    }
  }
  return base;
}

/** True when the master switch is on AND the required legal pages are published. */
export function isRegistrationActuallyOpen(c: HackathonContent): { open: boolean; reason: string | null } {
  if (!c.settings.registrationOpen) return { open: false, reason: "Registration has not opened yet." };
  const missing = REQUIRED_POLICIES_FOR_REGISTRATION.filter((s) => !c.policies[s].published);
  if (missing.length) {
    return { open: false, reason: "Registration opens once the event policies are published." };
  }
  return { open: true, reason: null };
}
