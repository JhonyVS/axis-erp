// GENERATED FILE — do not edit by hand. Source: scripts/build-themes.mjs

export interface ThemeMeta {
  id: string;
  name: string;
  blurb: string;
  swatch: { light: string[]; dark: string[] };
}

export const THEMES: ThemeMeta[] = [
  {
    "id": "graphite",
    "name": "Graphite",
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
    }
  },
  {
    "id": "nordic",
    "name": "Nordic",
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
    }
  },
  {
    "id": "ember",
    "name": "Ember",
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
    }
  },
  {
    "id": "violet",
    "name": "Violet",
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
    }
  },
  {
    "id": "forest",
    "name": "Forest",
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
    }
  },
  {
    "id": "contrast",
    "name": "High Contrast",
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
    }
  }
];

export const DEFAULT_THEME = 'graphite';
