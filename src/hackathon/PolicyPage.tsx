import React from "react";
import { ArrowLeft } from "lucide-react";
import type { PolicySlug } from "../shared/hackathon-content";
import type { ContentResponse } from "./lib";
import { Kicker, Link, btnSecondary } from "./ui";

export const POLICY_ROUTES: Record<string, PolicySlug> = {
  terms: "terms",
  privacy: "privacy",
  refund: "refund",
  conduct: "conduct",
  eligibility: "eligibility",
  payment: "payment",
  contact: "contact",
};

function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-5 text-[17px] leading-[1.7] text-[#2c2a25]">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return <ul key={i} className="list-disc space-y-1.5 pl-5">{lines.map((l, j) => <li key={j}>{l.replace(/^\s*-\s/, "")}</li>)}</ul>;
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {lines.length > 1 && /^\d+\.\s/.test(lines[0]) ? <strong>{lines[0]}{"\n"}</strong> : null}
            {lines.length > 1 && /^\d+\.\s/.test(lines[0]) ? lines.slice(1).join("\n") : b}
          </p>
        );
      })}
    </div>
  );
}

export function PolicyPage({ slug, data }: { slug: PolicySlug; data: ContentResponse }) {
  const p = data.content.policies[slug];
  return (
    <div className="w-full px-4 py-8 sm:px-6 sm:py-12 lg:px-10 xl:px-14">
      <Kicker>Policy</Kicker>
      <h1 className="mt-3 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">{p.title}</h1>
      {p.published ? (
        <>
          {p.updatedAt && <p className="mt-2 font-mono text-[12px] text-[#5b584f]">Last updated {new Date(p.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>}
          <div className="mt-8 max-w-4xl border-t-2 border-[#15181d] pt-8"><Body text={p.body} /></div>
        </>
      ) : (
        <p className="mt-8 max-w-4xl border-l-4 border-[#d6281f] bg-white px-4 py-4 text-[16px] leading-relaxed">
          This policy has not been published yet. It will be published before registrations open and before any payment is accepted.
        </p>
      )}
      <Link to="/competition" className={`${btnSecondary} mt-10`}><ArrowLeft size={16} aria-hidden="true" /> Back to the event</Link>
    </div>
  );
}
