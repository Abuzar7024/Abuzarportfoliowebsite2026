/**
 * Official configuration for AI HACKATHON — Pre-Registration Campaign.
 *
 * Single source of truth for prizes, target count, ₹499 pre-registration fee,
 * Terms & Conditions versions, and FAQ copy.
 */

export interface PrizeTier {
  rank: string;
  place: string;
  shortHighlight: string;
  medal: "gold" | "silver" | "bronze";
  emoji: string;
  amount: string;
  numericValue: number;
  extras?: string;
}

export interface HackathonStep {
  step: string;
  label: string;
  title: string;
  description: string;
}

export interface HackathonFaqItem {
  question: string;
  answer: string;
}

export const AVATAR_COMPETITION = {
  id: "ai-hackathon-2026",
  name: "AI HACKATHON",
  edition: "AI HACKATHON",
  subtitle: "BUILD WITH AI. COMPETE. WIN.",
  campaignBadge: "PRE-REGISTRATION NOW OPEN",
  heroHeadline: "BUILD WITH AI. COMPETE. WIN.",
  heroSubheadline:
    "A competition for builders, developers and AI enthusiasts.",
  ctaLabel: "PRE-REGISTER NOW",
  secondaryCtaLabel: "Prizes",
  formButtonLabel: "COUNT ME IN",
  targetNote:
    "Help us reach 5,000 registrations. Official competition dates will be announced once the target is reached.",
  prizeHighlight: "₹9,10,000 in Cash Prizes + Gift Voucher Value",
  tagline: "BUILD WITH AI. COMPETE. WIN.",
  organiser: "Abuzar Khan · abuzarcode.in",
  platformUrl: "https://abuzarcode.in",
  registrationPath: "/competition",
  termsPath: "/competition/terms",
  privacyPath: "/competition/terms#privacy-policy",
  verifyPathPrefix: "/competition/verify",

  registration: {
    requirePayment: true,
    feeInr: 499,
    feeFormatted: "₹499",
    targetRegistrations: 5000,
    targetFormatted: "5,000",
    currency: "INR",
    gateway: "PayU",
    productInfo: "AI Hackathon Pre-Registration",
    contactWindow: "24–48 hours",
    idPrefix: "AIH-2026",
    termsVersion: "v1.1-2026-11-05",
    privacyVersion: "v1.1-2026-11-05",
    mandatoryConsentText:
      "I have read and agree to the AI Hackathon Terms & Conditions and Privacy Policy. I understand that the current pre-registration fee is ₹499 and that voluntary withdrawal or non-attendance does not ordinarily qualify for a refund, subject to applicable law.",
  },

  prizePool: {
    kicker: "BIG IDEAS. BIG REWARDS.",
    heading: "BUILD. COMPETE. GET REWARDED.",
    rewardSummaryHeadline: "3 Major Cash Prize Winners + 100 Claude Subscription Rewards",
    subcopy:
      "₹9,10,000 in cash prizes and gift voucher value, plus 100 one-month Claude subscriptions.",
    totalCashAndVouchersFormatted: "₹9,10,000",
    totalCashAndVouchersInr: 910000,
    additionalRewardsSummary: "TOP 100 — One Month of Claude Subscription Each",
    tiers: [
      {
        rank: "1ST",
        place: "FIRST PLACE",
        shortHighlight: "1ST — ₹5,00,000",
        medal: "gold",
        emoji: "🥇",
        amount: "₹5,00,000",
        numericValue: 500000,
      },
      {
        rank: "2ND",
        place: "SECOND PLACE",
        shortHighlight: "2ND — ₹3,00,000",
        medal: "silver",
        emoji: "🥈",
        amount: "₹3,00,000",
        numericValue: 300000,
      },
      {
        rank: "3RD",
        place: "THIRD PLACE",
        shortHighlight: "3RD — ₹1,00,000 + ₹10,000 AMAZON GIFT VOUCHER",
        medal: "bronze",
        emoji: "🥉",
        amount: "₹1,00,000",
        numericValue: 110000,
        extras: "+ ₹10,000 AMAZON GIFT VOUCHER",
      },
    ] as PrizeTier[],
    additionalRewards: {
      count: 100,
      title: "TOP 100 PERFORMERS",
      headline: "TOP 100 PARTICIPANTS GET CLAUDE FOR ONE MONTH!",
      reward: "One month of Claude subscription each ($100 advertised value)",
      exclusionNote:
        "One month of Claude subscription each, advertised value of $100 per subscription, provided by our organising team.",
      description:
        "One month of Claude subscription each (advertised value of $100 per subscription), provided by our organising team.",
      conditions: [
        "Provided using the participant's registered Google-linked account, subject to Claude account and redemption eligibility.",
        "Each eligible participant receives one month.",
        "The top 100 will be determined using the officially announced competition ranking criteria.",
      ],
    },
  },

  howToJoin: [
    {
      step: "01",
      label: "01 — PRE-REGISTER",
      title: "PRE-REGISTER",
      description: "Submit your basic information in seconds.",
    },
    {
      step: "02",
      label: "02 — GET CONFIRMED",
      title: "GET CONFIRMED",
      description: "Complete the ₹499 pre-registration payment and receive your verified AIH-2026 badge.",
    },
    {
      step: "03",
      label: "03 — BUILD & COMPETE",
      title: "BUILD & COMPETE",
      description: "Receive official competition updates and compete once the 5,000 builder target is reached.",
    },
  ] as HackathonStep[],

  faqs: [
    {
      question: "What is AI Hackathon?",
      answer:
        "A developer competition organised through abuzarcode.in for builders, developers and AI enthusiasts.",
    },
    {
      question: "Who can participate?",
      answer:
        "Developers, programmers, computer science students, problem-solvers and AI enthusiasts are welcome to pre-register.",
    },
    {
      question: "Is pre-registration open?",
      answer:
        "Yes. Pre-registration is open now with a target of 5,000 participants.",
    },
    {
      question: "What is the registration fee?",
      answer:
        "The current pre-registration fee is ₹499, processed securely via PayU and verified server-side.",
    },
    {
      question: "When will the competition dates be announced?",
      answer:
        "Official competition dates, format and rules will be announced once we reach 5,000 pre-registrations.",
    },
    {
      question: "What are the prizes?",
      answer:
        "1st Place wins ₹5,00,000, 2nd Place wins ₹3,00,000, and 3rd Place wins ₹1,00,000 + a ₹10,000 Amazon Gift Voucher. In addition, the Top 100 performers receive one month of Claude subscription each (subject to account eligibility).",
    },
    {
      question: "How will I receive updates?",
      answer:
        "Our organising team will contact confirmed participants via their registered Email address and WhatsApp number.",
    },
  ] as HackathonFaqItem[],
};
