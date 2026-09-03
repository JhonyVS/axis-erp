import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  Trash2,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound, type SoundName } from '@/lib/sound';

import { PageHeader } from '@/components/data/primitives';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea, Field } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox, CheckboxField, RadioGroup, RadioField } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Segmented } from '@/components/ui/segmented';
import { Alert } from '@/components/ui/alert';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Sheet } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { Avatar, Kbd, Progress, Separator, Skeleton } from '@/components/ui/misc';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownCheckItem,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/dropdown';
import { toast } from '@/components/ui/toast';
import { stagger, fadeUp } from '@/lib/motion';

/**
 * The component gallery.
 *
 * A living page rather than a screenshot: every control here is the real component, wired
 * to real state, so hover, focus, press, disabled, loading and empty are all reachable by
 * actually using them. It doubles as the regression surface — switch theme or density
 * while this page is open and anything that hard-codes a colour or a padding shows up
 * immediately.
 */

/* ------------------------------------------------------------------ *
 * Layout helpers
 * ------------------------------------------------------------------ */

function Spec({
  title,
  note,
  children,
  id,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <motion.section variants={fadeUp} id={id} className="scroll-mt-20">
      <Card className="overflow-hidden">
        <div className="border-b border-line bg-surface-2/40 px-4 py-2.5">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {note && <p className="mt-0.5 max-w-prose text-xs text-fg-muted">{note}</p>}
        </div>
        <div className="p-4">{children}</div>
      </Card>
    </motion.section>
  );
}

