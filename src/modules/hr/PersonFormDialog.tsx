import { useEffect, useRef, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Field, Label } from '@/components/ui/input';
import { RadioGroup, RadioField } from '@/components/ui/checkbox';
import { DEPARTMENT_LIST, type Person } from '@/mock/data';
import { toast } from '@/components/ui/toast';

const ROLES = ['Technician', 'Shift Lead', 'Planner', 'Inspector', 'Coordinator', 'Engineer', 'Supervisor', 'Analyst'];
const SITES = ['Plant North', 'Plant South', 'DC East', 'HQ'];
const LIMITS = { name: 60 } as const;

type Draft = Omit<Person, 'id' | 'startedAt'>;

const blank = (): Draft => ({
  name: '',
  role: ROLES[0]!,
  department: DEPARTMENT_LIST[0]!,
  site: SITES[0]!,
  email: '',
  status: 'Onboarding',
  compliance: 0,
});

function computeErrors(d: Draft) {
  const e: Partial<Record<keyof Draft, string>> = {};
  if (!d.name.trim()) e.name = 'Enter the person’s full name.';
  if (!d.email.trim()) e.email = 'An email is how they receive their training assignments.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'That does not look like an email address.';
  return e;
}

/** Same rules as the item form: blur-time errors, never a disabled submit, ref-guarded. */
export function PersonFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode. */
  initial?: Person;
  onSubmit: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(blank);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const editing = !!initial;

  useEffect(() => {
    if (!open) return;
    setDraft(
      initial
        ? {
            name: initial.name,
            role: initial.role,
            department: initial.department,
            site: initial.site,
            email: initial.email,
            status: initial.status,
            compliance: initial.compliance,
          }
        : blank()
    );
    // In edit mode the email is already the user's own, so the name-derived suggestion
    // must not fire and overwrite it.
    setTouched(initial ? new Set(['email']) : new Set());
    setAttempted(false);
  }, [open, initial]);

  const errors = computeErrors(draft);
  const visible = (f: keyof Draft) => (attempted || touched.has(f) ? errors[f] : undefined);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const blur = (f: string) => setTouched((t) => new Set(t).add(f));

  // Suggesting the address from the name saves typing, but it stops the moment the user
  // edits the field themselves — an autofill that keeps overwriting is worse than none.
  const suggestEmail = (name: string) => {
    if (touched.has('email')) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '.');
    set('email', slug ? `${slug}@axis.example` : '');
  };

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
      onSubmit(draft);
      onOpenChange(false);
      toast.success(editing ? 'Person updated' : 'Person added', `${draft.name} · ${draft.department}`);
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
            title={editing ? 'Edit person' : 'Add person'}
            description={
              editing
                ? 'Changes apply across the directory and the compliance report.'
                : 'They will appear in the directory and start at 0% training compliance.'
            }
            icon={
              <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg">
                <UserPlus className="size-4" aria-hidden="true" />
              </span>
            }
          />

          <DialogBody className="space-y-4">
            <Field id="pf-name" label="Full name" required error={visible('name')}>
              {(aria) => (
                <Input
                  {...aria}
                  value={draft.name}
                  maxLength={LIMITS.name}
                  onChange={(e) => {
                    set('name', e.target.value);
                    suggestEmail(e.target.value);
                  }}
                  onBlur={() => blur('name')}
                  placeholder="Ana Rivas"
                />
              )}
            </Field>

            <Field id="pf-email" label="Email" required error={visible('email')} hint="Suggested from the name.">
              {(aria) => (
                <Input
                  {...aria}
                  type="email"
                  autoComplete="email"
                  value={draft.email}
                  onChange={(e) => set('email', e.target.value)}
                  onBlur={() => blur('email')}
                  placeholder="ana.rivas@axis.example"
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ['pf-role', 'Role', 'role', ROLES],
                  ['pf-dept', 'Department', 'department', DEPARTMENT_LIST],
                  ['pf-site', 'Site', 'site', SITES],
                ] as const
              ).map(([id, label, key, options]) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <select
                    id={id}
                    value={draft[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className="h-9 w-full rounded-md border border-line bg-surface-3 px-2 text-base text-fg transition-colors hover:border-line-strong focus:border-primary-line focus:outline-none focus:ring-2 focus:ring-ring/35"
                  >
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-fg">Status</legend>
              <RadioGroup
                value={draft.status}
                onValueChange={(v) => set('status', v as Person['status'])}
                className="space-y-2"
              >
                <RadioField id="pf-s1" value="Onboarding" label="Onboarding" hint="Not yet cleared for the floor." />
                <RadioField id="pf-s2" value="Active" label="Active" hint="Working their normal shift." />
                <RadioField id="pf-s3" value="On leave" label="On leave" hint="Away, returning later." />
              </RadioGroup>
            </fieldset>
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
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              loadingText={editing ? 'Saving…' : 'Adding…'}
              sound={null}
            >
              {editing ? 'Save changes' : 'Add person'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
