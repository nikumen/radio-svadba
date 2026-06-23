// VOLNA demo catalog — freely reachable, CORS-friendly audio (SoundHelix CDN).
// Works worldwide with no VPN, no auth, no geo-lock. Real durations fill in on play.

const src = (n) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

export const TRACKS = [
  { id: "s1",  title: "Nightfall Drive", artist: "Lukas Vei",   src: src(1),  duration: 372 },
  { id: "s2",  title: "Paper Cities",    artist: "MELØW",       src: src(2),  duration: 426 },
  { id: "s3",  title: "Velvet Static",   artist: "Sora Kits",   src: src(3),  duration: 348 },
  { id: "s4",  title: "Golden Hour",     artist: "Anna Lune",   src: src(4),  duration: 290 },
  { id: "s5",  title: "Concrete Bloom",  artist: "Reyko",       src: src(5),  duration: 396 },
  { id: "s6",  title: "Slow Tide",       artist: "Håkon",       src: src(6),  duration: 264 },
  { id: "s7",  title: "Neon Rituals",    artist: "VANT",        src: src(7),  duration: 412 },
  { id: "s8",  title: "Afterglow",       artist: "Mira Sol",    src: src(8),  duration: 305 },
  { id: "s9",  title: "Glasshouse",      artist: "Tomo",        src: src(9),  duration: 330 },
  { id: "s10", title: "Northbound",      artist: "Eli Frost",   src: src(10), duration: 358 },
  { id: "s11", title: "Marble Skies",    artist: "Juno Park",   src: src(11), duration: 276 },
  { id: "s12", title: "Lowlight",        artist: "Sasha Vey",   src: src(12), duration: 384 },
  { id: "s13", title: "Embers",          artist: "Noor",        src: src(13), duration: 312 },
  { id: "s14", title: "Driftwood",       artist: "Kai Mori",    src: src(14), duration: 268 },
  { id: "s15", title: "Signal Lost",     artist: "ODA",         src: src(15), duration: 402 },
  { id: "s16", title: "Daybreak",        artist: "Lena Wilde",  src: src(16), duration: 294 },
];

// Live wedding sets — original 320 kbps, hosted on GitHub Releases (no recompress).
const REL = "https://github.com/nikumen/radio-svadba/releases/download/audio-v1/";
export const WEDDING = [
  { id: "w1", title: "ЗАГС — Салоне", artist: "Радио Свадьба", src: REL + "radio-zags-salone.mp3",  duration: 1638 },
  { id: "w2", title: "Салоне — Яхта", artist: "Радио Свадьба", src: REL + "radio-salone-yahta.mp3", duration: 3641 },
];

const byId = new Map([...TRACKS, ...WEDDING].map((t) => [t.id, t]));
export const getTrack = (id) => byId.get(id) || null;

export const PLAYLISTS = [
  { id: "wave",    title: "Моя волна",      subtitle: "Бесконечный поток",         wave: true, trackIds: TRACKS.map((t) => t.id) },
  { id: "wedding", title: "РАДИО СВАДЬБА",  subtitle: "Живой сет · оригинал 320k", tracks: WEDDING },
  { id: "night",   title: "Ночная езда",    subtitle: "Тёмный синт и драйв",      trackIds: ["s1", "s7", "s12", "s15", "s10", "s5"] },
  { id: "focus",   title: "Глубокий фокус", subtitle: "Спокойствие и поток",      trackIds: ["s3", "s9", "s11", "s6", "s2", "s8"] },
  { id: "sunrise", title: "Рассвет",        subtitle: "Тёплое и светлое",         trackIds: ["s4", "s8", "s16", "s13", "s11"] },
  { id: "loud",    title: "Громче",         subtitle: "Энергия на максимум",      trackIds: ["s7", "s5", "s1", "s14", "s15"] },
];

const plById = new Map(PLAYLISTS.map((p) => [p.id, p]));
export const getPlaylist = (id) => plById.get(id) || null;
export const playlistTracks = (id) => {
  const pl = plById.get(id);
  if (!pl) return [];
  if (pl.tracks) return pl.tracks;       // playlist carries its own tracks (e.g. РАДИО СВАДЬБА)
  return (pl.trackIds || []).map(getTrack).filter(Boolean);
};

/** shuffled batch from the whole catalog — fuels the auto-extending «Моя волна» */
export function waveBatch(n = 8) {
  const pool = [...TRACKS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