/** A labelled row inside a spec, so variants are identifiable rather than a soup. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
      <span className="w-24 shrink-0 font-mono text-2xs uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function ButtonsSpec() {
  const [saving, setSaving] = useState(false);

  return (
    <Spec
      id="buttons"
      title="Buttons"
      note="Press scales to 0.97 rather than shifting position — tactile feedback without moving the layout box, so neighbouring content never jitters."
    >
      <div className="divide-y divide-line">
        <Row label="Variants">
          <Button variant="primary">
            <Plus />
            Primary
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="danger">
            <Trash2 />
            Danger
          </Button>
          <Button variant="link">Link</Button>
        </Row>

        <Row label="Sizes">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>

        <Row label="Icon only">
          {[
            { icon: <Pencil />, label: 'Edit item' },
            { icon: <Copy />, label: 'Duplicate item' },
            { icon: <Download />, label: 'Export item' },
            { icon: <Settings2 />, label: 'Item settings' },
          ].map((b) => (
            // Every icon-only control names the OBJECT, not the glyph. "Edit" alone tells
            // a screen-reader user nothing about what is being edited.
            <Tooltip key={b.label} content={b.label}>
              <Button variant="ghost" size="icon" aria-label={b.label}>
                {b.icon}
              </Button>
            </Tooltip>
          ))}
        </Row>

        <Row label="States">
          <Button
            variant="primary"
            loading={saving}
            loadingText="Saving…"
            onClick={() => {
              setSaving(true);
              window.setTimeout(() => {
                setSaving(false);
                toast.success('Item saved', 'Hex Bolt M12 · AX-4102-B14');
              }, 1600);
            }}
          >
            <Save />
            Click to load
          </Button>
          <Button disabled>Disabled</Button>
          <Button variant="danger" disabled>
            Disabled danger
          </Button>
        </Row>
      </div>
    </Spec>
  );
}

function BadgesSpec() {
  const tones = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const;
  return (
    <Spec
      id="badges"
      title="Badges"
      note="The soft fills sit close in lightness to the surface, so a badge ALWAYS carries text. The dot is a redundant cue on top of the label, never a replacement for it."
    >
      <div className="divide-y divide-line">
        <Row label="Tones">
          {tones.map((t) => (
            <Badge key={t} tone={t}>
              {t[0]!.toUpperCase() + t.slice(1)}
            </Badge>
          ))}
          <Badge tone="solid">Solid</Badge>
        </Row>
        <Row label="With dot">
          {tones.map((t) => (
            <Badge key={t} tone={t} dot>
              {t === 'success' ? 'In stock' : t === 'warning' ? 'Low stock' : t === 'danger' ? 'Out of stock' : 'Label'}
            </Badge>
          ))}
        </Row>
        <Row label="With icon">
          <Badge tone="primary" size="md">
            <Package aria-hidden="true" />
            Serialized
          </Badge>
          <Badge tone="success" size="md">
            <RefreshCw aria-hidden="true" />
            Synced
          </Badge>
        </Row>
      </div>
    </Spec>
  );
}

function FormsSpec() {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [checked, setChecked] = useState<boolean | 'indeterminate'>('indeterminate');
  const [radio, setRadio] = useState('consumable');
  const [threshold, setThreshold] = useState(24);
  const [view, setView] = useState<'table' | 'cards' | 'kanban'>('table');
  const [notify, setNotify] = useState(true);

  const LIMIT = 50;
  const error = touched && !name.trim() ? 'Enter a name so the item can be found later.' : undefined;

  return (
    <Spec
      id="forms"
      title="Form controls"
      note="Errors appear on blur, not on every keystroke, and sit below their field wired with aria-describedby. Validating while someone is still typing tells them they are wrong before they have finished being right."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Field
            id="demo-name"
            label="Item name"
            required
            hint="Shown everywhere the item appears."
            error={error}
          >
            {(aria) => (
              <div className="relative">
                <Input
                  {...aria}
                  value={name}
                  maxLength={LIMIT}
                  onBlur={() => setTouched(true)}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hex Bolt M12"
                  className="pr-14"
                />
                {/* The counter is always visible, not only once you are near the limit —
                    finding out about a cap by hitting it is a bad way to learn. */}
                <span
                  className={cn(
                    'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-2xs tabular',
                    name.length >= LIMIT ? 'font-semibold text-danger-fg' : 'text-fg-subtle'
                  )}
                >
                  {name.length}/{LIMIT}
                </span>
              </div>
            )}
          </Field>

          <Field id="demo-search" label="Search" hint="Icon padding, clear affordance.">
            {(aria) => (
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle"
                  aria-hidden="true"
                />
                <Input {...aria} placeholder="Search SKU, name or bin…" className="pl-8" />
              </div>
            )}
          </Field>

          <Field id="demo-notes" label="Notes">
            {(aria) => (
              <Textarea
                {...aria}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the next shift should know…"
              />
            )}
          </Field>

          <Field id="demo-disabled" label="Read-only field" hint="Disabled state.">
            {(aria) => <Input {...aria} value="AX-4102-B14" disabled />}
          </Field>
        </div>

        <div className="space-y-5">
          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Toggles</p>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2/40 px-3 py-2">
              <label htmlFor="demo-switch" className="text-sm font-medium">
                Notify on low stock
              </label>
              <Switch id="demo-switch" checked={notify} onCheckedChange={setNotify} />
            </div>
            <CheckboxField
              id="demo-check"
              label="Select all items"
              hint="Indeterminate is a different glyph, not a dimmed tick."
              checked={checked}
              onCheckedChange={setChecked}
            />
            <div className="flex items-center gap-4 pl-6">
              <Checkbox id="c1" checked aria-label="Checked example" />
              <Checkbox id="c2" aria-label="Unchecked example" />
              <Checkbox id="c3" disabled checked aria-label="Disabled example" />
              <span className="text-2xs text-fg-subtle">checked · unchecked · disabled</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Radio group</p>
            <RadioGroup value={radio} onValueChange={setRadio} className="space-y-2">
              <RadioField id="r1" value="consumable" label="Consumable" hint="Issued and not returned." />
              <RadioField id="r2" value="returnable" label="Returnable" hint="Comes back to the shelf." />
              <RadioField id="r3" value="serialized" label="Serialized" hint="Tracked unit by unit." />
            </RadioGroup>
          </div>

          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Slider</p>
            <Slider
              label="Reorder point"
              value={threshold}
              min={0}
              max={100}
              onValueChange={setThreshold}
              format={(v) => `${v} units`}
            />
          </div>

          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Segmented</p>
            <Segmented
              label="View mode"
              layoutId="gallery-view"
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: 'Table' },
                { value: 'cards', label: 'Cards' },
                { value: 'kanban', label: 'Kanban' },
              ]}
            />
          </div>
        </div>
      </div>
    </Spec>
  );
}

