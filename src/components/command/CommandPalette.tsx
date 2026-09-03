import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  ArrowRight,
  Boxes,
  CornerDownLeft,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Package,
  Palette,
  Search,
  Sparkles,
  Sun,
  Users,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUi } from '@/stores/uiStore';
import { usePrefs, resolveDark } from '@/stores/prefsStore';
import { THEMES } from '@/lib/themes.generated';
import { playSound } from '@/lib/sound';
import { ITEMS, PEOPLE, COURSES } from '@/mock/data';
import { Kbd } from '@/components/ui/misc';
import { DUR, EASE, spring } from '@/lib/motion';

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  keywords?: string;
}

/**
 * One search box that reaches navigation, settings AND records.
 *
 * The alternative — a separate search per module — forces the user to know where a thing
 * lives before they can look for it, which is exactly the knowledge they are missing when
 * they reach for search.
 */
export function CommandPalette() {
  const { commandOpen, setCommandOpen, askAi, setAiOpen } = useUi();
  const { setTheme, toggleMode, mode, setSound, sound } = usePrefs();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (commandOpen) {
      setQuery('');
      setActive(0);
    }
  }, [commandOpen]);

  const commands = useMemo<Command[]>(() => {
    const close = (fn: () => void) => () => {
      setCommandOpen(false);
      fn();
    };

    const nav: Command[] = [
      { id: 'n-dash', group: 'Go to', label: 'Dashboard', icon: <LayoutDashboard />, run: close(() => navigate('/')) },
      { id: 'n-wh', group: 'Go to', label: 'Inventory', hint: 'Warehouse', icon: <Boxes />, run: close(() => navigate('/warehouse')) },
      { id: 'n-hr', group: 'Go to', label: 'People directory', hint: 'HR', icon: <Users />, run: close(() => navigate('/hr')) },
      { id: 'n-tr', group: 'Go to', label: 'Courses', hint: 'Training', icon: <GraduationCap />, run: close(() => navigate('/training')) },
    ];

    const actions: Command[] = [
      {
        id: 'a-ai',
        group: 'Actions',
        label: 'Ask Axis AI',
        hint: '⌘J',
        icon: <Sparkles />,
        run: close(() => setAiOpen(true)),
        keywords: 'assistant chat copilot',
      },
      {
        id: 'a-low',
        group: 'Actions',
        label: 'Ask: which items are below minimum stock?',
        icon: <Sparkles />,
        run: close(() => askAi('Which items are below minimum stock?')),
        keywords: 'low reorder replenish',
      },
      {
        id: 'a-mode',
        group: 'Actions',
        label: resolveDark(mode) ? 'Switch to light mode' : 'Switch to dark mode',
        icon: resolveDark(mode) ? <Sun /> : <Moon />,
        run: close(toggleMode),
        keywords: 'theme dark light appearance',
      },
      {
        id: 'a-sound',
        group: 'Actions',
        label: sound ? 'Mute interface sounds' : 'Unmute interface sounds',
        icon: <Volume2 />,
        run: close(() => setSound(!sound)),
        keywords: 'audio volume mute',
      },
    ];

    const themes: Command[] = THEMES.map((t) => ({
      id: `t-${t.id}`,
      group: 'Theme',
      label: t.name,
      hint: t.blurb,
      icon: <Palette />,
      run: close(() => setTheme(t.id)),
      keywords: `theme colour color ${t.id}`,
    }));

    // Records are only searched once the user has typed something. Listing 64 SKUs in an
    // empty palette would bury the navigation the palette exists to provide.
    const q = query.trim().toLowerCase();
    const records: Command[] = q.length < 2 ? [] : [
      ...ITEMS.filter((i) => `${i.sku} ${i.name} ${i.bin}`.toLowerCase().includes(q))
        .slice(0, 5)
        .map((i) => ({
          id: `i-${i.id}`,
          group: 'Items',
          label: i.name,
          hint: `${i.sku} · ${i.bin}`,
          icon: <Package />,
          run: close(() => navigate(`/warehouse?q=${encodeURIComponent(i.sku)}`)),
        })),
      ...PEOPLE.filter((p) => `${p.name} ${p.role} ${p.department}`.toLowerCase().includes(q))
        .slice(0, 4)
        .map((p) => ({
          id: `p-${p.id}`,
          group: 'People',
          label: p.name,
          hint: `${p.role} · ${p.department}`,
          icon: <Users />,
          run: close(() => navigate(`/hr?q=${encodeURIComponent(p.name)}`)),
        })),
      ...COURSES.filter((c) => `${c.code} ${c.title} ${c.track}`.toLowerCase().includes(q))
        .slice(0, 4)
        .map((c) => ({
          id: `c-${c.id}`,
          group: 'Courses',
          label: c.title,
          hint: `${c.code} · ${c.track}`,
          icon: <GraduationCap />,
          run: close(() => navigate(`/training?q=${encodeURIComponent(c.code)}`)),
        })),
    ];

    return [...nav, ...actions, ...themes, ...records];
  }, [query, navigate, setCommandOpen, setAiOpen, askAi, toggleMode, mode, setSound, sound, setTheme]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.filter((c) => c.group !== 'Items' && c.group !== 'People' && c.group !== 'Courses');
    return commands.filter((c) =>
      `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''} ${c.group}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Clamp rather than reset: a shrinking result list must not silently select item 0
  // while the user is arrowing through it.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const grouped = useMemo(() => {
    const map = new Map<string, { cmd: Command; index: number }[]>();
    results.forEach((cmd, index) => {
      const arr = map.get(cmd.group) ?? [];
      arr.push({ cmd, index });
      map.set(cmd.group, arr);
    });
    return [...map.entries()];
  }, [results]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, results.length));
      playSound('tap');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % Math.max(1, results.length));
      playSound('tap');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[active]?.run();
    }
  };

  return (
    <DialogPrimitive.Root open={commandOpen} onOpenChange={setCommandOpen}>
      <AnimatePresence>
        {commandOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                transition={{ duration: DUR.normal, ease: EASE }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount aria-label="Command palette">
              {/* Centred by flex, never by translate utilities — Framer Motion writes its
                  own transform and would overwrite them. */}
              <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
                <motion.div
                  className="pointer-events-auto flex max-h-[62vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4, transition: { duration: DUR.fast, ease: EASE } }}
                  transition={reduced ? { duration: 0.01 } : spring}
                  onKeyDown={onKeyDown}
                >
                  <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>

                  <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-3.5">
                    <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search commands, items, people, courses…"
                      aria-label="Search commands"
                      // Owns a listbox it does not contain, so arrow keys move the
                      // selection without moving focus out of the input.
                      role="combobox"
                      aria-expanded
                      aria-controls="command-results"
                      aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
                      className="h-12 w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
                    />
                    <Kbd>ESC</Kbd>
                  </div>

                  <div ref={listRef} id="command-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1.5">
                    {results.length === 0 ? (
                      <div className="px-3 py-10 text-center">
                        <p className="text-sm font-medium text-fg">No matches for “{query}”</p>
                        <p className="mt-1 text-sm text-fg-muted">
                          Try a SKU, a person's name, or a course code.
                        </p>
                      </div>
                    ) : (
                      grouped.map(([group, entries]) => (
                        <div key={group} className="mb-1 last:mb-0">
                          <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                            {group}
                          </p>
                          {entries.map(({ cmd, index }) => (
                            <div
                              key={cmd.id}
                              id={`cmd-${cmd.id}`}
                              data-index={index}
                              role="option"
                              aria-selected={index === active}
                              onMouseMove={() => setActive(index)}
                              onClick={cmd.run}
                              className={cn(
                                'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm',
                                'transition-colors duration-fast',
                                index === active ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg'
                              )}
                            >
                              <span className={cn('shrink-0 [&_svg]:size-4', index === active ? 'text-primary-fg' : 'text-fg-subtle')}>
                                {cmd.icon}
                              </span>
                              <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                              {cmd.hint && (
                                <span className="hidden shrink-0 truncate text-2xs text-fg-subtle sm:block">
                                  {cmd.hint}
                                </span>
                              )}
                              {index === active && (
                                <CornerDownLeft className="size-3.5 shrink-0 text-primary-fg" aria-hidden="true" />
                              )}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3 border-t border-line bg-surface-2/50 px-3 py-2 text-2xs text-fg-subtle">
                    <span className="flex items-center gap-1">
                      <Kbd>↑</Kbd>
                      <Kbd>↓</Kbd> navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <Kbd>↵</Kbd> select
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      {results.length} result{results.length === 1 ? '' : 's'}
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </span>
                  </div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
