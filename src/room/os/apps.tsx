import React from "react";
import { ArrowLeft, ArrowUp, ChevronRight, Download, ExternalLink, HardDrive } from "lucide-react";
import { profile } from "../../data/profile";
import { featuredProjects, otherProjects } from "../../data/projects";
import { ProjectDetails } from "../../components/ProjectDialog";
import { ResumeDocument } from "../../components/ResumeDocument";
import { ContactForm } from "../../components/ContactForm";
import { SkillsExplorer } from "../../components/SkillsExplorer";
import { SignalRun } from "../../components/SignalRun";
import { BotChat } from "../bot/BotChat";
import { documentText, findPath, ROOT, type FsNode, type WinSpec } from "./fs";
import { OsIcon } from "./OsIcon";

type Open = (spec: WinSpec) => void;

/** Links URLs and email addresses inside plain text. */
function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+)/g).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent-ink underline underline-offset-2">
            {part}
          </a>
        ) : /@/.test(part) && /^[\w.+-]+@/.test(part) ? (
          <a key={i} href={`mailto:${part}`} className="text-accent-ink underline underline-offset-2">
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

export function Notepad({ doc }: { doc: string }) {
  const text = documentText(doc);
  return (
    <div className="flex min-h-full flex-col bg-[#15171a]">
      <pre className="flex-1 whitespace-pre-wrap break-words p-5 font-mono text-[13.5px] leading-relaxed text-ink-2">
        <Linkified text={text} />
      </pre>
      <p className="sticky bottom-0 border-t border-white/[0.06] bg-[#1b1d21] px-4 py-1.5 font-mono text-[11px] text-faint">
        {text.split("\n").length} lines · UTF-8 · read-only
      </p>
    </div>
  );
}

const SIDEBAR = ["Documents", "Projects", "Experience", "Games", "Recycle Bin"];

export function Explorer({ path, onNavigate, open }: { path: string; onNavigate: (path: string) => void; open: Open }) {
  const node = findPath(path) ?? ROOT;
  const parts = path.split("/").filter(Boolean);
  const up = "/" + parts.slice(0, -1).join("/");
  const activate = (child: FsNode) => {
    if (child.children) onNavigate(`${path === "/" ? "" : path}/${child.name}`);
    else if (child.open) open(child.open);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#16181b]">
      {/* Address bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <button type="button" className="os-iconbtn" onClick={() => onNavigate(up)} disabled={!parts.length} aria-label="Up one folder">
          <ArrowUp size={14} aria-hidden="true" />
        </button>
        <nav aria-label="Path" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-md border border-white/[0.08] bg-black/20 px-2.5 py-1.5 text-[12.5px] no-scrollbar">
          <button type="button" onClick={() => onNavigate("/")} className="flex shrink-0 items-center gap-1.5 text-ink-2 hover:text-ink">
            <HardDrive size={13} aria-hidden="true" /> This PC
          </button>
          {parts.map((p, i) => (
            <React.Fragment key={p}>
              <ChevronRight size={12} className="shrink-0 text-faint" aria-hidden="true" />
              <button type="button" onClick={() => onNavigate("/" + parts.slice(0, i + 1).join("/"))} className="shrink-0 text-ink-2 hover:text-ink">
                {p}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Quick access" className="hidden w-40 shrink-0 border-r border-white/[0.06] p-2 sm:block">
          {SIDEBAR.map((name) => {
            const n = ROOT.children!.find((c) => c.name === name)!;
            const active = parts[0] === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onNavigate(`/${name}`)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] ${active ? "bg-white/[0.08] text-ink" : "text-ink-2 hover:bg-white/[0.04]"}`}
              >
                <OsIcon name={n.icon} size={15} />
                {name}
              </button>
            );
          })}
        </nav>
        <div className="min-h-0 flex-1 overflow-auto p-3 scrollbar-thin">
          {node.children && node.children.length === 0 ? (
            <p className="p-6 text-center text-[13px] text-muted">This folder is empty. Bugs get fixed here, not binned.</p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1" aria-label={node.name}>
              {node.children?.map((child) => (
                <li key={child.name}>
                  <button
                    type="button"
                    onDoubleClick={() => activate(child)}
                    onClick={(e) => {
                      // Keyboard and touch open on a single activation; mouse uses double-click.
                      if (e.detail === 0 || matchMedia("(pointer: coarse)").matches) activate(child);
                    }}
                    className="os-file flex w-full flex-col items-center gap-1.5 rounded-md p-2 text-center"
                    title={`${child.name} · ${child.type}`}
                  >
                    <OsIcon name={child.icon} size={32} />
                    <span className="line-clamp-2 break-all text-[12px] leading-tight text-ink">{child.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="border-t border-white/[0.06] px-3 py-1.5 text-[11px] text-faint">
        {node.children?.length ?? 0} items · double-click (or tap) to open
      </p>
    </div>
  );
}

const ALL = [...featuredProjects, ...otherProjects];

export function ProjectViewer({ id, open }: { id: string; open: Open }) {
  const p = ALL.find((x) => x.id === id);
  if (!p) return <p className="p-6 text-muted">Project not found.</p>;
  return (
    <div className="p-6">
      <button type="button" onClick={() => open({ key: "explorer", title: "Projects", icon: "folder", kind: "explorer", props: { path: "/Projects" } })} className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink">
        <ArrowLeft size={13} aria-hidden="true" /> All projects
      </button>
      <ProjectDetails project={p} />
    </div>
  );
}

export function ResumeViewer() {
  return (
    <div className="flex min-h-full flex-col bg-[#2a2d32]">
      <div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b border-white/[0.06] bg-[#1b1d21] px-3 py-2">
        <a href={profile.links.resumePdf} download className="btn-primary !px-3 !py-1.5 text-[12.5px]">
          <Download size={13} aria-hidden="true" /> Download
        </a>
        <a href={profile.links.resumePdf} target="_blank" rel="noopener noreferrer" className="btn-ghost !px-3 !py-1.5 text-[12.5px]">
          <ExternalLink size={13} aria-hidden="true" /> Open PDF
        </a>
      </div>
      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-[820px] overflow-hidden rounded bg-white shadow-2xl">
          <ResumeDocument />
        </div>
      </div>
    </div>
  );
}

export function MailApp() {
  return (
    <div className="p-4 sm:p-6">
      <p className="mb-4 text-[13px] text-muted">
        To: <span className="text-ink">{profile.name}</span> &lt;{profile.email}&gt;
      </p>
      <ContactForm />
    </div>
  );
}

export function SkillsApp() {
  return (
    <div className="p-4 sm:p-6">
      <SkillsExplorer compact />
    </div>
  );
}

export function BotApp() {
  return <BotChat />;
}

export function GameApp() {
  return (
    <div className="flex min-h-full flex-col justify-center bg-[#131417] p-3">
      <SignalRun />
      <p className="mt-2 text-center font-mono text-[11px] text-faint">Space / ↑ / tap to jump · hold for height · double-jump in the air</p>
    </div>
  );
}
