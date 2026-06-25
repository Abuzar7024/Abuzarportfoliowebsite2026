import React from "react";
import { motion } from "motion/react";
import { sectionReveal, tagStagger, tagItem } from "../lib/motion-variants";

const highlights = [
  "Flutter & Dart",
  "AI Integration",
  "Clean Architecture",
  "Production Apps",
  "Computer Vision",
  "REST APIs",
];

export const About = () => {
  return (
    <section id="about" className="about-section">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.4 }}
        variants={sectionReveal}
        className="about-section-inner"
      >
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.4em" }}
          whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="about-eyebrow"
        >
          About Me
        </motion.p>
        <h3 className="about-title">Building mobile products that scale</h3>
        <p className="about-text">
          I'm a Flutter developer focused on production-ready apps — from AI-powered features and REST API integrations to Firebase backends and polished cross-platform UI.
        </p>
        <motion.div
          className="about-highlights"
          variants={tagStagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.5 }}
        >
          {highlights.map((item) => (
            <motion.span
              key={item}
              variants={tagItem}
              whileHover={{ scale: 1.06, borderColor: "rgba(34,211,238,0.45)" }}
              className="about-highlight"
            >
              {item}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
