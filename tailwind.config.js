/**
 * Every colour below resolves to a CSS custom property, never to a literal. That
 * indirection is the entire theme system: `bg-surface` is written once in a component
 * and means something different under each of the six `data-theme` values, in both
 * light and dark, with no component-level conditionals.
 *
 * Tokens are stored as OKLCH channel triplets so `<alpha-value>` still composes —
 * `bg-primary/10` works, which it would not if the variable held a hex string.
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'oklch(var(--bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'oklch(var(--surface) / <alpha-value>)',
          2: 'oklch(var(--surface-2) / <alpha-value>)',
          3: 'oklch(var(--surface-3) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'oklch(var(--border) / <alpha-value>)',
          strong: 'oklch(var(--border-strong) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'oklch(var(--fg) / <alpha-value>)',
          muted: 'oklch(var(--fg-muted) / <alpha-value>)',
          // Decorative / placeholder only — cleared for 3:1, not for body text.
          subtle: 'oklch(var(--fg-subtle) / <alpha-value>)',
        },
        ring: 'oklch(var(--ring) / <alpha-value>)',

        ...Object.fromEntries(
          ['primary', 'success', 'warning', 'danger', 'info'].map((name) => [
            name,
            {
              DEFAULT: `oklch(var(--${name}) / <alpha-value>)`,
              on: `oklch(var(--${name}-on) / <alpha-value>)`,
              fg: `oklch(var(--${name}-fg) / <alpha-value>)`,
              soft: `oklch(var(--${name}-soft) / <alpha-value>)`,
              'soft-fg': `oklch(var(--${name}-soft-fg) / <alpha-value>)`,
              line: `oklch(var(--${name}-line) / <alpha-value>)`,
            },
          ])
        ),

        chart: Object.fromEntries(
          [1, 2, 3, 4, 5, 6].map((n) => [n, `oklch(var(--chart-${n}) / <alpha-value>)`])
        ),
      },

      fontFamily: {
        // Fira Sans for prose, Fira Code everywhere a value must line up in a column:
        // SKUs, bin codes, quantities, timestamps. Tabular figures stop numbers from
        // shifting width as they change, which is what makes a live table feel stable.
        sans: ['"Fira Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      fontSize: {
        // A dense-dashboard scale. 13px is the table body; anything a user reads in
        // paragraphs stays at 15px or above.
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        md: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.5rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
      },

      borderRadius: {
        // `--radius` is the CARD radius, and the scale is built around it — but the bare
        // `rounded` utility must stay small. Pointing DEFAULT at the card radius turns
        // every 16px control into a circle: a checkbox with an 8px radius is visually a
        // radio button, which tells the user the wrong thing about how it behaves.
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 10px)',
      },

      spacing: {
        // Row height is a token because the density switch changes it globally.
        row: 'var(--row-h)',
        'row-pad': 'var(--row-pad)',
      },

      boxShadow: {
        // A single elevation scale, tinted with the theme's neutral so shadows do not
        // read as grey smudges on a warm or cool surface.
        low: '0 1px 2px oklch(var(--shadow) / 0.06), 0 1px 1px oklch(var(--shadow) / 0.04)',
        mid: '0 2px 4px oklch(var(--shadow) / 0.06), 0 4px 12px oklch(var(--shadow) / 0.08)',
        high: '0 8px 24px oklch(var(--shadow) / 0.12), 0 2px 6px oklch(var(--shadow) / 0.08)',
        pop: '0 16px 48px oklch(var(--shadow) / 0.18), 0 4px 12px oklch(var(--shadow) / 0.10)',
      },

      transitionDuration: {
        fast: 'var(--dur-fast)',
        normal: 'var(--dur-normal)',
        slow: 'var(--dur-slow)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        spring: 'var(--ease-spring)',
      },

      keyframes: {
        'caret-blink': { '0%,70%,100%': { opacity: '1' }, '20%,50%': { opacity: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        // Radix measures the panel and exposes its height as a variable, which is the
        // only reliable way to animate to `auto`.
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'row-flash': {
          '0%, 40%': { backgroundColor: 'oklch(var(--primary-soft))' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1.2s steps(1) infinite',
        shimmer: 'shimmer 1.6s infinite',
        'accordion-down': 'accordion-down var(--dur-normal) var(--ease-out)',
        'accordion-up': 'accordion-up var(--dur-fast) var(--ease-out)',
        'row-flash': 'row-flash 2.2s var(--ease-out) forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
