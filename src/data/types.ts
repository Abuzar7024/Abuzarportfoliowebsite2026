export type ProjectKind = "mobile" | "web" | "platform";
export type DeviceKind = "phone" | "browser" | "dashboard";

export interface ProjectLink {
  label: string;
  href: string;
  kind: "live" | "playstore" | "appstore" | "github" | "website";
  primary?: boolean;
  note?: string;
}

export interface ScreenSpec {
  /** Visual style painted onto the 3D device screen (procedural, illustrative). */
  variant: "dashboard" | "landing" | "form" | "services" | "provider" | "health" | "portfolio" | "wardrobe";
  accent: string;
  accent2?: string;
  title: string;
  subtitle?: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  category: string;
  kind: ProjectKind;
  role: string;
  organization?: string;
  period?: string;
  /** 1 = flagship (full-width immersive), 2 = large card, 3 = compact */
  tier: 1 | 2 | 3;
  accent: string;
  device: DeviceKind;
  screen: ScreenSpec;
  overview: string;
  problem?: string;
  solution?: string;
  contribution: string[];
  product?: string[];
  features: string[];
  highlights?: string[];
  result?: string;
  tech: string[];
  techNote?: string;
  links: ProjectLink[];
  verifiedNote?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  start: string; // ISO yyyy-mm
  end: string | null; // null = present
  location: string;
  summary: string;
  bullets: string[];
  tech: string[];
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  years: string;
  status: string;
}

export type SkillCategory =
  | "Mobile"
  | "AI & Computer Vision"
  | "Frontend"
  | "Backend & Cloud"
  | "State Management"
  | "Architecture"
  | "Tools";

export interface Skill {
  name: string;
  category: SkillCategory;
  context: string;
  projects?: string[];
  core?: boolean;
}
