import { useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Field, Label } from '@/components/ui/input';
import { CheckboxField } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { CATEGORY_LIST, type Item } from '@/mock/data';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

/**
 * Create / edit an item.
 *
 * The rules this form is built to, all of which have bitten before:
 *
 *  - Errors appear on BLUR, not on every keystroke. Telling someone they are wrong while
 *    they are still typing is telling them off for not having finished.
 *  - The submit button is never disabled for invalid input. A disabled button with no
 *    visible error is a dead end — the user cannot tell what is missing. Clicking reveals
 *    every error and moves focus to the first invalid field instead.
 *  - Anti double-click needs a synchronous ref as well as state, because React state does
 *    not update fast enough to block the second click of a fast double.
 *  - Failure shows a red message INSIDE the dialog, which stays open. Backend errors are
 *    long and there is no time to read one in a toast.
 */

const LIMITS = { name: 50, sku: 20, bin: 12, uom: 8 } as const;

export interface ItemDraft {
  name: string;
  sku: string;
  category: string;
  uom: string;
  onHand: number;
  minStock: number;
  bin: string;
  unitCost: number;
  serialized: boolean;
  reserved: number;
}

type Errors = Partial<Record<keyof ItemDraft, string>>;

const blank = (): ItemDraft => ({
  name: '',
  sku: '',
  category: CATEGORY_LIST[0]!,
  uom: 'ea',
  onHand: 0,
  minStock: 0,
  bin: '',
  unitCost: 0,
  serialized: false,
  reserved: 0,
});

/** Pure, so the same rules drive both what is shown and whether submit may proceed. */
function computeErrors(d: ItemDraft): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = 'Enter a name so the item can be found later.';
  else if (d.name.length > LIMITS.name) e.name = `Keep it under ${LIMITS.name} characters.`;

  if (!d.sku.trim()) e.sku = 'Every item needs a SKU — it is how the floor identifies it.';
  else if (!/^[A-Za-z0-9-]+$/.test(d.sku)) e.sku = 'Letters, digits and hyphens only.';

  if (!d.uom.trim()) e.uom = 'Enter a unit (ea, box, kg…).';
  if (!d.bin.trim()) e.bin = 'Enter the bin where this item lives.';
  if (d.minStock < 0) e.minStock = 'Cannot be negative.';
  if (d.onHand < 0) e.onHand = 'Cannot be negative.';
  return e;
}

/** Digits only, and never negative. `min={0}` alone does not survive a paste. */
const digits = (v: string) => Number(v.replace(/[^0-9]/g, '') || 0);
const NUMERIC_BLOCKED = ['e', 'E', '+', '-', '.', ','];

