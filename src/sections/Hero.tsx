import React from "react";
import { motion } from "motion/react";
import { heroStagger, heroItem, heroNameLine } from "../lib/motion-variants";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Github, Linkedin, Mail, ArrowDown } from "lucide-react";

const SKILL_TAGS = [
  "Flutter Developer",
  "AI Mobile Apps",
  "Computer Vision",
  "Firebase",
  "REST APIs",
];

const FLOATING_ORBS = [
  { size: 280, x: "8%", y: "18%", delay: 0, duration: 9 },
  { size: 200, x: "78%", y: "62%", delay: 1.5, duration: 11 },
  { size: 140, x: "62%", y: "12%", delay: 0.8, duration: 8 },
];

export const Hero = () => {
  return (
    <section id="home" className="hero-section">
      <div className="hero-bg">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-lighten"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1669729026928-36afe1390851?auto=format&fit=crop&q=80&w=2000')`,
          }}
        />

        {FLOATING_ORBS.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-500/10 blur-3xl"
            style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
            animate={{
              y: [0, -24, 0],
              x: [0, i % 2 === 0 ? 12 : -12, 0],
              opacity: [0.35, 0.6, 0.35],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: orb.delay,
            }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.85, rotate: -5 }}
          animate={{
            opacity: 0.5,
            scale: 1,
            rotate: 0,
            y: [0, -14, 0],
          }}
          transition={{
            opacity: { duration: 3.5, ease: "easeOut" },
            scale: { duration: 3.5, ease: "easeOut" },
            rotate: { duration: 3.5, ease: "easeOut" },
            y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          }}
          className="hero-moon"
        >
          <div className="relative w-full h-full">
            <div
              className="absolute inset-0 z-10"
              style={{
                background: "radial-gradient(circle at 50% 50%, transparent 20%, black 85%)",
                mixBlendMode: "multiply",
              }}
            />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1760117144211-f734f9776595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsaXN0aWMlMjBkYXJrJTIwbW9vbiUyMHNwYWNlJTIwaGlnaCUyMHJlc29sdXRpb258ZW58MXx8fHwxNzcwMjA2NDc1fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Moon Background"
              className="w-full h-full object-contain grayscale brightness-110 contrast-125 select-none pointer-events-none mix-blend-screen"
            />
            <motion.div
              className="absolute inset-0 bg-cyan-500/10 blur-[150px] rounded-full mix-blend-color-dodge"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/10 to-black opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-60" />
      </div>

      <motion.div
        variants={heroStagger}
        initial="initial"
        animate="animate"
        className="hero-content"
      >
        <motion.div variants={heroItem} className="hero-badge">
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-cyan-500/20 text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400"
            animate={{
              boxShadow: [
                "0 0 0px rgba(34,211,238,0)",
                "0 0 20px rgba(34,211,238,0.15)",
                "0 0 0px rgba(34,211,238,0)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Available for Projects
          </motion.span>
        </motion.div>

        <motion.div variants={heroItem} className="hero-name-wrap">
          <motion.h1
            className="relative text-[4.2rem] sm:text-[7.5rem] md:text-9xl lg:text-[11.5rem] font-black tracking-tighter text-white leading-[0.75] italic uppercase select-none"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.18, delayChildren: 0.55 } },
            }}
          >
            <motion.span
              variants={heroNameLine}
              className="block mb-2 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
              Abuzar
            </motion.span>
            <motion.span
              variants={heroNameLine}
              className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white/80 to-cyan-500 drop-shadow-[0_0_60px_rgba(34,211,238,0.2)]"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            >
              Khan
            </motion.span>
          </motion.h1>
        </motion.div>

        <motion.div variants={heroItem} className="hero-tags">
          {SKILL_TAGS.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1 + i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{ scale: 1.05, borderColor: "rgba(34,211,238,0.5)" }}
              className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/70"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

        <motion.p variants={heroItem} className="hero-description">
          I build high-performance Flutter applications that integrate Artificial Intelligence,
          Computer Vision, Camera Processing, and Cloud APIs to solve real-world retail and
          fashion problems.
        </motion.p>

        <motion.div variants={heroItem} className="hero-actions">
          <motion.button
            onClick={() =>
              document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
            }
            whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(34,211,238,0.25)" }}
            whileTap={{ scale: 0.96 }}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-full cursor-pointer group"
          >
            View Projects
            <motion.span
              animate={{ y: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowDown size={13} />
            </motion.span>
          </motion.button>

          <motion.button
            onClick={() =>
              document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
            }
            whileHover={{ scale: 1.04, borderColor: "rgba(34,211,238,0.6)", color: "#22d3ee" }}
            whileTap={{ scale: 0.96 }}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.06] border border-white/20 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-sm cursor-pointer"
          >
            Contact Me
          </motion.button>
        </motion.div>

        <motion.div variants={heroItem} className="hero-social">
          {[
            { href: "https://github.com/Abuzar7024", Icon: Github, hover: "#fff" },
            {
              href: "https://www.linkedin.com/in/abuzar-khan7024/",
              Icon: Linkedin,
              hover: "#60a5fa",
            },
            { href: "mailto:abuzxarrr87@gmail.com", Icon: Mail, hover: "#22d3ee" },
          ].map(({ href, Icon, hover }) => (
            <motion.a
              key={href}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-white/20"
              whileHover={{ scale: 1.2, y: -4, color: hover }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Icon size={28} />
            </motion.a>
          ))}
        </motion.div>
      </motion.div>

      <div className="hero-bottom-spacer" aria-hidden="true" />
    </section>
  );
};
