# CLAUDE.md — Axis ERP

Prototype ERP interface: warehouse/inventory, human resources and training, with an
integrated AI assistant. **There is no backend.** All data is mock data under `src/mock/`.
The deliverable is the interface.

```bash
npm install
npm run dev        # http://localhost:5180
npm run tokens     # regenerate the theme system + run the WCAG audit
npm run build      # tsc --noEmit, then vite build
```

---

## The design workflow is mandatory

This project exists to apply three specific tools. They are not optional and they are not
a formality — the whole architecture below came out of them.

### 1. Before writing or changing anything under `src/components/` or `src/modules/`

Invoke the **`ui-ux-pro-max`** skill. Query one concern at a time:

```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack react
```

Use `--design-system` only when adding a whole new surface, and keep the dials this
project was built with: `--variance 5 --motion 6 --density 8`.

### 2. Before introducing or changing any colour

Invoke the **`color-expert`** skill, then express the change as a **rule in
`scripts/build-themes.mjs`** — never as a literal in a component.

**No component may contain a colour.** Not a hex, not `bg-emerald-100`, not an inline
`style` with a colour. If a component needs a colour that does not exist, add a semantic
token to the generator and let all twelve palettes derive it.

### 3. Animation is `framer-motion` + `tailwindcss-animate`

- Durations and easings come from `src/lib/motion.ts` (JS) and the `--dur-*` / `--ease-*`
  custom properties (CSS). Never type a duration inline.
- Every JS-driven animation reads `useReducedMotion()` and degrades to its final state.
- Animate `transform` and `opacity` only. `width` is animated in exactly one place — the
  sidebar collapse — because it is a single element on an explicit user action.
- Exit animations run at roughly 65% of the enter duration.
- No overshoot springs on dense informational rows. They read as sloppy on a data table
  however good they feel on a marketing card.

---

## Theme system

Six themes × light/dark = twelve palettes, switched by **one click**, with no component
changes and no re-render.

```
scripts/build-themes.mjs        the ONLY place colour is decided
  └── src/styles/themes.css     GENERATED — never edit
  └── src/lib/themes.generated.ts  GENERATED — the manifest the switcher reads
```

**How it works.** `<html data-theme="ember" class="dark">`. Themes are CSS custom
properties, so switching one repaints without React doing anything;
`src/stores/prefsStore.ts` writes the attribute directly for that reason.

**Tokens are OKLCH channel triplets**, not hex:

```css
--primary: 0.4925 0.277 264;
```

consumed as `oklch(var(--primary) / <alpha-value>)`, which is what keeps Tailwind opacity
modifiers (`bg-primary/10`) working. A hex behind a variable breaks them.

**Nothing is picked by eye.** Every value is *solved* against a WCAG target, then
verified. `npm run tokens` checks 492 colour pairs and exits non-zero if any fails.
Adding a theme means adding four numbers to `THEMES`, not sixty hex codes.

Three rules do the work, and they are the part to preserve:

1. **Chroma is gamut-relative.** Colours are specified as `relC` — a fraction of the most
   chroma sRGB can physically show at that lightness and hue. An absolute chroma is timid
   at some hues and out of gamut at others; `relC: 0.97` means the same thing for yellow
   as for blue. The `PUNCH` table is the product's volume knob.
2. **Solve L for contrast; take all the chroma at that L.** Lightness carries the
   guarantee, chroma carries the punch, and they barely interfere. For text and hairlines
   the solver returns the FIRST lightness that passes (restraint is the point); for solid
   fills it returns the lightness where the gamut shell is WIDEST (`solveMaxChroma`) —
   otherwise a brand button stops at the muddiest colour that technically qualifies.
3. **Fill polarity is derived, not fixed.** Both label polarities are measured and the more
   saturated fill wins. That is why amber goes bright with dark text while blue goes deep
   with white text — the thing a good design system does by hand, falling out of the rule.

**Do not reuse the status hues for chart series.** They are spread evenly from the primary
(`primaryHue + k*60`) for two reasons: even spacing makes a hue collision impossible at any
primary (`primaryHue + 165` once put a series 9° from `warning`, and Forest's primary sat
10° from `success`), and a category that is exactly the danger red implies a meaning it
does not have.

**Two rules that fall out of this and must be honoured in components:**

1. `fg-subtle` clears 3:1, not 4.5:1. It is for placeholders, disabled labels and
   decorative glyphs. **It must never carry information.**
2. The `-soft` fills are near-isoluminant with the surface. **A badge always carries
   text**, and status is never conveyed by colour alone.

---

## Interface sounds

`src/lib/sound.ts`. Every sound is **synthesised with the Web Audio API** — there are no
audio files. Zero network weight, zero decode latency, and the whole palette is tunable
from the note table in that file.

