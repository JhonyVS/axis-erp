import * as React from 'react';
import { cn } from '@/lib/utils';

const base = cn(
  'w-full rounded-md border border-line bg-surface-3 text-fg placeholder:text-fg-subtle',
  'transition-[border-color,box-shadow,background-color] duration-fast ease-out',
  'hover:border-line-strong',
  'focus:border-primary-line focus:bg-surface focus:outline-none focus:ring-2 focus:ring-ring/35',
  'disabled:cursor-not-allowed disabled:opacity-50',
  // Driven by aria-invalid rather than a class, so the visual state and the state the
  // screen reader announces can never disagree.
  'aria-[invalid=true]:border-danger-line aria-[invalid=true]:ring-danger/25'
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(base, 'h-9 px-2.5 text-base', className)} {...props} />;
  }
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(base, 'min-h-20 px-2.5 py-2 text-base', className)} {...props} />;
});

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('text-sm font-medium text-fg', className)} {...props}>
      {children}
      {required && (
        <span className="ml-0.5 text-danger-fg" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

/**
 * A field wrapper that keeps the label, the helper text and the error message wired to
 * the control. `aria-describedby` is what makes the error audible; without it a screen
 * reader user hears the field name and nothing about why it was rejected.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (aria: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  const describedBy = [errId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {/* Errors take the place of the hint rather than stacking, so the field never grows. */}
      {error ? (
        <p id={errId} role="alert" className="text-xs text-danger-fg">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
