import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, X } from "lucide-react";
import { actions, useRoom } from "../store";
import { BotChat } from "../bot/BotChat";

/** The robot's Q&A, docked beside it in the room. */
export function RobotChatPanel() {
  const open = useRoom((s) => s.robotChat && s.view === "room");
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && actions.closeRobotChat();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="hud fixed bottom-24 right-3 top-24 z-40 flex w-[min(24rem,calc(100%-1.5rem))] flex-col overflow-hidden !bg-[#16181b]/95 sm:right-6"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label="Chat with AK-Bot"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <span className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-line-2 bg-bg-3 text-accent-ink">
                <Bot size={16} aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block font-brand text-[12px] tracking-wide">AK-BOT</span>
                <span className="block text-[11.5px] text-muted">Quick answers about Abuzar</span>
              </span>
            </span>
            <button ref={close} type="button" onClick={actions.closeRobotChat} className="os-iconbtn" aria-label="Close chat">
              <X size={16} aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1">
            <BotChat compact />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
