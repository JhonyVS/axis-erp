import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';
import { spring } from '@/lib/motion';

/**
 * A segmented control: two to four mutually exclusive options, all visible at once.
 *
 * Use it instead of a dropdown when the options are few and short — a `<select>` hides
 * the alternatives behind a click, which is the wrong trade when there are only three.
 *
 * The selection pill is a single shared `layoutId`, so it SLIDES between options rather
 * than cross-fading. That travel is what makes the group read as one control instead of
 * three buttons that happen to sit together.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  layoutId,
  size = 'md',
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  label: string;
  /** Must be unique per control on the page, or two pills will fight over one element. */
  layoutId: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex items-center gap-0.5 rounded-lg bg-surface-3 p-0.5 ring-1 ring-inset ring-line', className)}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              playSound('tap');
              onChange(opt.value);
            }}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium',
              'transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'sm' ? 'px-2 py-1 text-2xs [&_svg]:size-3' : 'px-2.5 py-1.5 text-xs [&_svg]:size-3.5',
              active ? 'text-fg' : 'text-fg-muted hover:text-fg'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-surface shadow-low ring-1 ring-line"
                transition={spring}
              />
            )}
            <span className="relative flex items-center gap-1.5 whitespace-nowrap">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
