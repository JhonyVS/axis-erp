import { useEffect, useRef } from 'react';
import { usePrefs } from '@/stores/prefsStore';

/**
 * The animated background behind the sign-in screen.
 *
 * It draws layered travelling waves in the CURRENT THEME's own colours, read straight
 * from the generated custom properties — so the sign-in screen is the first thing that
 * proves the theme system is real, before the user has seen a single row of data.
 *
 * Why a canvas rather than animated SVG or CSS gradients: this is one composited surface
 * with one paint per frame. The equivalent in SVG is a dozen path elements the browser
 * re-rasterises every frame, which is exactly the kind of thing that makes a login screen
 * feel heavy on the machines an ERP actually runs on.
 *
 * Three details that matter more than the maths:
 *   - Each wave is a SUM of sines at different frequencies. A single sine reads as a
 *     machine part; three incommensurate ones never quite repeat and read as water.
 *   - The loop pauses when the tab is hidden. A background animation quietly burning a
 *     core behind another window is a rude thing to ship.
 *   - Under prefers-reduced-motion it paints one frame and stops. The composition still
 *     looks composed; it simply does not move.
 */

/** Layer shape. Frequencies are deliberately not integer multiples of each other. */
const LAYERS = [
  { token: '--chart-1', alpha: 0.55, amp: 0.1, y: 0.3, speed: 0.055, freqs: [1.0, 2.3, 3.7], phase: 0.0 },
  { token: '--chart-2', alpha: 0.5, amp: 0.13, y: 0.45, speed: -0.041, freqs: [0.8, 1.9, 3.1], phase: 1.7 },
  { token: '--chart-3', alpha: 0.45, amp: 0.09, y: 0.6, speed: 0.068, freqs: [1.3, 2.7, 4.3], phase: 3.4 },
  { token: '--primary', alpha: 0.5, amp: 0.14, y: 0.74, speed: -0.03, freqs: [0.7, 1.6, 2.9], phase: 5.1 },
  { token: '--chart-5', alpha: 0.4, amp: 0.08, y: 0.88, speed: 0.049, freqs: [1.1, 2.1, 3.3], phase: 2.2 },
] as const;

export function WaveField({ className }: { className?: string }) {
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
     * Tokens are OKLCH channel triplets, so the alpha is composed here rather than baked
     * into the palette. Canvas2D accepts CSS Color 4, which is what lets the wave use the
     * exact same colour the rest of the app does instead of an approximation.
     */
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      return LAYERS.map((l) => {
        const triplet = cs.getPropertyValue(l.token).trim();
        return triplet ? `oklch(${triplet} / ${l.alpha})` : `oklch(0.6 0.2 260 / ${l.alpha})`;
      });
    };

    let colors = read();
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Cap DPR at 2: a 3x retina buffer quadruples the fill cost for no visible gain on
      // a soft-edged gradient.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    /** One wave, filled from its crest to the bottom edge. */
    const drawLayer = (layer: (typeof LAYERS)[number], color: string, t: number) => {
      const baseY = height * layer.y;
      const amp = height * layer.amp;
      // Sample every 6px. Finer buys nothing at these amplitudes; coarser starts to fold.
      const step = 6;

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width + step; x += step) {
        const u = x / Math.max(1, width);
        const [f1, f2, f3] = layer.freqs;
        const y =
          baseY +
          amp *
            (0.6 * Math.sin(u * Math.PI * 2 * f1! + t * layer.speed * 6 + layer.phase) +
              0.3 * Math.sin(u * Math.PI * 2 * f2! - t * layer.speed * 4 + layer.phase * 1.4) +
              0.1 * Math.sin(u * Math.PI * 2 * f3! + t * layer.speed * 9 + layer.phase * 0.6));
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      // The fade ends a little past the NEXT layer's crest rather than at the bottom of
      // the canvas. Fading each band across the full height stacks five near-transparent
      // washes on top of each other and the whole field goes flat and grey.
      const grad = ctx.createLinearGradient(0, baseY - amp, 0, baseY + height * 0.28);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
    };

    const frame = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      // `lighter` lets overlaps bloom instead of muddying, which is what makes the crossing
      // points glow rather than turn grey.
      ctx.globalCompositeOperation = 'lighter';
      LAYERS.forEach((layer, i) => drawLayer(layer, colors[i]!, t));
      ctx.globalCompositeOperation = 'source-over';
    };

    let raf = 0;
    let start = performance.now();

    const loop = (now: number) => {
      frame((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      // Not frame zero — every wave would be at the same phase and the field would look
      // like a stack of parallel lines. A fixed offset gives a composed still.
      frame(4.2);
    } else {
      raf = requestAnimationFrame(loop);
    }

    // Do not animate a background nobody is looking at.
    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        start = performance.now() - 1;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // The theme's variables are applied to the root before this effect re-runs, but the
    // browser may not have recomputed them yet; one frame of delay is enough.
    const recolor = requestAnimationFrame(() => {
      colors = read();
      if (reduced) frame(4.2);
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
