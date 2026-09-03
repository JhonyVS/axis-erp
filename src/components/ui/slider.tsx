import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';

/**
 * A slider always shows its VALUE. A bare track is a guess: the user can see roughly
 * where the handle sits and nothing about what that means.
 */
export function Slider({
  label,
  value,
  onValueChange,
  format = (v) => String(v),
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value' | 'onValueChange'> & {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-fg">{label}</label>
        <span className="font-mono text-xs tabular text-fg-muted">{format(value)}</span>
      </div>
      <SliderPrimitive.Root
        value={[value]}
        onValueChange={([v]) => onValueChange(v!)}
        // The click fires on RELEASE, not on every pixel of the drag. A slider that
        // machine-guns while you drag it is unusable with sound on.
        onValueCommit={() => playSound('tap')}
        className="relative flex h-5 w-full touch-none select-none items-center"
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-3 ring-1 ring-inset ring-line">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={label}
          className={cn(
            'block size-4 rounded-full border-2 border-primary bg-surface shadow-mid',
            'transition-transform duration-fast ease-out',
            'hover:scale-110 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
          )}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
