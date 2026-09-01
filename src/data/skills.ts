import type { Skill, SkillCategory } from "./types";

export const skillCategories: { id: SkillCategory; blurb: string }[] = [
  { id: "Mobile", blurb: "Primary stack — production apps on both stores." },
  { id: "AI & Computer Vision", blurb: "On-device vision and camera pipelines." },
  { id: "State Management", blurb: "Predictable state for large Flutter apps." },
  { id: "Frontend", blurb: "Web interfaces, from dashboards to this portfolio." },
  { id: "Backend & Cloud", blurb: "APIs, auth, data and push infrastructure." },
  { id: "Architecture", blurb: "Patterns that keep codebases changeable." },
  { id: "Tools", blurb: "Daily workflow." },
];

export const skills: Skill[] = [
  // Mobile
  { name: "Flutter", category: "Mobile", core: true, context: "Primary framework. Shipped Tajneed, Sadeeq (user + provider) and Riayah; building kiosk & mobile apps at Ebani Tech.", projects: ["tajneed", "sadeeq-user", "sadeeq-provider", "riayah", "digitopia"] },
  { name: "Dart", category: "Mobile", core: true, context: "The language behind every Flutter app I have shipped." },
  { name: "Android", category: "Mobile", context: "Play Store deployments for Tajneed, Sadeeq and Riayah.", projects: ["tajneed", "sadeeq-user", "riayah"] },
  { name: "iOS", category: "Mobile", context: "App Store deployment for Tajneed; enterprise iOS builds at Ebani Tech.", projects: ["tajneed"] },
  { name: "React Native", category: "Mobile", context: "Cross-platform mobile development alongside Flutter, sharing the same React foundations as my web work." },
  // AI & CV
  { name: "Computer Vision", category: "AI & Computer Vision", core: true, context: "Integrating CV models with real-time camera processing at Ebani Tech.", projects: ["digitopia"] },
  { name: "Virtual Try-On", category: "AI & Computer Vision", context: "Overlay pipelines for visualising products live from the camera feed." },
  { name: "Face Detection", category: "AI & Computer Vision", context: "Camera facial analysis and attribute extraction from video frames." },
  { name: "Image Processing", category: "AI & Computer Vision", context: "Client-side image processing and custom overlays." },
  { name: "Camera Integration", category: "AI & Computer Vision", context: "High-frequency camera frame handling in Flutter." },
  { name: "AI API Integration", category: "AI & Computer Vision", context: "Connecting mobile apps to AI / ML inference APIs." },
  // Frontend
  { name: "React", category: "Frontend", core: true, context: "Web apps at Quasar Digital Solutions; this portfolio.", projects: ["portfolio-2026"] },
  { name: "TypeScript", category: "Frontend", context: "This portfolio is fully typed React + TypeScript.", projects: ["portfolio-2026"] },
  { name: "JavaScript", category: "Frontend", context: "Web development foundation across projects." },
  { name: "Three.js / R3F", category: "Frontend", context: "The 3D scenes on this site — React Three Fiber with capability detection and fallbacks.", projects: ["portfolio-2026"] },
  { name: "Tailwind CSS", category: "Frontend", context: "Styling at Quasar Digital Solutions and this portfolio.", projects: ["portfolio-2026"] },
  { name: "Motion", category: "Frontend", context: "Scroll-linked and layout animations on this site.", projects: ["portfolio-2026"] },
  { name: "Vite", category: "Frontend", context: "Build tooling for this portfolio.", projects: ["portfolio-2026"] },
  // Backend & Cloud
  { name: "REST APIs", category: "Backend & Cloud", core: true, context: "API integration, token refresh and session-expiry handling across every app.", projects: ["tajneed", "sadeeq-user", "riayah"] },
  { name: "Firebase", category: "Backend & Cloud", core: true, context: "Auth, Firestore and FCM in Sadeeq, Riayah and web projects.", projects: ["sadeeq-user", "sadeeq-provider", "riayah"] },
  { name: "Cloud Firestore", category: "Backend & Cloud", context: "Real-time data sync and structured cloud storage." },
  { name: "Authentication", category: "Backend & Cloud", context: "Secure tokenized auth flows and Firebase Auth." },
  { name: "FCM Push", category: "Backend & Cloud", context: "Background and killed-state notification behaviour in Riayah.", projects: ["riayah"] },
  { name: "Google Maps API", category: "Backend & Cloud", context: "Real-time service and provider tracking in Sadeeq.", projects: ["sadeeq-user", "sadeeq-provider"] },
  { name: "EmailJS", category: "Backend & Cloud", context: "Serverless contact & service-request delivery on this site.", projects: ["portfolio-2026"] },
  // State
  { name: "GetX", category: "State Management", core: true, context: "Tajneed and both Sadeeq apps.", projects: ["tajneed", "sadeeq-user", "sadeeq-provider"] },
  { name: "Riverpod", category: "State Management", context: "Feature development at Ohara IT Solutions." },
  { name: "Provider", category: "State Management", context: "State handling in Riayah.", projects: ["riayah"] },
  // Architecture
  { name: "Clean Architecture", category: "Architecture", core: true, context: "The scalable mobile architecture behind Sadeeq." },
  { name: "MVVM", category: "Architecture", context: "Feature development at Ohara IT Solutions." },
  { name: "Repository Pattern", category: "Architecture", context: "Isolating data sources from UI and business logic." },
  { name: "Modular Design", category: "Architecture", context: "Feature modules that scale with the team." },
  { name: "SOLID", category: "Architecture", context: "Principles applied across app codebases." },
  { name: "Unit Testing", category: "Architecture", context: "Testing business logic; end-to-end testing protocols at Quasar." },
  // Tools
  { name: "Git", category: "Tools", core: true, context: "Version control on every project." },
  { name: "GitHub", category: "Tools", context: "Public repositories and the source of this portfolio." },
  { name: "Postman", category: "Tools", context: "API exploration and contract testing." },
  { name: "Android Studio", category: "Tools", context: "Flutter / Android development and profiling." },
  { name: "VS Code", category: "Tools", context: "Primary editor." },
  { name: "Figma", category: "Tools", context: "Designing and implementing accessible interfaces from Figma." },
];

export const heroNodes = [
  "Flutter",
  "Dart",
  "React",
  "TypeScript",
  "REST APIs",
  "Firebase",
  "Computer Vision",
  "Git",
  "Android",
  "iOS",
  "Cloud",
  "Databases",
];
