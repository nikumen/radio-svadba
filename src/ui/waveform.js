// SoundCloud-style interactive waveform on a <canvas>.
import { genWaveform, clamp } from "../lib/util.js";

const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function createWaveform(canvas, { onSeek, onScrub } = {}) {
  const ctx = canvas.getContext("2d");
  const wrap = canvas.parentElement;
  let bars = genWaveform("init", 160);
  let progress = 0, hover = null, W = 0, H = 0, dpr = 1, dragging = false;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function roundRect(x, y, w, hh, r) {
    r = Math.min(r, w / 2, hh / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hh, r);
    ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    if (!W) { resize(); return; }
    ctx.clearRect(0, 0, W, H);
    const n = bars.length;
    const gap = clamp((W / n) * 0.34, 1, 2.5);
    const bw = Math.max(1.5, (W - gap * (n - 1)) / n);
    const cBg = cssVar("--wave-bg") || "#cbc6bf";
    const cHi = cssVar("--wave-bg-hi") || "#b8b2aa";
    const cFg = cssVar("--wave-fg") || "#ff5500";
    for (let i = 0; i < n; i++) {
      const x = i * (bw + gap);
      const bh = Math.max(2, bars[i] * H * 0.94);
      const y = (H - bh) / 2;
      const frac = (i + 0.5) / n;
      ctx.fillStyle = frac <= progress ? cFg : hover != null && frac <= hover ? cHi : cBg;
      roundRect(x, y, bw, bh, 2);
      ctx.fill();
    }
  }

  const clientXOf = (e) =>
    e.touches && e.touches[0] ? e.touches[0].clientX
    : e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX
    : e.clientX;
  const fracFrom = (e) => {
    const r = canvas.getBoundingClientRect();
    return clamp((clientXOf(e) - r.left) / r.width, 0, 1);
  };
  let gesture = false; // dedupe: one finger never seeks twice (pointer + touch both fire)
  const begin = (e) => { if (gesture) return; gesture = true; dragging = true; hover = fracFrom(e); draw(); onScrub && onScrub(hover); };
  const moveTo = (e) => { if (!gesture) return; hover = fracFrom(e); onScrub && onScrub(hover); draw(); };
  const finish = (e) => { if (!gesture) return; gesture = false; dragging = false; onSeek && onSeek(fracFrom(e)); hover = null; draw(); };
  const cancel = () => { gesture = false; dragging = false; hover = null; draw(); };

  // Pointer (mouse / pen / touch) — primary path on every modern browser.
  wrap.addEventListener("pointerdown", (e) => { try { wrap.setPointerCapture(e.pointerId); } catch {} begin(e); });
  wrap.addEventListener("pointermove", moveTo);
  wrap.addEventListener("pointerup", finish);
  wrap.addEventListener("pointercancel", cancel);
  wrap.addEventListener("pointerleave", () => { if (!dragging) { hover = null; draw(); } });

  // Touch — explicit fallback for devices where pointer events misbehave; the
  // `gesture` guard keeps it from double-seeking when both fire for one finger.
  wrap.addEventListener("touchstart", (e) => { e.preventDefault(); begin(e); }, { passive: false });
  wrap.addEventListener("touchmove", (e) => { e.preventDefault(); moveTo(e); }, { passive: false });
  wrap.addEventListener("touchend", (e) => { e.preventDefault(); finish(e); }, { passive: false });
  wrap.addEventListener("touchcancel", cancel);
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { onSeek && onSeek(clamp(progress + 0.02, 0, 1)); e.preventDefault(); }
    if (e.key === "ArrowLeft")  { onSeek && onSeek(clamp(progress - 0.02, 0, 1)); e.preventDefault(); }
  });

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);
  requestAnimationFrame(resize);

  return {
    setTrack(seed) { bars = genWaveform(seed, 160); progress = 0; draw(); },
    setProgress(p) {
      progress = clamp(p || 0, 0, 1);
      draw();
      wrap.setAttribute("aria-valuenow", Math.round(progress * 100));
    },
    redraw: draw,
  };
}
