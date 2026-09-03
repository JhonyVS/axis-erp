import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';
import { DUR, EASE, softSpring } from '@/lib/motion';

/**
 * A side drawer for secondary detail. It keeps the list behind it visible, which a modal
 * dialog does not — use it when the user needs to refer back to where they came from.
 *
 * Like the dialog, it carries no close X: the footer's explicit button is the way out,
 * plus Escape and outside-click.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: 'right' | 'left';
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const offset = side === 'right' ? '100%' : '-100%';

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        playSound(next ? 'open' : 'close');
        onOpenChange(next);
      }}
    >
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-bg/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                transition={{ duration: DUR.normal, ease: EASE }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed inset-y-0 z-50 flex w-full max-w-md flex-col border-line bg-surface shadow-pop',
                  side === 'right' ? 'right-0 border-l' : 'left-0 border-r'
                )}
                initial={reduced ? { opacity: 0 } : { x: offset }}
                animate={{ x: 0, opacity: 1 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { x: offset, transition: { duration: DUR.normal, ease: EASE } }
                }
                transition={softSpring}
              >
                <div className="shrink-0 border-b border-line px-5 py-4">
                  <DialogPrimitive.Title className="text-md font-semibold tracking-tight">
                    {title}
                  </DialogPrimitive.Title>
                  {description && (
                    <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

                {footer && (
                  <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3">
                    {footer}
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
