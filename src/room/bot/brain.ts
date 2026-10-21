import { profile } from "../../data/profile";
import { education, experience, yearsOfExperience } from "../../data/experience";
import { featuredProjects, otherProjects } from "../../data/projects";
import { skills } from "../../data/skills";

/**
 * AK-Bot's brain: no AI service, just a curated set of questions with short
 * answers generated from the portfolio data, plus keyword matching for typed
 * questions. Every answer is a fact from the site.
 */

export interface BotQA {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

const current = experience.find((e) => e.end === null);
const past = experience.filter((e) => e.end !== null);
const host = (href?: string) => href?.replace(/^https?:\/\//, "").replace(/\/$/, "");

export const QA: BotQA[] = [
  {
    id: "who",
    question: "Who is Abuzar?",
    answer: `${profile.name} is a ${profile.title} in ${profile.location} with ${yearsOfExperience()}+ years of shipping mobile apps.`,
    keywords: ["who", "abuzar", "about", "yourself", "introduce", "bio", "background"],
  },
  {
    id: "now",
    question: "Where does he work now?",
    answer: current ? `${current.role} at ${current.company} (${current.location}) since ${current.period.split("—")[0].trim()}.` : "He's between roles right now.",
    keywords: ["work", "job", "company", "current", "now", "employer", "ebani"],
  },
  {
    id: "past",
    question: "Where has he worked before?",
    answer: past.map((e) => `${e.company}, ${e.role} (${e.period})`).join(" · "),
    keywords: ["before", "previous", "past", "experience", "history", "ohara", "quasar"],
  },
  {
    id: "projects",
    question: "What are his best projects?",
    answer: `${featuredProjects.map((p) => `${p.title}: ${p.category}`).join(" · ")}. Open the Projects folder for all ${featuredProjects.length + otherProjects.length}.`,
    keywords: ["projects", "project", "best", "built", "portfolio", "apps", "work"],
  },
  ...featuredProjects.map((p) => {
    const link = p.links.find((l) => l.primary) ?? p.links[0];
    return {
      id: `project-${p.id}`,
      question: `Tell me about ${p.title}`,
      answer: `${p.tagline}${link ? ` Live at ${host(link.href)}.` : ""}`,
      keywords: [p.title.toLowerCase(), ...p.category.toLowerCase().split(/\W+/)],
    };
  }),
  {
    id: "skills",
    question: "What are his main skills?",
    answer: `Daily: ${skills.filter((s) => s.level === "core").map((s) => s.name).join(", ")}.`,
    keywords: ["skills", "skill", "stack", "tech", "technologies", "languages", "flutter", "dart", "know"],
  },
  {
    id: "build",
    question: "What can he build for me?",
    answer: profile.whatIBuild.map((w) => w.label).join(", ") + ".",
    keywords: ["build", "make", "create", "services", "help", "freelance", "hire"],
  },
  {
    id: "open",
    question: "Is he open to work?",
    answer: `Yes: ${profile.availability.toLowerCase()}. Freelance projects too.`,
    keywords: ["open", "available", "availability", "hiring", "hire", "job", "role"],
  },
  {
    id: "contact",
    question: "How do I contact him?",
    answer: `Email ${profile.email} or WhatsApp ${profile.phoneDisplay}. Or use Mail on the computer.`,
    keywords: ["contact", "email", "mail", "phone", "reach", "whatsapp", "call", "message"],
  },
  {
    id: "education",
    question: "What did he study?",
    answer: education.map((e) => `${e.degree.replace(/\s*\(.*\)/, "")}, ${e.school} (${e.status.toLowerCase()})`).join(" · "),
    keywords: ["study", "education", "degree", "college", "university", "school", "bca"],
  },
  {
    id: "resume",
    question: "Can I see his resume?",
    answer: "Open Resume.pdf on the computer's desktop, or use the Resume button to download it.",
    keywords: ["resume", "cv", "pdf", "download"],
  },
  {
    id: "where",
    question: "Where is he based?",
    answer: `${profile.location}. Happy to work remotely.`,
    keywords: ["where", "based", "location", "city", "country", "remote"],
  },
  {
    id: "fun",
    question: "Tell me something fun",
    answer: "The cat on the desk is asleep, and there's a game called Signal Run in the Games folder.",
    keywords: ["fun", "joke", "cat", "game", "secret"],
  },
];

/** The chips shown by default. */
export const STARTERS = ["who", "projects", "skills", "open", "contact"];

export const FALLBACK = "I only know about Abuzar's work. Try one of these:";

const STOP = new Set(["the", "a", "an", "is", "are", "was", "of", "to", "in", "on", "for", "and", "or", "what", "does", "do", "did", "he", "his", "him", "me", "tell", "can", "you", "i", "with", "how", "any", "has", "have", "about"]);

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** Best matching answer for free text, or null when nothing fits. */
export function match(text: string): BotQA | null {
  const words = tokenize(text);
  if (!words.length) return null;
  let best: BotQA | null = null;
  let bestScore = 0;
  for (const qa of QA) {
    const q = tokenize(qa.question);
    let score = 0;
    for (const w of words) {
      if (qa.keywords.includes(w)) score += 2;
      if (q.includes(w)) score += 1;
    }
    if (score > bestScore) {
      best = qa;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : null;
}

/** Follow-up chips: a few questions not just answered. */
export function followUps(answeredId?: string) {
  const order = ["projects", "skills", "now", "contact", "open", "education", "fun", "build"];
  return order.filter((id) => id !== answeredId).slice(0, 3);
}

export const byId = (id: string) => QA.find((q) => q.id === id);
