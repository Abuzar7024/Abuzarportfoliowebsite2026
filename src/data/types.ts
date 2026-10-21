export type ProjectKind = "mobile" | "web" | "platform";

export interface ProjectLink {
  label: string;
  href: string;
  kind: "live" | "playstore" | "appstore" | "github" | "website";
  primary?: boolean;
  note?: string;
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
  /** Short label pair shown on the showcase slab, e.g. "Retail" / "Kiosk". */
  facets?: string[];
  accent: string;
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
  /** Same facts as `summary`, written for a non-technical reader. */
  plain: string;
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
  | "State Management"
  | "Backend"
  | "Integrations"
  | "AI & Computer Vision"
  | "Web"
  | "Tools";

/** Honest proficiency banding: never implies expert level where it is not earned. */
export type SkillLevel = "core" | "working" | "familiar";

export interface Skill {
  name: string;
  category: SkillCategory;
  /** One line a non-technical reader understands: what this actually does. */
  plain: string;
  context: string;
  projects?: string[];
  core?: boolean;
  level: SkillLevel;
}
