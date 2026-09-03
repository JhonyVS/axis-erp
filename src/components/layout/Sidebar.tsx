import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Boxes,
  ChevronsLeft,
  GraduationCap,
  LayoutDashboard,
  PackageSearch,
  Users,
  UserCog,
  ArrowLeftRight,
  Component,
  ShieldCheck,
  Hexagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/stores/uiStore';
import { playSound } from '@/lib/sound';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { spring } from '@/lib/motion';

/**
 * Navigation is grouped by MODULE, and every item carries an icon AND a label. An
 * icon-only rail is the single most common way an ERP becomes unlearnable — the labels
 * only disappear when the user collapses the rail themselves, and even then the tooltip
 * and the accessible name stay.
 */
const NAV = [
  {
    label: 'Overview',
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true }],
  },
  {
    label: 'Warehouse',
    items: [
      { to: '/warehouse', icon: Boxes, label: 'Inventory' },
      { to: '/warehouse/movements', icon: ArrowLeftRight, label: 'Movements' },
      { to: '/warehouse/counts', icon: PackageSearch, label: 'Cycle counts' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/hr', icon: Users, label: 'Directory' },
      { to: '/hr/compliance', icon: ShieldCheck, label: 'Compliance' },
      { to: '/hr/roles', icon: UserCog, label: 'Roles' },
    ],
  },
  {
    label: 'Training',
    items: [
      { to: '/training', icon: GraduationCap, label: 'Courses' },
      { to: '/training/paths', icon: BookOpen, label: 'Learning paths' },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/components', icon: Component, label: 'Components' }],
  },
] as const;

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUi();
  const reduced = useReducedMotion();
  const { pathname } = useLocation();

  return (
    <motion.aside
      // Animating `width` normally means animating layout, which is the expensive kind.
      // It is acceptable here precisely once, on an explicit user action, on a single
      // element — not on hover and not per row.
      animate={{ width: sidebarCollapsed ? 60 : 232 }}
      initial={false}
      transition={reduced ? { duration: 0 } : spring}
      className="relative z-20 flex shrink-0 flex-col border-r border-line bg-surface"
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-on shadow-low">
          <Hexagon className="size-4" strokeWidth={2.5} aria-hidden="true" />
        </div>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-w-0"
          >
            <p className="truncate text-sm font-semibold tracking-tight">Axis ERP</p>
            <p className="truncate text-2xs text-fg-subtle">Plant North</p>
          </motion.div>
        )}
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            {/* The group heading collapses to a rule rather than vanishing, so the
                grouping survives the collapsed rail. */}
            {sidebarCollapsed ? (
              <div className="mx-2 mb-2 h-px bg-line" aria-hidden="true" />
            ) : (
              <p className="mb-1 px-2 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                {group.label}
              </p>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  'end' in item && item.end ? pathname === item.to : pathname.startsWith(item.to);

                return (
                  <li key={item.to}>
                    <Tooltip content={sidebarCollapsed ? item.label : null} side="right">
                      <NavLink
                        to={item.to}
                        onClick={() => playSound('nav')}
                        className={cn(
                          'group relative flex h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium',
                          'transition-colors duration-fast',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
                          active ? 'text-primary-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
                        )}
                      >
                        {active && (
                          // One shared element travels between items, so the eye tracks
                          // where the selection went instead of re-finding it.
                          <motion.span
                            layoutId="nav-active"
                            className="absolute inset-0 rounded-md bg-primary-soft"
                            transition={reduced ? { duration: 0 } : spring}
                          />
                        )}
                        {/* Hover grows it, the press pushes it back in. `group-active`
                            is emitted after `group-hover`, so the press wins while it
                            lasts — including on the item you are already on, because
                            pressing that is still a press and must answer. */}
                        <Icon
                          className={cn(
                            'relative size-4 shrink-0 transition-transform duration-normal',
                            !active && 'group-hover:scale-110',
                            'group-active:scale-[0.88] group-active:duration-fast'
                          )}
                          aria-hidden="true"
                        />
                        {!sidebarCollapsed && <span className="relative truncate">{item.label}</span>}
                      </NavLink>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-2">
        <Tooltip content={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full justify-start gap-2.5 px-2"
          >
            {/* The chevron already rotates 180 to state the direction it will go; the
                press nudges it a few degrees further the same way, so the feedback and
                the meaning are the same gesture rather than two competing ones. */}
            <ChevronsLeft
              className={cn(
                'transition-transform duration-normal ease-spring',
                sidebarCollapsed
                  ? 'rotate-180 group-active:rotate-[195deg]'
                  : 'group-active:-rotate-[15deg]'
              )}
              aria-hidden="true"
            />
            {!sidebarCollapsed && <span>Collapse</span>}
          </Button>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
