import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';
import { DUR, EASE } from '@/lib/motion';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE: Record<AlertTone, { box: string; icon: string; Icon: React.ComponentType<{ className?: string }> }> = {
  neutral: { box: 'bg-surface-2 ring-line', icon: 'text-fg-muted', Icon: Info },
  info: { box: 'bg-info-soft ring-info-line/50', icon: 'text-info-soft-fg', Icon: Info },
  success: { box: 'bg-success-soft ring-success-line/50', icon: 'text-success-soft-fg', Icon: CheckCircle2 },
  warning: { box: 'bg-warning-soft ring-warning-line/50', icon: 'text-warning-soft-fg', Icon: AlertTriangle },
  danger: { box: 'bg-danger-soft ring-danger-line/50', icon: 'text-danger-soft-fg', Icon: XCircle },
};

/**
 * An inline banner: a persistent condition on the page, as opposed to a toast, which
 * reports something that just happened and then leaves.
 *
 * `danger` gets `role="alert"` so it is announced immediately; the quieter tones use the
 * default so a page with four informational banners does not talk over itself on load.
 * Every tone carries an ICON as well as a colour — the fills are chosen for lightness
 * proximity to the surface, so colour alone would be invisible in greyscale.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  tone?: AlertTone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const { box, icon, Icon } = TONE[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.normal, ease: EASE }}
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn('flex items-start gap-2.5 rounded-lg px-3.5 py-3 ring-1 ring-inset', box, className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-semibold', icon)}>{title}</p>
        {children && <div className={cn('mt-1 text-sm opacity-90', icon)}>{children}</div>}
        {action && <div className="mt-2.5 flex flex-wrap gap-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={() => {
            playSound('close');
            onDismiss();
          }}
          aria-label={`Dismiss: ${title}`}
          className={cn(
            '-m-1 grid size-6 shrink-0 place-items-center rounded transition-colors duration-fast',
            'hover:bg-fg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            icon
          )}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}
