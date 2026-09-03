import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from './dialog';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * Destructive confirmation.
 *
 * The confirm button ARMS on a short delay instead of being clickable immediately. The
 * failure it prevents is specific and common: a user double-clicks the row's delete
 * button, the second click lands on the freshly-mounted dialog's confirm, and the record
 * is gone without anyone having read a word.
 *
 * The countdown is drawn inside the button, so the wait is visible rather than feeling
 * like an unresponsive control. 1.2s is long enough to break the double-click and short
 * enough that a deliberate user does not notice it.
 */
const ARM_MS = 1200;

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  detail,
  confirmLabel = 'Delete',
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** What actually happens — say it plainly, including what is NOT destroyed. */
  detail?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [remaining, setRemaining] = useState(ARM_MS);

  useEffect(() => {
    if (!open) {
      setArmed(false);
      setRemaining(ARM_MS);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const left = Math.max(0, ARM_MS - (now - start));
      setRemaining(left);
      if (left > 0) raf = requestAnimationFrame(tick);
      else setArmed(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open} size="sm">
        <DialogHeader
          title={title}
          description={description}
          icon={
            <span className="grid size-8 place-items-center rounded-lg bg-danger-soft text-danger-soft-fg">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </span>
          }
        />
        {detail && (
          <DialogBody>
            <p className="rounded-lg bg-surface-2 p-3 text-sm text-fg-muted ring-1 ring-inset ring-line">
              {detail}
            </p>
          </DialogBody>
        )}
        <DialogFooter>
          {/* Cancel is auto-focused, so Enter on a dialog nobody read is a no-op. */}
          <Button variant="secondary" size="sm" autoFocus onClick={() => onOpenChange(false)} sound="close">
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={!armed}
            loading={loading}
            loadingText="Deleting…"
            onClick={() => void onConfirm()}
            className="relative overflow-hidden"
            sound="error"
          >
            {/* The wait is drawn, not hidden: a sweeping fill reads as "arming", where a
                plain disabled button reads as "broken". */}
            {!armed && (
              <span
                className="absolute inset-y-0 left-0 bg-danger-on/25"
                style={{ width: `${(remaining / ARM_MS) * 100}%` }}
                aria-hidden="true"
              />
            )}
            <span className={cn('relative', !armed && 'opacity-80')}>{confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
