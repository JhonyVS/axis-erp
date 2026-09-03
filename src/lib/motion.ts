import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion vocabulary. Components import from here rather than typing durations
 * inline, so the whole product moves with one rhythm — and so a single edit re-times it.
 *
 * The values mirror the CSS custom properties in globals.css; framer-motion cannot read
 * those, so this is the one place where the two systems are kept in sync by hand.
 */
export const DUR = { fast: 0.12, normal: 0.19, slow: 0.28 } as const;

export const EASE = [0.22, 1, 0.36, 1] as const;

export const spring: Transition = { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 };
export const softSpring: Transition = { type: 'spring', stiffness: 280, damping: 30 };

/**
 * Exit is faster than enter (~65%). Arrival can afford to be graceful; departure that
 * takes as long as arrival reads as lag, because the user has already moved on.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.normal, ease: EASE } },
  exit: { opacity: 0, y: -4, transition: { duration: DUR.fast, ease: EASE } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 6 },
  show: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit: { opacity: 0, scale: 0.98, y: 2, transition: { duration: DUR.fast, ease: EASE } },
};

/**
 * Container for staggered lists. 40ms per child reads as a wave; below ~25ms it looks
 * simultaneous, above ~70ms the last row feels late.
 *
 * Note there is no overshoot here on purpose: `back.out` style springs look sloppy on
 * dense informational rows, however good they feel on marketing cards.
 */
export const stagger = (each = 0.04, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: delay } },
});

/** Route transitions: forward moves content up-and-in, matching the nav direction. */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.normal, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: DUR.fast, ease: EASE } },
};
