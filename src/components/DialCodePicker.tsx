import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { DIAL_CODE_OPTIONS } from "../lib/dial-codes";

interface DialCodePickerProps {
  value: string;
  onChange: (dialCode: string) => void;
}

/**
 * Custom country-code picker. The native <select> popup can't be themed
 * (it rendered white-on-white on phones), so this uses an in-page dark listbox.
 */
export function DialCodePicker({ value, onChange }: DialCodePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const current = DIAL_CODE_OPTIONS.find((o) => o.dialCode === value) ?? DIAL_CODE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => listRef.current?.querySelector<HTMLButtonElement>("[data-selected='true']")?.focus(), 40);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country dial code: ${current.countryCode} ${current.dialCode}`}
        className="input flex w-auto min-w-[6.5rem] items-center justify-between gap-2 !px-3.5"
      >
        <span className="flex items-center gap-2 text-sm">
          <span aria-hidden="true">{current.flag}</span>
          <span className="font-mono text-[13px]">{current.dialCode}</span>
        </span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            aria-label="Country dial codes"
            className="glass scrollbar-thin absolute left-0 top-[calc(100%+6px)] z-30 max-h-60 w-56 max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-xl p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            {DIAL_CODE_OPTIONS.map((o) => {
              const selected = o.dialCode === current.dialCode && o.countryCode === current.countryCode;
              return (
                <li key={o.countryCode} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    data-selected={selected}
                    onClick={() => {
                      onChange(o.dialCode);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected ? "bg-accent/15 text-ink" : "text-ink-2 hover:bg-white/[0.06] hover:text-ink"}`}
                  >
                    <span aria-hidden="true">{o.flag}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{o.countryCode}</span>
                    <span className="font-mono text-[12.5px] text-muted">{o.dialCode}</span>
                    {selected && <Check size={13} className="text-accent" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
