import type { Project } from "./types";

export const projects: Project[] = [
  {
    id: "digitopia",
    title: "Digitopia",
    tagline: "AI-powered digital signage platform — one CMS for 1 to 1,000+ screens.",
    category: "AI Digital Signage · DOOH",
    kind: "platform",
    role: "Flutter Developer @ Ebani Tech",
    organization: "Ebani Tech",
    period: "2026 — Present",
    tier: 1,
    accent: "#ff2d3f",
    device: "dashboard",
    screen: {
      variant: "dashboard",
      accent: "#ff2d3f",
      accent2: "#ff8a6b",
      title: "Digitopia CMS",
      subtitle: "Screens · Campaigns · Analytics",
    },
    overview:
      "Digitopia is Ebani Tech's AI-powered digital signage and DOOH (digital out-of-home) platform. It lets businesses manage content on digital displays across multiple locations from a single cloud CMS, while AI viewer analytics — anonymous age and gender detection and dwell-time heatmaps — personalise what each screen shows and measure how audiences respond.",
    problem:
      "Physical spaces such as malls, hotels, restaurants, hospitals and retail stores still rely on static printed material that takes weeks to update and gives brands no feedback on who actually saw it.",
    solution:
      "A cloud CMS that controls every screen remotely, schedules campaigns by daypart and location, and uses on-screen cameras with AI audience mapping to adapt content in real time and report ROI.",
    contribution: [
      "Part of the Ebani Tech engineering team behind the Digitopia ecosystem, working as a Flutter Developer.",
      "Develop enterprise Flutter applications for Android and iOS, including responsive UI for kiosk and mobile devices.",
      "Work with the AI/ML team to integrate Computer Vision models and implement real-time camera processing.",
      "Integrate REST APIs and backend services, optimise application performance and maintain production applications.",
    ],
    product: [
      "Cloud CMS: manage 1 to 1,000+ screens from one dashboard with screen-by-screen (hyperlocal) campaign control.",
      "Viewer analytics: live, anonymous age and gender detection plus dwell-time heatmaps.",
      "Smart personalisation: content updates automatically based on viewer demographics.",
      "Interactive elements: gesture- or mobile-controlled experiences on screen.",
      "A/B testing and ROI tracking with daily and monthly analytics dashboards.",
    ],
    features: [
      "Multi-location screen management",
      "AI audience analytics (age / gender / dwell time)",
      "Demographic-based content personalisation",
      "Interactive gesture & mobile-controlled content",
      "A/B testing & ROI dashboards",
      "Hyperlocal, screen-by-screen targeting",
    ],
    highlights: [
      "Built on AiVi™ (Artificial Intelligence Virtual Interface), Ebani Tech's technology for anonymous audience mapping and remote content management.",
      "Serves fashion, healthcare, education, electronics retail, restaurants, automotive, jewellery, banking and real-estate deployments.",
    ],
    tech: ["Flutter", "Dart", "Computer Vision", "REST APIs", "Firebase", "React", "Redux", "MUI"],
    techNote:
      "Flutter, Dart, Computer Vision, REST APIs and Firebase reflect my application-layer stack at Ebani Tech. React, Redux and MUI are observed in the live web CMS build (app.digitopia.live).",
    links: [
      { label: "Open Digitopia", href: "https://app.digitopia.live/login", kind: "live", primary: true, note: "Customer login — product access is restricted." },
      { label: "digitopia.live", href: "https://digitopia.live/", kind: "website" },
    ],
    verifiedNote: "Product description verified against digitopia.live and app.digitopia.live on 26 Aug 2026.",
  },
  {
    id: "ebani",
    title: "Ebani",
    tagline: "Turn any space into a digital experience — screens, cloud CMS and support from one team.",
    category: "Digital Screen Network · Landing Experience",
    kind: "web",
    role: "Flutter Developer @ Ebani Tech",
    organization: "Ebani Tech",
    period: "2026 — Present",
    tier: 1,
    accent: "#ff6b57",
    device: "browser",
    screen: {
      variant: "landing",
      accent: "#ff6b57",
      accent2: "#ffb347",
      title: "Ebani Tech",
      subtitle: "Turn any space into a digital experience",
    },
    overview:
      "Ebani is the public product experience for Ebani Tech's digital screen network: digital totems, easel stands, table-top displays, LED walls and commercial TVs, all run from one cloud CMS — with hardware, software, installation, content and support delivered by a single team across India.",
    problem:
      "Malls, hotels, restaurants, hospitals and retail stores display printed posters and standees that cannot be updated quickly, while digital surfaces can change in seconds instead of weeks.",
    solution:
      "Twelve commercial-grade display formats paired with one content platform: control every panel remotely, schedule dayparts and campaigns, manage multiple locations, push real-time updates, override the network for emergencies and report on what played where.",
    contribution: [
      "Flutter Developer on the Ebani Tech team that builds and operates the Ebani / Digitopia product family.",
      "Build responsive Flutter UI for the kiosk and mobile devices that sit inside the screen network.",
      "Integrate REST APIs, backend services and Computer Vision models with real-time camera processing.",
      "Collaborate with backend and design teams and maintain production applications.",
    ],
    product: [
      "Nine-step narrative: the space problem → hardware solutions → cloud CMS → business value → ROI example → real deployments → results → process → accountability.",
      "Product catalogue of 12 formats, from 32-inch easel totems to 75-inch 4K displays, touch kiosks, podiums, tables and LED modules — all 24×7 commercial grade with integrated cameras.",
      "Consultation flow with a lead form (schedule a demo · talk to an expert · get pricing) and a one-working-day response promise.",
    ],
    features: [
      "Remote control of every panel from any device",
      "Advance scheduling by dayparts, campaigns and seasons",
      "Multi-location management",
      "Real-time updates and emergency overrides",
      "Analytics & reports: what played, where, how often",
      "Drag & drop content: video, images, live data, social feeds",
    ],
    highlights: [
      "Live deployments across Telangana and Andhra Pradesh, including malls, 5-star hotels, corporate lobbies and hospitality venues.",
      "Reported outcomes on the site: 80% reduction in printing costs (hotel chain), 18% increase in upsell revenue (restaurant), 3× promotion visibility (retail) — results vary by site.",
    ],
    tech: ["Next.js", "React", "Flutter", "Dart", "REST APIs"],
    techNote:
      "Next.js and React are observed in the live landing page build (Next.js response headers, /_next assets, Inter · Newsreader · IBM Plex Mono fonts). Flutter, Dart and REST APIs reflect my application-layer role at Ebani Tech.",
    links: [
      { label: "Visit Ebani", href: "http://ebani-landing-page.prod.digitopia.live/", kind: "live", primary: true },
    ],
    verifiedNote: "Product description verified against the live landing page on 26 Aug 2026.",
  },
  {
    id: "essonify",
    title: "Essonify",
    tagline: "Style, unified — a social style marketplace with a virtual wardrobe and an AI style partner.",
    category: "Lifestyle · Fashion Tech",
    kind: "mobile",
    role: "Mobile App Developer",
    organization: "Essonify Group Inc.",
    tier: 1,
    accent: "#ff4f9a",
    device: "phone",
    screen: {
      variant: "wardrobe",
      accent: "#ff4f9a",
      accent2: "#ffb347",
      title: "Essonify",
      subtitle: "Life is moments. Style them.",
    },
    overview:
      "Essonify (\"Essonify: Style, Unified\") is a social style e-marketplace with an integrated virtual wardrobe. It connects identity, inspiration and execution in one place — turning style from something you scroll into something you create, personalise and live. Published on the App Store and Google Play by Essonify Group Inc.",
    problem:
      "Personal style lives in three disconnected places: the clothes you own, the looks you save, and the moments you dress for. Nothing ties them together into an outfit you can actually wear today.",
    solution:
      "A digitised wardrobe, an AI Style Partner that generates personalised outfits, and a calendar-aware daily look forecast — with a community feed and shoppable looks so inspiration turns into outfits.",
    contribution: [
      "Mobile application development for the cross-platform app, in line with my Flutter, AI-integration and virtual try-on focus areas.",
      "Camera and image pipelines, AI API integration and responsive UI — the same capabilities listed in my skills and current focus.",
      "Specific responsibilities on this product are not detailed in my public resume; the product description below is verified from the store listing.",
    ],
    product: [
      "Plan outfits around life events — workdays, dinners, travel and special occasions.",
      "Digitise and organise your wardrobe.",
      "AI-powered personalised outfit generation via the Style Partner.",
      "Style Toolkit with Esson Type and colour analysis; Daily Look Forecast with personalised recommendations.",
      "Calendar integration, a social feed to explore community looks, and shoppable AI-generated and community outfits.",
    ],
    features: [
      "Virtual wardrobe",
      "AI Style Partner outfit generation",
      "Daily Look Forecast",
      "Esson Type & colour analysis",
      "Calendar-based style planning",
      "Social feed & shoppable looks",
    ],
    highlights: [
      "Available on iOS and Android (App Store version 1.0.4, Lifestyle, 16+).",
      "Essonify Group Inc. — \"Life is made of moments. Style them all.\"",
    ],
    tech: ["Flutter", "Dart", "AI API Integration", "Camera Integration", "REST APIs"],
    techNote:
      "Flutter, Dart, camera and AI-API integration reflect my mobile stack and focus areas; the store listings do not disclose the app's framework.",
    links: [
      { label: "App Store", href: "https://apps.apple.com/us/app/essonify-style-unified/id6761996798", kind: "appstore", primary: true },
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.essonify.app&pcampaignid=web_share", kind: "playstore" },
      { label: "essonify.com", href: "https://www.essonify.com/download", kind: "website" },
    ],
    verifiedNote: "Product description verified against essonify.com and the App Store listing on 26 Aug 2026.",
  },
  {
    id: "tajneed",
    title: "Tajneed",
    tagline: "Military recruitment system for the Ministry of Defence, U.A.E.",
    category: "Government · Recruitment",
    kind: "mobile",
    role: "Flutter Developer",
    tier: 1,
    accent: "#f5b942",
    device: "phone",
    screen: {
      variant: "form",
      accent: "#f5b942",
      accent2: "#ffe1a8",
      title: "Tajneed",
      subtitle: "Registration · Step 3 of 6",
    },
    overview:
      "Tajneed is the official recruitment application of the Ministry of Defence, U.A.E. It guides applicants through multi-step dynamic forms for military registration and is published on both the App Store and Google Play.",
    problem:
      "Military registration requires long, conditional, multi-step forms with strict validation — where submission failures, data mismatches and expired sessions directly block applicants.",
    solution:
      "Dynamic multi-step forms with validation and draft saving, hardened API handling, token refresh and session-expiry management, and restructured data flow for faster loads.",
    contribution: [
      "Developed complex multi-step dynamic forms with validation and draft saving.",
      "Improved API handling to reduce form-submission failures and data mismatches.",
      "Fixed UI alignment and responsiveness issues across screen sizes.",
      "Implemented token refresh and session-expiry handling for secure authentication.",
      "Optimised loading times by restructuring API calls and improving data flow.",
    ],
    features: [
      "Multi-step dynamic registration forms",
      "Draft saving & validation",
      "Secure token refresh & session handling",
      "Responsive layouts across devices",
      "Published on App Store and Google Play",
    ],
    tech: ["Flutter", "GetX", "REST APIs", "JSON", "Security Tokens"],
    links: [
      { label: "App Store", href: "https://apps.apple.com/ae/app/tajneed/id6517355120", kind: "appstore", primary: true },
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=ae.mod.tajneed&pcampaignid=web_share", kind: "playstore" },
      { label: "tajneed.gov.ae", href: "https://www.tajneed.gov.ae/", kind: "website" },
    ],
  },
  {
    id: "sadeeq-user",
    title: "Sadeeq",
    tagline: "50+ home services, background-verified professionals, pre-approved pricing.",
    category: "Home Services · Marketplace",
    kind: "mobile",
    role: "Lead Flutter Developer",
    tier: 2,
    accent: "#ffb347",
    device: "phone",
    screen: {
      variant: "services",
      accent: "#ffb347",
      accent2: "#ffd9a0",
      title: "Sadeeq",
      subtitle: "Your trusted home service partner",
    },
    overview:
      "Sadeeq is a one-stop home-services app offering 50+ services delivered by background-verified professionals with pre-approved pricing. The user app covers discovery, booking, real-time tracking and payment.",
    problem:
      "Booking household services means juggling unverified providers, unclear pricing and no visibility into when someone will actually arrive.",
    solution:
      "A streamlined booking flow with pre-approved pricing, real-time service tracking on Google Maps, secure payments and personalised notifications — on a scalable GetX + Clean Architecture codebase.",
    contribution: [
      "Architected a scalable mobile solution using GetX and Clean Architecture.",
      "Integrated real-time service tracking and the Google Maps API.",
      "Developed a secure payment-gateway integration for seamless transactions.",
      "Implemented a personalised notification system for service updates.",
      "Streamlined the booking flow for user-friendly access to household services.",
    ],
    features: [
      "50+ service categories",
      "Real-time provider tracking (Google Maps)",
      "Secure payment gateway",
      "Personalised service notifications",
      "Streamlined booking flow",
    ],
    tech: ["Flutter", "GetX", "Google Maps API", "REST APIs", "Firebase"],
    links: [
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.user.sadeeq&pcampaignid=web_share", kind: "playstore", primary: true },
      { label: "sadeeq.beserved.net", href: "https://sadeeq.beserved.net/#/", kind: "website" },
    ],
  },
  {
    id: "sadeeq-provider",
    title: "Sadeeq Provider",
    tagline: "The business side of Sadeeq — jobs, earnings and live customer chat.",
    category: "Business Tool · Field Operations",
    kind: "mobile",
    role: "Lead Flutter Developer",
    tier: 2,
    accent: "#b388ff",
    device: "phone",
    screen: {
      variant: "provider",
      accent: "#b388ff",
      accent2: "#ff5c8a",
      title: "Sadeeq Provider",
      subtitle: "Today · 6 jobs · earnings",
    },
    overview:
      "The provider app empowers professionals inside the Sadeeq ecosystem to manage service requests, track earnings and communicate with customers in real time.",
    problem:
      "Service professionals need a single place to accept jobs, see their day, get paid and talk to customers — without draining their battery with constant location updates.",
    solution:
      "A job-management dashboard with real-time status, earnings analytics, in-app chat and optimised background location services for provider tracking.",
    contribution: [
      "Built a robust job-management dashboard with real-time status updates.",
      "Implemented performance analytics and earnings-reporting modules.",
      "Developed a real-time chat system for provider–customer communication.",
      "Optimised background location services for provider tracking.",
    ],
    features: [
      "Job management dashboard",
      "Real-time status updates",
      "Earnings & performance analytics",
      "Real-time provider–customer chat",
      "Optimised background location tracking",
    ],
    tech: ["Flutter", "GetX", "REST APIs", "Google Maps API", "Firebase"],
    links: [
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=ae.sadeeq.provider&pcampaignid=web_share", kind: "playstore", primary: true },
      { label: "sadeeq.beserved.net", href: "https://sadeeq.beserved.net/#/", kind: "website" },
    ],
  },
  {
    id: "riayah",
    title: "Riayah",
    tagline: "Healthcare management — patients, appointments and clinical data, without the freezes.",
    category: "Healthcare",
    kind: "mobile",
    role: "Flutter Developer",
    tier: 2,
    accent: "#3ddc97",
    device: "phone",
    screen: {
      variant: "health",
      accent: "#3ddc97",
      accent2: "#a8f0d0",
      title: "Riayah",
      subtitle: "Appointments · Patients · Reports",
    },
    overview:
      "Riayah is a high-performance healthcare management application for patient tracking, appointment scheduling and clinical data management with robust state handling.",
    problem:
      "Heavy dashboards and data-dense screens froze the UI, API responses were mapped inconsistently, and push notifications misbehaved when the app was in the background or killed.",
    solution:
      "Optimised heavy screens, cleaned up response mapping and state management, added intelligent caching and fixed FCM behaviour for background and killed states.",
    contribution: [
      "Optimised the dashboard and heavy screens, reducing UI freezes.",
      "Cleaned up API response mapping and fixed state-management issues.",
      "Resolved data-related bugs across appointments and user profiles.",
      "Implemented intelligent caching for faster data fetching.",
      "Fixed FCM notification issues for background and killed-state behaviour.",
    ],
    features: [
      "Patient tracking",
      "Appointment scheduling",
      "Clinical data management",
      "Intelligent caching",
      "Reliable push notifications (FCM)",
    ],
    tech: ["Flutter", "Provider", "REST APIs", "Firebase", "FCM"],
    links: [
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.app.riayah&pcampaignid=web_share", kind: "playstore", primary: true },
    ],
  },
  {
    id: "portfolio-2026",
    title: "This Portfolio",
    tagline: "A React + Three.js developer experience — built as a product, not a template.",
    category: "Web Experience · Open Source",
    kind: "web",
    role: "Designer & Developer",
    tier: 3,
    accent: "#ff2d3f",
    device: "browser",
    screen: {
      variant: "portfolio",
      accent: "#ff2d3f",
      accent2: "#ff8a6b",
      title: "Abuzar Khan",
      subtitle: "Building digital products that actually ship.",
    },
    overview:
      "The site you are looking at. A React, TypeScript and Three.js portfolio with a scroll-driven 3D hero, procedural 3D product mockups, a vectorised resume, live GitHub data and a region-aware contact flow — with WebGL detection, reduced-motion support and mobile fallbacks.",
    contribution: [
      "Designed the visual system, 3D concept and interaction model end to end.",
      "Built the React Three Fiber scenes with capability detection, DPR clamping, offscreen pausing and 2D fallbacks.",
      "Region-aware contact and service-request flows: currency and dial codes follow the visitor's region, drafts persist across refreshes, delivery via EmailJS.",
      "Vectorised resume rendered from a single data source, printable and exported as a PDF.",
      "Live GitHub activity from the public API — no fabricated statistics.",
      "There is a small mini-game hidden after you send a message. Discovery rewards the curious.",
    ],
    features: [
      "Scroll-linked 3D developer core",
      "Procedural 3D device mockups",
      "Cinematic project detail transitions",
      "Vector resume + PDF export",
      "Live GitHub activity field",
      "Custom cursor, magnetic buttons, reduced-motion support",
    ],
    tech: ["React", "TypeScript", "Three.js", "React Three Fiber", "Motion", "Tailwind CSS", "Vite", "EmailJS"],
    links: [
      { label: "Source on GitHub", href: "https://github.com/Abuzar7024/Abuzarportfoliowebsite2026", kind: "github", primary: true },
    ],
  },
];

export const projectById = (id: string) => projects.find((p) => p.id === id);
export const flagshipProjects = projects.filter((p) => p.tier === 1);
export const largeProjects = projects.filter((p) => p.tier === 2);
export const compactProjects = projects.filter((p) => p.tier === 3);
