import type { Skill, SkillCategory } from "./types";

/**
 * Technology map. `level` is deliberately honest:
 *   core     - used daily in production work
 *   working  - shipped real features with it
 *   familiar - used it, but would not claim depth
 * `projects` drives the constellation links in the Skills section, so every id
 * listed here must exist in data/projects.ts.
 */
export const skills: Skill[] = [
  // ── Mobile ──────────────────────────────────────────────────────────
  {
    name: "Flutter",
    category: "Mobile",
    level: "core",
    core: true,
    plain: "Builds one app that runs on both iPhone and Android.",
    context:
      "My primary framework. Every production app I have shipped at Ebani Tech, Ohara IT and on personal work is built in Flutter.",
    projects: ["tryonretail", "essonify", "digitopia", "spoto", "tajneed", "sadeeq-user", "sadeeq-provider", "riayah"],
  },
  {
    name: "Dart",
    category: "Mobile",
    level: "core",
    core: true,
    plain: "The language Flutter apps are written in.",
    context: "The language behind all of my Flutter work, including async data flows and state handling.",
    projects: ["tryonretail", "essonify", "digitopia", "spoto", "tajneed", "sadeeq-user", "sadeeq-provider", "riayah"],
  },
  {
    name: "Android",
    category: "Mobile",
    level: "working",
    plain: "Getting apps built, signed and live on Google Play.",
    context:
      "Gradle and Kotlin-layer configuration, build variants, release signing and Play Store submission, including production debugging on real devices.",
    projects: ["essonify", "tryonretail", "spoto"],
  },
  {
    name: "iOS",
    category: "Mobile",
    level: "working",
    plain: "Getting apps through Apple review and onto the App Store.",
    context: "App Store build configuration, provisioning and submission for the Flutter apps I have shipped.",
    projects: ["essonify"],
  },
  {
    name: "React Native",
    category: "Mobile",
    level: "familiar",
    plain: "Another way to build phone apps, using React.",
    context: "Used on cross-platform exploration outside my main Flutter work. Not my primary mobile stack.",
  },

  // ── State Management ────────────────────────────────────────────────
  {
    name: "Riverpod",
    category: "State Management",
    level: "core",
    core: true,
    plain: "Keeps what is on screen in sync with the app's data.",
    context: "Primary state layer on TryonRetail, including the kiosk flows and onboarding steps.",
    projects: ["tryonretail"],
  },
  {
    name: "Provider",
    category: "State Management",
    level: "working",
    plain: "A simpler way to share data between screens.",
    context: "Used across Flutter feature work where a lightweight state solution fitted better than a full store.",
    projects: ["tajneed", "riayah"],
  },
  {
    name: "Bloc",
    category: "State Management",
    level: "working",
    plain: "Separates app logic from the screen, so behaviour is predictable.",
    context: "Event-driven state for flows where each transition needs to be explicit and testable.",
  },
  {
    name: "GetX",
    category: "State Management",
    level: "working",
    plain: "Handles state, screens and navigation together.",
    context: "Used at Ohara IT for feature development alongside MVC and MVVM patterns.",
    projects: ["sadeeq-user", "sadeeq-provider"],
  },

  // ── Backend ─────────────────────────────────────────────────────────
  {
    name: "Firebase",
    category: "Backend",
    level: "core",
    core: true,
    plain: "Logins, live data and notifications without running a server.",
    context: "Authentication, Firestore, storage and push notifications across mobile and social app work.",
    projects: ["spoto", "digitopia", "tajneed", "riayah"],
  },
  {
    name: "Supabase",
    category: "Backend",
    level: "working",
    plain: "An open database with built-in logins and live updates.",
    context: "Backend data and auth layer used in the Digitopia ecosystem work.",
    projects: ["digitopia"],
  },
  {
    name: "REST APIs",
    category: "Backend",
    level: "core",
    core: true,
    plain: "How an app talks to a company's existing systems.",
    context:
      "Integrating backend services into mobile clients: request handling, auth headers, error and retry states, and mapping responses to typed models.",
    projects: ["tryonretail", "essonify", "digitopia", "tajneed", "sadeeq-user", "sadeeq-provider"],
  },
  {
    name: "Node.js",
    category: "Backend",
    level: "familiar",
    plain: "Runs server-side JavaScript.",
    context: "Used for small service and tooling work. Not my primary backend environment.",
  },

  // ── Integrations ────────────────────────────────────────────────────
  {
    name: "Stripe",
    category: "Integrations",
    level: "working",
    plain: "Takes card payments and manages subscriptions.",
    context: "Subscription and billing integration on Essonify, including plan states and payment flows.",
    projects: ["essonify"],
  },
  {
    name: "Apple In-App Purchase",
    category: "Integrations",
    level: "working",
    plain: "Handles paid upgrades inside an iPhone app.",
    context: "In-app subscription purchasing and entitlement handling for Essonify on iOS.",
    projects: ["essonify"],
  },
  {
    name: "Google Play Billing",
    category: "Integrations",
    level: "working",
    plain: "Handles paid upgrades inside an Android app.",
    context: "Coin-based and in-app purchase flows on the Android side.",
    projects: ["spoto", "essonify"],
  },

  // ── AI & Computer Vision ────────────────────────────────────────────
  {
    name: "MediaPipe",
    category: "AI & Computer Vision",
    level: "working",
    plain: "Lets an app find faces and body points in a camera feed.",
    context: "Landmark detection and real-time camera processing in Flutter clients.",
    projects: ["essonify", "tryonretail"],
  },
  {
    name: "OpenCV",
    category: "AI & Computer Vision",
    level: "working",
    plain: "Processes and analyses images.",
    context: "Image processing supporting the camera and vision features in app work.",
    projects: ["essonify", "tryonretail"],
  },
  {
    name: "Computer Vision integration",
    category: "AI & Computer Vision",
    level: "working",
    plain: "Connecting camera-based AI models into a real app.",
    context:
      "At Ebani Tech I work with the AI/ML team to integrate Computer Vision models and implement real-time camera processing on the application layer. I integrate the models rather than train them.",
    projects: ["tryonretail", "digitopia"],
  },

  // ── Web ─────────────────────────────────────────────────────────────
  {
    name: "React",
    category: "Web",
    level: "working",
    plain: "Builds interactive websites and dashboards.",
    context: "Web interface work, and the framework behind this portfolio.",
    projects: ["portfolio-2026"],
  },
  {
    name: "JavaScript",
    category: "Web",
    level: "working",
    plain: "The language that makes web pages interactive.",
    context: "Web feature work, tooling scripts and build automation.",
    projects: ["portfolio-2026"],
  },
  {
    name: "TypeScript",
    category: "Web",
    level: "working",
    plain: "JavaScript with type safety, so errors surface early.",
    context: "Used across this portfolio's codebase, including the 3D and data layers.",
    projects: ["portfolio-2026"],
  },
  {
    name: "HTML",
    category: "Web",
    level: "working",
    plain: "The structure every web page is built from.",
    context: "Semantic, accessible markup as the base of web interface work.",
    projects: ["portfolio-2026"],
  },
  {
    name: "CSS",
    category: "Web",
    level: "working",
    plain: "Controls how a website looks and adapts to any screen.",
    context: "Responsive layout and design-system work, including Tailwind.",
    projects: ["portfolio-2026"],
  },

  // ── Tools ───────────────────────────────────────────────────────────
  {
    name: "Git",
    category: "Tools",
    level: "core",
    core: true,
    plain: "Tracks every change so nothing is ever lost.",
    context: "Branching, review and release history on all professional and personal work.",
  },
  {
    name: "GitHub",
    category: "Tools",
    level: "core",
    core: true,
    plain: "Where the code lives and teams collaborate.",
    context: "Repository hosting, pull requests and CI for my projects.",
    projects: ["portfolio-2026"],
  },
  {
    name: "Figma",
    category: "Tools",
    level: "working",
    plain: "Where designs are made before they are built.",
    context: "Translating design files into accurate, responsive interfaces.",
  },
];

/** Section order for the technology universe. */
export const skillCategories: SkillCategory[] = [
  "Mobile",
  "State Management",
  "Backend",
  "Integrations",
  "AI & Computer Vision",
  "Web",
  "Tools",
];

export const skillsByCategory = (category: SkillCategory) => skills.filter((s) => s.category === category);

export const skillByName = (name: string) => skills.find((s) => s.name === name);
