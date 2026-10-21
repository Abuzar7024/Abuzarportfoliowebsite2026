import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot } from "lucide-react";
import { byId, FALLBACK, followUps, match, STARTERS } from "./brain";
import { actions } from "../store";

interface Line {
  id: number;
  from: "bot" | "you";
  text: string;
  /** Question ids offered as chips under this bot line. */
  chips?: string[];
}

let nextId = 1;
const GREETING: Line = { id: 0, from: "bot", text: "Hi! I'm AK-Bot. Ask me about Abuzar.", chips: STARTERS };

/**
 * AK-Bot conversation: tap a question chip or type one. Answers are short
 * facts from the portfolio (see brain.ts); the robot in the room waves along.
 */
export function BotChat({ compact = false }: { compact?: boolean }) {
  const [lines, setLines] = useState<Line[]>([GREETING]);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: lines.length > 1 ? "smooth" : "auto" });
  }, [lines]);

  const reply = (question: string, qaId?: string) => {
    const qa = qaId ? byId(qaId) : match(question);
    const you: Line = { id: nextId++, from: "you", text: question };
    const bot: Line = qa
      ? { id: nextId++, from: "bot", text: qa.answer, chips: followUps(qa.id) }
      : { id: nextId++, from: "bot", text: FALLBACK, chips: STARTERS };
    setLines((l) => [...l, you, bot]);
    actions.pingRobot();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput("");
    reply(q.slice(0, 200));
  };

  const last = lines[lines.length - 1];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ol className={`scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto ${compact ? "p-3" : "p-4"}`} aria-live="polite" aria-label="Conversation with AK-Bot">
        {lines.map((l) => (
          <li key={l.id} className={`flex gap-2 ${l.from === "you" ? "justify-end" : ""}`}>
            {l.from === "bot" && (
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-2 bg-bg-3 text-accent-ink" aria-hidden="true">
                <Bot size={14} />
              </span>
            )}
            <p
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-snug ${
                l.from === "you" ? "rounded-br-md bg-accent text-white" : "rounded-bl-md border border-line bg-bg-3 text-ink"
              }`}
            >
              <span className="sr-only">{l.from === "you" ? "You: " : "AK-Bot: "}</span>
              {l.text}
            </p>
          </li>
        ))}
        <div ref={end} />
      </ol>

      {last.from === "bot" && last.chips && (
        <div className={`flex flex-wrap gap-1.5 border-t border-line ${compact ? "px-3 pt-2.5" : "px-4 pt-3"}`}>
          {last.chips.map((id) => {
            const qa = byId(id);
            return qa ? (
              <button key={id} type="button" onClick={() => reply(qa.question, qa.id)} className="seg !px-3 !py-1.5 text-[12.5px]">
                {qa.question}
              </button>
            ) : null;
          })}
        </div>
      )}

      <form onSubmit={submit} className={`flex gap-2 ${compact ? "p-3" : "p-4"}`}>
        <label htmlFor={compact ? "bot-input-room" : "bot-input-os"} className="sr-only">
          Ask AK-Bot a question
        </label>
        <input
          id={compact ? "bot-input-room" : "bot-input-os"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
          placeholder="Ask a question…"
          className="input !py-2.5"
          autoComplete="off"
        />
        <button type="submit" className="btn-primary !h-[42px] !w-[42px] shrink-0 !p-0" disabled={!input.trim()} aria-label="Ask">
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
