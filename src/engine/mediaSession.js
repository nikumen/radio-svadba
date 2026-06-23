// Media Session API — lets Bluetooth headsets, car head-units, lock screens and
// OS media keys control VOLNA, and shows track metadata + artwork there.
import { artworkDataUrl } from "../lib/util.js";

export function bindMediaSession(player) {
  if (!("mediaSession" in navigator)) return;
  const ms = navigator.mediaSession;

  player.addEventListener("trackchange", (e) => {
    const t = e.detail;
    if (!t) return;
    try {
      ms.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        album: "VOLNA · " + (player.queueName || "Плейлист"),
        artwork: [
          { src: t.artUrl || artworkDataUrl(t.id, 256), sizes: "256x256", type: "image/png" },
          { src: t.artUrl || artworkDataUrl(t.id, 512), sizes: "512x512", type: "image/png" },
        ],
      });
    } catch {}
  });

  player.addEventListener("state", () => {
    try { ms.playbackState = player.isPlaying ? "playing" : "paused"; } catch {}
  });

  player.addEventListener("time", () => {
    const d = player.audio.duration;
    if (ms.setPositionState && isFinite(d) && d > 0) {
      try {
        ms.setPositionState({
          duration: d,
          position: Math.min(player.audio.currentTime, d),
          playbackRate: player.audio.playbackRate || 1,
        });
      } catch {}
    }
  });

  const set = (action, handler) => { try { ms.setActionHandler(action, handler); } catch {} };
  set("play", () => player.play());
  set("pause", () => player.pause());
  set("stop", () => player.pause());
  set("previoustrack", () => player.prev());
  set("nexttrack", () => player.next());
  set("seekbackward", (d) => player.seekBy(-(d?.seekOffset || 10)));
  set("seekforward", (d) => player.seekBy(d?.seekOffset || 10));
  set("seekto", (d) => { if (d?.seekTime != null) player.seek(d.seekTime); });
}
