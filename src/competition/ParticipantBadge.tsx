import React, { useMemo, useState } from "react";
import { Check, CheckCircle2, Download, ExternalLink, FileDown, Share2 } from "lucide-react";
import { AVATAR_COMPETITION } from "../data/avatar-competition";
import { generateQrMatrix } from "./qr-code";

export interface ParticipantBadgeProps {
  participantId: string;
  participantName: string;
  status?: "VERIFIED";
  verifySignature?: string | null;
  registeredAt?: string | null;
}

/**
 * Draws the official high-resolution AI HACKATHON Participant Credential (1200×1560)
 * onto an HTML5 Canvas for crisp PNG & PDF downloads.
 */
function renderBadgeCanvas(params: {
  participantId: string;
  participantName: string;
  verifyUrl: string;
  matrix: boolean[][];
}): HTMLCanvasElement {
  const W = 1200;
  const H = 1560;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Deep obsidian background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#090c14");
  bg.addColorStop(0.5, "#07090f");
  bg.addColorStop(1, "#0d101b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle crimson + electric blue radial accents
  const topGlow = ctx.createRadialGradient(W / 2, 160, 10, W / 2, 160, 520);
  topGlow.addColorStop(0, "rgba(239, 35, 60, 0.22)");
  topGlow.addColorStop(0.55, "rgba(56, 189, 248, 0.08)");
  topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, H);

  // Minimal technical geometric grid + diagonal vector lines
  ctx.strokeStyle = "rgba(148, 163, 184, 0.05)";
  ctx.lineWidth = 1;
  for (let x = 60; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, H - 40);
    ctx.stroke();
  }
  for (let y = 60; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();
  }

  // Geometric concentric hexagon watermark at top center
  ctx.save();
  ctx.translate(W / 2, 235);
  ctx.strokeStyle = "rgba(239, 35, 60, 0.14)";
  ctx.lineWidth = 2;
  for (const r of [72, 110, 148]) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = Math.cos(angle) * r;
      const hy = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();

  // Outer precision frame
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(44, 44, W - 88, H - 88, 36);
  ctx.stroke();

  // Signal-red corner brackets
  ctx.strokeStyle = "#ef233c";
  ctx.lineWidth = 5;
  const bLen = 44;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(44, 44 + bLen);
  ctx.lineTo(44, 44);
  ctx.lineTo(44 + bLen, 44);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(W - 44 - bLen, 44);
  ctx.lineTo(W - 44, 44);
  ctx.lineTo(W - 44, 44 + bLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(44, H - 44 - bLen);
  ctx.lineTo(44, H - 44);
  ctx.lineTo(44 + bLen, H - 44);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(W - 44 - bLen, H - 44);
  ctx.lineTo(W - 44, H - 44);
  ctx.lineTo(W - 44, H - 44 - bLen);
  ctx.stroke();

  // Top Header Bar: Emblem + OFFICIAL PARTICIPANT + VERIFIED
  ctx.fillStyle = "rgba(239, 35, 60, 0.14)";
  ctx.strokeStyle = "rgba(239, 35, 60, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(110, 100, 420, 54, 27);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ff4d63";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText("OFFICIAL PARTICIPANT", 320, 127);

  // Subtle VERIFIED Pill (Top Right)
  ctx.fillStyle = "rgba(16, 185, 129, 0.14)";
  ctx.strokeStyle = "rgba(16, 185, 129, 0.45)";
  ctx.beginPath();
  ctx.roundRect(W - 350, 100, 240, 54, 27);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText("● VERIFIED", W - 230, 127);

  // Official AVATAR Hackathon Title
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 84px "Plus Jakarta Sans", "Space Grotesk", sans-serif';
  ctx.fillText("AVATAR", W / 2, 265);

  ctx.fillStyle = "#94a3b8";
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillText("DESIGN. BUILD. SELL. IN ONE DAY.", W / 2, 330);

  // Technical divider line
  const gradLine = ctx.createLinearGradient(110, 0, W - 110, 0);
  gradLine.addColorStop(0, "rgba(239, 35, 60, 0)");
  gradLine.addColorStop(0.5, "rgba(239, 35, 60, 0.7)");
  gradLine.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = gradLine;
  ctx.fillRect(110, 382, W - 220, 2);

  // Participant Number Block
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(110, 424, W - 220, 190, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = '700 19px "JetBrains Mono", monospace';
  ctx.fillText("PARTICIPANT CREDENTIAL ID", W / 2, 472);

  ctx.fillStyle = "#ffffff";
  ctx.font = '800 62px "JetBrains Mono", monospace';
  ctx.fillText(params.participantId, W / 2, 548);

  // Participant Full Name Block
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.roundRect(110, 644, W - 220, 185, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#64748b";
  ctx.font = '700 19px "JetBrains Mono", monospace';
  ctx.fillText("REGISTERED BUILDER", W / 2, 692);

  const displayName = (params.participantName || "OFFICIAL PARTICIPANT").toUpperCase();
  ctx.fillStyle = "#f8fafc";
  ctx.font =
    displayName.length > 22
      ? '800 40px "Plus Jakarta Sans", sans-serif'
      : '800 50px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(displayName.slice(0, 34), W / 2, 762);

  // QR Verification Block
  const qrBoxSize = 370;
  const qrX = (W - qrBoxSize) / 2;
  const qrY = 890;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(qrX, qrY, qrBoxSize, qrBoxSize, 26);
  ctx.fill();

  const N = params.matrix.length;
  const quietZone = 3;
  const totalModules = N + quietZone * 2;
  const cell = qrBoxSize / totalModules;

  ctx.fillStyle = "#090c14";
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (params.matrix[r][c]) {
        const rx = qrX + (c + quietZone) * cell;
        const ry = qrY + (r + quietZone) * cell;
        ctx.fillRect(Math.floor(rx), Math.floor(ry), Math.ceil(cell), Math.ceil(cell));
      }
    }
  }

  // Footer
  ctx.fillStyle = "#94a3b8";
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText("SCAN PASS TO VISIT ABUZARCODE.IN", W / 2, 1325);

  ctx.fillStyle = "#ef233c";
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText("https://abuzarcode.in/", W / 2, 1368);

  ctx.fillStyle = "#475569";
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText("AVATAR · DESIGN. BUILD. SELL. IN ONE DAY.", W / 2, 1455);

  return canvas;
}

