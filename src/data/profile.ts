import photo from "../assets/abuzar-khan.jpg";

export const profile = {
  name: "Abuzar Khan",
  firstName: "Abuzar",
  title: "Software Developer",
  roleLine: "Software Developer • Mobile & Web • Product Builder",
  headline: "Building digital products that actually ship.",
  intro:
    "I build mobile apps, web applications, APIs and AI-powered products — from Flutter apps used by government and healthcare teams to React and Three.js experiences like this one.",
  availability: "Open to Software Development Roles",
  location: "Hyderabad, India",
  email: "abuzxarrr87@gmail.com",
  phoneDisplay: "+91 8770206120",
  whatsapp: "918770206120",
  photo,
  links: {
    github: "https://github.com/Abuzar7024",
    githubUser: "Abuzar7024",
    linkedin: "https://www.linkedin.com/in/abuzar-khan7024/",
    portfolioRepo: "https://github.com/Abuzar7024/Abuzarportfoliowebsite2026",
    resumePdf: "/Abuzar-Khan-Resume.pdf",
  },
  summary:
    "Flutter developer with 2+ years of professional experience shipping production mobile applications across government, healthcare, home-services and retail domains. Currently at Ebani Tech, building enterprise Flutter applications for kiosk and mobile devices and integrating Computer Vision models with real-time camera processing. Experienced in REST API integration, Firebase, GetX / Riverpod / Provider state management, Clean Architecture and the full app-store deployment lifecycle.",
  philosophy: [
    {
      title: "Ship, then refine",
      text: "A product only creates value once it is in users' hands. I bias toward production-ready increments measured against real usage, over long-lived prototypes.",
    },
    {
      title: "Architecture that survives change",
      text: "Clean Architecture, MVVM and repository patterns keep features isolated, testable and safe to change — important when the same codebase runs on kiosks, phones and tablets.",
    },
    {
      title: "Performance is a feature",
      text: "Restructuring API calls, caching intelligently and profiling heavy screens has removed UI freezes and cut load times in the apps I maintain.",
    },
  ],
  whatIBuild: [
    { label: "Mobile apps", text: "Cross-platform Flutter and React Native apps for Android & iOS, from multi-step enterprise forms to real-time tracking." },
    { label: "Web experiences", text: "React + TypeScript interfaces with Motion and Three.js — like this portfolio." },
    { label: "AI-powered features", text: "Computer Vision model integration, camera pipelines and virtual try-on overlays on device." },
    { label: "API & cloud integration", text: "REST APIs, Firebase Auth, Cloud Firestore, FCM push notifications and Google Maps." },
  ],
  approach: [
    { step: "Understand", text: "Clarify the problem, the users and the constraints before touching code." },
    { step: "Architect", text: "Choose the state, data and module boundaries that keep the app maintainable." },
    { step: "Build", text: "Ship in small, testable increments with clean, reviewed code." },
    { step: "Harden", text: "Profile, cache, handle sessions and edge cases; make it resilient on real devices." },
    { step: "Ship & iterate", text: "Deploy to the stores, watch production, keep improving." },
  ],
  currentFocus: [
    { title: "AI-powered Flutter apps", text: "Integrating AI inference pipelines into responsive mobile apps." },
    { title: "Computer Vision on device", text: "Client-side image processing, custom overlays and real-time landmark rendering." },
    { title: "Virtual try-on systems", text: "Overlay pipelines that let users visualise products live from the camera feed." },
    { title: "Camera facial analysis", text: "Attribute extraction and estimations from high-frequency video frames." },
    { title: "Enterprise kiosk apps", text: "Robust retail kiosk setups with strict crash-safety and uptime requirements." },
    { title: "Firebase integrations", text: "Real-time sync, Cloud Firestore and secure tokenized authentication." },
  ],
  interests: [
    "Mobile & cross-platform product engineering",
    "AI / Computer Vision powered experiences",
    "Front-end & creative web development",
    "Enterprise apps used by real teams",
  ],
} as const;

export type Profile = typeof profile;
