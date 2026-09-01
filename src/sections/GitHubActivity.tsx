import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, GitBranch, Github, RefreshCw } from "lucide-react";
import { profile } from "../data/profile";
import { FadeIn, SectionHead } from "../components/Reveal";
import { CodeWindow } from "../components/CodeWindow";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery";

interface Repo {
  name: string;
  html_url: string;
  language: string | null;
  pushed_at: string;
  stargazers_count: number;
  fork: boolean;
  description: string | null;
}
interface User {
  public_repos: number;
  followers: number;
  created_at: string;
}
interface Data {
  user: User;
  repos: Repo[];
  fetchedAt: number;
}

const CACHE_KEY = "gh_activity_v1";
const CACHE_TTL = 30 * 60 * 1000;

const LANG_COLORS: Record<string, string> = {
  Dart: "#ff2d3f",
  TypeScript: "#ff8a6b",
  JavaScript: "#f5b942",
  HTML: "#ff5c8a",
  CSS: "#c9c9d1",
  Kotlin: "#b388ff",
  Java: "#ffb347",
  Python: "#3ddc97",
};
const langColor = (l: string | null) => (l && LANG_COLORS[l]) || "#8b8b96";

async function fetchData(user: string): Promise<Data> {
  const headers = { Accept: "application/vnd.github+json" };
  const [u, r] = await Promise.all([
    fetch(`https://api.github.com/users/${user}`, { headers }),
    fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, { headers }),
  ]);
  if (!u.ok || !r.ok) throw new Error(`GitHub API ${u.status}/${r.status}`);
  const userJson = (await u.json()) as User;
  const repos = ((await r.json()) as Repo[]).filter((x) => !x.fork);
  return { user: userJson, repos, fetchedAt: Date.now() };
}

function useGitHub(user: string) {
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const load = React.useCallback(async () => {
    setStatus("loading");
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Data;
        if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
          setData(parsed);
          setStatus("ok");
          return;
        }
      }
    } catch {
      /* ignore cache errors */
    }
    try {
      const fresh = await fetchData(user);
      setData(fresh);
      setStatus("ok");
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      } catch {
        /* ignore */
      }
    } catch {
      setStatus("error");
    }
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);
  return { data, status, reload: load };
}

