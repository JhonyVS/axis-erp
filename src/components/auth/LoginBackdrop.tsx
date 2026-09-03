import { useEffect, useRef } from 'react';
import { usePrefs } from '@/stores/prefsStore';

/**
 * The animated backdrop behind the sign-in screen: a starfield, falling drops that splash
 * where they meet the water, and layered waves — all painted in the CURRENT THEME's own
 * colours, read straight from the generated custom properties.
 *
 * The ground itself is NOT painted here. It is `--login-bg`, a token that is identical in
 * light and dark, so the effects sit on one committed stage in every theme instead of
 * having to be tuned twice for a background that inverts with the mode toggle.
 *
 * Everything is one canvas and one animation loop. Three separate effect components would
 * mean three canvases and three requestAnimationFrame callbacks fighting over the same
 * frame budget, on a screen whose entire job is to look effortless.
 *
 * The detail that ties it together: a drop does not vanish at an arbitrary height. It is
 * tested against the actual wave surface below it — the same function that draws the
 * wave — so it splashes exactly where the water happens to be at that instant, and the
 * ripple rides the crest.
 *
 * Honoured throughout: `prefers-reduced-motion` paints a single composed frame and stops,
 * and the loop suspends while the tab is hidden.
 */

/** Wave layers. Frequencies are deliberately not integer multiples of each other. */
const WAVES = [
  // Layer 0 is the waterline: drops collide with THIS surface, so it is drawn with a
  // crest line and carries the most weight of the five.
  { token: '--chart-1', alpha: 0.6, amp: 0.05, y: 0.6, speed: 0.055, freqs: [1.0, 2.3, 3.7], phase: 0.0 },
  { token: '--chart-2', alpha: 0.45, amp: 0.06, y: 0.66, speed: -0.041, freqs: [0.8, 1.9, 3.1], phase: 1.7 },
  { token: '--chart-3', alpha: 0.4, amp: 0.045, y: 0.76, speed: 0.068, freqs: [1.3, 2.7, 4.3], phase: 3.4 },
  { token: '--primary', alpha: 0.45, amp: 0.07, y: 0.86, speed: -0.03, freqs: [0.7, 1.6, 2.9], phase: 5.1 },
  { token: '--chart-5', alpha: 0.35, amp: 0.04, y: 0.95, speed: 0.049, freqs: [1.1, 2.1, 3.3], phase: 2.2 },
] as const;

/** Tokens the drops and stars pick from. */
const SPARK_TOKENS = ['--chart-1', '--chart-2', '--primary', '--login-fg'] as const;

interface Star {
  x: number;
  y: number;
  r: number;
  /** Twinkle phase and rate. Each star is on its own clock or they pulse in unison. */
  phase: number;
  rate: number;
  color: number;
}

interface Drop {
  x: number;
  y: number;
  /** Fall speed in px/s, and the length of the trail it drags. */
  vy: number;
  len: number;
  color: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  /** Seconds since impact; the ring expands and fades against `life`. */
  age: number;
  life: number;
  color: number;
}

