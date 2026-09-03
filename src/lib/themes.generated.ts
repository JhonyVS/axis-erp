// GENERATED FILE — do not edit by hand. Source: scripts/build-themes.mjs

export interface ThemeMeta {
  id: string;
  name: string;
  /** Chroma register, not hue: the axis the menu is grouped by. */
  character: 'matte' | 'muted' | 'vivid' | 'contrast';
  blurb: string;
  swatch: { light: string[]; dark: string[] };
  /** The sign-in ground — the same in both modes. */
  loginBg: string;
}

export const THEMES: ThemeMeta[] = [
  {
    "id": "slate-matte",
    "name": "Slate Matte",
    "character": "matte",
    "blurb": "Near-neutral page, dusty slate action. Chroma pulled right back for a shift.",
    "swatch": {
      "light": [
        "#f8f8f8",
        "#ced8e8",
        "#5e81b4",
        "#1a1c1e"
      ],
      "dark": [
        "#0c0e0f",
        "#243650",
        "#5e81b4",
        "#f5f6f6"
      ]
    },
    "loginBg": "#070a0e"
  },
  {
    "id": "stone-matte",
    "name": "Stone Matte",
    "character": "matte",
    "blurb": "Warm paper instead of a white lamp, with the same slate-blue action.",
    "swatch": {
      "light": [
        "#efe9e2",
        "#ced8e8",
        "#5e81b4",
        "#221a12"
      ],
      "dark": [
        "#120c07",
        "#243650",
        "#5e81b4",
        "#f9f5f1"
      ]
    },
    "loginBg": "#0c0a07"
  },
  {
    "id": "clay-matte",
    "name": "Clay Matte",
    "character": "matte",
    "blurb": "A terracotta action instead of a blue one, at the same low chroma.",
    "swatch": {
      "light": [
        "#f8f8f7",
        "#e9d1ce",
        "#bf6f65",
        "#1d1b19"
      ],
      "dark": [
        "#0f0d0c",
        "#4f2925",
        "#bf6f65",
        "#f7f5f5"
      ]
    },
    "loginBg": "#0d0907"
  },
  {
    "id": "steel",
    "name": "Steel",
    "character": "muted",
    "blurb": "The conventional ERP blue, stopped well short of electric. Six-hue charts.",
    "swatch": {
      "light": [
        "#f8f8f8",
        "#c8d9f3",
        "#487fd0",
        "#191c1e"
      ],
      "dark": [
        "#0c0e0f",
        "#18355f",
        "#487fd0",
        "#f5f6f7"
      ]
    },
    "loginBg": "#060b0f"
  },
  {
    "id": "mono-blue",
    "name": "Mono Blue",
    "character": "muted",
    "blurb": "Steel exactly, except the chart series are tonal steps of the one blue.",
    "swatch": {
      "light": [
        "#f8f8f8",
        "#c8d9f3",
        "#487fd0",
        "#191c1e"
      ],
      "dark": [
        "#0c0e0f",
        "#18355f",
        "#487fd0",
        "#f5f6f7"
      ]
    },
    "loginBg": "#060b0f"
  },
  {
    "id": "graphite",
    "name": "Graphite",
    "character": "vivid",
    "blurb": "Electric blue on cool graphite. High signal, high contrast.",
    "swatch": {
      "light": [
        "#f8f8f9",
        "#c5d8fd",
        "#033dfa",
        "#191c20"
      ],
      "dark": [
        "#0b0e11",
        "#15306f",
        "#033dfa",
        "#f5f6f7"
      ]
    },
    "loginBg": "#040a15"
  },
  {
    "id": "nordic",
    "name": "Nordic",
    "character": "vivid",
    "blurb": "Saturated cyan on deep slate. Cold, sharp, legible at distance.",
    "swatch": {
      "light": [
        "#f7f8f9",
        "#94e6fb",
        "#21d9fd",
        "#181d1e"
      ],
      "dark": [
        "#0b0e0f",
        "#053c48",
        "#21d9fd",
        "#f3f6f7"
      ]
    },
    "loginBg": "#050b0e"
  },
  {
    "id": "ember",
    "name": "Ember",
    "character": "vivid",
    "blurb": "Hot amber on warm sand. Built for the warehouse floor.",
    "swatch": {
      "light": [
        "#f9f8f7",
        "#fdcbb0",
        "#fc7a15",
        "#1f1b17"
      ],
      "dark": [
        "#100d0a",
        "#562604",
        "#fc7a15",
        "#f7f5f4"
      ]
    },
    "loginBg": "#0f0904"
  },
  {
    "id": "violet",
    "name": "Violet",
    "character": "vivid",
    "blurb": "Vivid magenta-violet. Maximum brand presence.",
    "swatch": {
      "light": [
        "#f8f8f9",
        "#dfcefd",
        "#9815fb",
        "#1d1a23"
      ],
      "dark": [
        "#0e0c13",
        "#412165",
        "#9815fb",
        "#f6f5f7"
      ]
    },
    "loginBg": "#0d0618"
  },
  {
    "id": "forest",
    "name": "Forest",
    "character": "vivid",
    "blurb": "Punchy emerald on warm neutral. Distinct from every status colour.",
    "swatch": {
      "light": [
        "#f6f9f7",
        "#a8e9c2",
        "#26fea3",
        "#191d1a"
      ],
      "dark": [
        "#0b0e0c",
        "#064026",
        "#26fea3",
        "#f3f7f4"
      ]
    },
    "loginBg": "#050c07"
  },
  {
    "id": "contrast",
    "name": "High Contrast",
    "character": "contrast",
    "blurb": "Pure achromatic surfaces, AAA body text, saturated accents.",
    "swatch": {
      "light": [
        "#ffffff",
        "#b0d5fd",
        "#1495fb",
        "#000000"
      ],
      "dark": [
        "#040404",
        "#042f54",
        "#1495fb",
        "#ffffff"
      ]
    },
    "loginBg": "#14050a"
  }
];

export const DEFAULT_THEME = 'slate-matte';
