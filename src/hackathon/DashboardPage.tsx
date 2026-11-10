import React, { useCallback, useEffect, useState } from "react";
import { Download, Loader2, LogOut, Printer } from "lucide-react";
import { ApiError, api, consumeAuthHash, inr, session } from "./lib";
import { HackathonPassCard } from "./HackathonPass";
import { downloadReceipt, printReceipt } from "./receipt";
import { Kicker, Link, btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";

interface Member {
  id: string;
  registrationCode: string | null;
  role: string;
  isLeader: boolean;
  fullName: string;
  organisation: string | null;
  course: string | null;
  city: string | null;
  state: string | null;
  github: string | null;
  linkedin: string | null;
  skills: string | null;
  email?: string;
  mobile?: string;
}
interface Me {
  email: string;
  adminRole: string | null;
  me?: Member;
  team: { id: string; teamCode: string | null; name: string; mode: string; city: string; state: string; memberCount: number; status: string } | null;
  members?: Member[];
  payment?: { txnid: string; status: string; amount: number; verifiedAt: string | null } | null;
  requests?: { id: number; kind: string; status: string; admin_note: string | null; created_at: string; payload: Record<string, string> }[];
  announcements: { id: number; title: string; body: string; created_at: string }[];
  schedule?: { notice: string; days: { day: string; title: string; items: string[] }[] };
  submissionInstructions?: string | null;
  settings?: { dateText: string; venueText: string; eventName: string };
}

export function SignIn({ title, note }: { title: string; note?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      await api("auth/login-link", { method: "POST", body: { email } });
      setState("sent");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the link.");
      setState("idle");
    }
  };
  return (
    <div className="mx-auto max-w-[560px] px-4 py-14 sm:px-6 sm:py-20">
      <Kicker>Sign in</Kicker>
      <h1 className="mt-3 text-[clamp(1.9rem,4.5vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">{title}</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#3d3b35]">{note ?? "Enter the email address you registered with. We will email you a one-time sign-in link. No password needed."}</p>
      {state === "sent" ? (
        <p role="status" className="mt-8 border-l-4 border-[#157a3a] bg-white px-4 py-4 text-[16px]">If this email is registered, a sign-in link is on its way. Open it on this device. The link works once and expires soon.</p>
      ) : (
        <form onSubmit={submit} className="mt-8" noValidate>
          <label htmlFor="si-email" className={labelCls}>Registered email address</label>
          <input id="si-email" type="email" autoComplete="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p role="alert" className="mt-2 text-[14px] font-semibold text-[#b81f17]">{error}</p>}
          <button type="submit" disabled={state === "sending" || !email} className={`${btnPrimary} mt-5`}>
            {state === "sending" ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null} Email me a sign-in link
          </button>
        </form>
      )}
      <p className="mt-8 text-[14px] text-[#5b584f]">Not registered yet? <Link to="/competition/register" className="font-bold underline">Register your team</Link>.</p>
    </div>
  );
}

export function DashboardPage() {
  const [authError] = useState(() => consumeAuthHash().error);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(Boolean(session.getAccess()));
  const [signedOut, setSignedOut] = useState(!session.getAccess());
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session.getAccess()) { setSignedOut(true); setLoading(false); return; }
    try {
      setMe(await api<Me>("me", { auth: true }));
      setSignedOut(false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setSignedOut(true);
      else setFlash(e instanceof ApiError ? e.message : "Could not load your dashboard.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <p className="mx-auto flex max-w-[900px] items-center gap-3 px-6 py-16 text-[17px]"><Loader2 className="animate-spin" aria-hidden="true" /> Loading your dashboard…</p>;
  if (signedOut || !me) {
    return (
      <>
        {authError && <p role="alert" className="mx-auto mt-6 max-w-[560px] border-l-4 border-[#d6281f] bg-white px-4 py-3 text-[14px] font-semibold">Sign-in link problem: {authError}. Request a new link below.</p>}
        <SignIn title="Participant dashboard" />
      </>
    );
  }

  const team = me.team;
  const leader = Boolean(me.me?.isLeader);
  const receiptReady = team?.status === "CONFIRMED" && me.payment?.status === "SUCCESS";

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Kicker>Dashboard</Kicker><h1 className="mt-2 text-[clamp(1.9rem,4.5vw,2.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">{team ? team.name : "Welcome"}</h1><p className="mt-1 font-mono text-[12px] text-[#5b584f]">Signed in as {me.email}</p></div>
        <div className="flex gap-3">
          {me.adminRole && <Link to="/competition/admin" className={btnSecondary}>Admin panel</Link>}
          <button type="button" className={btnSecondary} onClick={() => { session.clearAccess(); setMe(null); setSignedOut(true); }}><LogOut size={16} aria-hidden="true" /> Sign out</button>
        </div>
      </div>
      {flash && <p role="alert" className="mt-4 border-l-4 border-[#d6281f] bg-white px-4 py-3 text-[14px] font-semibold">{flash}</p>}

      {!team && <p className="mt-10 border-l-4 border-[#d6281f] bg-white px-4 py-4 text-[16px]">No active registration was found for this email. {me.adminRole ? "You are signed in as an organiser." : <>You can <Link to="/competition/register" className="font-bold underline">register your team</Link>.</>}</p>}

      {team && me.members && (
        <>
          <section className="mt-10 grid gap-x-8 border-t-2 border-[#15181d] sm:grid-cols-4">
            {[["Team ID", team.teamCode ?? "Not issued yet"], ["Registration status", team.status === "CONFIRMED" ? "Confirmed" : team.status === "PENDING_PAYMENT" ? "Awaiting payment" : team.status], ["Payment status", me.payment?.status ?? "No payment"], ["Participation", team.mode === "ONLINE" ? "Online" : "Physical (Bhopal)"]].map(([k, v]) => (
              <div key={k} className="border-b border-[#bdb8ab] py-3"><p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">{k}</p><p className="mt-1 text-[17px] font-extrabold">{v}</p></div>
            ))}
          </section>
          {team.status === "PENDING_PAYMENT" && <p className="mt-4 border-l-4 border-[#d6281f] bg-white px-4 py-3 text-[15px]">Payment for this registration has not been confirmed. If you paid, wait a few minutes and refresh. Do not pay again before the status is checked. <Link to="/competition/payment" className="font-bold underline">Check payment status</Link></p>}

          <section className="mt-10"><h2 className="text-[22px] font-extrabold">Team members</h2>
            <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] border-collapse text-left text-[15px]">
              <thead><tr className="border-b-2 border-[#15181d] font-mono text-[11px] uppercase tracking-wider"><th className="py-2">Registration ID</th><th>Name</th><th>Role</th><th>Organisation</th><th>Contact</th></tr></thead>
              <tbody>{me.members.map((m) => (<tr key={m.id} className="border-b border-[#bdb8ab]"><td className="py-3 pr-3 font-mono font-semibold">{m.registrationCode ?? "—"}</td><td className="pr-3 font-bold">{m.fullName}</td><td className="pr-3">{m.role}</td><td className="pr-3">{m.organisation ?? "—"}</td><td className="text-[13px]">{m.email ? <>{m.email}<br />{m.mobile}</> : "Private"}</td></tr>))}</tbody>
            </table></div>
          </section>

          {receiptReady && me.payment && (
            <>
              <section className="mt-8 flex flex-col gap-3 sm:flex-row">
                {(() => { const r = { eventName: me.settings?.eventName ?? "AVATAR", teamName: team.name, teamCode: team.teamCode, amount: me.payment!.amount, members: me.members!.map((m) => ({ registrationCode: m.registrationCode, fullName: m.fullName, role: m.role })), txnid: me.payment!.txnid, status: "SUCCESS (verified with PayU)", paidAt: me.payment!.verifiedAt }; return (<><button type="button" className={btnPrimary} onClick={() => downloadReceipt(r)}><Download size={16} aria-hidden="true" /> Download receipt ({inr(me.payment!.amount)})</button><button type="button" className={btnSecondary} onClick={() => printReceipt(r)}><Printer size={16} aria-hidden="true" /> Print / PDF</button></>); })()}
              </section>
              <section className="mt-12 border-t-2 border-[#15181d] pt-8">
                <Kicker>AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.</Kicker>
                <h2 className="mt-1 text-[22px] font-extrabold">Official AVATAR Participant Passes</h2>
                <p className="mt-1 text-[14.5px] text-[#3d3b35]">Download high-resolution PNG passes for every member of your team. Pass QR codes redirect to https://abuzarcode.in/.</p>
                <div className="mt-6 grid gap-8 md:grid-cols-2">
                  {me.members.map((m) => (
                    <HackathonPassCard
                      key={m.id}
                      pass={{
                        registrationCode: m.registrationCode ?? "AIH-R-PENDING",
                        teamCode: team.teamCode ?? "AIH-T-PENDING",
                        teamName: team.name,
                        fullName: m.fullName,
                        role: m.role,
                        organisation: m.organisation,
                        course: m.course,
                        memberCount: team.memberCount,
                        feePaidInr: me.payment?.amount,
                        verifiedAt: me.payment?.verifiedAt,
                      }}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="mt-12 grid gap-10 lg:grid-cols-2">
            <div><h2 className="text-[22px] font-extrabold">Announcements</h2>
              {me.announcements.length === 0 ? <p className="mt-3 text-[15px] text-[#5b584f]">No announcements yet.</p> : me.announcements.map((a) => (<article key={a.id} className="mt-3 border-t border-[#15181d] pt-3"><h3 className="font-bold">{a.title}</h3><p className="mt-1 whitespace-pre-line text-[15px] text-[#3d3b35]">{a.body}</p><p className="mt-1 font-mono text-[11px] text-[#5b584f]">{new Date(a.created_at).toLocaleDateString("en-IN")}</p></article>))}
            </div>
            <div><h2 className="text-[22px] font-extrabold">Event schedule and instructions</h2>
              <p className="mt-3 text-[14px] text-[#5b584f]">{me.schedule?.notice}</p>
              {me.schedule?.days.map((d) => (<p key={d.day} className="mt-2 text-[15px]"><strong>{d.day}:</strong> {d.title}</p>))}
              <p className="mt-4 border-l-4 border-[#15181d] bg-white px-3 py-2 text-[14px] text-[#3d3b35]">{me.submissionInstructions ?? "Instructions appear here once your registration is confirmed."}</p>
            </div>
          </section>

          <ProfileForm me={me.me!} onSaved={() => { setFlash("Profile updated."); void load(); }} />
          {leader && <ChangeRequests members={me.members} requests={me.requests ?? []} onSent={() => { setFlash("Change request sent to the organisers."); void load(); }} />}
        </>
      )}
    </div>
  );
}

function ProfileForm({ me, onSaved }: { me: Member; onSaved: () => void }) {
  const [v, setV] = useState({ organisation: me.organisation ?? "", course: me.course ?? "", city: me.city ?? "", state: me.state ?? "", github: me.github ?? "", linkedin: me.linkedin ?? "", skills: me.skills ?? "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const f = (k: keyof typeof v, label: string, opt?: boolean) => (<div key={k}><label htmlFor={`pf-${k}`} className={labelCls}>{label}{opt && <span className="ml-1 font-normal text-[#6b685e]">(optional)</span>}</label><input id={`pf-${k}`} className={inputCls} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></div>);
  return (
    <section className="mt-12 border-t-2 border-[#15181d] pt-6"><h2 className="text-[22px] font-extrabold">Your profile</h2>
      <p className="mt-1 text-[14px] text-[#5b584f]">Name, email and mobile can only be changed by an organiser-approved request.</p>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); setErr(null); setBusy(true); try { await api("me/profile", { method: "POST", auth: true, body: v }); onSaved(); } catch (x) { setErr(x instanceof ApiError ? x.message : "Could not save."); } finally { setBusy(false); } }}>
        {f("organisation", "College / organisation")}{f("course", "Course / designation")}{f("city", "City")}{f("state", "State")}{f("github", "GitHub profile", true)}{f("linkedin", "LinkedIn profile", true)}
        <div className="sm:col-span-2">{f("skills", "Technical skills", true)}</div>
        {err && <p role="alert" className="text-[14px] font-semibold text-[#b81f17] sm:col-span-2">{err}</p>}
        <div className="sm:col-span-2"><button type="submit" className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div>
      </form>
    </section>
  );
}

function ChangeRequests({ members, requests, onSent }: { members: Member[]; requests: NonNullable<Me["requests"]>; onSent: () => void }) {
  const others = members.filter((m) => !m.isLeader);
  const [code, setCode] = useState(others[0]?.registrationCode ?? "");
  const [f, setF] = useState({ fullName: "", email: "", mobile: "+91", note: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section className="mt-12 border-t-2 border-[#15181d] pt-6"><h2 className="text-[22px] font-extrabold">Request a team member change</h2>
      <p className="mt-1 text-[14px] text-[#5b584f]">Changes are applied only after an organiser approves them.</p>
      {others.length === 0 ? <p className="mt-3 text-[15px]">Your team has no other members to replace.</p> : (
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); setErr(null); setBusy(true); try { await api("me/change-requests", { method: "POST", auth: true, body: { kind: "REPLACE_MEMBER", registrationCode: code, ...f } }); setF({ fullName: "", email: "", mobile: "+91", note: "" }); onSent(); } catch (x) { setErr(x instanceof ApiError ? x.message : "Could not send."); } finally { setBusy(false); } }}>
          <div className="sm:col-span-2"><label htmlFor="cr-member" className={labelCls}>Member to replace</label><select id="cr-member" className={inputCls} value={code} onChange={(e) => setCode(e.target.value)}>{others.map((m) => <option key={m.id} value={m.registrationCode ?? ""}>{m.registrationCode} · {m.fullName}</option>)}</select></div>
          <div><label htmlFor="cr-name" className={labelCls}>New member's full name</label><input id="cr-name" className={inputCls} value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
          <div><label htmlFor="cr-email" className={labelCls}>New member's email</label><input id="cr-email" type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><label htmlFor="cr-mobile" className={labelCls}>New member's mobile (with country code)</label><input id="cr-mobile" type="tel" className={inputCls} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
          <div><label htmlFor="cr-note" className={labelCls}>Note <span className="font-normal text-[#6b685e]">(optional)</span></label><input id="cr-note" className={inputCls} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
          {err && <p role="alert" className="text-[14px] font-semibold text-[#b81f17] sm:col-span-2">{err}</p>}
          <div className="sm:col-span-2"><button type="submit" className={btnPrimary} disabled={busy}>{busy ? "Sending…" : "Send request"}</button></div>
        </form>
      )}
      {requests.length > 0 && <ul className="mt-6 space-y-2 text-[14px]">{requests.map((r) => (<li key={r.id} className="border-t border-[#bdb8ab] pt-2"><strong>{r.kind.replace("_", " ").toLowerCase()}</strong> · {r.status}{r.admin_note ? ` · ${r.admin_note}` : ""} <span className="font-mono text-[11px] text-[#5b584f]">{new Date(r.created_at).toLocaleDateString("en-IN")}</span></li>))}</ul>}
    </section>
  );
}