/**
 * Generates a standalone single-page ISO-32000 PDF file containing a JPEG image
 * of the badge canvas so "Download PDF" works instantaneously on all devices.
 */
function buildPdfFromCanvas(canvas: HTMLCanvasElement): Blob {
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.96);
  const base64 = jpegDataUrl.split(",")[1];
  const binaryStr = atob(base64);
  const imgBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    imgBytes[i] = binaryStr.charCodeAt(i);
  }

  const pageW = 450;
  const pageH = 585;
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    length += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    length += b.length;
  };
  const startObj = (id: number) => {
    offsets[id] = length;
    pushStr(`${id} 0 obj\n`);
  };
  const endObj = () => pushStr("\nendobj\n");

  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  startObj(1);
  pushStr("<< /Type /Catalog /Pages 2 0 R >>");
  endObj();

  startObj(2);
  pushStr("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  endObj();

  startObj(3);
  pushStr(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
  );
  endObj();

  startObj(4);
  pushStr(
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
  );
  pushBytes(imgBytes);
  pushStr("\nendstream");
  endObj();

  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  startObj(5);
  pushStr(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream`);
  endObj();

  const xrefOffset = length;
  pushStr("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) {
    pushStr(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

export function ParticipantBadge({
  participantId,
  participantName,
  status = "VERIFIED",
}: ParticipantBadgeProps) {
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const verifyPath = `${AVATAR_COMPETITION.verifyPathPrefix}/${participantId}`;
  const qrTargetUrl = "https://abuzarcode.in/";

  const matrix = useMemo(() => generateQrMatrix(qrTargetUrl), [qrTargetUrl]);
  const displayName = participantName.trim() || "OFFICIAL PARTICIPANT";

  const handleDownloadPng = () => {
    setDownloading("png");
    try {
      const canvas = renderBadgeCanvas({
        participantId,
        participantName: displayName,
        verifyUrl: qrTargetUrl,
        matrix,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `AVATAR-Pass-${participantId}.png`;
      a.click();
    } finally {
      setTimeout(() => setDownloading(null), 400);
    }
  };

  const handleDownloadPdf = () => {
    setDownloading("pdf");
    try {
      const canvas = renderBadgeCanvas({
        participantId,
        participantName: displayName,
        verifyUrl: qrTargetUrl,
        matrix,
      });
      const blob = buildPdfFromCanvas(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AVATAR-Pass-${participantId}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setTimeout(() => setDownloading(null), 400);
    }
  };

  const handleShareBadge = async () => {
    const shareData = {
      title: `AVATAR Pass — ${participantId}`,
      text: `I'm officially registered for AVATAR (${participantId})! DESIGN. BUILD. SELL. IN ONE DAY.`,
      url: qrTargetUrl,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // Fall back to clipboard copy if share sheet was dismissed
    }
    try {
      await navigator.clipboard.writeText(qrTargetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const N = matrix.length;

  return (
    <div className="flex w-full flex-col items-center">
      {/* Official Digital Hackathon Credential Card */}
      <div
        id="avatar-participant-badge"
        className="relative w-full max-w-[24rem] overflow-hidden rounded-[28px] border border-white/15 bg-[#090c14] p-6 text-white shadow-[0_28px_80px_-16px_rgba(239,35,60,0.28)]"
      >
        {/* Minimal Geometric Vector Pattern Overlay */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 520"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
        >
          <defs>
            <pattern id="aih-badge-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="0.6"
                strokeOpacity="0.35"
              />
            </pattern>
            <linearGradient id="aih-hex-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ef233c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#aih-badge-grid)" />
          <polygon
            points="200,26 268,65 268,143 200,182 132,143 132,65"
            fill="none"
            stroke="url(#aih-hex-grad)"
            strokeWidth="1.5"
          />
          <polygon
            points="200,46 250,75 250,133 200,162 150,133 150,75"
            fill="none"
            stroke="url(#aih-hex-grad)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Precision Signal-Red Corner Brackets */}
        <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 border-l-2 border-t-2 border-[#ef233c]" />
        <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 border-r-2 border-t-2 border-[#ef233c]" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3.5 left-3.5 h-4 w-4 border-b-2 border-l-2 border-[#ef233c]" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-3.5 right-3.5 h-4 w-4 border-b-2 border-r-2 border-[#ef233c]" />

        {/* Top Bar: Official Label + Subtle Verified Indicator */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ef233c]/40 bg-[#ef233c]/12 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff4d63]">
            OFFICIAL PARTICIPANT
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
            <CheckCircle2 size={11} className="text-emerald-400" aria-hidden="true" />
            {status}
          </span>
        </div>

        {/* Official AI Hackathon Vector Emblem + Title */}
        <div className="relative z-10 mt-5 flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-[#ef233c]/25 via-[#0f172a] to-[#38bdf8]/20 shadow-inner">
            <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
              <polygon
                points="18,3 31,10.5 31,25.5 18,33 5,25.5 5,10.5"
                fill="none"
                stroke="#ef233c"
                strokeWidth="2"
              />
              <polygon
                points="18,9 25.5,13.5 25.5,22.5 18,27 10.5,22.5 10.5,13.5"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <circle cx="18" cy="18" r="2.6" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-[-0.03em] text-white sm:text-2xl">
              {AVATAR_COMPETITION.name}
            </p>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
              {AVATAR_COMPETITION.subtitle}
            </p>
          </div>
        </div>

        <div className="relative z-10 my-4 h-px w-full bg-gradient-to-r from-[#ef233c]/60 via-white/15 to-[#38bdf8]/40" />

        {/* Participant Number */}
        <div className="relative z-10 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
            PARTICIPANT NUMBER
          </p>
          <p
            className="mt-1 break-all font-mono text-xl font-extrabold tracking-wider text-white sm:text-2xl"
            data-testid="badge-participant-id"
          >
            {participantId}
          </p>
        </div>

        {/* Participant Full Name */}
        <div className="relative z-10 mt-2.5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
            PARTICIPANT NAME
          </p>
          <p
            className="mt-1 truncate text-lg font-extrabold tracking-tight text-white"
            data-testid="badge-participant-name"
          >
            {displayName}
          </p>
        </div>

        {/* QR Code + Verification Link */}
        <div className="relative z-10 mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
          <div className="shrink-0 rounded-xl bg-white p-2">
            <svg
              viewBox={`0 0 ${N + 4} ${N + 4}`}
              className="h-24 w-24 sm:h-28 sm:w-28"
              role="img"
              aria-label={`Verification QR Code for ${participantId}`}
            >
              <rect width={N + 4} height={N + 4} fill="#ffffff" />
              {matrix.map((row, r) =>
                row.map((dark, c) =>
                  dark ? (
                    <rect key={`${r}-${c}`} x={c + 2} y={r + 2} width={1} height={1} fill="#090c14" />
                  ) : null
                )
              )}
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">
              DIGITAL PASS VERIFICATION
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#cbd5e1]">
              Scan QR or open the official verification link to validate this pass.
            </p>
            <a
              href={verifyPath}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-1 break-all font-mono text-[10.5px] font-semibold text-[#ff4d63] underline decoration-[#ff4d63]/40 underline-offset-4 hover:text-white"
            >
              <span>/verify/{participantId}</span>
              <ExternalLink size={11} className="shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Download & Share Controls */}
      <div className="mt-4 grid w-full max-w-[24rem] grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={downloading !== null}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ef233c] px-3 py-3 text-xs font-bold text-white transition-all hover:bg-[#d90429] disabled:opacity-60"
        >
          <Download size={14} aria-hidden="true" />
          <span>{downloading === "png" ? "Saving…" : "PNG"}</span>
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading !== null}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-3 text-xs font-bold text-white transition-all hover:bg-white/[0.1] disabled:opacity-60"
        >
          <FileDown size={14} aria-hidden="true" />
          <span>{downloading === "pdf" ? "Saving…" : "PDF"}</span>
        </button>
        <button
          type="button"
          onClick={handleShareBadge}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-3 text-xs font-bold text-white transition-all hover:bg-white/[0.1]"
        >
          {copiedLink ? (
            <>
              <Check size={14} className="text-emerald-400" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Share2 size={14} aria-hidden="true" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
