import { useEffect } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Check, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';
import { DUR, EASE, softSpring } from '@/lib/motion';

/**
 * Toasts.
 *
 * Hand-rolled rather than pulled from a library because the two behaviours that matter
 * are the ones libraries tend to get wrong for an ERP:
 *
 *  - An UNDO toast must outlive the action it undoes. Destructive work is committed when
 *    the toast expires, not when the button is clicked, so the timer is the transaction.
 *  - Hovering the stack pauses every timer. Reaching for "Undo" and having the toast
 *    vanish from under the cursor is the single most infuriating thing a toast can do.
 *
 * The viewport is `aria-live="polite"` and never steals focus.
 */

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds. `null` keeps it until dismissed. */
  duration: number | null;
  action?: { label: string; onClick: () => void };
  /** Runs when the toast expires WITHOUT the action being taken. The commit point. */
  onExpire?: () => void;
}

interface ToastState {
  toasts: Toast[];
  paused: boolean;
  push: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number | null }) => string;
  dismiss: (id: string, viaAction?: boolean) => void;
  setPaused: (paused: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2);

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  paused: false,

  push: ({ duration = 5000, ...rest }) => {
    const id = uid();
    playSound(rest.tone === 'danger' ? 'error' : rest.tone === 'success' ? 'success' : 'notify');
    // Cap the stack. Six toasts is not information, it is a wall.
    set((s) => ({ toasts: [...s.toasts, { id, duration, ...rest }].slice(-4) }));
    return id;
  },

  dismiss: (id, viaAction = false) => {
    const toast = get().toasts.find((t) => t.id === id);
    // Expiry commits; taking the action cancels the commit. Getting this backwards is
    // how an "Undo" toast silently deletes the thing you just rescued.
    if (toast && !viaAction) toast.onExpire?.();
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  setPaused: (paused) => set({ paused }),
}));

/** Convenience wrappers so call sites read as intent, not as configuration. */
export const toast = {
  success: (title: string, description?: string) =>
    useToasts.getState().push({ tone: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToasts.getState().push({ tone: 'danger', title, description, duration: 8000 }),
  warning: (title: string, description?: string) =>
    useToasts.getState().push({ tone: 'warning', title, description }),
  info: (title: string, description?: string) =>
    useToasts.getState().push({ tone: 'info', title, description }),
  undo: (title: string, opts: { description?: string; onUndo: () => void; onCommit: () => void }) => {
    const id = useToasts.getState().push({
      tone: 'neutral',
      title,
      description: opts.description,
      duration: 6000,
      onExpire: opts.onCommit,
      action: {
        label: 'Undo',
        onClick: () => {
          opts.onUndo();
          useToasts.getState().dismiss(id, true);
        },
      },
    });
    return id;
  },
};

const ICON: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  neutral: Info,
  info: Info,
  success: Check,
  warning: AlertTriangle,
  danger: XCircle,
};

const TONE: Record<ToastTone, { ring: string; icon: string; bar: string }> = {
  neutral: { ring: 'ring-line', icon: 'text-fg-muted', bar: 'bg-fg-subtle' },
  info: { ring: 'ring-info-line/60', icon: 'text-info-fg', bar: 'bg-info' },
  success: { ring: 'ring-success-line/60', icon: 'text-success-fg', bar: 'bg-success' },
  warning: { ring: 'ring-warning-line/60', icon: 'text-warning-fg', bar: 'bg-warning' },
  danger: { ring: 'ring-danger-line/60', icon: 'text-danger-fg', bar: 'bg-danger' },
};

function ToastCard({ toast: t }: { toast: Toast }) {
  const { dismiss, paused } = useToasts();
  const reduced = useReducedMotion();
  const Icon = ICON[t.tone];
  const tone = TONE[t.tone];

  useEffect(() => {
    if (t.duration === null || paused) return;
    const id = window.setTimeout(() => dismiss(t.id), t.duration);
    return () => window.clearTimeout(id);
    // Re-running on `paused` restarts the full duration rather than resuming the
    // remainder. That is deliberately generous: erring towards more time to hit Undo.
  }, [t.id, t.duration, paused, dismiss]);

  return (
    <motion.li
      layout
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96, transition: { duration: DUR.fast, ease: EASE } }}
      transition={softSpring}
      className={cn(
        'pointer-events-auto relative w-80 overflow-hidden rounded-lg bg-surface shadow-pop ring-1',
        tone.ring
      )}
    >
      <div className="flex items-start gap-2.5 p-3">
        <Icon className={cn('mt-0.5 size-4 shrink-0', tone.icon)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{t.title}</p>
          {t.description && <p className="mt-0.5 text-xs text-fg-muted">{t.description}</p>}
          {t.action && (
            <button
              type="button"
              onClick={() => {
                playSound('tap');
                t.action!.onClick();
              }}
              className="mt-2 rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold text-primary-fg ring-1 ring-inset ring-line transition-colors duration-fast hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => dismiss(t.id, true)}
          aria-label={`Dismiss: ${t.title}`}
          className="-m-1 grid size-6 shrink-0 place-items-center rounded text-fg-subtle transition-colors duration-fast hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* A visible timer. When the countdown IS the commit, hiding it is dishonest. */}
      {t.duration !== null && (
        <motion.div
          key={`${t.id}-${paused}`}
          className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left', tone.bar)}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: paused ? 1 : 0 }}
          transition={{ duration: paused ? 0 : t.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.li>
  );
}

export function Toaster() {
  const { toasts, setPaused } = useToasts();

  return (
    <ul
      // Announced, but never focus-stealing. A toast that grabs focus interrupts typing.
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </ul>
  );
}