export function ItemFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. */
  initial?: Item;
  onSubmit: (draft: ItemDraft) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<ItemDraft>(blank);
  const [touched, setTouched] = useState<Set<keyof ItemDraft>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const editing = !!initial;

  useEffect(() => {
    if (!open) return;
    setDraft(
      initial
        ? {
            name: initial.name,
            sku: initial.sku,
            category: initial.category,
            uom: initial.uom,
            onHand: initial.onHand,
            minStock: initial.minStock,
            bin: initial.bin,
            unitCost: initial.unitCost,
            serialized: initial.serialized,
            reserved: initial.reserved,
          }
        : blank()
    );
    setTouched(new Set());
    setAttempted(false);
    setFailure(null);
  }, [open, initial]);

  const allErrors = computeErrors(draft);
  // A field's error is hidden until the user has left it — unless they have already tried
  // to submit, at which point everything that is wrong must be visible at once.
  const visible = (f: keyof ItemDraft) => (attempted || touched.has(f) ? allErrors[f] : undefined);
  const set = <K extends keyof ItemDraft>(k: K, v: ItemDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const blur = (f: keyof ItemDraft) => setTouched((t) => new Set(t).add(f));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;

    if (Object.keys(allErrors).length > 0) {
      setAttempted(true);
      // Reveal, then land the caret on the first thing that needs fixing.
      window.requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFailure(null);
    try {
      await Promise.resolve(onSubmit(draft));
      onOpenChange(false);
      toast.success(editing ? 'Item updated' : 'Item created', `${draft.name} · ${draft.sku}`);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Could not save the item. Try again.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open} size="lg">
        <form ref={formRef} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader
            title={editing ? 'Edit item' : 'New item'}
            description={
              editing
                ? 'Changes apply to every warehouse holding this SKU.'
                : 'Add a SKU to Plant North and set its reorder point.'
            }
            icon={
              <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg">
                <Package className="size-4" aria-hidden="true" />
              </span>
            }
          />

          <DialogBody className="space-y-4">
            {failure && <Alert tone="danger" title="Could not save">{failure}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="it-name" label="Name" required error={visible('name')}>
                  {(aria) => (
                    <div className="relative">
                      <Input
                        {...aria}
                        value={draft.name}
                        maxLength={LIMITS.name}
                        onChange={(e) => set('name', e.target.value)}
                        onBlur={() => blur('name')}
                        placeholder="Hex Bolt M12"
                        className="pr-14"
                      />
                      <span
                        className={cn(
                          'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-2xs tabular',
                          draft.name.length >= LIMITS.name ? 'font-semibold text-danger-fg' : 'text-fg-subtle'
                        )}
                      >
                        {draft.name.length}/{LIMITS.name}
                      </span>
                    </div>
                  )}
                </Field>
              </div>

              <Field id="it-sku" label="SKU" required error={visible('sku')} hint="Letters, digits and hyphens.">
                {(aria) => (
                  <Input
                    {...aria}
                    value={draft.sku}
                    maxLength={LIMITS.sku}
                    onChange={(e) => set('sku', e.target.value.toUpperCase())}
                    onBlur={() => blur('sku')}
                    placeholder="AX-4102-B14"
                    className="font-mono"
                  />
                )}
              </Field>

              <div className="space-y-1.5">
                <Label htmlFor="it-category">Category</Label>
                <select
                  id="it-category"
                  value={draft.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="h-9 w-full rounded-md border border-line bg-surface-3 px-2 text-base text-fg transition-colors hover:border-line-strong focus:border-primary-line focus:outline-none focus:ring-2 focus:ring-ring/35"
                >
                  {CATEGORY_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <Field id="it-bin" label="Bin" required error={visible('bin')}>
                {(aria) => (
                  <Input
                    {...aria}
                    value={draft.bin}
                    maxLength={LIMITS.bin}
                    onChange={(e) => set('bin', e.target.value.toUpperCase())}
                    onBlur={() => blur('bin')}
                    placeholder="B-14-3"
                    className="font-mono"
                  />
                )}
              </Field>

              <Field id="it-uom" label="Unit of measure" required error={visible('uom')}>
                {(aria) => (
                  <Input
                    {...aria}
                    value={draft.uom}
                    maxLength={LIMITS.uom}
                    onChange={(e) => set('uom', e.target.value)}
                    onBlur={() => blur('uom')}
                    placeholder="ea"
                  />
                )}
              </Field>

              <Field id="it-onhand" label="On hand" error={visible('onHand')}>
                {(aria) => (
                  <Input
                    {...aria}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={draft.onHand}
                    onChange={(e) => set('onHand', digits(e.target.value))}
                    onBlur={() => blur('onHand')}
                    onKeyDown={(e) => {
                      if (NUMERIC_BLOCKED.includes(e.key)) e.preventDefault();
                    }}
                    // A scroll wheel over a focused number input silently changes stock.
                    onWheel={(e) => e.currentTarget.blur()}
                    className="font-mono tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                )}
              </Field>

              <Field
                id="it-min"
                label="Reorder point"
                error={visible('minStock')}
                hint="Below this, the item is flagged low."
              >
                {(aria) => (
                  <Input
                    {...aria}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={draft.minStock}
                    onChange={(e) => set('minStock', digits(e.target.value))}
                    onBlur={() => blur('minStock')}
                    onKeyDown={(e) => {
                      if (NUMERIC_BLOCKED.includes(e.key)) e.preventDefault();
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="font-mono tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                )}
              </Field>

              <Field id="it-cost" label="Unit cost" hint="USD.">
                {(aria) => (
                  <Input
                    {...aria}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={draft.unitCost}
                    onChange={(e) => set('unitCost', Math.max(0, Number(e.target.value) || 0))}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="font-mono tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                )}
              </Field>

              <div className="sm:col-span-2">
                <CheckboxField
                  id="it-serialized"
                  label="Track unit by unit"
                  hint="Each unit gets its own serial number and warranty record."
                  checked={draft.serialized}
                  onCheckedChange={(c) => set('serialized', c === true)}
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              sound="close"
            >
              Cancel
            </Button>
            {/* Never disabled on invalid — clicking is what reveals what is wrong. */}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              loadingText={editing ? 'Saving…' : 'Creating…'}
              sound={null}
            >
              {editing ? 'Save changes' : 'Create item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
