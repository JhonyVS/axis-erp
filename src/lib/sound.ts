/**
 * UI sound engine.
 *
 * Every sound is SYNTHESISED with the Web Audio API rather than loaded from a file.
 * That is a deliberate architectural choice, not a shortcut:
 *   - zero network weight and zero decode latency, so feedback lands inside the ~100ms
 *     window where it still reads as a response to the click rather than an echo of it;
 *   - the whole palette is tunable from twelve numbers below instead of a re-export
 *     from an audio editor;
 *   - nothing to 404 in an offline warehouse.
 *
 * Design constraints this file holds itself to:
 *   - Nothing longer than ~260ms. A UI sound that outlasts the interaction is a toy.
 *   - Everything sits on one pentatonic set, so two sounds firing together never beat.
 *   - Peak gain is low by construction; the master control only scales down from there.
 *   - The AudioContext is created on the first real user gesture. Browsers refuse to
 *     start audio before one, and probing for it early just logs warnings.
 */

export type SoundName =
  | 'tap' // any ordinary button
  | 'nav' // route change / sidebar item
  | 'toggleOn'
  | 'toggleOff'
  | 'open' // dialog, sheet, dock appears
  | 'close'
  | 'success' // an operation completed
  | 'error' // an operation failed, or a blocked action
  | 'notify' // something arrived that the user did not ask for
  | 'send' // user sent a chat message
  | 'receive' // assistant finished answering
  | 'type'; // per-token tick while the assistant streams

/* ------------------------------------------------------------------ *
 * Note table — one pentatonic set keeps simultaneous sounds consonant
 * ------------------------------------------------------------------ */
const N = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
} as const;

interface Note {
  /** Start offset from the trigger, in seconds. */
  at: number;
  freq: number;
  /** Slide to this frequency across the note. Gives toggles their up/down direction. */
  to?: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
}

interface Voice {
  notes: Note[];
  /** Lowpass cutoff. Everything is filtered — raw oscillators sound cheap and fatiguing. */
  cutoff: number;
}

const VOICES: Record<SoundName, Voice> = {
  tap: { cutoff: 2600, notes: [{ at: 0, freq: N.E5, dur: 0.045, gain: 0.16, type: 'sine' }] },

  nav: {
    cutoff: 3000,
    notes: [
      { at: 0, freq: N.G4, dur: 0.05, gain: 0.13 },
      { at: 0.045, freq: N.D5, dur: 0.07, gain: 0.11 },
    ],
  },

  // Direction is carried by the glide, so the two toggles are distinguishable with
  // eyes closed — which is the only reason to have two of them.
  toggleOn: { cutoff: 3200, notes: [{ at: 0, freq: N.D5, to: N.A5, dur: 0.1, gain: 0.15 }] },
  toggleOff: { cutoff: 2200, notes: [{ at: 0, freq: N.A5, to: N.D5, dur: 0.1, gain: 0.13 }] },

  open: {
    cutoff: 2800,
    notes: [
      { at: 0, freq: N.C5, dur: 0.09, gain: 0.11 },
      { at: 0.03, freq: N.G5, dur: 0.11, gain: 0.08 },
    ],
  },
  close: {
    cutoff: 1800,
    notes: [
      { at: 0, freq: N.G4, dur: 0.09, gain: 0.1 },
      { at: 0.03, freq: N.C4, dur: 0.11, gain: 0.08 },
    ],
  },

  // A rising major triad. Unmistakably "done", and short enough to fire on every save.
  success: {
    cutoff: 4000,
    notes: [
      { at: 0, freq: N.C5, dur: 0.08, gain: 0.13 },
      { at: 0.055, freq: N.E5, dur: 0.08, gain: 0.12 },
      { at: 0.11, freq: N.G5, dur: 0.15, gain: 0.13 },
    ],
  },

  // Deliberately not a buzzer. A falling minor second reads as "no" without the
  // adrenaline spike of a harsh alarm — this fires on a mistyped field, not a fire.
  error: {
    cutoff: 1200,
    notes: [
      { at: 0, freq: 311.13, dur: 0.11, gain: 0.15, type: 'triangle' },
      { at: 0.09, freq: 233.08, dur: 0.19, gain: 0.14, type: 'triangle' },
    ],
  },

  notify: {
    cutoff: 5000,
    notes: [
      { at: 0, freq: N.A5, dur: 0.07, gain: 0.1 },
      { at: 0.09, freq: N.E5, dur: 0.14, gain: 0.09 },
    ],
  },

  send: { cutoff: 3400, notes: [{ at: 0, freq: N.A4, to: N.E5, dur: 0.075, gain: 0.12 }] },
  receive: {
    cutoff: 2400,
    notes: [
      { at: 0, freq: N.E5, dur: 0.09, gain: 0.1 },
      { at: 0.05, freq: N.C5, dur: 0.16, gain: 0.09 },
    ],
  },

  // Fires many times per second while streaming, so it is near-silent and very short.
  // Anything louder becomes a machine gun after two sentences.
  type: { cutoff: 6000, notes: [{ at: 0, freq: N.C6, dur: 0.014, gain: 0.028 }] },
};

