import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, onCheckedChange, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      onCheckedChange={(c) => {
        playSound(c ? 'toggleOn' : 'toggleOff');
        onCheckedChange?.(c);
      }}
      className={cn(
        'peer grid size-4 shrink-0 place-items-center rounded border border-line-strong bg-surface-3',
        'transition-[background-color,border-color,box-shadow] duration-fast ease-out',
        'hover:border-primary-line',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-on',
        'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-on',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="animate-in zoom-in-50 duration-fast">
        {/* Indeterminate is a DIFFERENT glyph, not a dimmed tick. "Some of these are
            selected" and "this is selected" must never look like the same state. */}
        {props.checked === 'indeterminate' ? (
          <Minus className="size-3" strokeWidth={3.5} aria-hidden="true" />
        ) : (
          <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

/** Checkbox + label as one hit target: the label is half the affordance. */
export function CheckboxField({
  id,
  label,
  hint,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  id: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox id={id} className="mt-0.5" {...props} />
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer select-none text-sm font-medium text-fg">
          {label}
        </label>
        {hint && <p className="text-xs text-fg-muted">{hint}</p>}
      </div>
    </div>
  );
}

export const RadioGroup = RadioPrimitive.Root;

export function RadioField({
  value,
  label,
  hint,
  id,
}: {
  value: string;
  label: string;
  hint?: string;
  id: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <RadioPrimitive.Item
        id={id}
        value={value}
        onClick={() => playSound('tap')}
        className={cn(
          'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-line-strong bg-surface-3',
          'transition-colors duration-fast hover:border-primary-line',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary'
        )}
      >
        <RadioPrimitive.Indicator className="size-1.5 rounded-full bg-primary-on animate-in zoom-in-50 duration-fast" />
      </RadioPrimitive.Item>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer select-none text-sm font-medium text-fg">
          {label}
        </label>
        {hint && <p className="text-xs text-fg-muted">{hint}</p>}
      </div>
    </div>
  );
}
