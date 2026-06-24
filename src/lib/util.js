// VOLNA — shared utilities (DOM, math, seeded waveform, artwork, storage)

export const $ = (id) => document.getElementById(id);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** tiny hyperscript helper */
export function h(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "dataset") Object.assign(e.dataset, v);
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) e.setAttribute(k, "");
    else e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(c));
  }
  return e;
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function fmtTime(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/* ── seeded RNG ── */
export function hashStr(str) {
  let h = 2166136261 >>> 0;
  str = String(str);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** deterministic, musical-looking waveform heights (0..1) */
export function genWaveform(seed, n = 160) {
  const rng = mulberry32(hashStr(seed));
  const arr = new Float32Array(n);
  const sections = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let env = 0.32 + 0.4 * Math.sin(t * Math.PI);
    for (let s = 0; s < sections; s++) {
      const c = (s + 0.5) / sections;
      env += 0.16 * Math.exp(-Math.pow((t - c) / 0.12, 2));
    }
    let v = env * (0.55 + 0.45 * rng());
    if (rng() > 0.93) v += 0.25 * rng();
    arr[i] = clamp(v * 0.72, 0.06, 1);
  }
  return arr;
}

/* ── artwork (deterministic gradients) ── */
export const artHue = (seed) => hashStr(seed) % 360;
export function artworkCss(seed) {
  const hue = artHue(seed), h2 = (hue + 38) % 360;
  return `linear-gradient(140deg, hsl(${hue} 86% 63%), hsl(${h2} 80% 45%))`;
}

/** paint a cover element: gradient + optional brand logo overlay (white silhouette via CSS mask) */
export function applyCover(el, track) {
  if (!el || !track) return;
  el.style.background = artworkCss(track.id);
  let logo = el.querySelector(":scope > .cover-logo");
  if (track.logo) {
    el.classList.add("cover--logo");
    if (!logo) {
      logo = document.createElement("img");
      logo.className = "cover-logo";
      logo.alt = "";
      logo.setAttribute("aria-hidden", "true");
      el.prepend(logo);
    }
    if (logo.getAttribute("src") !== track.logo) logo.setAttribute("src", track.logo);
  } else {
    el.classList.remove("cover--logo");
    if (logo) logo.remove();
  }
}
let _artCache = new Map();
export function artworkDataUrl(seed, size = 512) {
  if (_artCache.has(seed)) return _artCache.get(seed);
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  const hue = artHue(seed), h2 = (hue + 38) % 360;
  const g = x.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, `hsl(${hue} 86% 63%)`);
  g.addColorStop(1, `hsl(${h2} 80% 45%)`);
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  const rng = mulberry32(hashStr(seed) + 7);
  for (let i = 0; i < 3; i++) {
    x.beginPath();
    x.fillStyle = `hsla(${(hue + i * 60) % 360} 90% ${60 + i * 8}% / 0.18)`;
    x.arc(rng() * size, rng() * size, size * (0.25 + rng() * 0.3), 0, Math.PI * 2);
    x.fill();
  }
  const url = c.toDataURL("image/png");
  _artCache.set(seed, url);
  return url;
}

/* ── base64url (unicode-safe) ── */
export function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/* ── localStorage wrapper ── */
export const store = {
  get(k, def) {
    try {
      const v = localStorage.getItem("volna:" + k);
      return v == null ? def : JSON.parse(v);
    } catch { return def; }
  },
  set(k, v) {
    try { localStorage.setItem("volna:" + k, JSON.stringify(v)); } catch {}
  },
};