const daysAgo = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86400000;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export function GitHubActivity() {
  const { data, status, reload } = useGitHub(profile.links.githubUser);
  const reduced = usePrefersReducedMotion();

  const languages = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const r of data.repos) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({ name, n, pct: Math.round((n / total) * 100) }));
  }, [data]);

  const repos = data?.repos ?? [];

  return (
    <section id="activity" className="section !pt-0" aria-labelledby="activity-title">
      <div className="container-x">
        <SectionHead id="activity-title" label="GitHub" title="Live development activity." text="My real coding activity, loaded live from GitHub the moment you opened this page — nothing here is hard-coded." />

        <div className="mt-10 grid grid-cols-1 gap-4 lg:mt-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:gap-5">
          {/* Profile stats */}
          <FadeIn>
            <CodeWindow file="gh api /users/Abuzar7024" meta="live" className="h-full" bodyClassName="p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="icon-tile !h-9 !w-9">
                  <Github size={16} />
                </span>
                @{profile.links.githubUser}
              </span>
              <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="btn-link text-xs" data-cursor="Open">
                Profile <ExternalLink size={12} />
              </a>
            </div>

            {status === "error" ? (
              <div className="mt-6 rounded-2xl border border-line bg-white/[0.02] p-5 text-sm text-ink-2">
                <p>Live GitHub data is unavailable right now (rate limit or offline).</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => void reload()} className="btn-ghost !min-h-0 !px-4 !py-2 text-xs">
                    <RefreshCw size={12} /> Retry
                  </button>
                  <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="btn-primary !min-h-0 !px-4 !py-2 text-xs">
                    Open GitHub
                  </a>
                </div>
              </div>
            ) : (
              <>
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
                    <dt className="mono-label">Public repos</dt>
                    <dd className="mt-1 font-display text-3xl font-bold">{data ? data.user.public_repos : <span className="inline-block h-8 w-12 animate-pulse rounded bg-white/10" />}</dd>
                  </div>
                  <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
                    <dt className="mono-label">Member since</dt>
                    <dd className="mt-1 font-display text-3xl font-bold">{data ? new Date(data.user.created_at).getFullYear() : <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10" />}</dd>
                  </div>
                </dl>
                <div className="mt-6">
                  <p className="mono-label mb-3">Primary languages across public repos</p>
                  {data ? (
                    <ul className="space-y-2.5">
                      {languages.map((l) => (
                        <li key={l.name}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-ink">{l.name}</span>
                            <span className="font-mono text-muted">
                              {l.n} · {l.pct}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <motion.div className="h-full rounded-full" style={{ background: langColor(l.name) }} initial={reduced ? { width: `${l.pct}%` } : { width: 0 }} whileInView={{ width: `${l.pct}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-4 animate-pulse rounded bg-white/10" />
                      ))}
                    </div>
                  )}
                </div>
                {data && <p className="mt-5 text-[11px] text-muted">Fetched {formatDate(new Date(data.fetchedAt).toISOString())} · cached for 30 minutes in your browser.</p>}
              </>
            )}
            </CodeWindow>
          </FadeIn>

          {/* Skyline */}
          <FadeIn delay={0.08}>
            <CodeWindow file="repos --sort=pushed" meta="height = recency" className="h-full" bodyClassName="flex flex-col p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="icon-tile !h-9 !w-9">
                  <GitBranch size={16} />
                </span>
                Repository skyline
              </p>
              <p className="mono-label">height = recency · colour = language</p>
            </div>

            {status === "error" ? (
              <p className="mt-6 text-sm text-muted">Could not load repositories.</p>
            ) : (
              <>
                <ul className="mt-6 flex h-40 items-end gap-1.5 border-b border-line pb-px sm:gap-2" aria-label="Repositories by recency">
                  {(data ? repos.slice(0, 24) : Array.from({ length: 12 }, () => null)).map((r, i) => {
                    if (!r) return <li key={i} className="h-1/3 flex-1 animate-pulse rounded-t-md bg-white/[0.06]" />;
                    const d = daysAgo(r.pushed_at);
                    const pct = d < 14 ? 100 : d < 45 ? 78 : d < 120 ? 56 : d < 365 ? 36 : 20;
                    const color = langColor(r.language);
                    return (
                      <motion.li
                        key={r.name}
                        className="group relative flex-1"
                        style={{ height: `${pct}%` }}
                        initial={reduced ? false : { scaleY: 0, opacity: 0 }}
                        whileInView={{ scaleY: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <a
                          href={r.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-full w-full origin-bottom rounded-t-md border border-b-0 border-white/10 transition-transform duration-300 group-hover:-translate-y-1"
                          style={{ background: `linear-gradient(180deg, ${color}, ${color}33)`, boxShadow: `0 -8px 30px -12px ${color}` }}
                          title={`${r.name}${r.language ? ` · ${r.language}` : ""} · pushed ${formatDate(r.pushed_at)}`}
                          aria-label={`${r.name}${r.language ? `, ${r.language}` : ""}, last pushed ${formatDate(r.pushed_at)}`}
                          data-cursor="Open"
                        />
                      </motion.li>
                    );
                  })}
                </ul>
                <div className="mt-2 flex justify-between font-mono text-[11px] text-muted">
                  <span>most recent</span>
                  <span>older</span>
                </div>
                {data && (
                  <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {repos.slice(0, 6).map((r) => (
                      <li key={r.name}>
                        <a href={r.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] px-3.5 py-2.5 text-sm transition-colors hover:border-accent/50" data-cursor="Open">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: langColor(r.language) }} aria-hidden="true" />
                            <span className="truncate text-ink">{r.name}</span>
                            {r.language && <span className="hidden shrink-0 font-mono text-[11px] text-muted sm:inline">{r.language}</span>}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-muted">{formatDate(r.pushed_at)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            </CodeWindow>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
