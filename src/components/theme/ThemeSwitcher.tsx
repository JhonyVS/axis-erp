import { Check, Monitor, Moon, Palette, Rows3, Rows4, Sun, Volume2, VolumeX } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { THEMES } from '@/lib/themes.generated';
import { usePrefs, resolveDark, type Mode, type Density } from '@/stores/prefsStore';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Segmented } from '@/components/ui/segmented';

/**
 * A theme is picked with ONE click on its swatch. There is no Apply button and no
 * confirmation, because the change is instant, free, and reversible — a confirmation
 * step here would cost more than the mistake it prevents.
 *
 * The swatches are real colours from the generated manifest, not hand-maintained
 * approximations, so a change to a theme's spec is reflected in its preview
 * automatically. Previewing the theme you are not currently in is the whole job of this
 * control; a list of names would make the user open every one to find out what it looks like.
 *
 * The list is grouped by CHARACTER — the chroma register — and not by hue, because that
 * is the axis a person actually chooses along: how loud the screen is allowed to be for
 * the hours they will spend in front of it. Hue is the preference you express afterwards,
 * inside the register you can live with. Grouping by hue would offer eleven variations of
 * one decision and hide the decision itself.
 */

const CHARACTERS = [
  { key: 'matte', label: 'Matte', note: 'calmest — for a full shift' },
  { key: 'muted', label: 'Muted', note: 'coloured, voice kept down' },
  { key: 'vivid', label: 'Vivid', note: 'maximum signal' },
  { key: 'contrast', label: 'Contrast', note: 'AAA body text' },
] as const;

function ThemeSwatch({ id, name, blurb }: { id: string; name: string; blurb: string }) {
  const { theme, setTheme, mode } = usePrefs();
  const active = theme === id;
  const meta = THEMES.find((t) => t.id === id)!;
  const colors = resolveDark(mode) ? meta.swatch.dark : meta.swatch.light;

  return (
    <Tooltip content={blurb} side="left">
      <button
        type="button"
        onClick={() => setTheme(id)}
        aria-pressed={active}
        aria-label={`${name} theme${active ? ' (current)' : ''}`}
        className={cn(
          'group relative flex w-full items-center gap-2.5 rounded-lg border p-2 text-left',
          'transition-all duration-normal ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          active
            ? 'border-primary-line bg-primary-soft/50 shadow-low'
            : 'border-line hover:border-line-strong hover:bg-surface-2'
        )}
      >
        {/* Live preview built from the theme's own generated colours. */}
        <span
          className="flex size-8 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-line"
          aria-hidden="true"
        >
          {colors.map((c, i) => (
            <span key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
          ))}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{name}</span>
          <span className="block truncate text-2xs text-fg-muted">{blurb}</span>
        </span>

        {/* A tick, not just a border colour: the selected state must survive greyscale. */}
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-full transition-all duration-fast',
            active ? 'bg-primary text-primary-on' : 'opacity-0'
          )}
          aria-hidden="true"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      </button>
    </Tooltip>
  );
}

export function ThemeSwitcher() {
  const { mode, setMode, density, setDensity, sound, setSound, volume, setVolume } = usePrefs();

  return (
    <PopoverPrimitive.Root>
      <Tooltip content="Appearance">
        <PopoverPrimitive.Trigger asChild>
          <Button variant="ghost" size="icon" aria-label="Appearance settings">
            <Palette />
          </Button>
        </PopoverPrimitive.Trigger>
      </Tooltip>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-80 rounded-xl border border-line bg-surface p-3 shadow-pop',
            'origin-[--radix-popover-content-transform-origin]',
            'animate-in fade-in-0 zoom-in-95 duration-fast',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
        >
          <div className="space-y-3">
            <section className="space-y-1.5">
              <h4 className="px-0.5 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                Mode
              </h4>
              <Segmented<Mode>
                label="Colour mode"
                layoutId="mode-pill"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'light', label: 'Light', icon: <Sun /> },
                  { value: 'dark', label: 'Dark', icon: <Moon /> },
                  { value: 'system', label: 'Auto', icon: <Monitor /> },
                ]}
              />
            </section>

            <section className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 px-0.5">
                <h4 className="text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                  Theme
                </h4>
                {/* Says what the grouping means, so the headings are not a puzzle. */}
                <p className="text-2xs text-fg-muted">grouped by chroma, not hue</p>
              </div>

              {/* Eleven themes do not fit a popover. The list scrolls; the sections do not
                  collapse, because a collapsed group is a theme nobody finds. */}
              <div className="max-h-[17.5rem] space-y-2.5 overflow-y-auto pr-0.5">
                {CHARACTERS.map(({ key, label, note }) => {
                  const group = THEMES.filter((t) => t.character === key);
                  if (group.length === 0) return null;

                  return (
                    <div key={key} className="space-y-1">
                      <p className="px-0.5 text-2xs font-medium text-fg">
                        {label} <span className="font-normal text-fg-muted">· {note}</span>
                      </p>
                      {group.map((t) => (
                        <ThemeSwatch key={t.id} id={t.id} name={t.name} blurb={t.blurb} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-1.5">
              <h4 className="px-0.5 text-2xs font-semibold uppercase tracking-wider text-fg-subtle">
                Density
              </h4>
              <Segmented<Density>
                label="Row density"
                layoutId="density-pill"
                value={density}
                onChange={setDensity}
                options={[
                  { value: 'comfortable', label: 'Comfortable', icon: <Rows3 /> },
                  { value: 'compact', label: 'Compact', icon: <Rows4 /> },
                ]}
              />
            </section>

            <section className="space-y-2 rounded-lg border border-line bg-surface-2/50 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="sound-toggle" className="flex items-center gap-2 text-sm font-medium">
                  {sound ? (
                    <Volume2 className="size-4 text-fg-muted" aria-hidden="true" />
                  ) : (
                    <VolumeX className="size-4 text-fg-subtle" aria-hidden="true" />
                  )}
                  Interface sounds
                </label>
                <Switch id="sound-toggle" checked={sound} onCheckedChange={setSound} />
              </div>

              <div className={cn('transition-opacity duration-normal', sound ? 'opacity-100' : 'pointer-events-none opacity-40')}>
                <label htmlFor="volume" className="sr-only">
                  Sound volume
                </label>
                <input
                  id="volume"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  disabled={!sound}
                  onChange={(e) => setVolume(Number(e.target.value) / 100)}
                  // Preview the level as it moves — a volume slider that is silent while
                  // you drag it is guesswork.
                  onMouseUp={() => playSound('notify')}
                  onKeyUp={() => playSound('notify')}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary"
                />
              </div>
            </section>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** One-click light/dark flip, always visible in the topbar for the most common change. */
export function ModeToggle() {
  const { mode, toggleMode } = usePrefs();
  const dark = resolveDark(mode);

  return (
    <Tooltip content={dark ? 'Switch to light' : 'Switch to dark'}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMode}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Both icons are always mounted and cross-rotate, so the swap reads as one
            object turning over rather than two icons blinking. */}
        <span className="relative flex size-4 items-center justify-center">
          <Sun
            className={cn(
              'absolute size-4 transition-all duration-slow ease-spring',
              dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            )}
            aria-hidden="true"
          />
          <Moon
            className={cn(
              'absolute size-4 transition-all duration-slow ease-spring',
              dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            )}
            aria-hidden="true"
          />
        </span>
      </Button>
    </Tooltip>
  );
}