export function LoginBackdrop({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Re-reading on these two is what re-colours the field when the user switches theme.
  const theme = usePrefs((s) => s.theme);
  const mode = usePrefs((s) => s.mode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Tokens are OKLCH channel triplets, so alpha is composed at use rather than baked
     * into the palette. Canvas2D accepts CSS Color 4, which is what lets these effects
     * use the exact colour the rest of the app does instead of an approximation.
     */
    const cssVar = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    let waveColors: string[] = [];
    let sparkTriplets: string[] = [];

    const readColors = () => {
      waveColors = WAVES.map((w) => {
        const t = cssVar(w.token);
        return t ? `oklch(${t} / ${w.alpha})` : `oklch(0.6 0.2 260 / ${w.alpha})`;
      });
      sparkTriplets = SPARK_TOKENS.map((t) => cssVar(t) || '0.7 0.15 260');
    };
    const spark = (i: number, alpha: number) => `oklch(${sparkTriplets[i % sparkTriplets.length]} / ${alpha})`;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let drops: Drop[] = [];
    let ripples: Ripple[] = [];

    /** Deterministic-ish helpers; exact distribution matters less than even coverage. */
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const seed = () => {
      const area = width * height;
      // Densities, not counts: the same field looks equally busy on a laptop and on a
      // 4K panel. A fixed count leaves a big screen empty and a small one cluttered.
      const starCount = Math.round(Math.min(340, area / 6500));
      const dropCount = Math.round(Math.min(120, area / 17000));

      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        // Kept above the waterline: a star behind the waves reads as a rendering bug.
        y: Math.random() * height * 0.62,
        r: rand(0.5, 1.9),
        phase: Math.random() * Math.PI * 2,
        rate: rand(0.4, 1.6),
        color: Math.floor(rand(0, SPARK_TOKENS.length)),
      }));

      drops = Array.from({ length: dropCount }, () => newDrop(Math.random() * height * 0.5));
    };

    /** Depth is faked with one number: faster drops are longer, brighter and thicker. */
    const newDrop = (y = -20): Drop => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y,
        vy: 90 + depth * 260,
        len: 8 + depth * 46,
        color: Math.floor(rand(0, SPARK_TOKENS.length)),
        alpha: 0.4 + depth * 0.55,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Cap DPR at 2: a 3x buffer quadruples fill cost for no visible gain on soft edges.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    readColors();
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    /**
     * The wave surface at a given x and time.
     *
     * Shared by the renderer and the drop collision test, so a splash cannot land
     * anywhere but on the water actually drawn. Duplicating the maths would let the two
     * drift apart the moment either is tuned.
     */
    const waveY = (layer: (typeof WAVES)[number], x: number, t: number) => {
      const u = x / Math.max(1, width);
      const [f1, f2, f3] = layer.freqs;
      return (
        height * layer.y +
        height *
          layer.amp *
          (0.6 * Math.sin(u * Math.PI * 2 * f1! + t * layer.speed * 6 + layer.phase) +
            0.3 * Math.sin(u * Math.PI * 2 * f2! - t * layer.speed * 4 + layer.phase * 1.4) +
            0.1 * Math.sin(u * Math.PI * 2 * f3! + t * layer.speed * 9 + layer.phase * 0.6))
      );
    };

    const drawWave = (layer: (typeof WAVES)[number], color: string, t: number, crest = false) => {
      const step = 6; // Finer buys nothing at these amplitudes; coarser starts to fold.
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width + step; x += step) ctx.lineTo(x, waveY(layer, x, t));
      ctx.lineTo(width, height);
      ctx.closePath();

      // The fade ends past the next layer's crest rather than at the canvas bottom.
      // Fading each band across the full height stacks five washes and the field goes grey.
      const top = height * layer.y - height * layer.amp;
      const grad = ctx.createLinearGradient(0, top, 0, top + height * 0.26);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      /*
       * The collision layer gets a drawn crest line.
       *
       * Its fill is a soft gradient, so the eye reads the "surface" somewhere lower than
       * where the maths puts it — and the splashes then look like they are floating in
       * mid-air instead of landing on water. A thin bright edge makes the waterline a
       * thing you can see, which is the only reason the ripple placement reads as correct.
       */
      if (crest) {
        ctx.beginPath();
        for (let x = 0; x <= width + step; x += step) {
          const y = waveY(layer, x, t);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    };

    const drawStars = (t: number) => {
      for (const s of stars) {
        // Never fully off: a star that blinks out entirely reads as a dropped frame.
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.rate + s.phase));
        ctx.fillStyle = spark(s.color, 0.8 * tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawDrops = (dt: number, t: number) => {
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i]!;
        d.y += d.vy * dt;

        const surface = waveY(WAVES[0]!, d.x, t);
        if (d.y >= surface) {
          ripples.push({
            x: d.x,
            y: surface,
            age: 0,
            life: 1.1 + Math.random() * 0.6,
            color: d.color,
          });
          drops[i] = newDrop(-rand(20, height * 0.4));
          continue;
        }

        // A line, not a dot: the streak is what makes it read as falling rather than as a
        // dot that happens to be lower this frame.
        const grad = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, spark(d.color, d.alpha));
        ctx.strokeStyle = grad;
        ctx.lineWidth = d.alpha > 0.55 ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.len);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();

        // A brighter head on the nearest drops. The trail alone reads as a scratch; the
        // head is what makes it read as an object with a leading edge.
        if (d.alpha > 0.6) {
          ctx.fillStyle = spark(d.color, d.alpha);
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawRipples = (dt: number) => {
      // Iterate backwards so removing an expired ring cannot skip the next one.
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]!;
        r.age += dt;
        if (r.age >= r.life) {
          ripples.splice(i, 1);
          continue;
        }
        const p = r.age / r.life;
        // Ease-out: the ring spreads fast on impact and slows as it dies, the way a real
        // one loses energy. Linear growth reads as a mechanical expanding circle.
        const radius = 3 + (1 - Math.pow(1 - p, 2.2)) * 46;
        ctx.strokeStyle = spark(r.color, 0.7 * (1 - p));
        ctx.lineWidth = 1.2 * (1 - p * 0.6);
        ctx.beginPath();
        // Flattened vertically: a circle on a horizontal surface is seen in perspective.
        ctx.ellipse(r.x, r.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const frame = (t: number, dt: number) => {
      ctx.clearRect(0, 0, width, height);
      // `lighter` lets overlaps bloom instead of muddying — it is what makes the crossing
      // points glow rather than turn grey.
      ctx.globalCompositeOperation = 'lighter';
      drawStars(t);
      drawDrops(dt, t);
      WAVES.forEach((w, i) => drawWave(w, waveColors[i]!, t, i === 0));
      drawRipples(dt);
      ctx.globalCompositeOperation = 'source-over';
    };

    let raf = 0;
    let start = performance.now();
    let last = start;

    const loop = (now: number) => {
      // Clamp dt so a backgrounded tab or a long GC pause does not teleport every drop
      // to the bottom in a single frame.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame((now - start) / 1000, dt);
      raf = requestAnimationFrame(loop);
    };

    const staticFrame = () => {
      // Not t=0: every wave would share a phase and the field would look like a stack of
      // parallel lines. A fixed offset gives a composed still.
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      drawStars(4.2);
      for (const d of drops) {
        const grad = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, spark(d.color, d.alpha));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.len);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      WAVES.forEach((w, i) => drawWave(w, waveColors[i]!, 4.2, i === 0));
      ctx.globalCompositeOperation = 'source-over';
    };

    if (reduced) staticFrame();
    else raf = requestAnimationFrame(loop);

    // Do not animate a background nobody is looking at.
    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // The theme's variables land on the root before this effect re-runs, but the browser
    // may not have recomputed them yet; one frame of delay is enough.
    const recolor = requestAnimationFrame(() => {
      readColors();
      if (reduced) staticFrame();
    });

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(recolor);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [theme, mode]);

  return (
    // Decorative: it carries no information, so it is hidden from the accessibility tree.
    <canvas ref={canvasRef} aria-hidden="true" className={className} />
  );
}
