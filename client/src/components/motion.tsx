import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useLocation } from 'react-router';
import type { ReactNode } from 'react';

/** Shared cinematic easing (matches the CSS cubic-bezier used across the app). */
export const EASE = [0.22, 0.7, 0.25, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

/** Reveal-on-scroll wrapper (respects reduced motion via global MotionConfig). */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay } } }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Route-level crossfade — opacity only (no transform), so it never composites/
 * reflows the full page subtree mid-navigation (which janks on large/4K screens
 * and over heavy pages like the profile). Short + GPU-cheap.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
