// Shareable playlist links. State is encoded in the URL hash → no backend,
// works from any device, anywhere. Two forms:
//   #pl=<id>     — a catalog playlist (short link)
//   #p=<base64>  — an arbitrary queue (catalog ids + any custom audio URLs)
import { getPlaylist, playlistTracks, getTrack } from "../data/catalog.js";
import { b64urlEncode, b64urlDecode, hashStr } from "../lib/util.js";
import { toast } from "../ui/toast.js";

export function playlistShareUrl(id) {
  const u = new URL(location.href);
  u.hash = "pl=" + id;
  return u.toString();
}

export function buildShareLink(player) {
  const tracks = player.queue;
  if (!tracks.length) return null;
  const payload = {
    n: player.queueName || "Плейлист",
    i: player.order[player.pos] || 0,
    t: tracks.map((t) => (t.custom ? { c: 1, t: t.title, a: t.artist, s: t.src } : { id: t.id })),
  };
  const u = new URL(location.href);
  u.hash = "p=" + b64urlEncode(JSON.stringify(payload));
  return u.toString();
}

export function parseShareLink() {
  const hash = location.hash.replace(/^#/, "");
  const plMatch = hash.match(/(?:^|&)pl=([\w-]+)/);
  if (plMatch) {
    const pl = getPlaylist(plMatch[1]);
    if (pl) return { tracks: playlistTracks(pl.id), index: 0, name: pl.title, wave: !!pl.wave };
  }
  const pMatch = hash.match(/(?:^|&)p=([^&]+)/);
  if (pMatch) {
    try {
      const p = JSON.parse(b64urlDecode(pMatch[1]));
      const tracks = p.t
        .map((x) =>
          x.c
            ? { id: "u" + hashStr(x.s), title: x.t || "Трек по ссылке", artist: x.a || "Неизвестен", src: x.s, custom: true, duration: null }
            : getTrack(x.id)
        )
        .filter(Boolean);
      if (tracks.length) return { tracks, index: Math.min(p.i || 0, tracks.length - 1), name: p.n || "Плейлист по ссылке", wave: false };
    } catch {}
  }
  return null;
}

export async function shareUrl(url, title) {
  if (!url) return;
  if (navigator.share) {
    try { await navigator.share({ title: "VOLNA — " + (title || "плейлист"), url }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  try { await navigator.clipboard.writeText(url); toast("Ссылка скопирована — отправляйте куда угодно", "accent"); }
  catch { window.prompt("Скопируйте ссылку на плейлист:", url); }
}

export function initShare(player) {
  document.getElementById("pb-share").addEventListener("click", () => {
    const url = buildShareLink(player);
    if (!url) return toast("Сначала запустите плейлист");
    shareUrl(url, player.queueName);
  });
}
