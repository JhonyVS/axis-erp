import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * The soft fills are near-isoluminant with the surface on purpose — that is what makes
 * them read as tinted paper rather than as a second button competing for attention.
 *
 * The consequence is a hard rule, not a preference: a badge ALWAYS carries text. Colour
 * alone would be invisible to a colour-blind user and to anyone on a bright warehouse
 * floor (WCAG 1.4.1). The `dot` prop adds a shape cue on top of the label, never instead.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-2xs font-medium ring-1 ring-inset [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-2 text-fg-muted ring-line',
        primary: 'bg-primary-soft text-primary-soft-fg ring-primary-line/45',
        success: 'bg-success-soft text-success-soft-fg ring-success-line/45',
        warning: 'bg-warning-soft text-warning-soft-fg ring-warning-line/45',
        danger: 'bg-danger-soft text-danger-soft-fg ring-danger-line/45',
        info: 'bg-info-soft text-info-soft-fg ring-info-line/45',
        solid: 'bg-primary text-primary-on ring-transparent',
      },
      size: { sm: 'text-2xs', md: 'px-2 py-0.5 text-xs' },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  }
);

const DOT: Record<string, string> = {
  neutral: 'bg-fg-subtle',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  solid: 'bg-primary-on',
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

/**
 * forwardRef is not optional here. A Badge is routinely wrapped in a Tooltip, and Radix's
 * `asChild` triggers hand their ref to the child — a plain function component silently
 * drops it, and the tooltip never positions or opens.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, size, dot, children, ...props },
  ref
) {
  return (
    <span ref={ref} className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('size-1.5 shrink-0 rounded-full', DOT[tone ?? 'neutral'])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
});

export { badgeVariants };