function OverlaysSpec() {
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [dense, setDense] = useState(true);

  return (
    <Spec
      id="overlays"
      title="Overlays"
      note="Radix owns the focus trap, scroll lock, Escape and focus restoration; Framer Motion owns only the transition. None of them carry a close X — the footer button is the labelled way out."
    >
      <div className="divide-y divide-line">
        <Row label="Dialog">
          <Button variant="secondary" onClick={() => setDialog(true)}>
            Open dialog
          </Button>
          <span className="text-2xs text-fg-muted">Spring scale-in, blurred scrim</span>
        </Row>

        <Row label="Destructive">
          <Button variant="danger" onClick={() => setConfirm(true)}>
            <Trash2 />
            Delete item…
          </Button>
          <span className="text-2xs text-fg-muted">
            Confirm arms after 1.2s so a double-click cannot land on it
          </span>
        </Row>

        <Row label="Sheet">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open drawer
          </Button>
          <span className="text-2xs text-fg-muted">Keeps the page behind it visible</span>
        </Row>

        <Row label="Dropdown">
          <DropdownMenu>
            <DropdownTrigger asChild>
              <Button variant="outline">
                Actions
                <Ellipsis />
              </Button>
            </DropdownTrigger>
            <DropdownContent align="start">
              <DropdownLabel>Item</DropdownLabel>
              <DropdownItem icon={<Pencil />} shortcut="⌘E">
                Edit
              </DropdownItem>
              <DropdownItem icon={<Copy />} shortcut="⌘D">
                Duplicate
              </DropdownItem>
              <DropdownItem icon={<ExternalLink />}>Open in new tab</DropdownItem>
              <DropdownSeparator />
              <DropdownLabel>View</DropdownLabel>
              <DropdownCheckItem checked={dense} onSelect={() => setDense((v) => !v)}>
                Dense rows
              </DropdownCheckItem>
              <DropdownSeparator />
              {/* Destructive sits below a separator: the separation is spatial as well as
                  chromatic, so it survives greyscale and a slipped cursor. */}
              <DropdownItem destructive icon={<Trash2 />}>
                Delete
              </DropdownItem>
            </DropdownContent>
          </DropdownMenu>

          <Tooltip content="Tooltips repeat what is already available — never the only copy of anything.">
            <Button variant="ghost">Hover me</Button>
          </Tooltip>
        </Row>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent open={dialog}>
          <DialogHeader
            title="Move stock"
            description="Transfer units between bins without changing total on-hand."
          />
          <DialogBody className="space-y-4">
            <Field id="dlg-qty" label="Quantity" required hint="Cannot exceed 51 units available.">
              {(aria) => <Input {...aria} type="number" defaultValue={12} min={0} />}
            </Field>
            <Field id="dlg-bin" label="Destination bin" required>
              {(aria) => <Input {...aria} defaultValue="B-14-3" className="font-mono" />}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setDialog(false)} sound="close">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setDialog(false);
                toast.success('Stock moved', '12 units → bin B-14-3');
              }}
            >
              Move stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this item?"
        description="Hex Bolt M12 · AX-4102-B14"
        detail="The item is deactivated, not erased — its transaction history stays intact for auditing."
        loading={deleting}
        onConfirm={() => {
          setDeleting(true);
          window.setTimeout(() => {
            setDeleting(false);
            setConfirm(false);
            // The toast owns the commit: the record is only really gone when the timer
            // runs out, which is what makes Undo mean something.
            toast.undo('Item deleted', {
              description: 'Hex Bolt M12 · AX-4102-B14',
              onUndo: () => toast.success('Item restored'),
              onCommit: () => {},
            });
          }, 900);
        }}
      />

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        title="Hex Bolt M12"
        description="AX-4102-B14 · Bin B-14-3"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSheet(false)} sound="close">
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setSheet(false)}>
              Save changes
            </Button>
          </>
        }
      >
        <dl className="divide-y divide-line text-sm">
          {[
            ['Category', 'Fasteners'],
            ['On hand', '51 ea'],
            ['Reserved', '4 ea'],
            ['Reorder point', '20 ea'],
            ['Unit cost', '$3.40'],
            ['Last movement', '2 days ago'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-2">
              <dt className="text-fg-muted">{k}</dt>
              <dd className="font-mono tabular">{v}</dd>
            </div>
          ))}
        </dl>
      </Sheet>
    </Spec>
  );
}

