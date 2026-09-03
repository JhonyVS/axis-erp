import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  value,
  title,
  meta,
  children,
}: {
  value: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AccordionPrimitive.Item value={value} className="border-b border-line last:border-0">
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          onClick={() => playSound('tap')}
          className={cn(
            'group flex flex-1 items-center gap-2.5 px-3.5 py-3 text-left text-sm font-medium',
            'transition-colors duration-fast hover:bg-surface-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
          )}
        >
          {/* The chevron rotates rather than swapping glyphs, so the control reads as one
              object turning over instead of two icons blinking. */}
          <ChevronDown
            className="size-4 shrink-0 text-fg-subtle transition-transform duration-normal ease-spring group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {meta && <span className="shrink-0">{meta}</span>}
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>

      {/*
        Height animates through Radix's own --radix-accordion-content-height variable,
        which it measures for us. CSS cannot animate to `auto`, and measuring by hand in
        an effect produces a visible jump the first time each panel opens.
      */}
      <AccordionPrimitive.Content className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="px-3.5 pb-3.5 pl-10 pt-0 text-fg-muted">{children}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  );
}
