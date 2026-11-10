import { inr } from "./lib";

export interface ReceiptData {
  eventName: string;
  teamName: string;
  teamCode: string | null;
  mode?: string;
  amount: number;
  members: { registrationCode: string | null; fullName: string; role: string }[];
  txnid: string;
  status: string;
  paidAt: string | null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function receiptHtml(d: ReceiptData): string {
  const rows = d.members
    .map((m) => `<tr><td>${esc(m.registrationCode ?? "—")}</td><td>${esc(m.fullName)}</td><td>${esc(m.role)}</td></tr>`)
    .join("");
  const when = d.paidAt ? new Date(d.paidAt).toLocaleString("en-IN") : "—";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Registration confirmation ${esc(d.teamCode ?? "")}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:32px auto;padding:0 20px;color:#15181d}h1{font-size:26px;margin:0}
.k{font:600 12px monospace;letter-spacing:.12em;text-transform:uppercase;color:#d6281f}table{width:100%;border-collapse:collapse;margin-top:16px}
td,th{border-top:1px solid #bdb8ab;padding:10px 6px;text-align:left}dl{display:grid;grid-template-columns:200px 1fr;gap:8px 16px;margin-top:20px}dt{color:#5b584f}dd{margin:0;font-weight:700}
footer{margin-top:32px;font-size:12px;color:#5b584f}</style></head><body>
<p class="k">${esc(d.eventName)} · DESIGN. BUILD. SELL. IN ONE DAY. · Registration confirmation</p><h1>${esc(d.teamName)}</h1>
<dl><dt>Team ID</dt><dd>${esc(d.teamCode ?? "—")}</dd><dt>Payment status</dt><dd>${esc(d.status)}</dd>
<dt>Total amount paid</dt><dd>${esc(inr(d.amount))}</dd><dt>Participants</dt><dd>${d.members.length}</dd>
<dt>Payment reference</dt><dd>${esc(d.txnid)}</dd><dt>Verified at</dt><dd>${esc(when)}</dd></dl>
<table><thead><tr><th>Registration ID</th><th>Name</th><th>Role</th></tr></thead><tbody>${rows}</tbody></table>
<footer>This is an electronically generated confirmation. Exact event dates and venue will be announced.</footer>
<script>window.addEventListener('load',function(){if(location.hash==='#print')window.print()})</script></body></html>`;
}

export function downloadReceipt(d: ReceiptData): void {
  const blob = new Blob([receiptHtml(d)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registration-${d.teamCode ?? d.txnid}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function printReceipt(d: ReceiptData): void {
  const blob = new Blob([receiptHtml(d)], { type: "text/html" });
  window.open(`${URL.createObjectURL(blob)}#print`, "_blank", "noopener");
}
