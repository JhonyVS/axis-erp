# Axis ERP

Prototype ERP interface — warehouse/inventory, human resources, training, and an
integrated AI assistant. No backend: all data is seeded mock data. The interface is the
deliverable.

```bash
npm install
npm run dev      # http://localhost:5180
```

## What is in here

- **A sign-in screen** with a canvas backdrop — starfield, falling drops that splash on the
  water, layered waves — painted in the live theme's colours over a ground that stays the
  same in light and dark. The deliberate delay reports the steps it is working through
  rather than spinning. Nothing is verified and the screen says so.
- **A live component gallery** at `/components`: every primitive, interactive, with its
  hover, focus, press, disabled, loading and empty states reachable by actually using them.
- **11 themes × light/dark**, switched with one click, and grouped in the picker by
  **character** — matte, muted, vivid, contrast — because how loud a screen is allowed to
  be is the decision someone makes for the hours they sit in front of it, and hue is only
  the preference they express afterwards. Every colour is *derived* from a WCAG target by
  `scripts/build-themes.mjs`, never picked by eye: chroma is placed relative to the sRGB
  gamut shell at whatever lightness the contrast solver lands on, and how far up that
  shell each role sits is the theme's own dial. `npm run tokens` verifies 946 colour pairs
  and fails the build if any misses — including for the matte palettes, which is the point:
  calm is a chroma decision and must not become a contrast concession.
- **Synthesised interface sounds** (Web Audio, zero audio files), with a volume control
  and an off switch.
- **AI assistant dock** with visible tool calls, streamed answers, structured result
  blocks and a cited source under every figure.
- **Command palette** (`⌘K`) that reaches navigation, settings and records in one box.
- **Density switch** — comfortable / compact — that re-rhythms every table from one token.
- Accessibility treated as part of "done": focus rings, `aria-sort`, contextual live
  counts, reduced-motion support, and no meaning carried by colour alone.

`CLAUDE.md` carries the rules this project is built to. Read it before changing anything.

## License

MIT — see [LICENSE](LICENSE).
