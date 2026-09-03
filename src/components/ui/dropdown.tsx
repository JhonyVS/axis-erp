import * as React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  className,
  align = 'end',
  sideOffset = 6,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        // The menu grows out of its trigger rather than fading in place, so the spatial
        // relationship between the button and the panel stays legible.
        className={cn(
          'z-50 min-w-44 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-pop',
          'origin-[--radix-dropdown-menu-content-transform-origin]',
          'animate-in fade-in-0 zoom-in-95 duration-fast',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className
        )}
        {...props}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

export function DropdownItem({
  className,
  onSelect,
  destructive,
  icon,
  shortcut,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & {
  destructive?: boolean;
  icon?: React.ReactNode;
  shortcut?: React.ReactNode;
}) {
  return (
    <DropdownPrimitive.Item
      onSelect={(e) => {
        playSound('tap');
        onSelect?.(e);
      }}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
        'transition-colors duration-fast',
        'data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle',
        // Destructive items get the danger colour AND sit below a separator, so the
        // separation is spatial as well as chromatic.
        destructive
          ? 'text-danger-fg data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger-soft-fg [&_svg]:text-danger-fg'
          : 'text-fg',
        className
      )}
      {...props}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="ml-auto font-mono text-2xs text-fg-subtle">{shortcut}</span>}
    </DropdownPrimitive.Item>
  );
}

export function DropdownCheckItem({
  checked,
  children,
  onSelect,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> & { checked?: boolean }) {
  return (
    <DropdownItem
      onSelect={onSelect}
      // The tick is the state, not the highlight colour — colour alone would not survive
      // a colour-vision deficiency.
      icon={checked ? <Check aria-hidden="true" /> : <span className="size-4" aria-hidden="true" />}
      aria-checked={checked}
      role="menuitemcheckbox"
      {...props}
    >
      {children}
    </DropdownItem>
  );
}

export function DropdownLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1.5 text-2xs font-semibold uppercase tracking-wider text-fg-subtle', className)} {...props} />;
}

export function DropdownSeparator() {
  return <DropdownPrimitive.Separator className="my-1 h-px bg-line" />;
}
