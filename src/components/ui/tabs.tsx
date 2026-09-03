import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';
import { spring } from '@/lib/motion';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('relative flex items-center gap-1 border-b border-line', className)}
      {...props}
    />
  );
}

/**
 * The active indicator is a single shared `layoutId` element, so it SLIDES from the old
 * tab to the new one instead of cross-fading. That travel is what tells the eye where it
 * came from — a fade leaves the user to work out the relationship themselves.
 */
export function TabsTrigger({
  className,
  value,
  layoutGroup,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { layoutGroup: string }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      onClick={() => playSound('nav')}
      className={cn(
        'group relative -mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium',
        'text-fg-muted transition-colors duration-fast hover:text-fg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        'data-[state=active]:text-primary-fg',
        '[&_svg]:size-4',
        className
      )}
      {...props}
    >
      {children}
      <TabsPrimitive.Content value={value} className="hidden" />
      <span className="absolute inset-x-0 bottom-0 hidden group-data-[state=active]:block">
        <motion.span
          layoutId={`tab-indicator-${layoutGroup}`}
          className="block h-0.5 rounded-full bg-primary"
          transition={spring}
        />
      </span>
    </TabsPrimitive.Trigger>
  );
}

export const TabsContent = TabsPrimitive.Content;
