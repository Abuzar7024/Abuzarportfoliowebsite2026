import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { profile } from "../../data/profile";
import { yearsOfExperience } from "../../data/experience";
import { MaskLines, Rise, SectionIndex, Stagger, StaggerItem } from "../animations/Reveal";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";

const FOCUS = [
  { k: "AI inside mobile apps", v: "Camera and vision features integrated into Flutter clients without slowing them down." },
  { k: "Kiosk & in-store software", v: "Touchscreen applications built to run all day in retail environments." },
  { k: "Payments & subscriptions", v: "Stripe, Apple In-App Purchase and Play Billing wired into real products." },
  { k: "Architecture that lasts", v: "Structure that keeps the next feature cheap and safe to add." },
];

/**
 * Editorial spread: a large statement on the left, a quiet interactive
 * geometry panel on the right. Magazine rhythm rather than a card.
 */
export function About() {
  const reduced = usePrefersReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const panelY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["8%", "-8%"]);
  const years = yearsOfExperience();

  return (
    <section ref={ref} id="about" className="section relative" aria-labelledby="about-title">
      <div className="shell">
        <SectionIndex n="01" label="About" />

        <div className="mt-10 grid grid-cols-1 gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-14">
          {/* statement */}
          <div className="lg:col-span-7">
            <h2 id="about-title" className="t-h2">
              <MaskLines
                lines={["I build mobile products", "that ship, get used,", "and keep working."]}
                lineClassName="t-h2"
              />
            </h2>

            <Rise delay={0.15} className="mt-8">
              <p className="t-body measure">{profile.summary}</p>
            </Rise>

            <Stagger className="mt-10 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2">
              {FOCUS.map((f) => (
                <StaggerItem key={f.k}>
                  <h3 className="font-display text-[15px] font-bold text-ink">{f.k}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{f.v}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* figures + geometry */}
          <div className="lg:col-span-5">
            <motion.div style={{ y: panelY }} className="lg:sticky lg:top-28">
              <div className="slab p-7 sm:p-9">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-8">
                  <div>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">Experience</dt>
                    <dd className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">
                      {years}
                      <span className="ml-1 text-lg text-accent">yrs</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">Primary stack</dt>
                    <dd className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">
                      Flutter
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">Based in</dt>
                    <dd className="mt-2 text-[15px] text-ink-2">{profile.location}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">Focus</dt>
                    <dd className="mt-2 text-[15px] text-ink-2">Mobile · AI integration</dd>
                  </div>
                </dl>

                <div className="rule my-8" />

                <p className="text-[14px] leading-relaxed text-muted">
                  Currently at Ebani Tech in Hyderabad, building Flutter applications for kiosk and mobile
                  devices and integrating Computer Vision models with real-time camera processing.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