/* ------------------------------------------------------------------ *
 * Engine
 * ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.6;

/** Per-sound rate limit. A list rendering 40 rows must not fire 40 taps. */
const lastPlayed = new Map<SoundName, number>();
const MIN_GAP_MS: Partial<Record<SoundName, number>> = { type: 22, tap: 30, nav: 60 };

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) {
    // Browsers suspend the context when a tab is backgrounded; resume is cheap.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Call from the first real user gesture. Creating the context inside the click handler
 * is what makes it start unsuspended; doing it on mount produces a context that is
 * alive but muted, and the first few sounds silently vanish.
 */
export function primeAudio(): void {
  ensureContext();
}

export function setSoundEnabled(next: boolean): void {
  enabled = next;
  if (next) ensureContext();
}

export function setSoundVolume(next: number): void {
  volume = Math.min(1, Math.max(0, next));
  if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.01);
}

export function playSound(name: SoundName): void {
  if (!enabled) return;

  const gap = MIN_GAP_MS[name];
  if (gap !== undefined) {
    const now = performance.now();
    if (now - (lastPlayed.get(name) ?? 0) < gap) return;
    lastPlayed.set(name, now);
  }

  const audio = ensureContext();
  if (!audio || !master || audio.state !== 'running') return;

  const voice = VOICES[name];
  const t0 = audio.currentTime;

  // One filter per trigger rather than one shared: overlapping sounds would otherwise
  // fight over the same cutoff automation.
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = voice.cutoff;
  filter.Q.value = 0.6;
  filter.connect(master);

  for (const note of voice.notes) {
    const osc = audio.createOscillator();
    osc.type = note.type ?? 'sine';

    const start = t0 + note.at;
    const end = start + note.dur;

    osc.frequency.setValueAtTime(note.freq, start);
    if (note.to !== undefined) {
      // Exponential, not linear — pitch is perceived logarithmically, so a linear ramp
      // sounds like it accelerates at the end.
      osc.frequency.exponentialRampToValueAtTime(note.to, end);
    }

    // Percussive envelope: a 6ms attack is fast enough to feel instant but slow enough
    // to avoid the click that a hard gate produces.
    const env = audio.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(note.gain, start + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(env);
    env.connect(filter);
    osc.start(start);
    osc.stop(end + 0.02);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
  }

  // Tear the filter down after the longest note has decayed.
  const tail = Math.max(...voice.notes.map((n) => n.at + n.dur)) + 0.1;
  window.setTimeout(() => filter.disconnect(), tail * 1000 + 60);
}

/** Convenience for JSX: `onClick={withSound('tap', handleClick)}`. */
export function withSound<E>(name: SoundName, handler?: (event: E) => void) {
  return (event: E) => {
    playSound(name);
    handler?.(event);
  };
}
