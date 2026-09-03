import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound, type SoundName } from '@/lib/sound';

/**
 * Every variant resolves through semantic tokens, so a button never knows which theme
 * or mode it is rendering under. `bg-primary text-primary-on` is a contrast guarantee
 * the generator already proved, in all twelve palettes.
 */
const buttonVariants = cva(
  cn(
    'relative inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md',
    'font-medium transition-colors duration-fast ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    // Disabled must be obvious AND non-interactive: opacity alone still looks clickable.
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0'
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-on shadow-low hover:bg-primary/90 active:bg-primary/95',
        secondary: 'bg-surface-2 text-fg shadow-low ring-1 ring-inset ring-line hover:bg-surface-3',
        outline: 'bg-transparent text-fg ring-1 ring-inset ring-line-strong hover:bg-surface-2',
        ghost: 'bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
        danger: 'bg-danger text-danger-on shadow-low hover:bg-danger/90',
        soft: 'bg-primary-soft text-primary-soft-fg ring-1 ring-inset ring-primary-line/50 hover:bg-primary-soft/70',
        link: 'bg-transparent text-primary-fg underline-offset-4 hover:underline',
      },
      size: {
        // 44px minimum on the touch-sized variants; `icon` keeps a square hit area even
        // when the glyph inside it is 16px.
        xs: 'h-7 px-2 text-xs [&_svg]:size-3.5',
        sm: 'h-8 px-2.5 text-sm [&_svg]:size-4',
        md: 'h-9 px-3.5 text-base [&_svg]:size-4',
        lg: 'h-11 px-5 text-md [&_svg]:size-[18px]',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-7 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Label shown in place of the children while `loading`. Keeps the button from going mute. */
  loadingText?: string;
  /** Set to `null` for a silent button (e.g. one inside a rapidly-repeating list). */
  sound?: SoundName | null;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    sound = 'tap',
    disabled,
    onClick,
    children,
    ...props
  },
  ref
) {
  const reduced = useReducedMotion();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sound) playSound(sound);
    onClick?.(e);
  };

  const content = loading ? (
    <>
      <Loader2 className="animate-spin" aria-hidden="true" />
      {loadingText ?? children}
    </>
  ) : (
    children
  );

  if (asChild) {
    return (
      <Slot ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      // Announces the pending state to screen readers, which cannot see the spinner.
      aria-busy={loading || undefined}
      onClick={handleClick}
      // Scale-on-press, not translate: it gives tactile feedback without moving the
      // element's layout box, so neighbouring content never jitters.
      whileTap={reduced || disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 700, damping: 30 }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {content}
    </motion.button>
  );
});

export { buttonVariants };