function FeedbackSpec() {
  const [banner, setBanner] = useState(true);

  return (
    <Spec
      id="feedback"
      title="Alerts & toasts"
      note="A banner reports a standing condition on the page; a toast reports something that just happened and then leaves. Hovering the toast stack pauses every timer — reaching for Undo and watching it vanish is the worst thing a toast can do."
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Alert tone="info" title="Cycle count CC-0042 is ready for review">
            42 of 42 lines counted. Variance is within tolerance on 39 of them.
          </Alert>
          <Alert tone="success" title="Purchase order PO-1183 received" />
          <Alert
            tone="warning"
            title="9 items dropped below minimum stock"
            action={
              <Button variant="outline" size="xs">
                Review inventory
                <ArrowRight />
              </Button>
            }
          >
            Replenishing all of them to minimum costs roughly $4,180.
          </Alert>
          <Alert tone="danger" title="Sync failed" action={<Button variant="outline" size="xs">Retry</Button>}>
            The warehouse gateway did not respond. Stock levels may be up to 20 minutes stale.
          </Alert>
          {banner && (
            <Alert tone="neutral" title="Dismissible" onDismiss={() => setBanner(false)}>
              Banners that a user can clear should say so with a visible control.
            </Alert>
          )}
          {!banner && (
            <Button variant="ghost" size="xs" onClick={() => setBanner(true)}>
              Bring the dismissible banner back
            </Button>
          )}
        </div>

        <Separator />

        <Row label="Toasts">
          <Button variant="secondary" size="sm" onClick={() => toast.success('Saved', 'Changes are live.')}>
            Success
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.info('Export queued', 'You will get an email.')}>
            Info
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.warning('Stock is low', '4 units left in A-03-5.')}>
            Warning
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast.error('Could not save', 'Insufficient available quantity in bin A-03-5.')}
          >
            Error
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              toast.undo('3 items archived', {
                description: 'They will be hidden from the default view.',
                onUndo: () => toast.success('Restored', 'The 3 items are back.'),
                onCommit: () => {},
              })
            }
          >
            Undo toast
          </Button>
        </Row>
      </div>
    </Spec>
  );
}

function DisplaySpec() {
  const [tab, setTab] = useState('overview');

  return (
    <Spec
      id="display"
      title="Display & status"
      note="Progress always prints its number: a bar alone conveys its value through length, which is a shape-only signal. Skeletons occupy the real element's height so nothing reflows when data lands."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Progress</p>
            <Progress value={100} displayValue={412} label="Well above reorder point" tone="success" />
            <Progress value={62} label="Approaching reorder point" tone="warning" />
            <Progress value={14} label="Critical" tone="danger" />
            <Progress value={48} label="Neutral" />
          </div>

          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Avatars</p>
            <div className="flex items-center gap-2">
              {['Ana Rivas', 'Luis Moreno', 'María Castillo', 'Diego Peña'].map((n) => (
                <Tooltip key={n} content={n}>
                  <div>
                    <Avatar name={n} />
                  </div>
                </Tooltip>
              ))}
              <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-2xs font-semibold text-fg-muted ring-1 ring-inset ring-line">
                +38
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Skeletons</p>
            <div className="space-y-2 rounded-lg border border-line p-3">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Keyboard</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
              <span>palette</span>
              <Kbd>⌘</Kbd>
              <Kbd>J</Kbd>
              <span>assistant</span>
              <Kbd>ESC</Kbd>
              <span>close</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
              Tabs — the indicator slides between triggers
            </p>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="overview" layoutGroup="gallery">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="movements" layoutGroup="gallery">
                  Movements
                </TabsTrigger>
                <TabsTrigger value="units" layoutGroup="gallery">
                  Serial units
                </TabsTrigger>
              </TabsList>
              <TabsContent value={tab} className="p-3 text-sm text-fg-muted">
                {tab === 'overview' && 'Stock position, reorder point and unit cost.'}
                {tab === 'movements' && 'Every receipt, issue and transfer for this item.'}
                {tab === 'units' && 'Individually tracked units with their warranty status.'}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Accordion</p>
            <div className="overflow-hidden rounded-lg border border-line">
              <Accordion type="single" collapsible defaultValue="a">
                <AccordionItem value="a" title="Stock by bin" meta={<Badge tone="neutral">4 bins</Badge>}>
                  Units are spread across A-14-1, B-20-3, C-03-4 and D-17-1.
                </AccordionItem>
                <AccordionItem value="b" title="Reorder policy" meta={<Badge tone="warning" dot>Below min</Badge>}>
                  Reorder point 20, order quantity 100, lead time 12 days.
                </AccordionItem>
                <AccordionItem value="c" title="Audit trail">
                  Last edited 2 days ago by Clara Duarte.
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </Spec>
  );
}

