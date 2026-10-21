import React, { useEffect, useRef, useState } from "react";
import { HOTSPOTS, pinElements, setState, useRoom } from "../store";

const BUBBLES: Record<string, { ping: "robotPing" | "catPing"; text: string }> = {
  robot: { ping: "robotPing", text: "Hi! I'm AK-Bot. Let's chat →" },
  cat: { ping: "catPing", text: "Purrr… (still asleep)" },
};

/** Shows a speech bubble for two seconds whenever this character is pinged. */
function useTalking(id: string) {
  const bubble = BUBBLES[id];
  const ping = useRoom((s) => (bubble ? s[bubble.ping] : 0));
  const first = useRef(ping);
  const [talking, setTalking] = useState(false);
  useEffect(() => {
    if (!bubble || ping === first.current) return;
    setTalking(true);
    const t = window.setTimeout(() => setTalking(false), 2200);
    return () => window.clearTimeout(t);
  }, [ping, bubble]);
  return talking ? bubble?.text : null;
}

function Pin({ id, label, hint, activate }: (typeof HOTSPOTS)[number]) {
  const hovered = useRoom((s) => s.hovered === id);
  const speech = useTalking(id);
  return (
    <button
      ref={(el) => {
        if (el) pinElements.set(id, el);
        else pinElements.delete(id);
      }}
      type="button"
      className="room-pin"
      data-visible="false"
      data-hovered={hovered}
      data-talking={!!speech}
      onClick={activate}
      onFocus={() => setState({ hovered: id })}
      onBlur={() => setState({ hovered: null })}
      onPointerEnter={() => setState({ hovered: id })}
      onPointerLeave={() => setState({ hovered: null })}
      aria-label={`${label}: ${hint}`}
    >
      <span className="room-pin-dot" aria-hidden="true" />
      <span className="room-pin-label rounded-lg border border-line-2 bg-bg/90 px-2.5 py-1.5 text-left shadow-lg backdrop-blur" aria-hidden="true">
        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-accent-ink">{label}</span>
        <span className="block text-[12.5px] text-ink">{speech ?? hint}</span>
      </span>
    </button>
  );
}

/**
 * One focusable pin per interactive object, positioned over it every frame by
 * the scene. They make the room's affordances visible, and give keyboard and
 * screen-reader users the same actions as clicking the 3D objects.
 */
export function HotspotPins() {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 [&_.room-pin]:pointer-events-auto" aria-label="Interactive objects" role="group">
      {HOTSPOTS.map((h) => (
        <Pin key={h.id} {...h} />
      ))}
    </div>
  );
}
