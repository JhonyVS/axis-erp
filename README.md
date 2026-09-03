# Axis ERP

Prototype ERP interface — warehouse/inventory, human resources, training, and an
integrated AI assistant. No backend: all data is seeded mock data. The interface is the
deliverable.

```bash
npm install
npm run dev      # http://localhost:5180
```

## What is in here

- **A live component gallery** at `/components`: every primitive, interactive, with its
  hover, focus, press, disabled, loading and empty states reachable by actually using them.
- **6 themes × light/dark**, switched with one click. Every colour is *derived* from a
  WCAG target by `scripts/build-themes.mjs`, never picked by eye — chroma is pushed to the
  sRGB gamut shell at whatever lightness the contrast solver lands on. `npm run tokens`
  verifies 492 colour pairs and fails the build if any misses.
- **Synthesised interface sounds** (Web Audio, zero audio files), with a volume control
  and an off switch.
- **AI assistant dock** with visible tool calls, streamed answers, structured result
  blocks and a cited source under every figure.
- **Command palette** (`⌘K`) that reaches navigation, settings and records in one box.
- **Density switch** — comfortable / compact — that re-rhythms every table from one token.
- Accessibility treated as part of "done": focus rings, `aria-sort`, contextual live
  counts, reduced-motion support, and no meaning carried by colour alone.

`CLAUDE.md` carries the rules this project is built to. Read it before changing anything.
