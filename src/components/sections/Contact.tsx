import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Github, Linkedin, Mail, FileText } from "lucide-react";
import { profile } from "../../data/profile";
import { MaskLines, Rise, SectionIndex } from "../animations/Reveal";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

const CHANNELS = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}`, Icon: Mail },
  { label: "LinkedIn", value: "abuzar-khan7024", href: profile.links.linkedin, Icon: Linkedin },
  { label: "GitHub", value: profile.links.githubUser, href: profile.links.github, Icon: Github },
  { label: "Resume", value: "Download PDF", href: profile.links.resumePdf, Icon: FileText },
];

/** Closing act: large type, four ways to reach me, nothing else competing. */
export function Contact() {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const glow = useTransform(scrollYProgress, [0, 1], [0.08, 0.3]);

  return (
    <section ref={ref} id="contact" className="section relative" aria-labelledby="contact-title">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          opacity: reduced ? 0.18 : glow,
          background: "radial-gradient(70rem 40rem at 50% 100%, rgba(255,43,61,0.28), transparent 70%)",
        }}
      />

      <div className="shell">
        <SectionIndex n="07" label="Contact" />

        <h2 id="contact-title" className="mt-10">
          <span className="sr-only">Let's build something.</span>
          <MaskLines aria-hidden="true" lines={["LET'S BUILD", "SOMETHING."]} lineClassName="display" />
        </h2>

        <Rise delay={0.2}>
          <p className="t-body measure mt-8">
            Open to Flutter and mobile application roles, and to product work involving AI-integrated
            or camera-driven experiences.
          </p>
        </Rise>

        <Rise delay={0.3}>
          <ul className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map(({ label, value, href, Icon }) => (
              <li key={label} className="bg-bg">
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  data-cursor="Open"
                  className="group flex h-full flex-col justify-between gap-8 p-6 transition-colors hover:bg-white/[0.03] sm:p-7"
                >
                  <span className="flex items-center justify-between gap-3">
                    <Icon size={17} className="text-accent" aria-hidden="true" />
                    <ArrowUpRight
                      size={15}
                      className="text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      aria-hidden="true"
                    />
                  </span>
                  <span>
                    <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
                      {label}
                    </span>
                    <span className="mt-1.5 block break-words text-[15px] font-medium text-ink transition-colors group-hover:text-accent">
                      {value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Rise>

        <Rise delay={0.4}>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            {profile.location} · {profile.availability}
          </p>
        </Rise>
      </div>
    </section>
  );
}
