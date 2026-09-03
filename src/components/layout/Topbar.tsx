import { Bell, Search, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUi } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Kbd, Avatar, Separator } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { ModeToggle, ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/dropdown';

/** Breadcrumb trail. Orientation matters more the deeper the hierarchy goes. */
const CRUMBS: Record<string, string[]> = {
  '/': ['Dashboard'],
  '/warehouse': ['Warehouse', 'Inventory'],
  '/warehouse/movements': ['Warehouse', 'Movements'],
  '/warehouse/counts': ['Warehouse', 'Cycle counts'],
  '/hr': ['People', 'Directory'],
  '/hr/compliance': ['People', 'Compliance'],
  '/hr/roles': ['People', 'Roles'],
  '/training': ['Training', 'Courses'],
  '/training/paths': ['Training', 'Learning paths'],
  '/components': ['System', 'Components'],
};

export function Topbar() {
  const { pathname } = useLocation();
  const { setCommandOpen, setAiOpen, aiOpen } = useUi();
  const crumbs = CRUMBS[pathname] ?? ['Axis'];

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md">
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => (
            <li key={c} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-fg-subtle" aria-hidden="true">
                  /
                </span>
              )}
              <span
                className={cn(
                  'truncate',
                  i === crumbs.length - 1 ? 'font-medium text-fg' : 'text-fg-muted'
                )}
                aria-current={i === crumbs.length - 1 ? 'page' : undefined}
              >
                {c}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {/*
        A button, not an input. It opens the command palette, and looking like a search
        field would promise inline results it does not deliver. The shortcut is printed
        on it because a shortcut nobody can see is a shortcut nobody uses.
      */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className={cn(
          'group hidden h-8 items-center gap-2 rounded-md border border-line bg-surface-3 pl-2.5 pr-1.5 sm:flex',
          'text-sm text-fg-subtle transition-colors duration-fast hover:border-line-strong hover:bg-surface-2 hover:text-fg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <Search className="size-3.5" aria-hidden="true" />
        <span className="w-32 text-left lg:w-44">Search or jump to…</span>
        <Kbd className="group-hover:border-line-strong">⌘K</Kbd>
      </button>

      <Separator orientation="vertical" className="hidden h-6 sm:block" />

      <Tooltip content={<span className="flex items-center gap-1.5">Ask Axis AI <Kbd>⌘J</Kbd></span>}>
        <Button
          variant={aiOpen ? 'soft' : 'ghost'}
          size="icon"
          onClick={() => setAiOpen(!aiOpen)}
          aria-label="Toggle Axis AI assistant"
          aria-expanded={aiOpen}
        >
          <Sparkles />
        </Button>
      </Tooltip>

      <DropdownMenu>
        <Tooltip content="Notifications">
          <DropdownTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications, 3 unread" className="relative">
              <Bell />
              {/* The count is in the accessible name above; this dot is a redundant
                  visual cue, not the only one. */}
              <span
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger ring-2 ring-surface"
                aria-hidden="true"
              />
            </Button>
          </DropdownTrigger>
        </Tooltip>
        <DropdownContent className="w-72">
          <DropdownLabel>Notifications</DropdownLabel>
          <DropdownItem icon={<Badge tone="danger" dot>Low</Badge>}>
            9 items dropped below minimum stock
          </DropdownItem>
          <DropdownItem icon={<Badge tone="warning" dot>Due</Badge>}>
            4 certifications expire this month
          </DropdownItem>
          <DropdownItem icon={<Badge tone="info" dot>New</Badge>}>
            Cycle count CC-0042 is ready for review
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu>

      <ModeToggle />
      <ThemeSwitcher />

      <DropdownMenu>
        <DropdownTrigger asChild>
          <button
            type="button"
            className="rounded-full transition-transform duration-fast hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label="Account menu for Jon Alvarez"
          >
            <Avatar name="Jon Alvarez" />
          </button>
        </DropdownTrigger>
        <DropdownContent>
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">Jon Alvarez</p>
            <p className="truncate text-2xs text-fg-muted">Warehouse Manager</p>
          </div>
          <DropdownSeparator />
          <DropdownItem>Profile</DropdownItem>
          <DropdownItem>Preferences</DropdownItem>
          <DropdownSeparator />
          {/* Sign out is destructive-adjacent, so it sits below a separator rather than
              in the same block as the harmless items. */}
          <DropdownItem destructive>Sign out</DropdownItem>
        </DropdownContent>
      </DropdownMenu>
    </header>
  );
}