function MotionSpec() {
  return (
    <Spec
      id="motion"
      title="Motion & elevation"
      note="One rhythm for the whole product: 120 / 190 / 280ms on a single easing curve, with exits at roughly 65% of their enter. Everything here is disabled by prefers-reduced-motion."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'shadow-low', cls: 'shadow-low', use: 'Cards at rest' },
          { name: 'shadow-mid', cls: 'shadow-mid', use: 'Hover, switch thumb' },
          { name: 'shadow-high', cls: 'shadow-high', use: 'Tooltips, menus' },
          { name: 'shadow-pop', cls: 'shadow-pop', use: 'Dialogs, palette' },
        ].map((s) => (
          <div
            key={s.name}
            className={cn(
              'rounded-lg border border-line bg-surface p-3 transition-transform duration-normal ease-spring hover:-translate-y-1',
              s.cls
            )}
          >
            <p className="font-mono text-2xs text-fg">{s.name}</p>
            <p className="mt-1 text-2xs text-fg-muted">{s.use}</p>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'duration-fast', ms: '120ms', cls: 'duration-fast', use: 'Hover, press' },
          { label: 'duration-normal', ms: '190ms', cls: 'duration-normal', use: 'Enter, expand' },
          { label: 'duration-slow', ms: '280ms', cls: 'duration-slow', use: 'Theme crossfade' },
        ].map((d) => (
          <button
            key={d.label}
            type="button"
            onClick={() => playSound('tap')}
            className={cn(
              'group rounded-lg border border-line bg-surface-2/40 p-3 text-left transition-colors ease-out',
              'hover:border-primary-line hover:bg-primary-soft',
              d.cls
            )}
          >
            <p className="font-mono text-2xs text-fg group-hover:text-primary-soft-fg">{d.label}</p>
            <p className="mt-0.5 font-mono text-lg tabular text-fg group-hover:text-primary-soft-fg">{d.ms}</p>
            <p className="mt-1 text-2xs text-fg-muted group-hover:text-primary-soft-fg">
              {d.use} — hover to feel it
            </p>
          </button>
        ))}
      </div>
    </Spec>
  );
}

function SoundSpec() {
  const sounds: { name: SoundName; label: string; when: string }[] = [
    { name: 'tap', label: 'Tap', when: 'Any ordinary button' },
    { name: 'nav', label: 'Navigate', when: 'Route change, sidebar item' },
    { name: 'toggleOn', label: 'Toggle on', when: 'Switch turned on' },
    { name: 'toggleOff', label: 'Toggle off', when: 'Switch turned off' },
    { name: 'open', label: 'Open', when: 'Dialog, sheet, dock' },
    { name: 'close', label: 'Close', when: 'The same, dismissed' },
    { name: 'success', label: 'Success', when: 'Operation completed' },
    { name: 'error', label: 'Error', when: 'Operation failed or blocked' },
    { name: 'notify', label: 'Notify', when: 'Unrequested arrival' },
    { name: 'send', label: 'Send', when: 'Message sent to the assistant' },
    { name: 'receive', label: 'Receive', when: 'Assistant finished' },
    { name: 'type', label: 'Type', when: 'Per token while streaming' },
  ];

  return (
    <Spec
      id="sound"
      title="Sound"
      note="Every sound is synthesised with the Web Audio API — there are no audio files. All twelve sit on one pentatonic set so two firing together never beat, and nothing lasts longer than 260ms."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sounds.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => playSound(s.name)}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/40 px-3 py-2 text-left',
              'transition-all duration-fast hover:border-primary-line hover:bg-primary-soft active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Volume2
              className="size-3.5 shrink-0 text-fg-subtle transition-colors group-hover:text-primary-soft-fg"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg group-hover:text-primary-soft-fg">
                {s.label}
              </span>
              <span className="block truncate text-2xs text-fg-muted group-hover:text-primary-soft-fg">
                {s.when}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-2xs text-fg-subtle">
        Silent? Interface sounds are off, or the browser has not seen a gesture yet — click anything
        once. The switch lives in the palette icon in the top bar.
      </p>
    </Spec>
  );
}

/**
 * Every class here is written out in full.
 *
 * Tailwind's JIT scans source text for complete class names — it never evaluates the
 * program — so `bg-${family}` produces exactly nothing in the stylesheet. A swatch built
 * from a template literal renders transparent, which is the most confusing possible
 * failure on a page whose entire job is showing colours.
 */
