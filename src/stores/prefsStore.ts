import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME } from '@/lib/themes.generated';
import { setSoundEnabled, setSoundVolume } from '@/lib/sound';

export type Mode = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';

interface PrefsState {
  theme: string;
  mode: Mode;
  density: Density;
  sound: boolean;
  volume: number;

  setTheme: (id: string) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  setDensity: (d: Density) => void;
  setSound: (on: boolean) => void;
  setVolume: (v: number) => void;
}

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const resolveDark = (mode: Mode) => (mode === 'system' ? prefersDark() : mode === 'dark');

/**
 * Writes straight to the documentElement rather than through React state.
 *
 * Themes are CSS custom properties; nothing in the tree needs to re-render for a theme
 * change to take effect. Routing it through a context provider would re-render every
 * component in the app to accomplish exactly nothing.
 */
export function applyPrefs(s: Pick<PrefsState, 'theme' | 'mode' | 'density'>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const dark = resolveDark(s.mode);

  root.setAttribute('data-theme', s.theme);
  root.setAttribute('data-density', s.density);
  root.classList.toggle('dark', dark);
  // Tells the browser which palette to use for form controls and scrollbars it draws itself.
  root.style.colorScheme = dark ? 'dark' : 'light';
}

/**
 * The colour crossfade is opt-in per switch, not a standing rule.
 *
 * A global `transition: background-color 280ms` would also catch every table-row hover
 * and make the grid feel like it is lagging behind the cursor. Marking the root for the
 * duration of the switch confines the crossfade to the moment it belongs to.
 */
function withThemeTransition(fn: () => void) {
  if (typeof document === 'undefined') return fn();
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return fn();

  root.setAttribute('data-theme-switching', '');
  fn();
  window.setTimeout(() => root.removeAttribute('data-theme-switching'), 320);
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,
      mode: 'system',
      density: 'comfortable',
      sound: true,
      volume: 0.6,

      setTheme: (id) =>
        withThemeTransition(() => {
          set({ theme: id });
          applyPrefs({ ...get(), theme: id });
        }),

      setMode: (mode) =>
        withThemeTransition(() => {
          set({ mode });
          applyPrefs({ ...get(), mode });
        }),

      toggleMode: () => {
        // From "system", the useful next step is whichever mode the user is NOT
        // currently looking at — flipping to the resolved value would appear to do nothing.
        const cur = get().mode;
        const next: Mode = cur === 'system' ? (resolveDark('system') ? 'light' : 'dark') : cur === 'dark' ? 'light' : 'dark';
        get().setMode(next);
      },

      setDensity: (density) => {
        set({ density });
        applyPrefs({ ...get(), density });
      },

      setSound: (on) => {
        set({ sound: on });
        setSoundEnabled(on);
      },

      setVolume: (v) => {
        set({ volume: v });
        setSoundVolume(v);
      },
    }),
    {
      name: 'axis.theme',
      // Matches the shape the inline script in index.html reads before first paint.
      partialize: (s) => ({
        theme: s.theme,
        mode: s.mode,
        density: s.density,
        sound: s.sound,
        volume: s.volume,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyPrefs(state);
        setSoundEnabled(state.sound);
        setSoundVolume(state.volume);
      },
    }
  )
);

/** Keeps "system" honest when the OS flips while the app is open. */
export function watchSystemTheme() {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    const s = usePrefs.getState();
    if (s.mode === 'system') applyPrefs(s);
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
