import { Variants } from "motion/react";

export const fadeIn: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

export const glassHover = {
  scale: 1.02,
  borderColor: "rgba(0, 242, 255, 0.4)",
  boxShadow: "0 0 20px rgba(0, 242, 255, 0.15)",
  transition: { duration: 0.2 }
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};
