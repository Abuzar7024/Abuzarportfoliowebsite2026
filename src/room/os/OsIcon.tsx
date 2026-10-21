import React from "react";
import { Bot, Cpu, FileText, Folder, Gamepad2, Mail, Monitor, Package, Trash2 } from "lucide-react";
import type { IconName } from "./fs";

const MAP: Record<IconName, { Icon: typeof Folder; color: string; fill?: string }> = {
  pc: { Icon: Monitor, color: "#c9cfd8" },
  folder: { Icon: Folder, color: "#9aa3b0", fill: "#c9cfd8" },
  text: { Icon: FileText, color: "#dfe4eb" },
  pdf: { Icon: FileText, color: "#ff5058" },
  project: { Icon: Package, color: "#e3262e" },
  mail: { Icon: Mail, color: "#dfe4eb" },
  bot: { Icon: Bot, color: "#ff5058" },
  game: { Icon: Gamepad2, color: "#dfe4eb" },
  skills: { Icon: Cpu, color: "#c9cfd8" },
  bin: { Icon: Trash2, color: "#9aa3b0" },
};

/** File and app icons for AK-OS, drawn from one inline-SVG icon set. */
export function OsIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  const { Icon, color, fill } = MAP[name];
  return <Icon size={size} color={color} fill={fill ?? "none"} fillOpacity={fill ? 0.85 : undefined} strokeWidth={1.6} aria-hidden="true" />;
}
