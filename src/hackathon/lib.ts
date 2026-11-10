import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CONTENT,
  mergeContent,
  type HackathonContent,
} from "../shared/hackathon-content";

// ── Types returned by the API ────────────────────────────────────────────────
export interface PublicStats {
  confirmedParticipants: number;
  confirmedTeams: number;
  targetParticipants: number;
  maxParticipants: number;
  remainingToMax: number;
}
export interface Announcement {
  id: number;
  title: string;
  body: string;
  created_at: string;
}
export interface ContentResponse {
  degraded: boolean;
  content: HackathonContent;
  registration: { open: boolean; reason: string | null };
  stats: PublicStats | null;
  announcements: Announcement[];
  loading?: boolean;
  reload?: () => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

// ── Session (sessionStorage only; holds an opaque access token, never PII) ───
const ACCESS_KEY = "hk_access_token";
const TEAM_KEY = "hk_team_token";
const PAY_KEY = "hk_pay_session";

export const session = {
  getAccess: () => sessionStorage.getItem(ACCESS_KEY) || "",
  setAccess: (t: string) => sessionStorage.setItem(ACCESS_KEY, t),
  clearAccess: () => sessionStorage.removeItem(ACCESS_KEY),
  getTeamToken: () => sessionStorage.getItem(TEAM_KEY) || "",
  setTeamToken: (t: string) => sessionStorage.setItem(TEAM_KEY, t),
  clearTeamToken: () => sessionStorage.removeItem(TEAM_KEY),
  getPay: (): { txn: string; t: string } | null => {
    try {
      const raw = sessionStorage.getItem(PAY_KEY);
      return raw ? (JSON.parse(raw) as { txn: string; t: string }) : null;
    } catch {
      return null;
    }
  },
  setPay: (txn: string, t: string) => sessionStorage.setItem(PAY_KEY, JSON.stringify({ txn, t })),
};

/** Reads the Supabase magic-link result from the URL hash, stores the token and cleans the URL. */
export function consumeAuthHash(): { error: string | null } {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return { error: null };
  const params = new URLSearchParams(hash);
  const token = params.get("access_token");
  const err = params.get("error_description") || params.get("error");
  if (token || err) {
    window.history.replaceState({}, "", window.location.pathname);
  }
  if (token) {
    session.setAccess(token);
    return { error: null };
  }
  return { error: err ? err.replace(/\+/g, " ") : null };
}

export async function api<T = Record<string, unknown>>(
  path: string,
  opts?: { method?: string; body?: unknown; auth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts?.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts?.auth) {
    const t = session.getAccess();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let res: Response;
  try {
    res = await fetch(`/api/hackathon/${path}`, {
      method: opts?.method ?? "GET",
      headers,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Network error. Check your connection and try again.");
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    /* non-JSON (CSV etc.) */
  }
  if (!res.ok || data.ok === false) {
    if (res.status === 401 && opts?.auth) session.clearAccess();
    throw new ApiError(
      res.status,
      String(data.code || "ERROR"),
      String(data.error || "Something went wrong. Please try again."),
      data.fields as Record<string, string> | undefined
    );
  }
  return data as T;
}

export async function downloadAuthed(path: string, filename: string): Promise<void> {
  const res = await fetch(`/api/hackathon/${path}`, { headers: { Authorization: `Bearer ${session.getAccess()}` } });
  if (!res.ok) throw new ApiError(res.status, "ERROR", "Could not download the file.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ── Content hook ─────────────────────────────────────────────────────────────
export function useContent() {
  const [state, setState] = useState<ContentResponse>({
    degraded: false,
    content: DEFAULT_CONTENT,
    registration: { open: true, reason: null },
    stats: null,
    announcements: [],
  });
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const r = await api<ContentResponse & { content: Partial<HackathonContent> }>("content");
      const merged = mergeContent(r.content as never);
      setState({
        degraded: r.degraded,
        content: merged,
        registration: {
          open: r.registration ? r.registration.open : merged.settings.registrationOpen !== false,
          reason: r.registration?.reason ?? null,
        },
        stats: r.stats,
        announcements: r.announcements ?? [],
      });
    } catch {
      setState((s) => ({ ...s, degraded: true, registration: { open: true, reason: null } }));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { ...state, loading, reload: load };
}

// ── Tiny router (history API) ────────────────────────────────────────────────
export function navigate(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  document.getElementById("hk-scroll")?.scrollTo({ top: 0 });
}

export function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const on = () => setPath(window.location.pathname);
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return path.replace(/\/+$/, "") || "/";
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
