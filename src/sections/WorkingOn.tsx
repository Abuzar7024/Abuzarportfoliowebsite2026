import React from "react";
import { motion } from "motion/react";
import { fadeIn, staggerContainer } from "../lib/motion-variants";
import { Brain, Eye, Sparkles, Camera, Database, Briefcase, Activity } from "lucide-react";

const focusItems = [
  {
    title: "AI-Powered Flutter Apps",
    icon: Brain,
    desc: "Integrating state-of-the-art AI inference pipelines directly into highly responsive mobile apps.",
    status: "Active Research",
  },
  {
    title: "Computer Vision",
    icon: Eye,
    desc: "Implementing client-side image processing, custom overlays, and real-time landmark rendering.",
    status: "In Development",
  },
  {
    title: "Virtual Try-On Systems",
    icon: Sparkles,
    desc: "Perfecting overlay pipelines to let users visualize clothing and accessories live from device feeds.",
    status: "Refining Pipeline",
  },
  {
    title: "Camera Facial Analysis",
    icon: Camera,
    desc: "Extracting attribute vectors, skin metrics, and estimations from high-frequency video frames.",
    status: "Optimizing Latency",
  },
  {
    title: "Firebase Integrations",
    icon: Database,
    desc: "Structuring real-time sync, dynamic cloud firestores, and secure tokenized authentication.",
    status: "Production Ready",
  },
  {
    title: "Enterprise Mobile Apps",
    icon: Briefcase,
    desc: "Engineering robust kiosk setups for retail environments with strict crash safety and uptime metrics.",
    status: "Active Deployment",
  },
];

export const WorkingOn = () => {
  return (
    <section id="working-on" className="working-on-section">
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeIn}
        className="working-on-header"
      >
        <div className="working-on-badge">
          <Activity size={14} className="text-cyan-400" />
          <span>Active Development</span>
        </div>
        <h3 className="working-on-title">
          Current <span className="working-on-title-accent">Build Pipeline</span>
        </h3>
        <p className="working-on-subtitle">
          Six focus areas I'm actively building, optimizing, and shipping across AI, mobile, and cloud.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="working-on-grid"
      >
        {focusItems.map((item) => (
          <motion.div key={item.title} variants={fadeIn} className="working-on-card group">
            <div className="working-on-card-glow" />

            <div className="working-on-card-icon">
              <item.icon size={22} />
            </div>

            <div className="working-on-card-body">
              <div className="working-on-card-top">
                <h4 className="working-on-card-title">{item.title}</h4>
                <span className="working-on-card-status">{item.status}</span>
              </div>
              <p className="working-on-card-desc">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
