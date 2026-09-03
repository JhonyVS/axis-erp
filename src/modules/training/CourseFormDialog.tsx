import { useEffect, useRef, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Field, Label } from '@/components/ui/input';
import { CheckboxField } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { TRACK_LIST, type Course } from '@/mock/data';
import { toast } from '@/components/ui/toast';

const LIMITS = { title: 70, code: 10 } as const;

type Draft = Omit<Course, 'id' | 'completed'>;

const blank = (): Draft => ({
  code: '',
  title: '',
  track: TRACK_LIST[0]!,
  durationMin: 60,
  mandatory: false,
  enrolled: 0,
  expiresInDays: null,
});

function computeErrors(d: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.title.trim()) e.title = 'Give the course a title people will recognise.';
  if (!d.code.trim()) e.code = 'A code is how the course is referenced in records.';
  else if (!/^[A-Z0-9-]+$/.test(d.code)) e.code = 'Uppercase letters, digits and hyphens only.';
  if (d.enrolled < 0) e.enrolled = 'Cannot be negative.';
  return e;
}

export function CourseFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(blank);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validity, setValidity] = useState(180);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(blank());
    setTouched(new Set());
    setAttempted(false);
    setValidity(180);
  }, [open]);

  const errors = computeErrors(draft);
  const visible = (f: keyof Draft) => (attempted || touched.has(f) ? errors[f] : undefined);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const blur = (f: string) => setTouched((t) => new Set(t).add(f));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;

    if (Object.keys(errors).length > 0) {
      setAttempted(true);
      window.requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Only a mandatory course carries an expiry. An optional course that "lapses" would
      // put a red badge on something nobody was ever required to hold.
      onSubmit({ ...draft, expiresInDays: draft.mandatory ? validity : null });
      onOpenChange(false);
      toast.success('Course created', `${draft.code} · ${draft.title}`);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent open={open}>
        <form ref={formRef} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader
            title="New course"
            description="It appears in the catalogue immediately, with nobody enrolled yet."
            icon={
              <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg">
                <GraduationCap className="size-4" aria-hidden="true" />
              </span>
            }
          />

          <DialogBody className="space-y-4">
            <Field id="cf-title" label="Title" required error={visible('title')}>
              {(aria) => (
                <Input
                  {...aria}
                  value={draft.title}
                  maxLength={LIMITS.title}
                  onChange={(e) => set('title', e.target.value)}
                  onBlur={() => blur('title')}
                  placeholder="Forklift Operation & Certification"
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cf-code" label="Code" required error={visible('code')}>
                {(aria) => (
                  <Input
                    {...aria}
                    value={draft.code}
                    maxLength={LIMITS.code}
                    onChange={(e) => set('code', e.target.value.toUpperCase())}
                    onBlur={() => blur('code')}
                    placeholder="TR-112"
                    className="font-mono"
                  />
                )}
              </Field>

              <div className="space-y-1.5">
                <Label htmlFor="cf-track">Track</Label>
                <select
                  id="cf-track"
                  value={draft.track}
                  onChange={(e) => set('track', e.target.value)}
                  className="h-9 w-full rounded-md border border-line bg-surface-3 px-2 text-base text-fg transition-colors hover:border-line-strong focus:border-primary-line focus:outline-none focus:ring-2 focus:ring-ring/35"
                >
                  {TRACK_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Slider
              label="Duration"
              value={draft.durationMin}
              min={15}
              max={480}
              step={15}
              onValueChange={(v) => set('durationMin', v)}
              format={(v) => `${Math.floor(v / 60)}h ${String(v % 60).padStart(2, '0')}m`}
            />

            <div className="space-y-3 rounded-lg border border-line bg-surface-2/40 p-3">
              <CheckboxField
                id="cf-mandatory"
                label="Mandatory"
                hint="Required for the roles it is assigned to, and it expires."
                checked={draft.mandatory}
                onCheckedChange={(c) => set('mandatory', c === true)}
              />
              {/* Validity only exists for a mandatory course, so the control only exists
                  when it applies — a disabled field the user cannot explain is clutter. */}
              {draft.mandatory && (
                <Slider
                  label="Certification valid for"
                  value={validity}
                  min={30}
                  max={730}
                  step={30}
                  onValueChange={setValidity}
                  format={(v) => `${v} days`}
                />
              )}
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
            <Button type="submit" variant="primary" size="sm" loading={submitting} loadingText="Creating…" sound={null}>
              Create course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
