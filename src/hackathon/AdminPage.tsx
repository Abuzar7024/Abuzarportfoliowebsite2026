import React, { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { EVENT_STATUS_LABELS, POLICY_SLUGS, type EventStatusLabel, type HackathonContent, type PolicySlug } from "../shared/hackathon-content";
import { ApiError, api, downloadAuthed, inr, session } from "./lib";
import { SignIn } from "./DashboardPage";
import { Kicker, btnPrimary, btnSecondary, inputCls, labelCls } from "./ui";

type Tab = "overview" | "registrations" | "payments" | "refunds" | "changes" | "content" | "announcements";
const TABS: [Tab, string][] = [["overview", "Overview"], ["registrations", "Registrations"], ["payments", "Payments"], ["refunds", "Refunds"], ["changes", "Change requests"], ["content", "Content"], ["announcements", "Announcements"]];

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function useMsg() {
  const [msg, setMsg] = useState<{ t: "ok" | "err"; text: string } | null>(null);
  const node = msg ? <p role={msg.t === "err" ? "alert" : "status"} className={`mt-4 border-l-4 bg-white px-4 py-2 text-[14px] font-semibold ${msg.t === "err" ? "border-[#d6281f]" : "border-[#157a3a]"}`}>{msg.text}</p> : null;
  return { node, ok: (text: string) => setMsg({ t: "ok", text }), err: (e: unknown) => setMsg({ t: "err", text: e instanceof ApiError ? e.message : "Something went wrong." }) };
}

const th = "py-2 pr-3 font-mono text-[11px] uppercase tracking-wider";
const td = "py-2.5 pr-3 align-top";

function Overview() {
  const [d, setD] = useState<Row | null>(null);
  const m = useMsg();
  useEffect(() => { api<Row>("admin/overview", { auth: true }).then(setD).catch(m.err); /* eslint-disable-next-line */ }, []);
  if (!d) return <>{m.node ?? <Loader2 className="animate-spin" />}</>;
  const t = d.totals;
  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-6 border-t-2 border-[#15181d] sm:grid-cols-4">
        {[["Participants", t.participants], ["Teams", t.teams], ["Revenue", inr(t.revenue)], ["Refunded", inr(t.refunded)], ["Pending payments", t.pending], ["Failed / expired", t.failed], ["Needs review", t.review]].map(([k, v]) => (
          <div key={String(k)} className="border-b border-[#bdb8ab] py-3"><dt className="font-mono text-[11px] uppercase tracking-wider text-[#5b584f]">{k}</dt><dd className="mt-1 text-[24px] font-extrabold">{String(v)}</dd></div>
        ))}
      </dl>
      <h3 className="mt-8 text-[18px] font-extrabold">By mode</h3>
      <p className="mt-1 text-[15px]">{(d.byMode as Row[]).map((r) => `${r.mode}: ${r.teams} teams / ${r.participants} participants`).join(" · ") || "No confirmed teams yet."}</p>
      <h3 className="mt-8 text-[18px] font-extrabold">Daily registrations (last 30 days)</h3>
      <table className="mt-2 w-full max-w-md text-left text-[15px]"><thead><tr className="border-b-2 border-[#15181d]"><th className={th}>Date</th><th className={th}>Teams</th><th className={th}>Participants</th></tr></thead>
        <tbody>{(d.daily as Row[]).map((r) => <tr key={String(r.day)} className="border-b border-[#bdb8ab]"><td className={td}>{String(r.day).slice(0, 10)}</td><td className={td}>{r.teams}</td><td className={td}>{r.participants}</td></tr>)}</tbody></table>
    </div>
  );
}

function Registrations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [f, setF] = useState({ q: "", mode: "", paymentStatus: "", teamSize: "" });
  const [busy, setBusy] = useState(false);
  const m = useMsg();
  const qs = (extra = "") => `${new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString()}${extra}`;
  const load = useCallback(async () => { setBusy(true); try { setRows((await api<{ rows: Row[] }>(`admin/registrations?${qs()}`, { auth: true })).rows); } catch (e) { m.err(e); } finally { setBusy(false); } /* eslint-disable-next-line */ }, [f]);
  useEffect(() => { void load(); }, [load]);
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2"><label className={labelCls} htmlFor="r-q">Search name, email, phone, team ID, registration ID</label><input id="r-q" className={inputCls} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        <div><label className={labelCls} htmlFor="r-mode">Mode</label><select id="r-mode" className={inputCls} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}><option value="">All</option><option>ONLINE</option><option>PHYSICAL</option></select></div>
        <div><label className={labelCls} htmlFor="r-pay">Payment</label><select id="r-pay" className={inputCls} value={f.paymentStatus} onChange={(e) => setF({ ...f, paymentStatus: e.target.value })}><option value="">All</option>{["SUCCESS", "INITIATED", "PENDING", "FAILED", "CANCELLED", "EXPIRED", "REFUND_PENDING", "REFUNDED"].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className={labelCls} htmlFor="r-size">Team size</label><select id="r-size" className={inputCls} value={f.teamSize} onChange={(e) => setF({ ...f, teamSize: e.target.value })}><option value="">All</option><option value="1">Solo (1)</option><option value="2-3">2–3</option><option value="4+">4+</option></select></div>
      </div>
      <div className="mt-4 flex items-center gap-3"><button type="button" className={btnSecondary} onClick={() => downloadAuthed(`admin/registrations.csv?${qs()}`, "registrations.csv").catch(m.err)}><Download size={16} aria-hidden="true" /> Export CSV (opens in Excel)</button>{busy && <Loader2 className="animate-spin" size={16} />}<span className="text-[13px] text-[#5b584f]">{rows.length} rows shown</span></div>
      {m.node}
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left text-[14px]"><thead><tr className="border-b-2 border-[#15181d]">{["Team", "Registration ID", "Name", "Email / mobile", "Mode", "Size", "Payment", "Amount"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.registration_code ?? r.email + r.team_id} className="border-b border-[#bdb8ab]"><td className={td}><strong>{r.team_name}</strong><br /><span className="font-mono text-[11px]">{r.team_code ?? "—"}</span></td><td className={`${td} font-mono`}>{r.registration_code ?? "—"}{r.is_leader ? " ★" : ""}</td><td className={td}>{r.full_name}</td><td className={td}>{r.email}<br />{r.mobile}</td><td className={td}>{r.mode}</td><td className={td}>{r.member_count}</td><td className={td}>{r.payment_status ?? "—"}</td><td className={td}>{r.amount_inr ? inr(r.amount_inr) : "—"}</td></tr>)}</tbody></table></div>
    </div>
  );
}

function Payments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [review, setReview] = useState(false);
  const m = useMsg();
  const load = useCallback(async () => { try { setRows((await api<{ rows: Row[] }>(`admin/payments?${status ? `status=${status}&` : ""}${review ? "review=1" : ""}`, { auth: true })).rows); } catch (e) { m.err(e); } /* eslint-disable-next-line */ }, [status, review]);
  useEffect(() => { void load(); }, [load]);
  const reconcile = async (txn: string) => { try { const r = await api<{ status: string; gateway: string }>(`admin/payments/${txn}/reconcile`, { method: "POST", auth: true, body: {} }); m.ok(`${txn}: ${r.status} (gateway: ${r.gateway})`); void load(); } catch (e) { m.err(e); } };
  const refund = async (r: Row) => { const reason = window.prompt("Reason for the refund?"); if (!reason) return; const amt = window.prompt("Refund amount (INR)", String(r.amount_inr)); if (!amt) return; try { await api(`admin/payments/${r.txnid}/refund`, { method: "POST", auth: true, body: { reason, amountInr: Number(amt) } }); m.ok("Refund request recorded. Process it in the PayU dashboard, then record the reference under Refunds."); void load(); } catch (e) { m.err(e); } };
  return (
    <div>
      <div className="flex flex-wrap items-end gap-4"><div><label className={labelCls} htmlFor="p-s">Status</label><select id="p-s" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{["SUCCESS", "INITIATED", "PENDING", "FAILED", "CANCELLED", "EXPIRED", "REFUND_PENDING", "REFUNDED"].map((s) => <option key={s}>{s}</option>)}</select></div>
        <label className="flex items-center gap-2 pb-3 text-[14px] font-semibold"><input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} /> Needs review only</label>
        <button type="button" className={btnSecondary} onClick={() => downloadAuthed("admin/payments.csv", "payments.csv").catch(m.err)}><Download size={16} aria-hidden="true" /> Financial report (CSV)</button></div>
      {m.node}
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left text-[14px]"><thead><tr className="border-b-2 border-[#15181d]">{["Created", "Reference", "Team", "Amount", "Status", "Env", "Actions"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r.txnid} className="border-b border-[#bdb8ab]"><td className={td}>{new Date(r.created_at).toLocaleString("en-IN")}</td><td className={`${td} font-mono text-[12px]`}>{r.txnid}<br />{r.payu_mihpayid ?? ""}</td><td className={td}>{r.team_name}<br /><span className="font-mono text-[11px]">{r.leader_email}</span></td><td className={td}>{inr(r.amount_inr)}<br /><span className="text-[12px]">{r.member_count} × {inr(r.fee_per_person)}</span></td><td className={td}><strong>{r.status}</strong>{r.needs_review ? <span className="ml-1 bg-[#d6281f] px-1.5 text-[11px] text-white">REVIEW</span> : null}<br /><span className="text-[12px]">{r.failure_reason ?? ""}</span></td><td className={td}>{r.environment}</td><td className={`${td} space-x-2`}>{["INITIATED", "PENDING", "FAILED", "EXPIRED", "CANCELLED"].includes(r.status) && <button type="button" className="font-bold underline" onClick={() => reconcile(r.txnid)}>Reconcile</button>}{r.status === "SUCCESS" && <button type="button" className="font-bold underline" onClick={() => refund(r)}>Refund</button>}</td></tr>)}</tbody></table></div>
    </div>
  );
}

