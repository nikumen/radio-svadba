// VOLNA demo catalog — freely reachable, CORS-friendly audio (SoundHelix CDN).
// Works worldwide with no VPN, no auth, no geo-lock. Real durations fill in on play.

// Демо-треки убраны — сайт посвящён только плейлисту РАДИО СВАДЬБА.
export const TRACKS = [];

// Live wedding sets — original 320 kbps, self-hosted on Beget VPS (allmusicbot.ru,
// RU-доступно без VPN, постоянная ссылка, range/seek, CORS). Не пережато.
const REL = "https://allmusicbot.ru/audio/";
const LOGO = "assets/feerique-logo.svg"; // Feerique Event — бренд на обложках свадебных треков
export const WEDDING = [
  { id: "w1", title: "ЗАГС — Салоне", artist: "Радио Свадьба", src: REL + "radio-zags-salone.mp3",  duration: 1638, logo: LOGO },
  { id: "w2", title: "Салоне — Яхта", artist: "Радио Свадьба", src: REL + "radio-salone-yahta.mp3", duration: 3641, logo: LOGO },
];

const byId = new Map([...TRACKS, ...WEDDING].map((t) => [t.id, t]));
export const getTrack = (id) => byId.get(id) || null;

export const PLAYLISTS = [
  { id: "wedding", title: "РАДИО СВАДЬБА", subtitle: "Живой сет · оригинал 320k", tracks: WEDDING, logo: LOGO },
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
