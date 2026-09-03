/**
 * Theme generator — the color-expert layer of this project.
 *
 * Nothing in `src/styles/themes.css` is written by hand. Every value here is *derived*
 * from a rule ("the muted foreground is the lightest L that still clears 4.5:1 against
 * the surface it sits on") rather than picked by eye, which is the whole point: when a
 * theme's hue changes, the contrast guarantees survive.
 *
 * Two ideas do the work:
 *
 *   1. GAMUT-RELATIVE CHROMA. Colours are specified as `relC` — a fraction of the most
 *      chroma sRGB can actually show at that lightness and hue — not as an absolute
 *      number. An absolute chroma is a guess that is timid at some hues and out of gamut
 *      at others; `relC: 0.97` means "almost as saturated as this colour can physically
 *      get", and it means the same thing for yellow as for blue.
 *
 *   2. SOLVE FOR LIGHTNESS, THEN TAKE ALL THE CHROMA. Lightness carries the contrast
 *      guarantee, chroma carries the punch, and the two barely interfere. So the search
 *      moves L until the pair clears its WCAG target, and chroma is pushed to the gamut
 *      shell at whatever L that turns out to be.
 *
 * Pipeline:
 *   OKLCH spec -> Ottosson oklab->linear sRGB -> gamut map by chroma reduction
 *   -> WCAG 2.x relative luminance -> assert the pair clears its threshold
 *
 * Output is emitted as `L C H` triplets (not hex) so Tailwind can compose them with
 * `oklch(var(--token) / <alpha-value>)` and keep opacity modifiers working.
 *
 * Run: npm run tokens
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * 1. Colour maths — OKLCH <-> sRGB, gamut mapping, WCAG contrast
 * ------------------------------------------------------------------ */

/** Ottosson's OKLab -> linear sRGB. https://bottosson.github.io/posts/oklab/ */
function oklabToLinearSrgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function oklchToLinearSrgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  return oklabToLinearSrgb(L, C * Math.cos(hRad), C * Math.sin(hRad));
}

const EPS = 1e-6;
const inGamut = ({ r, g, b }) =>
  r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;

/**
 * The largest chroma sRGB can show at this lightness and hue — the gamut shell.
 *
 * This is what makes `relC` portable: max chroma at L 0.6 is roughly 0.13 for a blue and
 * roughly 0.19 for a red, so one absolute number can never mean "vivid" for both.
 */
function maxChroma(L, H) {
  let lo = 0;
  let hi = 0.45; // beyond any sRGB chroma in OKLCH
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinearSrgb(L, mid, H))) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Gamut-map by reducing chroma while holding L and H.
 * Clipping R/G/B instead would shift the hue — the colour would stop being the colour.
 */
function clampChroma(L, C, H) {
  if (inGamut(oklchToLinearSrgb(L, C, H))) return C;
  return maxChroma(L, H);
}

/** WCAG 2.x relative luminance operates on linear-light sRGB, which is what we already have. */
function relativeLuminance({ r, g, b }) {
  const clip = (v) => Math.min(1, Math.max(0, v));
  return 0.2126 * clip(r) + 0.7152 * clip(g) + 0.0722 * clip(b);
}

