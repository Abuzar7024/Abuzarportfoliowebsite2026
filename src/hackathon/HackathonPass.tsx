import React, { useMemo } from "react";
import { CheckCircle2, Download, Printer } from "lucide-react";
import { generateQrMatrix } from "../competition/qr-code";

export const PASS_QR_URL = "https://abuzarcode.in/";

export interface PassMemberData {
  registrationCode: string;
  teamCode: string;
  teamName: string;
  fullName: string;
  role: "Team Leader" | "Team Member" | string;
  organisation?: string | null;
  course?: string | null;
  memberCount?: number;
  feePaidInr?: number;
  verifiedAt?: string | null;
}

/** High-DPI PNG generator for a participant's official AVATAR Hackathon Pass. */
export function downloadPassPng(pass: PassMemberData): void {
  const W = 1080;
  const H = 1520;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Outer background
  ctx.fillStyle = "#e8e4d8";
  ctx.fillRect(0, 0, W, H);

  // Card body
  const pad = 48;
  const cX = pad;
  const cY = pad;
  const cW = W - pad * 2;
  const cH = H - pad * 2;

  ctx.fillStyle = "#f6f4ef";
  ctx.fillRect(cX, cY, cW, cH);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#15181d";
  ctx.strokeRect(cX, cY, cW, cH);

  // Top charcoal header block
  const headH = 250;
  ctx.fillStyle = "#15181d";
  ctx.fillRect(cX, cY, cW, headH);

  // Lanyard slot pill
  ctx.fillStyle = "#e8e4d8";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 70, cY + 24, 140, 22, 11);
  ctx.fill();

  // Header text
  ctx.fillStyle = "#ff6b5e";
  ctx.font = "600 20px 'JetBrains Mono', monospace";
  ctx.fillText("DESIGN. BUILD. SELL. IN ONE DAY.", cX + 44, cY + 92);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 64px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("AVATAR", cX + 44, cY + 162);

  ctx.fillStyle = "#d8d4c8";
  ctx.font = "600 21px 'JetBrains Mono', monospace";
  ctx.fillText("OFFICIAL PARTICIPANT PASS · VERIFIED", cX + 44, cY + 208);

  // Red accent ribbon
  const ribY = cY + headH;
  const ribH = 62;
  ctx.fillStyle = "#d6281f";
  ctx.fillRect(cX, ribY, cW, ribH);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  const roleLabel = pass.role.toUpperCase().includes("LEADER") ? "★ TEAM LEADER PASS" : "PARTICIPANT PASS";
  ctx.fillText(roleLabel, cX + 44, ribY + 40);

  const formatLabel = "1-DAY PRODUCT CHALLENGE";
  const formatW = ctx.measureText(formatLabel).width;
  ctx.fillText(formatLabel, cX + cW - 44 - formatW, ribY + 40);

  // Participant identity block
  let y = ribY + ribH + 74;
  ctx.fillStyle = "#5b584f";
  ctx.font = "600 19px 'JetBrains Mono', monospace";
  ctx.fillText("PARTICIPANT NAME", cX + 44, y);

  y += 54;
  ctx.fillStyle = "#15181d";
  ctx.font = "800 48px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(pass.fullName.slice(0, 32), cX + 44, y);

  if (pass.organisation || pass.course) {
    y += 38;
    ctx.fillStyle = "#3d3b35";
    ctx.font = "600 24px 'Plus Jakarta Sans', sans-serif";
    const orgLine = [pass.course, pass.organisation].filter(Boolean).join(" · ").slice(0, 52);
    ctx.fillText(orgLine, cX + 44, y);
  }

  // Divider
  y += 40;
  ctx.strokeStyle = "#15181d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cX + 44, y);
  ctx.lineTo(cX + cW - 44, y);
  ctx.stroke();

  // 2x2 Metadata grid
  const gY = y + 48;
  const col2X = cX + cW / 2 + 10;

  const drawField = (label: string, val: string, x: number, fy: number, highlight = false) => {
    ctx.fillStyle = "#5b584f";
    ctx.font = "600 18px 'JetBrains Mono', monospace";
    ctx.fillText(label, x, fy);
    ctx.fillStyle = highlight ? "#d6281f" : "#15181d";
    ctx.font = "800 30px 'JetBrains Mono', monospace";
    ctx.fillText(val, x, fy + 40);
  };

  drawField("REGISTRATION ID", pass.registrationCode, cX + 44, gY, true);
  drawField("TEAM ID", pass.teamCode, col2X, gY);
  drawField("TEAM NAME", pass.teamName.slice(0, 22), cX + 44, gY + 110);
  drawField(
    "TEAM SIZE",
    pass.memberCount ? `${pass.memberCount} ${pass.memberCount === 1 ? "Member (Solo)" : "Members"}` : "Verified Team",
    col2X,
    gY + 110
  );

  // Bottom divider before QR footer
  const qrTop = cY + cH - 390;
  ctx.strokeStyle = "#15181d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cX + 44, qrTop);
  ctx.lineTo(cX + cW - 44, qrTop);
  ctx.stroke();

  // QR code box on right (redirects directly to https://abuzarcode.in/)
  const qrMatrix = generateQrMatrix(PASS_QR_URL);
  const qrBoxSize = 270;
  const qrX = cX + cW - 44 - qrBoxSize;
  const qrY = qrTop + 44;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX, qrY, qrBoxSize, qrBoxSize);
  ctx.strokeStyle = "#15181d";
  ctx.lineWidth = 3;
  ctx.strokeRect(qrX, qrY, qrBoxSize, qrBoxSize);

  const quiet = 3;
  const totalModules = qrMatrix.length + quiet * 2;
  const cell = qrBoxSize / totalModules;
  ctx.fillStyle = "#15181d";
  for (let r = 0; r < qrMatrix.length; r++) {
    for (let c = 0; c < qrMatrix.length; c++) {
      if (qrMatrix[r][c]) {
        ctx.fillRect(
          Math.floor(qrX + (c + quiet) * cell),
          Math.floor(qrY + (r + quiet) * cell),
          Math.ceil(cell),
          Math.ceil(cell)
        );
      }
    }
  }

  // Left side of QR footer
  const fX = cX + 44;
  let fY = qrTop + 78;
  ctx.fillStyle = "#157a3a";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.fillText("● VERIFIED AVATAR PASS", fX, fY);

  fY += 44;
  ctx.fillStyle = "#15181d";
  ctx.font = "800 24px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("DESIGN. BUILD. SELL. IN ONE DAY.", fX, fY);

  fY += 38;
  ctx.fillStyle = "#3d3b35";
  ctx.font = "500 20px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Official Pre-Registration Credential", fX, fY);

  fY += 56;
  ctx.fillStyle = "#5b584f";
  ctx.font = "600 18px 'JetBrains Mono', monospace";
  ctx.fillText("SCAN QR TO VISIT", fX, fY);
  fY += 28;
  ctx.fillStyle = "#d6281f";
  ctx.font = "700 20px 'JetBrains Mono', monospace";
  ctx.fillText("https://abuzarcode.in/", fX, fY);

  const link = document.createElement("a");
  link.download = `AVATAR-Pass-${pass.registrationCode}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/** Renders the official AVATAR conference lanyard pass card in the DOM. */
export function HackathonPassCard({
  pass,
  compact = false,
}: {
  pass: PassMemberData;
  compact?: boolean;
}) {
  const qr = useMemo(() => generateQrMatrix(PASS_QR_URL), []);
  const isLeader = pass.role.toUpperCase().includes("LEADER");

  return (
    <article
      data-testid="avatar-participant-pass"
      aria-label={`AVATAR Hackathon pass for ${pass.fullName}`}
      className="relative mx-auto w-full max-w-full sm:max-w-[430px] border-2 border-[#15181d] bg-[#f6f4ef] text-[#15181d] shadow-[5px_5px_0px_#15181d] sm:shadow-[8px_8px_0px_#15181d]"
    >
      {/* Top dark badge header with lanyard slot */}
      <div className="bg-[#15181d] px-4 pb-4 pt-3 text-white sm:px-5 sm:pb-5 sm:pt-3.5">
        <div className="mx-auto mb-3 h-2.5 w-20 rounded-full border border-white/25 bg-[#f6f4ef]/15" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#ff6b5e]">
            DESIGN. BUILD. SELL. IN ONE DAY.
          </span>
          <span className="border border-white/25 px-2 py-0.5 font-mono text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-wider text-[#d8d4c8]">
            OFFICIAL PASS
          </span>
        </div>
        <h3 className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold leading-none tracking-[-0.03em] text-white">
          AVATAR
        </h3>
        <p className="mt-1 font-mono text-[10.5px] sm:text-[11px] uppercase tracking-[0.12em] text-[#d8d4c8]">
          Official Participant Credential
        </p>
      </div>

      {/* Crimson role + 1-day challenge bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#d6281f] px-4 py-2 font-mono text-[10.5px] sm:px-5 sm:text-[11px] font-bold uppercase tracking-[0.12em] text-white">
        <span>{isLeader ? "★ Team Leader" : "Team Member"}</span>
        <span>1-Day Challenge</span>
      </div>

      {/* Participant body */}
      <div className="p-4 sm:p-5">
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#5b584f]">
            Participant
          </p>
          <p className="mt-0.5 break-words text-[20px] sm:text-[23px] font-extrabold leading-tight tracking-[-0.02em] text-[#15181d]">
            {pass.fullName}
          </p>
          {(pass.course || pass.organisation) && (
            <p className="mt-0.5 break-words text-[13px] sm:text-[13.5px] font-medium text-[#3d3b35]">
              {[pass.course, pass.organisation].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* 2x2 IDs & Team Info Grid */}
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-y border-[#15181d] py-3.5 sm:gap-x-4">
          <div className="min-w-0">
            <dt className="font-mono text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">
              Registration ID
            </dt>
            <dd className="mt-0.5 break-all font-mono text-[13px] sm:text-[14px] font-extrabold text-[#d6281f]">
              {pass.registrationCode}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-mono text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">
              Team ID
            </dt>
            <dd className="mt-0.5 break-all font-mono text-[13px] sm:text-[14px] font-extrabold text-[#15181d]">
              {pass.teamCode}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-mono text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">
              Team Name
            </dt>
            <dd className="mt-0.5 truncate text-[13px] sm:text-[14px] font-bold text-[#15181d]">
              {pass.teamName}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-mono text-[9.5px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5b584f]">
              Team Size
            </dt>
            <dd className="mt-0.5 truncate text-[13px] sm:text-[14px] font-bold text-[#15181d]">
              {pass.memberCount ? `${pass.memberCount} ${pass.memberCount === 1 ? "Member" : "Members"}` : "Verified Team"}
            </dd>
          </div>
        </dl>

        {/* QR & Verification Footer */}
        <div className="mt-4 flex items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 bg-[#157a3a]/10 px-2.5 py-1 font-mono text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#157a3a]">
              <CheckCircle2 size={13} aria-hidden="true" className="shrink-0" />
              <span>Verified Pass</span>
            </div>
            <p className="mt-2 text-[12px] sm:text-[12.5px] leading-snug text-[#3d3b35]">
              Official AVATAR participant credential. Scan QR code to open{" "}
              <a
                href={PASS_QR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-[#d6281f] underline"
              >
                abuzarcode.in
              </a>
              .
            </p>
          </div>

          <a
            href={PASS_QR_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open https://abuzarcode.in/"
            className="shrink-0 border-2 border-[#15181d] bg-white p-1.5 sm:p-2 transition-transform hover:scale-[1.02]"
          >
            <svg
              viewBox={`0 0 ${qr.length + 4} ${qr.length + 4}`}
              className="h-20 w-20 sm:h-24 sm:w-24"
              role="img"
              aria-label="QR code redirecting to https://abuzarcode.in/"
            >
              <rect width={qr.length + 4} height={qr.length + 4} fill="#ffffff" />
              {qr.map((row, r) =>
                row.map((cell, c) =>
                  cell ? <rect key={`${r}-${c}`} x={c + 2} y={r + 2} width={1} height={1} fill="#15181d" /> : null
                )
              )}
            </svg>
          </a>
        </div>

        {!compact && (
          <div className="mt-4 flex flex-col gap-2 border-t border-[#d9d5c9] pt-3.5 sm:flex-row">
            <button
              type="button"
              data-testid="download-pass-png"
              onClick={() => downloadPassPng(pass)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 bg-[#15181d] px-3 py-2.5 font-mono text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#d6281f]"
            >
              <Download size={14} aria-hidden="true" />
              Download Pass (PNG)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1.5 border border-[#15181d] bg-white px-3 py-2.5 font-mono text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wider text-[#15181d] transition-colors hover:bg-[#15181d] hover:text-white"
              title="Print pass"
            >
              <Printer size={14} aria-hidden="true" />
              Print
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
