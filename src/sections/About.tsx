import React from "react";
import { motion } from "motion/react";
import { fadeIn } from "../lib/motion-variants";

const highlights = [
  "Flutter & Dart",
  "AI Integration",
  "Clean Architecture",
  "Production Apps",
];

export const About = () => {
  return (
    <section id="about" className="about-section">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeIn}
        className="about-section-inner"
      >
        <p className="about-eyebrow">About Me</p>
        <h3 className="about-title">Building mobile products that scale</h3>
        <p className="about-text">
          I'm a Flutter developer focused on production-ready apps — from AI-powered features and REST API integrations to Firebase backends and polished cross-platform UI.
        </p>
        <div className="about-highlights">
          {highlights.map((item) => (
            <span key={item} className="about-highlight">{item}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
