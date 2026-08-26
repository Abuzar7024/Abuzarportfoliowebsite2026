import React from "react";

interface CodeWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** File name shown in the title bar, e.g. "about.md" */
  file: string;
  /** Optional tabs; the active tab is highlighted. */
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTab?: (id: string) => void;
  /** Right-side meta in the title bar (e.g. "UTF-8 · 42 lines"). */
  meta?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}

/** IDE-style window: traffic lights, file tabs, monospace meta. The container for every content block. */
export function CodeWindow({ file, tabs, activeTab, onTab, meta, children, className = "", bodyClassName = "", ...rest }: CodeWindowProps) {
  return (
    <div className={`card overflow-hidden ${className}`} {...rest}>
      <div className="flex items-center gap-3 border-b border-line bg-white/[0.02] px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        {tabs ? (
          <div className="scrollbar-thin -my-2.5 flex min-w-0 flex-1 gap-1 overflow-x-auto py-2" role="tablist">
            {tabs.map((t) => {
              const active = t.id === activeTab;
              return (
                <button key={t.id} type="button" role="tab" aria-selected={active} onClick={() => onTab?.(t.id)} className={`shrink-0 rounded-md px-3 py-1 font-mono text-[12px] transition-colors ${active ? "bg-white/[0.08] text-ink" : "text-muted hover:text-ink"}`}>
                  {t.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">{file}</span>
        )}
        {meta && <span className="hidden shrink-0 font-mono text-[11px] text-muted sm:inline">{meta}</span>}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

/** Line-numbered gutter for code-like blocks. */
export function Lines({ children, start = 1 }: { children: React.ReactNode[]; start?: number }) {
  return (
    <ol className="font-mono text-[13px] leading-7" start={start}>
      {children.map((c, i) => (
        <li key={i} className="grid grid-cols-[2.25rem_1fr] gap-3">
          <span className="select-none text-right text-muted/60">{start + i}</span>
          <span className="min-w-0 break-words">{c}</span>
        </li>
      ))}
    </ol>
  );
}

export const Tok = {
  key: ({ children }: { children: React.ReactNode }) => <span className="text-accent">{children}</span>,
  str: ({ children }: { children: React.ReactNode }) => <span className="text-[#ffb38a]">{children}</span>,
  num: ({ children }: { children: React.ReactNode }) => <span className="text-[#8fd3ff]">{children}</span>,
  kw: ({ children }: { children: React.ReactNode }) => <span className="text-[#c792ea]">{children}</span>,
  fn: ({ children }: { children: React.ReactNode }) => <span className="text-[#82e0aa]">{children}</span>,
  cm: ({ children }: { children: React.ReactNode }) => <span className="text-muted">{children}</span>,
  p: ({ children }: { children: React.ReactNode }) => <span className="text-ink-2">{children}</span>,
};
