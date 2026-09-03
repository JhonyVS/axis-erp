import { cn } from '@/lib/utils';

/**
 * Icons that answer the PRESS, not the cursor.
 *
 * The published animated-icon collections (pqoqubbw/lucide-animated and the rest) all
 * animate on hover, which is the wrong trigger for this product for two reasons: a
 * warehouse tablet has no hover at all, and on a desktop hover fires while the person is
 * still deciding — so the icon reacts to a cursor merely passing over it and stops meaning
 * anything. A press is unambiguous: it happened because someone did it on purpose.
 *
 * Everything here is driven by the BUTTON's `:active` state through Tailwind's `group-*`
 * variants, never by the icon's own pointer events. That is not a stylistic choice:
 * `buttonVariants` sets `[&_svg]:pointer-events-none`, so the glyph never receives a
 * pointer event at all — and it should not, because pressing the far corner of a button
 * is the same press as pressing its icon and must look the same.
 *
 * Being CSS rather than JS also means `prefers-reduced-motion` is already handled: the
 * global rule in `globals.css` collapses every transition to 0.01ms, so a reduced-motion
 * user gets the final state instantly, which is exactly the required degradation. There
 * is no `useReducedMotion()` here because there is no JS-driven animation to guard.
 *
 * Durations come from the `duration-*` scale, which resolves to the `--dur-*` custom
 * properties — the same tokens `motion.ts` mirrors for the framer-motion side.
 *
 * Note what is NOT here: a wrapper that adds press feedback to an arbitrary icon. It does
 * not need to exist. `buttonVariants` scales any descendant svg on `:active`, so every
 * icon in every button already answers a press with no per-site work, and a non-button
 * group needs exactly one class (see the sidebar). These components are only for the
 * cases where the movement has to mean something more specific than "pressed".
 */

/** Lucide's own drawing parameters. Matching them is what keeps these in the same set. */
const SVG = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/* ------------------------------------------------------------------ *
 * The bespoke ones: an animation that carries the verb
 * ------------------------------------------------------------------ */

/**
 * Trash, whose lid lifts as you press.
 *
 * The lid is the only part that moves, which is the whole argument for hand-writing these
 * rather than dropping in a wrapper: the movement has to belong to the thing the button
 * does. A trash can whose lid opens says "this will be put away"; the same icon scaled
 * down by 12% says nothing at all.
 *
 * `origin-[20%_30%]` puts the pivot at the hinge end of the lid, so it rotates open
 * instead of sliding off.
 */
export function TrashPress({ className }: { className?: string }) {
  return (
    <svg {...SVG} className={className}>
      {/* Body and contents: still. */}
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />

      {/* Lid: the bar and its handle, lifting together. */}
      <g
        className={cn(
          'origin-[20%_30%] transition-transform duration-normal ease-out',
          'group-active:-translate-y-[1.5px] group-active:-rotate-[14deg]'
        )}
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </g>
    </svg>
  );
}

/**
 * Refresh, which turns a sixth of a revolution under the press.
 *
 * Deliberately a nudge and not a spin. A full rotation on press competes with the spinner
 * that appears when the refresh actually starts, and two spinning things at once read as
 * a bug. This one says "it moved"; the loading state says "it is working".
 */
export function RefreshPress({ className }: { className?: string }) {
  return (
    <svg
      {...SVG}
      className={cn(
        'transition-transform duration-normal ease-out group-active:rotate-[60deg]',
        className
      )}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

/**
 * A check that DRAWS itself rather than appearing.
 *
 * `pathLength={1}` renormalises the path to a length of 1 whatever its real geometry, so
 * the dash offset is a plain 1 → 0 and nobody has to measure the stroke or re-measure it
 * when the glyph changes. It is the one trick worth stealing from every draw-on icon
 * implementation.
 *
 * Two triggers on purpose:
 *  - uncontrolled, it draws while pressed and retracts on release — press feedback;
 *  - pass `checked`, and it stays drawn, which is the version that means "done".
 *
 * The drawn state is the DEFAULT when the prop is present, so a reduced-motion user, who
 * gets the transition collapsed to nothing, still sees a check and not an empty box.
 */
export function CheckPress({ checked, className }: { checked?: boolean; className?: string }) {
  return (
    <svg {...SVG} className={className}>
      <path
        d="M20 6 9 17l-5-5"
        pathLength={1}
        strokeDasharray={1}
        className={cn(
          'transition-[stroke-dashoffset] duration-normal ease-out',
          checked ? '[stroke-dashoffset:0]' : '[stroke-dashoffset:1] group-active:[stroke-dashoffset:0]'
        )}
      />
    </svg>
  );
}
