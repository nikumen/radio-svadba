// Inline SVG icons (no external font/CDN → fast, RU-safe, crisp at any DPI).
const svg = (inner, attrs) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" ${attrs} aria-hidden="true" focusable="false">${inner}</svg>`;
const line = (paths) =>
  svg(paths, 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"');
const solid = (paths) => svg(paths, 'fill="currentColor"');

export const ICONS = {
  play: solid('<path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z"/>'),
  pause: solid('<rect x="6.5" y="4.5" width="3.6" height="15" rx="1.2"/><rect x="13.9" y="4.5" width="3.6" height="15" rx="1.2"/>'),
  prev: solid('<rect x="5" y="5.5" width="2.6" height="13" rx="1.2"/><path d="M19 6.3v11.4a1 1 0 0 1-1.53.85l-8.9-5.7a1 1 0 0 1 0-1.7l8.9-5.7A1 1 0 0 1 19 6.3Z"/>'),
  next: solid('<rect x="16.4" y="5.5" width="2.6" height="13" rx="1.2"/><path d="M5 6.3v11.4a1 1 0 0 0 1.53.85l8.9-5.7a1 1 0 0 0 0-1.7l-8.9-5.7A1 1 0 0 0 5 6.3Z"/>'),
  shuffle: line('<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>'),
  repeat: line('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  repeatOne: line('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10.5 12.5 10v4"/>'),
  heart: line('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>'),
  heartFilled: solid('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>'),
  volHigh: svg('<path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="M16 9a5 5 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19.5 7a9 9 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', ""),
  volLow: svg('<path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="M16 9a5 5 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', ""),
  volMute: svg('<path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="m22 9-6 6M16 9l6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', ""),
  bluetooth: line('<path d="m7 7 10 10-5 5V2l5 5L7 17"/>'),
  share: line('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 3.9M15.4 6.6 8.6 10.5"/>'),
  queue: line('<path d="M3 6h13M3 12h13M3 18h9"/><circle cx="19" cy="16" r="2.5"/><path d="M21.5 16V8"/>'),
  home: line('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'),
  wave: line('<path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"/>'),
  library: line('<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>'),
  search: line('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  menu: line('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  theme: svg('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>', ""),
  close: line('<path d="M18 6 6 18M6 6l12 12"/>'),
  chevronDown: line('<path d="m6 9 6 6 6-6"/>'),
  maximize: line('<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>'),
  plus: line('<path d="M12 5v14M5 12h14"/>'),
  globe: line('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18"/>'),
};

export function setIcon(el, name) {
  if (el && ICONS[name]) el.innerHTML = ICONS[name];
}

export function renderIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.dataset.icon;
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}