- The `AudioContext` is created on the **first real user gesture** (`primeAudio()` in
  `App.tsx`). Browsers refuse to start audio before one.
- Nothing is longer than ~260ms and everything sits on one pentatonic set, so two sounds
  firing together never beat.
- Rate-limited per sound. A list rendering 40 rows must not fire 40 taps.
- Sound is a `Button` prop (`sound="tap"`, or `sound={null}` to silence). Do not call
  `playSound` from inside a render.

---

## Accessibility is part of "done"

Non-negotiable, and cheap when done first:

- Focus rings are **never** removed. One treatment, defined once in `globals.css`.
- Icon-only controls carry an `aria-label` naming the object, not the icon
  (`"Delete Hex Bolt M12"`, not `"Delete"`). Decorative icons take `aria-hidden="true"`.
- A sortable column exposes `aria-sort`; the icon and the announced state come from the
  same variable so they cannot disagree.
- Result counts are announced as a **contextual phrase** ("12 of 64 items match your
  filters"), not a bare number.
- Errors sit below their field and are wired with `aria-describedby`. Use the `Field`
  component in `ui/input.tsx`.
- Anything conveyed by colour is also conveyed by text or shape.
- `prefers-reduced-motion` is honoured in CSS *and* in every `framer-motion` component.

---

## Conventions

**Language.** Every string a user sees is in **English** — labels, placeholders, buttons,
tooltips, errors, empty states, headings. This file too.

**Styling.** Tailwind classes. No inline `style` except for a computed dimension (a
progress bar's width) or a value that genuinely comes from data.

**Toasts.** `toast.success/error/warning/info` for reporting; `toast.undo` when the action
is reversible. For an undo toast the **expiry is the commit** — `onCommit` runs when the
timer ends, `onUndo` cancels it. Getting that backwards silently destroys the record the
user just rescued. Hovering the stack pauses every timer.

**Alert vs toast.** A banner reports a standing condition on the page; a toast reports
something that just happened and then leaves. If it is still true after a reload, it is a
banner.

**Every collection gets the same five verbs**: `add`, `update`, `remove`, `restore`,
`commit`. Deletes are soft everywhere — `remove` parks the record with its ORIGINAL index
and `restore` splices it back there, because appending it to the end "restores" the row
somewhere the user never had it, which reads as a second mistake. The park/restore/commit
logic is written once as pure functions in `dataStore.ts`; do not hand-roll a fourth copy.

**Module parity.** Inventory, Directory and Courses all offer the same affordances, and a
new module is expected to match: a create dialog, an edit dialog behind a per-row/card
action menu, a detail drawer on click, destructive delete behind `ConfirmDialog`, an undo
toast, and a brief flash on the record just created or edited. A module that only lists is
half a module.

**Data lives in `stores/dataStore.ts`, not in `mock/data.ts`.** The mock module SEEDS the
store once; every read and write afterwards goes through the store. Importing the frozen
module constant into a module is what made "New item" a decoration — a form can validate
perfectly and still have nowhere to put its result. The assistant reads the store too, so
it can never cite a count that contradicts the table on screen.

**Forms.** Copy the shape in `modules/warehouse/ItemFormDialog.tsx`:
errors on **blur** (not per keystroke), a submit button that is **never disabled** for
invalid input (clicking reveals every error and focuses the first invalid field — a
disabled button with no visible error is a dead end), a synchronous `useRef` guard against
double-click on top of the `isSubmitting` state, and failure as a red `Alert` **inside**
the dialog, which stays open.

**Empty states.** "Nothing here yet" and "nothing matches your filters" are different
problems with different fixes, so they are different components with different copy and
different buttons. See `EmptyState` usage in `modules/warehouse/Inventory.tsx`.

**Loading.** Skeletons that occupy the real element's height, never a spinner that
collapses the layout and shoves it back open. `DataTable` does this for you.

**Dates.** Relative for scanning (`relative()`), absolute **with the year** in the tooltip
(`dateTime()`). A relative label alone is ambiguous the moment someone reads it a week
later.

**Numbers.** `font-mono` + `tabular` on anything that lines up in a column — SKUs, bin
codes, quantities, money. Numbers must not change width as they change value.

**Modals.** No close X in the corner. Dialogs close via their explicit `Cancel`/`Close`
button in the footer, plus Escape and outside-click when not blocking.

**Dialog centring.** Use the full-screen flex wrapper in `ui/dialog.tsx`. Never
`left-1/2 -translate-x-1/2` on a Framer Motion element — Motion writes its own `transform`
and silently overwrites the Tailwind translate, parking the dialog in the corner.

**Radix + `asChild`.** Any component used as an `asChild` trigger must be a
`forwardRef`. A plain function component drops the ref and the trigger never opens.

**One stylesheet.** `main.tsx` imports `src/styles/globals.css` and nothing else. Do not
add a second entry point — an unimported stylesheet is a trap that costs the next person
an afternoon.

---

## Structure

```
scripts/build-themes.mjs      colour generator + WCAG audit
src/
  styles/globals.css          the only imported stylesheet
  styles/themes.css           GENERATED
  lib/                        utils, motion tokens, sound engine, hooks
  stores/                     prefs (theme/mode/density/sound), transient UI, workspace data
  components/
    ui/                       primitives — button, badge, card, input, dialog, sheet,
                              alert, toast, checkbox, radio, slider, segmented,
                              accordion, dropdown, tabs, tooltip, confirm-dialog
    layout/                   Sidebar, Topbar
    theme/                    ThemeSwitcher, ModeToggle
    ai/                       AiDock + engine (swap `answer()` for a real API)
    command/                  CommandPalette (⌘K)
    data/                     DataTable, StatCard, EmptyState, Section, PageHeader
  modules/                    Dashboard, Components (gallery), warehouse/, hr/, training/
  mock/data.ts                seeded, deterministic fixtures
```

**Keyboard:** `⌘K` command palette · `⌘J` assistant · `/` search · `Esc` close.

## Sign-in

`/login`, guarded by `RequireAuth` in `App.tsx`. The guard stashes the attempted path in
route state so the redirect after sign-in lands the user where they were going — a deep
link that survives the login is the difference between a shareable URL and a decorative one.

**Nothing is verified.** `authStore.signIn` accepts anything, and the screen says so out
loud. Keep that notice: a prototype login that *looks* like it checks credentials teaches
people to type real passwords into a demo. Never add password storage, never remove the
`autoComplete` attributes (blocking a password manager is the fastest way to make a login
hostile — WCAG 3.3.8).

The 1.9s delay is deliberate, and so is what fills it: the card lists the steps it is going
through and ticks each one off. Authentication is the one place a pause is expected, and an
indeterminate spinner there reads as a hang where a visible sequence reads as progress.

### The backdrop

`components/auth/LoginBackdrop.tsx` — a starfield, falling drops that splash where they
meet the water, and layered waves, all painted from the live theme tokens. The sign-in
screen proves the theme system before any data is on screen.

**One canvas, one animation loop.** Three effect components would mean three canvases and
three `requestAnimationFrame` callbacks fighting over the same frame budget, on a screen
whose whole job is to look effortless. If you add an effect, add it to this loop.

**The ground is `--login-bg`, and it is the SAME token in light and dark.** The sign-in
screen commits to one dark stage in every theme so the effects sit on a known background —
a backdrop that inverts with the mode toggle has to be tuned twice and looks wrong once.
Two consequences to keep in mind:

- Text on the ground uses `text-login-fg` / `text-login-fg-muted`, both solved against it.
- Anything with a THEMED surface inside that page must re-establish its own foreground
  (the card carries `text-fg`). Otherwise it inherits `text-login-fg` and you get
  near-white text on a near-white card — invisible, and only for the elements that inherit,
  which is why it survives a casual look.

**A drop is tested against the wave surface function that draws the wave**, so a splash
lands exactly where the water is at that instant. Layer 0 is the waterline and is given a
drawn crest line: its fill is a soft gradient, so without the line the eye reads the
surface lower than the maths puts it and the ripples appear to float in mid-air.

Densities scale with area rather than being fixed counts, the loop suspends while the tab
is hidden, `dt` is clamped so a long pause cannot teleport every drop to the bottom, and
reduced motion paints one composed frame and stops.

## The component gallery is the regression surface

`/components` renders every primitive live and interactive. Add a component to it in the
same commit that adds the component — a primitive that is not in the gallery is one nobody
will find, and one whose hover, focus, disabled and loading states nobody has looked at.

Switch theme, mode and density with that page open. Anything holding a hard-coded colour
or a fixed padding shows up immediately, which is cheaper than finding it in a module.

**Tailwind's JIT scans source text and never runs the program.** `bg-${family}` compiles to
nothing and renders transparent. Write class names out in full and select them from a
static map — see `FAMILY_CLASSES` in `modules/Components.tsx`.

## Where the AI assistant plugs in

`src/components/ai/engine.ts` exports `answer(question): Answer`. It returns named tool
calls and structured blocks — text, stats, table, actions — plus a cited source. Replacing
it with a real model means replacing that one function and streaming the blocks it
returns. Nothing in `AiDock.tsx` changes.

Keep the two properties that make it trustworthy: **name the data you read**, and **cite
the source under the answer**. An unsourced figure in an ERP is a liability.
