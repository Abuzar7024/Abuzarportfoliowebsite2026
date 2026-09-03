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
  { name: "Flutter", plain: "Builds one app that runs on both iPhone and Android.", category: "Mobile", core: true, context: "Primary framework. Shipped Tajneed, Sadeeq (user + provider) and Riayah; building kiosk & mobile apps at Ebani Tech.", projects: ["tajneed", "sadeeq-user", "sadeeq-provider", "riayah", "digitopia"] },
  { name: "Dart", plain: "The language Flutter apps are written in.", category: "Mobile", core: true, context: "The language behind every Flutter app I have shipped." },
  { name: "Android", plain: "Publishing and tuning apps for Android phones.", category: "Mobile", context: "Play Store deployments for Tajneed, Sadeeq and Riayah.", projects: ["tajneed", "sadeeq-user", "riayah"] },
  { name: "iOS", plain: "Publishing and tuning apps for iPhones.", category: "Mobile", context: "App Store deployment for Tajneed; enterprise iOS builds at Ebani Tech.", projects: ["tajneed"] },
  { name: "React Native", plain: "Another way to build one app for both phones, using React.", category: "Mobile", core: true, context: "Cross-platform mobile development alongside Flutter, sharing the same React foundations as my web work." },
  { name: "Expo", plain: "Toolkit that makes React Native apps quicker to build and test.", category: "Mobile", context: "The standard toolchain for building and testing React Native apps." },
  // AI & CV
  { name: "Computer Vision", plain: "Teaching an app to understand what the camera sees.", category: "AI & Computer Vision", core: true, context: "Integrating CV models with real-time camera processing at Ebani Tech.", projects: ["digitopia"] },
  { name: "Virtual Try-On", plain: "Letting shoppers see products on themselves through the camera.", category: "AI & Computer Vision", context: "Overlay pipelines for visualising products live from the camera feed." },
  { name: "Face Detection", plain: "Spotting faces in a camera feed, anonymously.", category: "AI & Computer Vision", context: "Camera facial analysis and attribute extraction from video frames." },
  { name: "Image Processing", plain: "Cleaning up and transforming photos inside the app.", category: "AI & Computer Vision", context: "Client-side image processing and custom overlays." },
  { name: "Camera Integration", plain: "Using the phone camera smoothly, without lag.", category: "AI & Computer Vision", context: "High-frequency camera frame handling in Flutter." },
  { name: "AI API Integration", plain: "Plugging apps into AI services that do the heavy thinking.", category: "AI & Computer Vision", context: "Connecting mobile apps to AI / ML inference APIs." },
  // Frontend
  { name: "React", plain: "The most popular way to build modern websites and apps.", category: "Frontend", core: true, context: "Web apps at Quasar Digital Solutions; this portfolio.", projects: ["portfolio-2026"] },
  { name: "Next.js", plain: "A React framework for fast, search-friendly websites.", category: "Frontend", context: "The React framework behind the Ebani landing experience.", projects: ["ebani"] },
  { name: "Redux", plain: "Keeps complex app data organised and predictable.", category: "Frontend", context: "State management in React apps, including the Digitopia web dashboard.", projects: ["digitopia"] },
  { name: "TypeScript", plain: "JavaScript with safety checks that catch bugs before launch.", category: "Frontend", context: "This portfolio is fully typed React + TypeScript.", projects: ["portfolio-2026"] },
  { name: "JavaScript", plain: "The language every website runs on.", category: "Frontend", context: "Web development foundation across projects." },
  { name: "Three.js / R3F", plain: "Real 3D graphics in the browser — like the shape on this page.", category: "Frontend", context: "The 3D scenes on this site — React Three Fiber with capability detection and fallbacks.", projects: ["portfolio-2026"] },
  { name: "Tailwind CSS", plain: "A fast, consistent way to style everything you see.", category: "Frontend", context: "Styling at Quasar Digital Solutions and this portfolio.", projects: ["portfolio-2026"] },
  { name: "Motion", plain: "The smooth animations as you scroll this site.", category: "Frontend", context: "Scroll-linked and layout animations on this site.", projects: ["portfolio-2026"] },
  { name: "Vite", plain: "Tooling that makes the site load quickly.", category: "Frontend", context: "Build tooling for this portfolio.", projects: ["portfolio-2026"] },
  // Backend & Cloud
  { name: "REST APIs", plain: "How an app talks to your servers and other services.", category: "Backend & Cloud", core: true, context: "API integration, token refresh and session-expiry handling across every app.", projects: ["tajneed", "sadeeq-user", "riayah"] },
  { name: "Firebase", plain: "Google's toolkit for logins, databases and notifications.", category: "Backend & Cloud", core: true, context: "Auth, Firestore and FCM in Sadeeq, Riayah and web projects.", projects: ["sadeeq-user", "sadeeq-provider", "riayah"] },
  { name: "Cloud Firestore", plain: "A database that updates on every device instantly.", category: "Backend & Cloud", context: "Real-time data sync and structured cloud storage." },
  { name: "Authentication", plain: "Secure sign-in and keeping accounts safe.", category: "Backend & Cloud", context: "Secure tokenized auth flows and Firebase Auth." },
  { name: "FCM Push", plain: "Push notifications that arrive even when the app is closed.", category: "Backend & Cloud", context: "Background and killed-state notification behaviour in Riayah.", projects: ["riayah"] },
  { name: "Google Maps API", plain: "Live maps and tracking inside an app.", category: "Backend & Cloud", context: "Real-time service and provider tracking in Sadeeq.", projects: ["sadeeq-user", "sadeeq-provider"] },
  { name: "EmailJS", plain: "Sends the form on this page straight to my inbox.", category: "Backend & Cloud", context: "Serverless contact & service-request delivery on this site.", projects: ["portfolio-2026"] },
  // State
  { name: "GetX", plain: "Keeps Flutter apps fast and organised as they grow.", category: "State Management", core: true, context: "Tajneed and both Sadeeq apps.", projects: ["tajneed", "sadeeq-user", "sadeeq-provider"] },
  { name: "Riverpod", plain: "A modern way to manage what a Flutter app remembers.", category: "State Management", context: "Feature development at Ohara IT Solutions." },
  { name: "Provider", plain: "Shares data between screens without slowing things down.", category: "State Management", context: "State handling in Riayah.", projects: ["riayah"] },
  // Architecture
  { name: "Clean Architecture", plain: "Structuring code so features can be added safely later.", category: "Architecture", core: true, context: "The scalable mobile architecture behind Sadeeq." },
  { name: "MVVM", plain: "A tidy way to separate screens from the logic behind them.", category: "Architecture", context: "Feature development at Ohara IT Solutions." },
  { name: "Repository Pattern", plain: "Keeps data sources swappable without breaking screens.", category: "Architecture", context: "Isolating data sources from UI and business logic." },
  { name: "Modular Design", plain: "Building in blocks so teams can work in parallel.", category: "Architecture", context: "Feature modules that scale with the team." },
  { name: "SOLID", plain: "Ground rules that keep code readable years later.", category: "Architecture", context: "Principles applied across app codebases." },
  { name: "Unit Testing", plain: "Automated checks that catch bugs before users do.", category: "Architecture", context: "Testing business logic; end-to-end testing protocols at Quasar." },
  // Tools
  { name: "Git", plain: "Tracks every change, so nothing is ever lost.", category: "Tools", core: true, context: "Version control on every project." },
  { name: "GitHub", plain: "Where the code lives and gets reviewed.", category: "Tools", context: "Public repositories and the source of this portfolio." },
  { name: "Postman", plain: "Testing that an app and its server agree with each other.", category: "Tools", context: "API exploration and contract testing." },
  { name: "Android Studio", plain: "The workshop where Android apps get built.", category: "Tools", context: "Flutter / Android development and profiling." },
  { name: "VS Code", plain: "My day-to-day code editor.", category: "Tools", context: "Primary editor." },
  { name: "Figma", plain: "Where designs are made before they become real screens.", category: "Tools", context: "Designing and implementing accessible interfaces from Figma." },
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
