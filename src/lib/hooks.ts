import { useEffect, useRef, useState } from 'react';

/** Debounce for search inputs: the typed value stays instant, the query does not. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Global keyboard shortcuts.
 *
 * Ignores keystrokes originating in a text field so typing "k" in a search box never
 * opens the command palette — the single most common way an app-wide shortcut goes wrong.
 */
export function useHotkey(
  combo: { key: string; meta?: boolean; shift?: boolean },
  handler: () => void
) {
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

      const metaHeld = e.metaKey || e.ctrlKey;
      if (combo.meta && !metaHeld) return;
      if (!combo.meta && metaHeld) return;
      if (!combo.meta && typing) return;
      if (combo.shift !== undefined && combo.shift !== e.shiftKey) return;
      if (e.key.toLowerCase() !== combo.key.toLowerCase()) return;

      e.preventDefault();
      saved.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [combo.key, combo.meta, combo.shift]);
}

/** Simulates a network round-trip so loading and empty states are actually exercised. */
export function useMockQuery<T>(data: T, ms = 550) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(id);
  }, [ms]);
  return { data, loading };
}
