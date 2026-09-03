import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, initials } from '@/lib/utils';

/** Loading placeholder. Sized by the caller so it reserves the real element's space (CLS). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />;
}

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative
      orientation={orientation}
      className={cn(
        'shrink-0 bg-line',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}

/** A rendered key cap. Discoverability for shortcuts that would otherwise stay secret. */
export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center whitespace-nowrap rounded border border-line bg-surface-2 px-1.5 font-mono text-2xs font-medium text-fg-muted',
        className
      )}
    >
      {children}
    </kbd>
  );
}

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex size-8 shrink-0 select-none overflow-hidden rounded-full bg-primary-soft',
        className
      )}
    >
      {src && <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />}
      {/* The name is announced by the surrounding row, so the initials are decorative here. */}
      <AvatarPrimitive.Fallback
        aria-hidden="true"
        className="flex size-full items-center justify-center text-2xs font-semibold text-primary-soft-fg"
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/**
 * A meter, not a spinner: it always shows a number beside the bar, because a bar alone
 * conveys its value through length only — which is a colour/shape-only signal for anyone
 * using a screen reader.
 */
export function Progress({
  value,
  label,
  tone = 'primary',
  className,
  displayValue,
}: {
  /** Bar length, 0-100. Clamped. */
  value: number;
  label?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  /**
   * The number to PRINT, when it differs from the bar length.
   *
   * A bar that saturates at 100% makes "exactly at the reorder point" and "ten times the
   * reorder point" look identical. Clamping the bar is right — it has finite width — but
   * clamping the label throws the information away. So the bar clamps and the label tells
   * the truth.
   */
  displayValue?: number;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const shown = displayValue ?? clamped;
  const fill = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }[tone];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(shown)}
        aria-valuetext={`${Math.round(shown)}%`}
        aria-valuemin={0}
        aria-valuemax={Math.max(100, Math.round(shown))}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-slow ease-out', fill)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-11 shrink-0 text-right font-mono text-2xs tabular text-fg-muted">
        {Math.round(shown)}%
      </span>
    </div>
  );
}
