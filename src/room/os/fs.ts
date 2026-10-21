import { profile } from "../../data/profile";
import { education, experience, yearsOfExperience } from "../../data/experience";
import { featuredProjects, otherProjects } from "../../data/projects";
import type { AppId } from "../store";

/**
 * AK-OS virtual file system. Every file opens a window; text documents are
 * generated from the same data files as the rest of the site.
 */

export type AppKind = "explorer" | "notepad" | "project" | "resume" | "mail" | "skills" | "bot" | "game";

export type IconName = "pc" | "folder" | "text" | "pdf" | "project" | "mail" | "bot" | "game" | "skills" | "bin";

export interface WinSpec {
  /** Identity: opening the same key again focuses the existing window. */
  key: string;
  title: string;
  icon: IconName;
  kind: AppKind;
  props?: Record<string, string>;
}

export interface FsNode {
  name: string;
  icon: IconName;
  /** Shown in the Explorer's "Type" column. */
  type: string;
  children?: FsNode[];
  open?: WinSpec;
}

const note = (doc: string, name: string): WinSpec => ({ key: `note:${doc}`, title: `${name} - Notepad`, icon: "text", kind: "notepad", props: { doc } });
const explorer = (path: string, title: string): WinSpec => ({ key: "explorer", title, icon: "folder", kind: "explorer", props: { path } });

export const SPECS = {
  about: note("about", "About me.txt"),
  contactTxt: note("contact", "Contact.txt"),
  education: note("education", "Education.txt"),
  resume: { key: "resume", title: "Resume.pdf - Viewer", icon: "pdf", kind: "resume" } as WinSpec,
  mail: { key: "mail", title: "Mail - New message", icon: "mail", kind: "mail" } as WinSpec,
  bot: { key: "bot", title: "AK-Bot", icon: "bot", kind: "bot" } as WinSpec,
  skills: { key: "skills", title: "Skills", icon: "skills", kind: "skills" } as WinSpec,
  game: { key: "game", title: "Signal Run", icon: "game", kind: "game" } as WinSpec,
  pc: explorer("/", "This PC"),
  projects: explorer("/Projects", "Projects"),
  experience: explorer("/Experience", "Experience"),
  bin: explorer("/Recycle Bin", "Recycle Bin"),
};

/** What the room's bottom navigation opens on the computer. */
export const APP_SPECS: Record<AppId, WinSpec> = {
  about: SPECS.about,
  projects: SPECS.projects,
  experience: SPECS.experience,
  skills: SPECS.skills,
  resume: SPECS.resume,
  contact: SPECS.mail,
  assistant: SPECS.bot,
};

const allProjects = [...featuredProjects, ...otherProjects];

export const ROOT: FsNode = {
  name: "This PC",
  icon: "pc",
  type: "Computer",
  children: [
    {
      name: "Documents",
      icon: "folder",
      type: "Folder",
      children: [
        { name: "About me.txt", icon: "text", type: "Text document", open: SPECS.about },
        { name: "Contact.txt", icon: "text", type: "Text document", open: SPECS.contactTxt },
        { name: "Education.txt", icon: "text", type: "Text document", open: SPECS.education },
        { name: "Resume.pdf", icon: "pdf", type: "PDF document", open: SPECS.resume },
      ],
    },
    {
      name: "Projects",
      icon: "folder",
      type: "Folder",
      children: allProjects.map((p) => ({
        name: `${p.title}.app`,
        icon: "project" as const,
        type: p.category,
        open: { key: `project:${p.id}`, title: p.title, icon: "project" as const, kind: "project" as const, props: { id: p.id } },
      })),
    },
    {
      name: "Experience",
      icon: "folder",
      type: "Folder",
      children: experience.map((e) => ({ name: `${e.company}.txt`, icon: "text" as const, type: e.period, open: note(`job:${e.id}`, `${e.company}.txt`) })),
    },
    { name: "Skills.app", icon: "skills", type: "Application", open: SPECS.skills },
    { name: "Games", icon: "folder", type: "Folder", children: [{ name: "Signal Run.exe", icon: "game", type: "Game", open: SPECS.game }] },
    { name: "Recycle Bin", icon: "bin", type: "System folder", children: [] },
  ],
};

export function findPath(path: string): FsNode | null {
  const parts = path.split("/").filter(Boolean);
  let node: FsNode | undefined = ROOT;
  for (const part of parts) {
    node = node?.children?.find((c) => c.name === part);
    if (!node) return null;
  }
  return node ?? null;
}

/** Plain-text documents shown in Notepad. */
export function documentText(doc: string): string {
  if (doc === "about") {
    return [
      `${profile.name.toUpperCase()}`,
      `${profile.roleLine}`,
      `${profile.location} · ${profile.availability}`,
      "",
      profile.intro,
      "",
      profile.summary,
      "",
      "WHAT I BUILD",
      ...profile.whatIBuild.map((w) => `- ${w.label}: ${w.text}`),
      "",
      "HOW I WORK",
      ...profile.philosophy.map((p) => `- ${p.title}: ${p.text}`),
      "",
      `${yearsOfExperience()}+ years of experience. Open Projects, Experience or Resume.pdf for more.`,
    ].join("\n");
  }
  if (doc === "contact") {
    return [
      "CONTACT",
      "",
      `Email     ${profile.email}`,
      `Phone     ${profile.phoneDisplay} (WhatsApp too)`,
      `LinkedIn  ${profile.links.linkedin}`,
      `GitHub    ${profile.links.github}`,
      "",
      "Or open Mail on the desktop to send a message right from here.",
    ].join("\n");
  }
  if (doc === "education") {
    return ["EDUCATION", "", ...education.map((e) => `- ${e.degree}\n  ${e.school}, ${e.location}\n  ${e.years} · ${e.status}`)].join("\n");
  }
  if (doc.startsWith("job:")) {
    const e = experience.find((x) => `job:${x.id}` === doc);
    if (!e) return "File not found.";
    return [
      `${e.company.toUpperCase()}`,
      `${e.role}`,
      `${e.period} · ${e.location}`,
      "",
      e.plain,
      "",
      "WHAT I DID",
      ...e.bullets.map((b) => `- ${b}`),
      "",
      `TECH  ${e.tech.join(", ")}`,
    ].join("\n");
  }
  return "File not found.";
}
