import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, RefreshCcw, Wifi, WifiOff, X } from "lucide-react";
import { SignalRun } from "./SignalRun";
import { useScrollLock } from "../hooks/useScrollLock";

interface OfflineScreenProps {
  /** "offline": the connection dropped. "play": opened from the footer for fun. */
  mode: "offline" | "play";
  online: boolean;
  onClose: () => void;
}

/**
 * Shown over the site when the connection drops (and served by the service
 * worker for cold offline loads). It keeps the page underneath intact, offers
 * Signal Run while waiting, and announces when the connection is back without
 * yanking the visitor out of a run.
 */
export function OfflineScreen({ mode, online, onClose }: OfflineScreenProps) {
  const [checking, setChecking] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useScrollLock(true);
  const restored = mode === "offline" && online;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (mode === "play" || online)) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, online, onClose]);

  const retry = async () => {
    setChecking(true);
    try {
      // Bypass the service worker cache: only a real network response counts.
      await fetch(`/favicon.svg?ping=${Date.now()}`, { cache: "no-store" });
      window.location.reload();
    } catch {
      setTimeout(() => setChecking(false), 600);
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-[90] overflow-y-auto bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        backgroundImage:
          "radial-gradient(50rem 30rem at 80% -10%, rgba(201,207,216,0.1), transparent 60%), linear-gradient(180deg,#16181c,#131417)",
      }}
    >
      <div className="shell flex min-h-full flex-col justify-center py-16">
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <p className="eyebrow">
              {mode === "play" ? (
                <>Easter egg · works offline too</>
              ) : restored ? (
                <>
                  <Wifi size={14} className="text-success" aria-hidden="true" />
                  <span className="text-success">Connection restored</span>
                </>
              ) : (
                <>
                  <span className="signal-dot" aria-hidden="true" />
                  <b>No connection</b>
                </>
              )}
            </p>
            {(mode === "play" || online) && (
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line-2 text-ink-2 transition-colors hover:text-ink"
                aria-label="Close and return to the portfolio"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          <h1 id="offline-title" className="mt-5 text-[clamp(2.25rem,6vw,4rem)] leading-[1]">
            {mode === "play" ? (
              <>
                Signal <span className="serif-accent text-silver">Run.</span>
              </>
            ) : (
              <>
                Signal lost. <span className="serif-accent text-silver">Systems still running.</span>
              </>
            )}
          </h1>
          <p className="lead mt-4 max-w-xl" aria-live="polite">
            {mode === "play"
              ? "The game that lives on my offline page. Hop the barriers, pylons and sentinel bots; collect the data shards."
              : restored
                ? "You're back online. Finish your run, then head back to the portfolio whenever you're ready."
                : "Your connection dropped. The page will pick up where you left off once it's back — until then, take the pod for a run."}
          </p>

          <div className="frost mt-8 p-2">
            <SignalRun />
          </div>
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            Space / ↑ / tap to jump · hold for height · tap twice to double-jump
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {mode === "offline" && !online && (
              <button type="button" onClick={retry} className="btn-ghost" disabled={checking}>
                {checking ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCcw size={15} aria-hidden="true" />}
                {checking ? "Checking…" : "Try again"}
              </button>
            )}
            {(mode === "play" || online) && (
              <button type="button" onClick={onClose} className="btn-primary">
                <ArrowLeft size={15} aria-hidden="true" />
                Back to the portfolio
              </button>
            )}
            {mode === "offline" && !online && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <WifiOff size={14} aria-hidden="true" />
                Reconnects automatically
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
