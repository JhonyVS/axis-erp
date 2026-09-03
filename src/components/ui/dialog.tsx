import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';
import { DUR, EASE, spring } from '@/lib/motion';

/**
 * Radix owns the hard parts — focus trap, scroll lock, `Escape`, `aria-modal`, restoring
 * focus to the trigger on close. Framer Motion owns only the transition, via `forceMount`
 * + `AnimatePresence` so the exit animation gets to finish before Radix unmounts.
 *
 * Layout note, learned the expensive way: the panel is centred by a full-screen FLEX
 * wrapper, never by `left-1/2 -translate-x-1/2`. Framer Motion writes its own `transform`
 * on the elements it animates, which silently overwrites Tailwind's translate utilities
 * and parks the dialog in the bottom-right quadrant.
 */

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const handleChange = (next: boolean) => {
    playSound(next ? 'open' : 'close');
    onOpenChange(next);
  };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  open,
  className,
  children,
  size = 'md',
}: {
  open: boolean;
  className?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const reduced = useReducedMotion();
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              // The scrim exists to isolate the dialog, not to decorate it: the blur is
              // what signals "the thing behind is dismissed", per Apple HIG.
              className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: DUR.fast } }}
              transition={{ duration: DUR.normal, ease: EASE }}
            />
          </DialogPrimitive.Overlay>

          <DialogPrimitive.Content asChild forceMount>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className={cn(
                  'pointer-events-auto flex max-h-[88vh] w-full flex-col overflow-hidden',
                  'rounded-xl border border-line bg-surface shadow-pop',
                  width,
                  className
                )}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985, y: 4, transition: { duration: DUR.fast, ease: EASE } }}
                transition={reduced ? { duration: 0.01 } : spring}
              >
                {children}
              </motion.div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

/**
 * No close X in the corner. Dialogs are dismissed by their explicit Cancel/Close button
 * in the footer (plus Escape and outside-click when the dialog is not blocking), so the
 * way out is always a labelled control rather than a bare glyph.
 */
export function DialogHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-5 py-4">
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0">
        <DialogPrimitive.Title className="text-md font-semibold tracking-tight">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">
            {description}
          </DialogPrimitive.Description>
        )}
      </div>
    </div>
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-4', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3',
        className
      )}
      {...props}
    />
  );
}

export const DialogClose = DialogPrimitive.Close;