const FAMILY_CLASSES = {
  primary: {
    solid: 'bg-primary text-primary-on',
    soft: 'bg-primary-soft text-primary-soft-fg ring-1 ring-inset ring-primary-line/50',
    fg: 'text-primary-fg',
  },
  success: {
    solid: 'bg-success text-success-on',
    soft: 'bg-success-soft text-success-soft-fg ring-1 ring-inset ring-success-line/50',
    fg: 'text-success-fg',
  },
  warning: {
    solid: 'bg-warning text-warning-on',
    soft: 'bg-warning-soft text-warning-soft-fg ring-1 ring-inset ring-warning-line/50',
    fg: 'text-warning-fg',
  },
  danger: {
    solid: 'bg-danger text-danger-on',
    soft: 'bg-danger-soft text-danger-soft-fg ring-1 ring-inset ring-danger-line/50',
    fg: 'text-danger-fg',
  },
  info: {
    solid: 'bg-info text-info-on',
    soft: 'bg-info-soft text-info-soft-fg ring-1 ring-inset ring-info-line/50',
    fg: 'text-info-fg',
  },
} as const;

const CHART_CLASSES = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'bg-chart-6',
] as const;

function PaletteSpec() {
  const families = Object.keys(FAMILY_CLASSES) as (keyof typeof FAMILY_CLASSES)[];

  return (
    <Spec
      id="palette"
      title="Palette"
      note="Nothing here is a hex code in a component — every swatch is a CSS custom property solved against a WCAG target. Switch theme or mode in the top bar and this whole section repaints."
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">Surfaces</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['bg', 'bg-bg'],
              ['surface', 'bg-surface'],
              ['surface-2', 'bg-surface-2'],
              ['surface-3', 'bg-surface-3'],
              ['border', 'bg-line'],
              ['border-strong', 'bg-line-strong'],
            ].map(([name, cls]) => (
              <div key={name} className="w-28">
                <div className={cn('h-10 rounded-md ring-1 ring-inset ring-line', cls)} />
                <p className="mt-1 truncate font-mono text-2xs text-fg-muted">{name}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
            Accent families — every pair below is a verified 4.5:1
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {families.map((f) => (
              <div key={f} className="space-y-1.5">
                <div
                  className={cn(
                    'flex h-12 items-center justify-between rounded-md px-2.5 text-2xs font-semibold',
                    FAMILY_CLASSES[f].solid
                  )}
                >
                  <span>{f}</span>
                  <span className="opacity-70">solid</span>
                </div>
                <div
                  className={cn(
                    'flex h-12 items-center justify-between rounded-md px-2.5 text-2xs font-semibold',
                    FAMILY_CLASSES[f].soft
                  )}
                >
                  <span>{f}</span>
                  <span className="opacity-70">soft</span>
                </div>
                <p className={cn('text-2xs font-medium', FAMILY_CLASSES[f].fg)}>{f}-fg on surface</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
            Chart series — solved for 3:1 against the card, in two lightness bands so they stay
            separable in greyscale
          </p>
          <div className="flex gap-2">
            {CHART_CLASSES.map((cls, i) => (
              <div key={cls} className="flex-1">
                <div className={cn('h-10 rounded-md', cls)} />
                <p className="mt-1 font-mono text-2xs text-fg-muted">chart-{i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Spec>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const SECTIONS = [
  ['buttons', 'Buttons'],
  ['badges', 'Badges'],
  ['forms', 'Forms'],
  ['overlays', 'Overlays'],
  ['feedback', 'Alerts & toasts'],
  ['display', 'Display'],
  ['motion', 'Motion'],
  ['sound', 'Sound'],
  ['palette', 'Palette'],
] as const;

export function Components() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Component gallery"
        description="Every primitive in the system, live and interactive. Change the theme, the mode or the density from the top bar and watch the whole page follow — nothing here holds a colour of its own."
        actions={
          <Button variant="soft" size="sm" onClick={() => toast.info('Try the theme switcher', 'Palette icon, top right.')}>
            <Send />
            Ping me
          </Button>
        }
      />

      {/* A jump list, because this page is long and a user looking for "toast" should not
          have to scroll past four other sections to find out it exists. */}
      <nav aria-label="Sections" className="flex flex-wrap gap-1.5">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={() => playSound('nav')}
            className="rounded-md border border-line bg-surface px-2.5 py-1 text-2xs font-medium text-fg-muted transition-colors duration-fast hover:border-primary-line hover:bg-primary-soft hover:text-primary-soft-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {label}
          </a>
        ))}
      </nav>

      <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="space-y-4">
        <ButtonsSpec />
        <BadgesSpec />
        <FormsSpec />
        <OverlaysSpec />
        <FeedbackSpec />
        <DisplaySpec />
        <MotionSpec />
        <SoundSpec />
        <PaletteSpec />
      </motion.div>
    </div>
  );
}
