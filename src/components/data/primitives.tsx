import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { useUi } from '@/stores/uiStore';
import { DUR, EASE, fadeUp } from '@/lib/motion';

/* ------------------------------------------------------------------ *
 * Page header
 * ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
  aiPrompt,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Offers the assistant a question already scoped to this page. */
  aiPrompt?: string;
}) {
  const askAi = useUi((s) => s.askAi);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 pb-1">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {/* Capped measure: a description that runs the full width of a 1920px monitor is
            physically hard to read back to the start of the next line. */}
        {description && <p className="mt-1 max-w-prose text-sm text-fg-muted">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {aiPrompt && (
          <Button variant="ghost" size="sm" onClick={() => askAi(aiPrompt)}>
            <Sparkles />
            Ask AI
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Stat card
 * ------------------------------------------------------------------ */

/**
 * Counts up to its value on mount.
 *
 * The animation is not decoration: a number that arrives by counting draws the eye to the
 * cards that changed. It is skipped entirely under reduced motion, and the final value is
 * rendered immediately rather than after a delay.
 */
function useCountUp(value: number, enabled: boolean) {
  const [display, setDisplay] = React.useState(enabled ? 0 : value);

  React.useEffect(() => {
    if (!enabled) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 620;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic: fast at the start where the change is informative, settling at
      // the end where precision matters.
      setDisplay(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, enabled]);

  return display;
}

export function StatCard({
  label,
  value,
  format = (n) => String(Math.round(n)),
  delta,
  tone = 'neutral',
  icon,
  loading,
  hint,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  /** Percentage change vs the previous period. */
  delta?: number;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  hint?: string;
}) {
  const reduced = useReducedMotion();
  const display = useCountUp(value, !reduced && !loading);

  if (loading) {
    return (
      <Card className="p-3.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2.5 h-7 w-24" />
        <Skeleton className="mt-2 h-3 w-16" />
      </Card>
    );
  }

  const toneRing = {
    neutral: 'text-fg-subtle',
    success: 'text-success-fg',
    warning: 'text-warning-fg',
    danger: 'text-danger-fg',
  }[tone];

  // Direction is carried by an ARROW as well as by colour — red and green alone are the
  // classic failure for the ~8% of men with a red/green deficiency.
  const DeltaIcon = delta === undefined ? Minus : delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const deltaTone =
    delta === undefined || delta === 0 ? 'text-fg-subtle' : delta > 0 ? 'text-success-fg' : 'text-danger-fg';

  return (
    <motion.div variants={fadeUp}>
      <Card className="group p-3.5 transition-shadow duration-normal hover:shadow-mid">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-xs font-medium text-fg-muted">{label}</p>
          {icon && <span className={cn('shrink-0 [&_svg]:size-4', toneRing)}>{icon}</span>}
        </div>

        <p className="mt-1.5 font-mono text-2xl font-semibold tabular leading-none tracking-tight">
          {format(display)}
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-2xs">
          {delta !== undefined && (
            <span className={cn('flex items-center gap-0.5 font-medium', deltaTone)}>
              <DeltaIcon className="size-3" aria-hidden="true" />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && <span className="truncate text-fg-subtle">{hint}</span>}
        </div>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Empty state
 * ------------------------------------------------------------------ */

/**
 * "Nothing here" and "nothing MATCHES" are different problems with different fixes, so
 * they are different states with different copy and different buttons. Showing one
 * message for both leaves a user with active filters hunting for data that is right there.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.normal, ease: EASE }}
      className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-fg-subtle [&_svg]:size-5">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-fg">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      </div>
      {action}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Section
 * ------------------------------------------------------------------ */

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}
