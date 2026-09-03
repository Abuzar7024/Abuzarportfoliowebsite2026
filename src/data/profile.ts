import photo from "../assets/abuzar-khan.jpg";

export const profile = {
  name: "Abuzar Khan",
  firstName: "Abuzar",
  title: "Software Developer",
  roleLine: "Software Developer • Mobile & Web • Product Builder",
  headline: "Building digital products that actually ship.",
  intro:
    "I build phone apps and websites that people use every day — for government departments, hospitals, home-service teams and retail brands.",
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
    // BASE_URL keeps this correct when served from a subpath (GitHub Pages project site).
    resumePdf: `${import.meta.env.BASE_URL}Abuzar-Khan-Resume.pdf`,
  },
  summary:
    "Flutter developer with 2+ years of professional experience shipping production mobile applications across government, healthcare, home-services and retail domains. Currently at Ebani Tech, building enterprise Flutter applications for kiosk and mobile devices and integrating Computer Vision models with real-time camera processing. Experienced in REST API integration, Firebase, GetX / Riverpod / Provider state management, Clean Architecture and the full app-store deployment lifecycle.",
  philosophy: [
    {
      title: "Ship, then refine",
      text: "An app is only worth something once people are using it. I get a working version out early, then improve it with real feedback.",
    },
    {
      title: "Architecture that survives change",
      text: "I build so that adding a feature next year is cheap and safe, instead of a rewrite. Your app should grow with the business.",
    },
    {
      title: "Performance is a feature",
      text: "Slow apps get deleted. I have taken over apps that froze on busy screens and made them quick again.",
    },
  ],
  whatIBuild: [
    { label: "Phone apps", text: "One app that works on both iPhone and Android — booking, tracking, forms, payments." },
    { label: "Websites & dashboards", text: "Fast, modern sites and admin screens where your team can see and manage everything." },
    { label: "Smart camera features", text: "Apps that use the camera to recognise faces, try on clothes or read what they see." },
    { label: "The invisible plumbing", text: "Logins, saved data, push notifications and live maps — connecting your app to your systems." },
  ],
  approach: [
    { step: "Understand", text: "We talk through what you need, who it is for, and what success looks like." },
    { step: "Plan", text: "I map out the screens and how everything fits together, so there are no surprises later." },
    { step: "Build", text: "You see working pieces as they are finished, not one big reveal at the end." },
    { step: "Test", text: "I use it on real phones until it is fast and nothing breaks in the awkward cases." },
    { step: "Launch", text: "I handle the App Store and Google Play submission, then keep improving it." },
  ],
  currentFocus: [
    { title: "AI inside phone apps", text: "Bringing smart features into apps without making them slow." },
    { title: "Computer Vision on device", text: "Client-side image processing, custom overlays and real-time landmark rendering." },
    { title: "Virtual try-on", text: "Letting shoppers see products on themselves through the camera." },
    { title: "Face-aware features", text: "Reading age and expression from a live camera, privately and anonymously." },
    { title: "Touchscreens in shops", text: "Kiosk software that runs all day without crashing or needing staff." },
    { title: "Live data & logins", text: "Secure sign-in and data that updates instantly across every device." },
  ],
  interests: [
    "Building phone apps people use daily",
    "Smart, camera-powered features",
    "Beautiful, fast websites",
    "Apps that real teams depend on",
  ],
} as const;

export type Profile = typeof profile;