function Refunds() {
  const [rows, setRows] = useState<Row[]>([]);
  const m = useMsg();
  const load = useCallback(async () => { try { setRows((await api<{ rows: Row[] }>("admin/refunds", { auth: true })).rows); } catch (e) { m.err(e); } /* eslint-disable-next-line */ }, []);
  useEffect(() => { void load(); }, [load]);
  const resolve = async (id: number, action: "processed" | "rejected") => { const gatewayRef = action === "processed" ? window.prompt("PayU refund reference") ?? "" : ""; if (action === "processed" && !gatewayRef) return; try { await api(`admin/refunds/${id}/resolve`, { method: "POST", auth: true, body: { action, gatewayRef } }); void load(); } catch (e) { m.err(e); } };
  return (<div><p className="text-[14px] text-[#3d3b35]">Refunds are recorded here after you process them in the PayU dashboard. This panel does not move money.</p>{m.node}
    <table className="mt-4 w-full border-collapse text-left text-[14px]"><thead><tr className="border-b-2 border-[#15181d]">{["Team", "Payment", "Amount", "Reason", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-[#bdb8ab]"><td className={td}>{r.team_name}<br /><span className="font-mono text-[11px]">{r.team_code}</span></td><td className={`${td} font-mono text-[12px]`}>{r.txnid}</td><td className={td}>{inr(r.amount_inr)}</td><td className={td}>{r.reason}</td><td className={td}>{r.status}{r.gateway_ref ? ` · ${r.gateway_ref}` : ""}</td><td className={`${td} space-x-2`}>{r.status === "REQUESTED" && <><button type="button" className="font-bold underline" onClick={() => resolve(r.id, "processed")}>Mark processed</button><button type="button" className="font-bold underline" onClick={() => resolve(r.id, "rejected")}>Reject</button></>}</td></tr>)}</tbody></table></div>);
}

function Changes() {
  const [rows, setRows] = useState<Row[]>([]);
  const m = useMsg();
  const load = useCallback(async () => { try { setRows((await api<{ rows: Row[] }>("admin/change-requests", { auth: true })).rows); } catch (e) { m.err(e); } /* eslint-disable-next-line */ }, []);
  useEffect(() => { void load(); }, [load]);
  const resolve = async (id: number, approve: boolean) => { const note = window.prompt("Note for the team (optional)") ?? ""; try { await api(`admin/change-requests/${id}/resolve`, { method: "POST", auth: true, body: { approve, note } }); m.ok(approve ? "Approved and applied." : "Rejected."); void load(); } catch (e) { m.err(e); } };
  return (<div>{m.node}<table className="mt-2 w-full border-collapse text-left text-[14px]"><thead><tr className="border-b-2 border-[#15181d]">{["Team", "Request", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r) => <tr key={r.id} className="border-b border-[#bdb8ab]"><td className={td}>{r.team_name}<br /><span className="font-mono text-[11px]">{r.team_code}</span></td><td className={td}>{r.kind}<br /><span className="text-[13px]">{r.payload?.registrationCode ? `Replace ${r.payload.registrationCode} with ${r.payload.fullName} (${r.payload.email}, ${r.payload.mobile})` : r.payload?.note}</span></td><td className={td}>{r.status}{r.admin_note ? ` · ${r.admin_note}` : ""}</td><td className={`${td} space-x-2`}>{r.status === "PENDING" && <><button type="button" className="font-bold underline" onClick={() => resolve(r.id, true)}>Approve</button><button type="button" className="font-bold underline" onClick={() => resolve(r.id, false)}>Reject</button></>}</td></tr>)}</tbody></table></div>);
}

function ContentTab() {
  const [content, setContent] = useState<HackathonContent | null>(null);
  const [reg, setReg] = useState<{ open: boolean; reason: string | null } | null>(null);
  const [payu, setPayu] = useState<Row | null>(null);
  const [json, setJson] = useState<Record<string, string>>({});
  const [slug, setSlug] = useState<PolicySlug>("terms");
  const m = useMsg();
  const load = useCallback(async () => {
    try {
      const r = await api<{ content: HackathonContent; registration: { open: boolean; reason: string | null }; payu: Row }>("admin/content", { auth: true });
      setContent(r.content); setReg(r.registration); setPayu(r.payu);
      setJson({ home: JSON.stringify(r.content.home, null, 2), tracks: JSON.stringify(r.content.tracks, null, 2), prizes: JSON.stringify(r.content.prizes, null, 2), schedule: JSON.stringify(r.content.schedule, null, 2), faqs: JSON.stringify(r.content.faqs, null, 2) });
    } catch (e) { m.err(e); }
    /* eslint-disable-next-line */ }, []);
  useEffect(() => { void load(); }, [load]);
  const save = async (key: string, value: unknown) => { try { const r = await api<{ registration: { open: boolean; reason: string | null } }>(`admin/content/${key}`, { method: "PUT", auth: true, body: { value } }); setReg(r.registration); m.ok(`Saved ${key}.`); void load(); } catch (e) { m.err(e); } };
  if (!content) return <>{m.node ?? <Loader2 className="animate-spin" />}</>;
  const s = content.settings;
  const [draft, setDraft] = [s, (patch: Partial<typeof s>) => setContent({ ...content, settings: { ...s, ...patch } })];
  const txt = (k: keyof typeof s, label: string) => (<div key={String(k)}><label className={labelCls} htmlFor={`s-${String(k)}`}>{label}</label><input id={`s-${String(k)}`} className={inputCls} value={String(draft[k] ?? "")} onChange={(e) => setDraft({ [k]: e.target.value } as never)} /></div>);
  const num = (k: keyof typeof s, label: string) => (<div key={String(k)}><label className={labelCls} htmlFor={`s-${String(k)}`}>{label}</label><input id={`s-${String(k)}`} type="number" className={inputCls} value={Number(draft[k])} onChange={(e) => setDraft({ [k]: Number(e.target.value) } as never)} /></div>);
  const pol = content.policies[slug];
  const setPol = (patch: Partial<typeof pol>) => setContent({ ...content, policies: { ...content.policies, [slug]: { ...pol, ...patch } } });
  return (
    <div className="space-y-12">
      {m.node}
      <section>
        <div className="border-l-4 border-[#15181d] bg-white px-4 py-3 text-[14px]"><strong>Registration is {reg?.open ? "OPEN" : "CLOSED"}.</strong> {reg?.reason}<br />Payment gateway: {payu?.error ? `⚠ ${payu.error}` : `${payu?.environment} / ${payu?.mode} → ${payu?.endpoint}`}</div>
        <h3 className="mt-6 text-[20px] font-extrabold">Event settings &amp; Hackathon Status</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="s-eventStatus">Event Status Indicator (Hackathon Status Page)</label>
            <select
              id="s-eventStatus"
              className={inputCls}
              value={s.eventStatus}
              onChange={(e) => setDraft({ eventStatus: e.target.value as EventStatusLabel })}
            >
              {EVENT_STATUS_LABELS.map((lbl) => (
                <option key={lbl} value={lbl}>{lbl}</option>
              ))}
            </select>
          </div>
          {txt("preRegistrationStatus", "Pre-Registration Status text")}
          {txt("officialRegistrationStatus", "Official Registration Status text")}
          {txt("registrationDeadlineText", "Registration Deadline (text)")}
          {txt("eventName", "Event name")}{txt("editionLabel", "Edition label")}{txt("location", "Location")}{txt("dateText", "Event dates (text)")}{txt("venueText", "Venue (text)")}{txt("formatText", "Format")}{txt("physicalDurationText", "Physical event duration")}
          {num("feePerPerson", "Fee per person (INR)")}{num("maxTeamSize", "Maximum team size (up to 15)")}{num("maxParticipants", "Maximum participants")}{num("targetParticipants", "Target participants")}{num("expectedPhysicalAttendance", "Expected physical attendance")}
          {txt("contactEmail", "Contact email")}{txt("contactPhone", "Contact phone")}{txt("grievanceText", "Grievance text")}{txt("submissionInstructions", "Submission instructions")}{txt("heroImageUrl", "Hero photo URL")}{txt("secondaryImageUrl", "Venue/Schedule photo URL")}{txt("mentorImageUrl", "Mentoring photo URL")}{txt("demoImageUrl", "Demo/Jury photo URL")}
          <label className="flex items-center gap-2 text-[15px] font-bold"><input type="checkbox" checked={s.physicalRegistrationAvailable} onChange={(e) => setDraft({ physicalRegistrationAvailable: e.target.checked })} /> Physical participation available</label>
          <label className="flex items-center gap-2 text-[15px] font-bold"><input type="checkbox" checked={s.tax.enabled} onChange={(e) => setDraft({ tax: { ...s.tax, enabled: e.target.checked } })} /> Add tax to the fee</label>
          {s.tax.enabled && <><div><label className={labelCls} htmlFor="tax-l">Tax label</label><input id="tax-l" className={inputCls} value={s.tax.label} onChange={(e) => setDraft({ tax: { ...s.tax, label: e.target.value } })} /></div><div><label className={labelCls} htmlFor="tax-r">Tax rate (%)</label><input id="tax-r" type="number" className={inputCls} value={s.tax.ratePercent} onChange={(e) => setDraft({ tax: { ...s.tax, ratePercent: Number(e.target.value) } })} /></div></>}
          <label className="flex items-center gap-2 text-[15px] font-bold sm:col-span-2"><input type="checkbox" checked={s.registrationOpen} onChange={(e) => setDraft({ registrationOpen: e.target.checked })} /> Registration open (also requires Terms, Privacy and Refund policies to be published)</label>
        </div>
        <button type="button" className={`${btnPrimary} mt-4`} onClick={() => save("settings", s)}>Save settings</button>
      </section>
      <section>
        <h3 className="text-[20px] font-extrabold">Policies</h3>
        <div className="mt-3 grid gap-4">
          <div><label className={labelCls} htmlFor="pol-s">Policy</label><select id="pol-s" className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value as PolicySlug)}>{POLICY_SLUGS.map((p) => <option key={p} value={p}>{content.policies[p].title}{content.policies[p].published ? " (published)" : " (draft)"}</option>)}</select></div>
          <div><label className={labelCls} htmlFor="pol-t">Title</label><input id="pol-t" className={inputCls} value={pol.title} onChange={(e) => setPol({ title: e.target.value })} /></div>
          <div><label className={labelCls} htmlFor="pol-b">Text (blank line = new paragraph; "- " = bullet)</label><textarea id="pol-b" rows={12} className={inputCls} value={pol.body} onChange={(e) => setPol({ body: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-[15px] font-bold"><input type="checkbox" checked={pol.published} onChange={(e) => setPol({ published: e.target.checked })} /> Published (visible to the public)</label>
          <div><button type="button" className={btnPrimary} onClick={() => save("policies", { [slug]: pol })}>Save policy</button></div>
        </div>
      </section>
      {(["home", "tracks", "prizes", "schedule", "faqs"] as const).map((k) => (
        <section key={k}><h3 className="text-[20px] font-extrabold capitalize">{k} (JSON)</h3>
          <textarea aria-label={`${k} JSON`} rows={10} className={`${inputCls} mt-3 font-mono text-[13px]`} value={json[k] ?? ""} onChange={(e) => setJson({ ...json, [k]: e.target.value })} />
          <button type="button" className={`${btnPrimary} mt-3`} onClick={() => { try { void save(k, JSON.parse(json[k])); } catch { m.err(new ApiError(0, "JSON", "That is not valid JSON.")); } }}>Save {k}</button></section>
      ))}
    </div>
  );
}

function Announcements() {
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const m = useMsg();
  const load = useCallback(async () => { try { setRows((await api<{ rows: Row[] }>("admin/announcements", { auth: true })).rows); } catch (e) { m.err(e); } /* eslint-disable-next-line */ }, []);
  useEffect(() => { void load(); }, [load]);
  return (<div>{m.node}
    <form className="grid gap-3" onSubmit={async (e) => { e.preventDefault(); try { await api("admin/announcements", { method: "POST", auth: true, body: { title, body } }); setTitle(""); setBody(""); m.ok("Published."); void load(); } catch (x) { m.err(x); } }}>
      <div><label className={labelCls} htmlFor="a-t">Title</label><input id="a-t" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div><label className={labelCls} htmlFor="a-b">Message</label><textarea id="a-b" rows={4} className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} /></div>
      <div><button type="submit" className={btnPrimary}>Publish announcement</button></div></form>
    <ul className="mt-8 space-y-3">{rows.map((r) => <li key={r.id} className="border-t border-[#15181d] pt-3"><strong>{r.title}</strong><p className="whitespace-pre-line text-[14px]">{r.body}</p><button type="button" className="text-[13px] font-bold underline" onClick={async () => { try { await api(`admin/announcements/${r.id}`, { method: "DELETE", auth: true }); void load(); } catch (x) { m.err(x); } }}>Delete</button></li>)}</ul></div>);
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [state, setState] = useState<"checking" | "out" | "denied" | "ok">(session.getAccess() ? "checking" : "out");
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (!session.getAccess()) return;
    api<{ adminEmail: string }>("admin/overview", { auth: true }).then((r) => { setEmail(r.adminEmail); setState("ok"); }).catch((e) => setState(e instanceof ApiError && e.status === 403 ? "denied" : "out"));
  }, []);
  if (state === "checking") return <p className="flex items-center gap-3 px-6 py-16"><Loader2 className="animate-spin" /> Checking access…</p>;
  if (state === "out") return <SignIn title="Organiser sign in" note="Sign in with an organiser email. You will receive a one-time link." />;
  if (state === "denied") return <div className="mx-auto max-w-[560px] px-6 py-20"><h1 className="text-[2rem] font-extrabold">No access</h1><p className="mt-3 text-[16px]">This account is not an organiser.</p></div>;
  return (
    <div className="w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-10 xl:px-14">
      <Kicker>Organiser panel</Kicker>
      <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold tracking-[-0.03em]">Event administration</h1>
      <p className="mt-1 font-mono text-[12px] text-[#5b584f]">{email}</p>
      <div role="tablist" aria-label="Admin sections" className="mt-6 flex flex-wrap gap-px border-y border-[#15181d] bg-[#15181d]">
        {TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} type="button" onClick={() => setTab(k)} className={`px-4 py-3 text-[14px] font-bold ${tab === k ? "bg-[#15181d] text-white" : "bg-[#f6f4ef] hover:bg-white"}`}>{label}</button>)}
      </div>
      <div className="mt-8">
        {tab === "overview" && <Overview />}{tab === "registrations" && <Registrations />}{tab === "payments" && <Payments />}{tab === "refunds" && <Refunds />}{tab === "changes" && <Changes />}{tab === "content" && <ContentTab />}{tab === "announcements" && <Announcements />}
      </div>
    </div>
  );
}
