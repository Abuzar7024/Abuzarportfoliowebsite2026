import type { Experience, Education } from "./types";

export const experience: Experience[] = [
  {
    id: "ebani",
    company: "Ebani Tech",
    role: "Flutter Developer",
    period: "Jun 2026 — Present",
    start: "2026-06",
    end: null,
    location: "Hyderabad, India",
    plain:
      "I build the apps that run on smart advertising screens and phones — including the camera features that let a screen recognise who is standing in front of it and change what it shows.",
    summary:
      "Developing enterprise mobile architectures, building responsive UIs for kiosk and mobile devices, and collaborating with AI/ML teams to integrate real-time camera processing and Computer Vision models.",
    bullets: [
      "Develop enterprise Flutter applications for Android and iOS.",
      "Build scalable mobile architectures and responsive UI for kiosk and mobile devices.",
      "Integrate REST APIs and backend services.",
      "Work with AI/ML teams to integrate Computer Vision models and implement real-time camera processing.",
      "Optimize application performance and maintain production applications.",
      "Collaborate with backend and design teams.",
    ],
    tech: ["Flutter", "Dart", "REST APIs", "Computer Vision", "Firebase", "Android", "iOS"],
  },
  {
    id: "ohara",
    company: "Ohara IT Solutions",
    role: "Flutter Developer",
    period: "Nov 2025 — May 2026",
    start: "2025-11",
    end: "2026-05",
    location: "Mumbai, India",
    plain:
      "I took apps from first idea all the way to live on the App Store and Google Play — building the features, keeping them fast, and getting them approved.",
    summary:
      "Managed the complete app lifecycle from development to store deployment with a focus on clean architecture and high-performance cross-platform delivery.",
    bullets: [
      "Developed new features using MVC, MVVM and GetX.",
      "Integrated REST APIs and secure local storage.",
      "Implemented dynamic multi-step forms.",
      "Optimized layouts for peak performance.",
      "Collaborated with QA and Project Managers.",
    ],
    tech: ["Flutter", "GetX", "Riverpod", "Dart", "REST APIs"],
  },
  {
    id: "quasar",
    company: "Quasar Digital Solutions",
    role: "Junior Developer",
    period: "Jun 2024 — May 2025",
    start: "2024-06",
    end: "2025-05",
    location: "Bhopal, India",
    plain:
      "My first developer job: building websites and apps that work on any screen size, turning designers' drawings into pages people could actually click through.",
    summary:
      "Built responsive web and mobile applications in Agile teams, focusing on seamless user experiences, rapid prototyping and scalable frontend code.",
    bullets: [
      "Implemented Firebase Auth and Firestore.",
      "Designed accessible interfaces from Figma.",
      "Improved performance via refactoring.",
      "Executed end-to-end testing protocols.",
    ],
    tech: ["React", "Firebase", "Tailwind CSS", "Figma"],
  },
];

export const education: Education[] = [
  {
    id: "bca",
    degree: "Bachelor of Computer Applications (B.C.A.)",
    school: "Manipal University Jaipur",
    location: "Jaipur, India",
    years: "2025 — Present",
    status: "In progress",
  },
  {
    id: "hs",
    degree: "Higher Secondary (Commerce)",
    school: "Campion School Co-Ed",
    location: "Bhopal, India",
    years: "2010 — 2023",
    status: "Completed",
  },
];

/** Whole years of professional experience computed from the earliest start date. */
export function yearsOfExperience(now = new Date()): number {
  const starts = experience.map((e) => new Date(`${e.start}-01T00:00:00`).getTime());
  const first = Math.min(...starts);
  const years = (now.getTime() - first) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(years));
}