function contrast(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** A token: authored in OKLCH, carries its own linear-sRGB so contrast is cheap to check. */
function tok(L, C, H) {
  const c = clampChroma(L, C, H);
  return { L, C: c, H, rgb: oklchToLinearSrgb(L, c, H) };
}

/**
 * A token authored as a fraction of the gamut shell — the form used almost everywhere.
 *
 * `cap` is an absolute chroma ceiling, and it exists because the shell is wildly
 * uneven across hues: at L 0.88 sRGB offers a green four times the chroma it offers a
 * blue. Pure `relC` would make every green in the product scream while the blues stay
 * polite. The cap only bites where the gamut is generous, so it evens the family out
 * without flattening the hues that have no room to spare.
 */
function rel(L, relC, H, cap = Infinity) {
  return tok(L, Math.min(relC * maxChroma(L, H), cap), H);
}

const round = (n) => Number(n.toFixed(4)).toString();
const css = (t) => `${round(t.L)} ${round(t.C)} ${round(t.H)}`;

function toHex(t) {
  const enc = (v) => {
    const x = Math.min(1, Math.max(0, v));
    const s = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.round(s * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${enc(t.rgb.r)}${enc(t.rgb.g)}${enc(t.rgb.b)}`;
}

/* ------------------------------------------------------------------ *
 * 2. Derivation rules — "solve for L", not "pick a hex"
 * ------------------------------------------------------------------ */

/**
 * Solve for the LEAST heavy-handed lightness that still clears `target` contrast
 * against `against`, holding gamut-relative chroma constant along the way.
 *
 * The search always starts at the background's own lightness — where contrast is at its
 * minimum — and walks `towards` white (1) or black (0). Because it returns the first
 * value that passes, a muted foreground stays muted instead of collapsing into the
 * primary text colour, and a hairline border stays a hairline.
 *
 * Deriving the direction from the background rather than hard-coding a start per mode is
 * what makes one rule serve light and dark: in light mode the walk goes down from the
 * white surface, in dark mode it goes up from the near-black one, with no branch.
 */
function solveL({ relC, H, against, target, towards, from, steps = 260 }) {
  const start = from ?? against.L;
  const step = (towards - start) / steps;
  let best = null;
  for (let i = 0; i <= steps; i++) {
    const L = start + step * i;
    // Chroma is recomputed at every L: the gamut shell moves as lightness does, so a
    // fixed absolute chroma would go flat at the ends of the ramp.
    const t = rel(L, relC, H);
    const ratio = contrast(t.rgb, against.rgb);
    if (ratio >= target) return { ...t, ratio };
    if (!best || ratio > best.ratio) best = { ...t, ratio };
  }
  return best; // reported as a failure by the audit below
}

/**
 * Solve for the MOST SATURATED colour that still clears `target` against `against`.
 *
 * This is the opposite objective to `solveL`, and it is the right one for a fill whose
 * job is to be seen: sweep the whole lightness axis, keep every L that satisfies the
 * contrast rule, and return the one where the sRGB shell is widest.
 *
 * `solveL`'s "first value that passes" is correct for text and hairlines, where restraint
 * is the point. It is wrong for a brand button, where it stops at the muddiest colour
 * that technically qualifies.
 */
function solveMaxChroma({ relC, H, against, target, cap, steps = 400 }) {
  let best = null;
  for (let i = 0; i <= steps; i++) {
    const L = i / steps;
    const t = rel(L, relC, H, cap);
    if (contrast(t.rgb, against.rgb) < target) continue;
    if (!best || t.C > best.C) best = t;
  }
  return best;
}

/**
 * The two candidate label colours for a solid fill. They are defined ONCE and reused
 * both to solve the fill's lightness and to pick the label, so the pair that ships is
 * the exact pair that was measured. (Solving against pure white and then labelling with
 * a near-white silently costs ~0.1 of a contrast point — enough to miss 4.5:1.)
 */
const onCandidates = (hue) => ({
  light: rel(0.99, 0.06, hue),
  dark: rel(0.185, 0.12, hue),
});

function onColor(fill, hue) {
  const { light, dark } = onCandidates(hue);
  return contrast(light.rgb, fill.rgb) >= contrast(dark.rgb, fill.rgb) ? light : dark;
}

const AA_TEXT = 4.5; // WCAG 1.4.3 — normal text
const AA_UI = 3.0; // WCAG 1.4.11 — non-text UI (borders, icons, chart marks)

/**
 * How saturated each ROLE is, as a fraction of the gamut shell.
 *
 * This table is the volume knob for the whole product. Accent fills and chart series sit
 * almost on the shell because they are large blocks that should read as colour; text
 * pulls back slightly because very high chroma on small glyphs costs legibility even when
 * the contrast ratio is satisfied; surfaces stay near-neutral so a screen full of data
 * does not vibrate.
 */
const PUNCH = {
  solid: 0.97, // buttons, filled badges, the brand
  fg: 0.85, // accent-coloured text and icons on a surface
  soft: 0.95, // tinted chip and banner fills
  softFg: 0.88, // text on a tinted fill
  line: 0.92, // accent borders and rings
  chart: 0.97,
  surface: 0.08, // the neutral ladder
  text: 0.17, // neutral text
  border: 0.22,
};

/**
 * Chroma ceilings for the tinted fills, in absolute OKLCH chroma.
 *
 * Soft fills sit near the ends of the lightness axis, which is exactly where the gamut
 * shell is most lopsided between hues — so this is the one role that needs a cap to stay
 * a family rather than a collection of unrelated loudness levels.
 */
const SOFT_CAP = { light: 0.085, dark: 0.115 };

/* ------------------------------------------------------------------ *
 * 3. Theme specs — a theme is 6 numbers, not 60 hex codes
 * ------------------------------------------------------------------ */

/**
 * `neutralHue` tints every surface so the greys belong to the theme instead of being the
 * same slate in all six; `tint` scales how far that goes. `primaryHue` drives brand and
 * focus ring.
 *
 * The status hues stay constant across themes on purpose: red must mean danger in every
 * theme, or the colour stops carrying meaning.
 */
const THEMES = [
  {
    id: 'graphite',
    name: 'Graphite',
    blurb: 'Electric blue on cool graphite. High signal, high contrast.',
    neutralHue: 258,
    tint: 1,
    primaryHue: 264,
  },
  {
    id: 'nordic',
    name: 'Nordic',
    blurb: 'Saturated cyan on deep slate. Cold, sharp, legible at distance.',
    neutralHue: 220,
    tint: 1.5,
    primaryHue: 216,
  },
  {
    id: 'ember',
    name: 'Ember',
    blurb: 'Hot amber on warm sand. Built for the warehouse floor.',
    neutralHue: 62,
    tint: 1.5,
    primaryHue: 50,
  },
  {
    id: 'violet',
    name: 'Violet',
    blurb: 'Vivid magenta-violet. Maximum brand presence.',
    neutralHue: 300,
    tint: 1.3,
    primaryHue: 302,
  },
  {
    id: 'forest',
    name: 'Forest',
    blurb: 'Punchy emerald on warm neutral. Distinct from every status colour.',
    neutralHue: 155,
    tint: 1.2,
    primaryHue: 158,
  },
  {
    id: 'contrast',
    name: 'High Contrast',
    blurb: 'Pure achromatic surfaces, AAA body text, saturated accents.',
    neutralHue: 0,
    tint: 0,
    primaryHue: 250,
    highContrast: true,
  },
];

/** Status hues are shared: meaning must not drift between themes. */
const STATUS = {
  success: 148,
  warning: 78,
  danger: 27,
  info: 245,
};

/* ------------------------------------------------------------------ *
 * 4. Build one mode of one theme
 * ------------------------------------------------------------------ */

function buildMode(spec, mode) {
  const dark = mode === 'dark';
  const hc = !!spec.highContrast;
  const nh = spec.neutralHue;
  const tint = spec.tint;

  /** Which end of the lightness axis every derived colour walks towards in this mode. */
  const AWAY = dark ? 1 : 0;

  // Surface ladder. Light mode puts the card ABOVE the page (white on off-white);
  // dark mode inverts that relationship — a raised surface is lighter, not darker.
  const L = dark
    ? { bg: hc ? 0.11 : 0.161, surface: hc ? 0.17 : 0.199, s2: hc ? 0.23 : 0.249, s3: hc ? 0.145 : 0.179 }
    : { bg: hc ? 1.0 : 0.979, surface: 1.0, s2: hc ? 0.95 : 0.964, s3: hc ? 0.962 : 0.973 };

  const sPunch = PUNCH.surface * tint;
  const bg = rel(L.bg, dark ? sPunch * 1.6 : sPunch, nh);
  const surface = rel(L.surface, dark ? sPunch * 1.5 : sPunch * 0.25, nh);
  const surface2 = rel(L.s2, dark ? sPunch * 1.5 : sPunch * 1.1, nh);
  const surface3 = rel(L.s3, dark ? sPunch * 1.7 : sPunch * 1.1, nh);

  /**
   * Foregrounds are solved against `surface-2`, NOT against `surface`.
   *
   * surface-2 is the hover/raised tint, and it is the lower-contrast of the two in both
   * modes (a shade darker under light, a shade lighter under dark). Muted text appears on
   * both — table headers, hovered rows, card sub-headers — so solving against the card
   * alone produces a palette that quietly fails the moment the cursor lands on a row.
   * Solving the worst case makes the better case free.
   */
  const worst = surface2;

  const fg = rel(dark ? (hc ? 1.0 : 0.972) : hc ? 0.0 : 0.225, PUNCH.text * tint * 0.7, nh);

  const fgMuted = solveL({
    relC: PUNCH.text * tint,
    H: nh,
    against: worst,
    target: hc ? 7 : AA_TEXT,
    towards: AWAY,
  });

  // `fg-subtle` is for placeholders, disabled labels and decorative glyphs only.
  // It targets the 3:1 non-text bar, so it must never carry information on its own.
  const fgSubtle = solveL({
    relC: PUNCH.text * tint,
    H: nh,
    against: worst,
    target: hc ? AA_TEXT : AA_UI,
    towards: AWAY,
  });

  // A hairline is not a control boundary: 1.4:1 is enough to separate two adjacent
  // surfaces, and anything stronger draws a cage around every card.
  const border = solveL({
    relC: PUNCH.border * tint,
    H: nh,
    against: worst,
    target: hc ? AA_UI : 1.4,
    towards: AWAY,
  });

  // `border-strong` IS a control boundary (inputs, toggles), so it takes the 3:1 rule.
  const borderStrong = solveL({
    relC: PUNCH.border * tint,
    H: nh,
    against: worst,
    target: AA_UI,
    towards: AWAY,
  });

  /**
   * A full accent family: solid fill + its label, a foreground for use directly on the
   * surface, a tinted soft fill with its own label, and a line for the soft fill's edge.
   *
   * The soft fills are close in LIGHTNESS to the surface even though they are strongly
   * tinted — that is what makes them read as coloured paper rather than as a second
   * button. The consequence, which the components honour: a soft chip must always carry
   * TEXT, never colour alone.
   */
  function family(hue) {
    const cand = onCandidates(hue);

    /**
     * The solid fill, solved for MAXIMUM CHROMA rather than for a fixed polarity.
     *
     * Both label polarities are tried: a dark fill under a white label, and a bright fill
     * under a dark label. Whichever produces the more saturated fill wins.
     *
     * This matters because the sRGB shell peaks at very different lightnesses per hue.
     * Forcing a white label everywhere pushes amber and yellow down into the muddy part
     * of their ramp — the reason a hard-coded palette's yellow button always looks like
     * dried mustard. Letting amber go bright with dark text is both more saturated and
     * what every good design system does by hand; here it falls out of the rule.
     *
     * Each candidate is measured against the exact label it would ship with, so the 4.5:1
     * guarantee holds either way.
     */
    const underWhiteLabel = solveMaxChroma({
      relC: PUNCH.solid,
      H: hue,
      against: cand.light,
      target: AA_TEXT,
    });
    const underDarkLabel = solveMaxChroma({
      relC: PUNCH.solid,
      H: hue,
      against: cand.dark,
      target: AA_TEXT,
    });
    const solid = underDarkLabel.C > underWhiteLabel.C ? underDarkLabel : underWhiteLabel;

    const fgOnSurface = solveL({
      relC: PUNCH.fg,
      H: hue,
      against: worst,
      target: hc ? 7 : AA_TEXT,
      towards: AWAY,
    });

    // Lightness chosen for CHROMA, not for subtlety. At L 0.945 the sRGB shell has
    // almost nothing left — a "tinted" fill there is a rounding error away from white.
    // Dropping to 0.88 more than doubles the chroma available, and the fill finally
    // reads as coloured paper instead of as a slightly dirty white.
    const soft = dark
      ? rel(hc ? 0.30 : 0.33, PUNCH.soft, hue, SOFT_CAP.dark)
      : rel(hc ? 0.86 : 0.88, PUNCH.soft, hue, SOFT_CAP.light);

    const softFg = solveL({
      relC: PUNCH.softFg,
      H: hue,
      against: soft,
      target: hc ? 7 : AA_TEXT,
      towards: AWAY,
    });

    const line = solveL({ relC: PUNCH.line, H: hue, against: worst, target: AA_UI, towards: AWAY });

    return { solid, on: onColor(solid, hue), fg: fgOnSurface, soft, softFg, line };
  }

  /**
   * The sign-in ground.
   *
   * Deliberately NOT derived from the current mode: the login screen commits to one dark
   * stage in every theme, so the wave field and the falling particles read the same way
   * whichever mode the user is in. An effects backdrop that inverts with the light switch
   * has to be tuned twice and looks wrong once.
   *
   * It still belongs to the theme — the hue is the theme's own neutral, pushed to a
   * higher chroma than any surface would take, because at this lightness a near-neutral
   * reads as plain black and the theme identity disappears.
   */
  const loginBg = rel(0.145, 0.5, nh);
  const loginFg = rel(0.97, 0.1, nh);
  // Solved against the ground, not against a surface: this text sits directly on it.
  const loginFgMuted = solveL({ relC: 0.22, H: nh, against: loginBg, target: AA_TEXT, towards: 1 });

  const primary = family(spec.primaryHue);
  const success = family(STATUS.success);
  const warning = family(STATUS.warning);
  const danger = family(STATUS.danger);
  const info = family(STATUS.info);

  /**
   * Chart series.
   *
   * The hues are spread EVENLY around the wheel from the theme's primary, rather than
   * reusing the status hues. Two reasons, one of which cost a bug:
   *
   *  - Reusing them collides. `primaryHue + 165` put Graphite's sixth series at 69 deg,
   *    nine degrees from the warning series at 78 — indistinguishable. Forest was worse:
   *    its primary at 158 sat ten degrees from success at 148. Even spacing makes a
   *    collision impossible for any theme, at any primary hue.
   *  - A chart series that is exactly the danger red implies a meaning it does not have.
   *    Categories are not statuses, and borrowing the status palette says otherwise.
   *
   * Each series is then solved to clear 3:1 against the CARD, so a bar or a line is
   * distinguishable from its plot area without consulting the legend.
   */
  const chartHues = [0, 1, 2, 3, 4, 5].map((k) => (spec.primaryHue + k * 60) % 360);

  const charts = chartHues.map((h, i) =>
    solveL({
      relC: PUNCH.chart,
      H: h,
      against: surface,
      // Alternating the target pushes every other series further from the background,
      // which splits the set into two lightness bands. That is what keeps six series
      // separable in greyscale and under colour-vision deficiency, where hue alone fails.
      target: i % 2 === 0 ? AA_UI : 4.8,
      towards: AWAY,
    })
  );

  return {
    bg,
    surface,
    surface2,
    surface3,
    loginBg,
    loginFg,
    loginFgMuted,
    border,
    borderStrong,
    fg,
    fgMuted,
    fgSubtle,
    primary,
    success,
    warning,
    danger,
    info,
    charts,
    ring: primary.line,
  };
}

/* ------------------------------------------------------------------ *
 * 5. Emit CSS + audit
 * ------------------------------------------------------------------ */

function emitVars(p) {
  const lines = [];
  const push = (name, t) => lines.push(`    --${name}: ${css(t)};`);

  push('bg', p.bg);
  push('surface', p.surface);
  push('surface-2', p.surface2);
  push('surface-3', p.surface3);
  push('border', p.border);
  push('border-strong', p.borderStrong);
  push('fg', p.fg);
  push('fg-muted', p.fgMuted);
  push('fg-subtle', p.fgSubtle);
  push('ring', p.ring);
  push('login-bg', p.loginBg);
  push('login-fg', p.loginFg);
  push('login-fg-muted', p.loginFgMuted);

  for (const key of ['primary', 'success', 'warning', 'danger', 'info']) {
    const f = p[key];
    push(key, f.solid);
    push(`${key}-on`, f.on);
    push(`${key}-fg`, f.fg);
    push(`${key}-soft`, f.soft);
    push(`${key}-soft-fg`, f.softFg);
    push(`${key}-line`, f.line);
  }
  p.charts.forEach((c, i) => push(`chart-${i + 1}`, c));

  return lines.join('\n');
}

const audit = [];
function check(theme, mode, label, a, b, target) {
  const ratio = contrast(a.rgb, b.rgb);
  audit.push({ theme, mode, label, ratio, target, pass: ratio >= target - 0.005 });
}

function auditMode(themeId, mode, p) {
  const c = (label, a, b, t) => check(themeId, mode, label, a, b, t);
  c('fg / surface', p.fg, p.surface, 7);
  c('fg / bg', p.fg, p.bg, 7);
  c('fg-muted / surface', p.fgMuted, p.surface, AA_TEXT);
  c('fg-muted / surface-2', p.fgMuted, p.surface2, AA_TEXT);
  c('fg-muted / surface-3', p.fgMuted, p.surface3, AA_TEXT);
  c('fg-muted / bg', p.fgMuted, p.bg, AA_TEXT);
  c('login-fg / login-bg', p.loginFg, p.loginBg, 7);
  c('login-fg-muted / login-bg', p.loginFgMuted, p.loginBg, AA_TEXT);
  c('fg-subtle / surface', p.fgSubtle, p.surface, AA_UI);
  c('fg-subtle / surface-2', p.fgSubtle, p.surface2, AA_UI);
  c('border-strong / surface', p.borderStrong, p.surface, AA_UI);
  c('border-strong / surface-2', p.borderStrong, p.surface2, AA_UI);
  for (const key of ['primary', 'success', 'warning', 'danger', 'info']) {
    const f = p[key];
    c(`${key}-on / ${key}`, f.on, f.solid, AA_TEXT);
    c(`${key}-fg / surface`, f.fg, p.surface, AA_TEXT);
    c(`${key}-fg / surface-2`, f.fg, p.surface2, AA_TEXT);
    c(`${key}-soft-fg / ${key}-soft`, f.softFg, f.soft, AA_TEXT);
    c(`${key}-line / surface`, f.line, p.surface, AA_UI);
  }
  p.charts.forEach((ch, i) => c(`chart-${i + 1} / surface`, ch, p.surface, AA_UI));
}

const blocks = [];
const manifest = [];

for (const spec of THEMES) {
  const light = buildMode(spec, 'light');
  const dark = buildMode(spec, 'dark');
  auditMode(spec.id, 'light', light);
  auditMode(spec.id, 'dark', dark);

  const isDefault = spec.id === THEMES[0].id;
  const lightSel = isDefault ? `:root,\n  [data-theme='${spec.id}']` : `[data-theme='${spec.id}']`;
  const darkSel = isDefault
    ? `:root.dark,\n  [data-theme='${spec.id}'].dark`
    : `[data-theme='${spec.id}'].dark`;

  blocks.push(
    `  /* ${spec.name} — ${spec.blurb} */\n` +
      `  ${lightSel} {\n${emitVars(light)}\n  }\n\n` +
      `  ${darkSel} {\n${emitVars(dark)}\n  }`
  );

  manifest.push({
    id: spec.id,
    name: spec.name,
    blurb: spec.blurb,
    swatch: {
      light: [toHex(light.bg), toHex(light.primary.soft), toHex(light.primary.solid), toHex(light.fg)],
      dark: [toHex(dark.bg), toHex(dark.primary.soft), toHex(dark.primary.solid), toHex(dark.fg)],
    },
    loginBg: toHex(light.loginBg),
  });
}

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Source: scripts/build-themes.mjs   Regenerate: npm run tokens
 *
 * Tokens are OKLCH channel triplets ("L C H"), consumed as
 * \`oklch(var(--token) / <alpha-value>)\` so Tailwind opacity modifiers keep working.
 *
 * Chroma is gamut-relative: every accent sits as close to the sRGB shell as the PUNCH
 * table allows, at whatever lightness the WCAG solver landed on.
 */

@layer base {
`;

const outCss = `${header}${blocks.join('\n\n')}\n}\n`;
mkdirSync(resolve(__dirname, '../src/styles'), { recursive: true });
writeFileSync(resolve(__dirname, '../src/styles/themes.css'), outCss, 'utf8');

mkdirSync(resolve(__dirname, '../src/lib'), { recursive: true });
writeFileSync(
  resolve(__dirname, '../src/lib/themes.generated.ts'),
  `// GENERATED FILE — do not edit by hand. Source: scripts/build-themes.mjs\n\n` +
    `export interface ThemeMeta {\n  id: string;\n  name: string;\n  blurb: string;\n  swatch: { light: string[]; dark: string[] };\n  /** The sign-in ground — the same in both modes. */\n  loginBg: string;\n}\n\n` +
    `export const THEMES: ThemeMeta[] = ${JSON.stringify(manifest, null, 2)};\n\n` +
    `export const DEFAULT_THEME = '${THEMES[0].id}';\n`,
  'utf8'
);

/* Report */
const failures = audit.filter((a) => !a.pass);
const byTheme = new Map();
for (const a of audit) {
  const k = `${a.theme}/${a.mode}`;
  byTheme.set(k, (byTheme.get(k) ?? 0) + 1);
}

console.log(`\nGenerated ${THEMES.length} themes x 2 modes -> src/styles/themes.css`);
console.log(`Checked ${audit.length} colour pairs against WCAG 2.x.\n`);

for (const [k, n] of byTheme) {
  const f = failures.filter((x) => `${x.theme}/${x.mode}` === k);
  const mark = f.length === 0 ? 'PASS' : `FAIL (${f.length})`;
  console.log(`  ${k.padEnd(22)} ${String(n).padStart(3)} pairs   ${mark}`);
}

if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(
      `  ${f.theme}/${f.mode}  ${f.label.padEnd(28)} ${f.ratio.toFixed(2)}:1  (needs ${f.target}:1)`
    );
  }
  process.exitCode = 1;
} else {
  console.log('\nAll pairs clear their WCAG target.');
}
