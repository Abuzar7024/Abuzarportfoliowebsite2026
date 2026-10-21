import React from "react";
import { toast } from "sonner";
import { ArrowUpRight, Copy, FileText, Github, Linkedin, Mail, MessageCircle } from "lucide-react";
import { profile } from "../data/profile";
import { ContactForm } from "../components/ContactForm";
import { Rise, SectionIndex } from "../components/animations/Reveal";

const CHANNELS = [
  { label: "WhatsApp", value: profile.phoneDisplay, href: `https://wa.me/${profile.whatsapp}`, Icon: MessageCircle },
  { label: "LinkedIn", value: "abuzar-khan7024", href: profile.links.linkedin, Icon: Linkedin },
  { label: "GitHub", value: profile.links.githubUser, href: profile.links.github, Icon: Github },
  { label: "Resume", value: "Download PDF", href: profile.links.resumePdf, Icon: FileText },
];

export function Contact() {
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      toast.success("Email copied to clipboard");
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section id="contact" className="section pb-40" aria-labelledby="contact-title">
      <div className="shell">
        <SectionIndex n="05" label="Contact" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <Rise>
              <h2 id="contact-title" className="text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.95]">
                Send a <span className="serif-accent text-accent-ink">signal.</span>
              </h2>
            </Rise>
            <Rise delay={0.1}>
              <p className="lead mt-6">
                Hiring for a Flutter or mobile role, planning an app, or just want to compare notes on camera-driven
                features? Write to me — I reply to every message.
              </p>
            </Rise>

            <Rise delay={0.15} className="mt-9">
              <div className="frost-solid flex items-center gap-3 p-2 pl-4">
                <Mail size={16} className="shrink-0 text-silver" aria-hidden="true" />
                <a href={`mailto:${profile.email}`} className="min-w-0 flex-1 truncate text-[15px] text-ink hover:text-accent-ink">
                  {profile.email}
                </a>
                <button type="button" onClick={copyEmail} className="btn-ghost !px-3 !py-2 text-[13px]" aria-label="Copy email address">
                  <Copy size={13} aria-hidden="true" />
                  Copy
                </button>
              </div>

              <ul className="mt-3 grid grid-cols-2 gap-3">
                {CHANNELS.map(({ label, value, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="frost-solid group flex h-full flex-col gap-4 p-4 transition-colors hover:border-line-2"
                    >
                      <span className="flex items-center justify-between">
                        <Icon size={16} className="text-silver transition-colors group-hover:text-accent-ink" aria-hidden="true" />
                        <ArrowUpRight size={14} className="text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{label}</span>
                        <span className="mt-1 block truncate text-sm text-ink">{value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <p className="mt-6 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                <span className="signal-dot" aria-hidden="true" />
                {profile.location} · {profile.availability}
              </p>
            </Rise>
          </div>

          <Rise delay={0.1}>
            <ContactForm />
          </Rise>
        </div>
      </div>
    </section>
  );
}
