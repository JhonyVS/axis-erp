import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Hexagon, Loader2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/authStore';
import { playSound } from '@/lib/sound';
import { WaveField } from '@/components/auth/WaveField';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { CheckboxField } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ModeToggle, ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { DUR, EASE, spring } from '@/lib/motion';

/**
 * Sign-in.
 *
 * The wait is the design problem here. Authentication is the one moment where a pause is
 * expected, and the wrong way to fill it is a spinner that says nothing for two seconds.
 * Instead the button reports the steps it is actually going through, ticking each one off
 * as it completes — the same idea as the assistant's tool trace, and for the same reason:
 * a visible sequence of work reads as progress, where an indeterminate spinner reads as a
 * hang.
 *
 * Nothing here is real. The screen says so, because a prototype login that pretends to
 * verify credentials teaches people to type real passwords into a demo.
 */

const STEPS = [
  { label: 'Checking credentials', at: 0 },
  { label: 'Loading workspace', at: 700 },
  { label: 'Restoring preferences', at: 1400 },
] as const;

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuth((s) => s.signIn);
  const reduced = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(-1);
  const [failure, setFailure] = useState<string | null>(null);

  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const errors: Record<string, string | undefined> = {
    email: !email.trim()
      ? 'Enter your work email.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? 'That does not look like an email address.'
        : undefined,
    password: !password ? 'Enter your password.' : undefined,
  };
  const visible = (f: string) => (attempted || touched.has(f) ? errors[f] : undefined);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pendingRef.current) return;

    if (errors.email || errors.password) {
      setAttempted(true);
      window.requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      playSound('error');
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setFailure(null);
    setStep(0);
    playSound('send');

    // The steps are cosmetic, but they are honest about the ORDER a real sign-in works in.
    timers.current = STEPS.slice(1).map((s, i) =>
      window.setTimeout(() => setStep(i + 1), s.at)
    );

    try {
      await signIn(email.trim());
      playSound('success');
      // `replace` so Back does not land on a login screen the user has already passed.
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch {
      setFailure('Could not reach the workspace. Check your connection and try again.');
      playSound('error');
    } finally {
      timers.current.forEach(clearTimeout);
      pendingRef.current = false;
      setPending(false);
      setStep(-1);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg text-fg">
      {/* The waves read the live theme tokens, so this screen re-colours with the switcher
          in the corner — the theme system proving itself before any data is on screen. */}
      <WaveField className="pointer-events-none absolute inset-0 h-full w-full" />

      {/*
        A light scrim, only at the edges. The card carries its own opaque surface and a
        backdrop blur, so its contrast is already guaranteed — the scrim exists for the
        header and footer text sitting directly on the waves, and darkening the middle as
        well just erases the animation the screen is there to show.
      */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/80 via-transparent to-bg/85" />

      <header className="relative z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-on shadow-mid">
            <Hexagon className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Axis ERP</p>
            <p className="text-2xs text-fg-muted">Plant North</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ModeToggle />
          <ThemeSwitcher />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduced ? { duration: 0.15 } : spring}
          className="w-full max-w-sm rounded-xl border border-line bg-surface/90 p-6 shadow-pop backdrop-blur-xl"
        >
          <div className="mb-5">
            <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Access inventory, people and training for Plant North.
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {failure && (
              <Alert tone="danger" title="Sign-in failed">
                {failure}
              </Alert>
            )}

            <Field id="lg-email" label="Work email" required error={visible('email')}>
              {(aria) => (
                <Input
                  {...aria}
                  type="email"
                  // Let the password manager do its job. Blocking autofill is the single
                  // most common way a login becomes hostile (WCAG 3.3.8).
                  autoComplete="username"
                  autoFocus
                  disabled={pending}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => new Set(t).add('email'))}
                  placeholder="you@axis.example"
                />
              )}
            </Field>

            <Field id="lg-password" label="Password" required error={visible('password')}>
              {(aria) => (
                <Input
                  {...aria}
                  type="password"
                  autoComplete="current-password"
                  disabled={pending}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => new Set(t).add('password'))}
                  placeholder="••••••••"
                />
              )}
            </Field>

            <div className="flex items-center justify-between gap-3">
              <CheckboxField
                id="lg-remember"
                label="Stay signed in"
                checked={remember}
                disabled={pending}
                onCheckedChange={(c) => setRemember(c === true)}
              />
              <button
                type="button"
                className="text-xs font-medium text-primary-fg underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={pending}
              loadingText="Signing in…"
              sound={null}
            >
              <LogIn />
              Sign in
            </Button>

            {/*
              The wait, made legible. Reserved height so the card does not grow and shove
              the button under the cursor mid-click.
            */}
            <div className="min-h-16" aria-live="polite">
              <AnimatePresence>
                {pending && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, transition: { duration: DUR.fast } }}
                    transition={{ duration: DUR.normal, ease: EASE }}
                    className="space-y-1.5 overflow-hidden rounded-lg border border-line bg-surface-2/60 p-2.5"
                  >
                    {STEPS.map((s, i) => {
                      const done = step > i;
                      const active = step === i;
                      return (
                        <li
                          key={s.label}
                          className={cn(
                            'flex items-center gap-2 text-2xs transition-colors duration-normal',
                            done ? 'text-fg-subtle' : active ? 'text-fg' : 'text-fg-subtle/50'
                          )}
                        >
                          {done ? (
                            <Check className="size-3 shrink-0 text-success-fg" aria-hidden="true" />
                          ) : active ? (
                            <Loader2 className="size-3 shrink-0 animate-spin text-primary-fg" aria-hidden="true" />
                          ) : (
                            <span className="size-3 shrink-0" aria-hidden="true" />
                          )}
                          {s.label}
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </form>

          <div className="mt-4 flex items-start gap-2 border-t border-line pt-4">
            <Badge tone="warning" className="mt-0.5 shrink-0">
              Demo
            </Badge>
            <p className="text-2xs text-fg-muted">
              No account is checked and nothing is sent anywhere. Any email and password sign
              you in — please do not type a real password.
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 p-4 text-center text-2xs text-fg-subtle">
        Axis ERP — interface prototype
      </footer>
    </div>
  );
}
