// Wires the persistent bottom bar + the expanded Now-Playing overlay.
import { createWaveform } from "./waveform.js";
import { toast } from "./toast.js";
import { $, fmtTime, artworkCss, artHue } from "../lib/util.js";
import { likes } from "../lib/likes.js";

export function initPlayerBar(player) {
  const seekTo = (f) => player.seek(f * (player.audio.duration || 0));
  const pbWave = createWaveform($("pb-wave"), { onSeek: seekTo });
  const npWave = createWaveform($("np-wave"), { onSeek: seekTo });
  const np = $("np");

  const playBtns = [$("pb-play"), $("np-play")];
  const groups = {
    play: playBtns,
    prev: [$("pb-prev"), $("np-prev")],
    next: [$("pb-next"), $("np-next")],
    shuffle: [$("pb-shuffle"), $("np-shuffle")],
    repeat: [$("pb-repeat"), $("np-repeat")],
  };
  groups.play.forEach((b) => b.addEventListener("click", () => player.toggle()));
  groups.prev.forEach((b) => b.addEventListener("click", () => player.prev()));
  groups.next.forEach((b) => b.addEventListener("click", () => player.next()));
  groups.shuffle.forEach((b) => b.addEventListener("click", () => player.toggleShuffle()));
  groups.repeat.forEach((b) => b.addEventListener("click", () => player.cycleRepeat()));

  // like
  const likeUI = (track, on) => {
    const liked = on != null ? on : likes.has(track.id);
    const b = $("pb-like");
    b.classList.toggle("is-liked", liked);
    b.setAttribute("aria-pressed", String(liked));
  };
  $("pb-like").addEventListener("click", () => { const t = player.current(); if (t) likeUI(t, likes.toggle(t.id)); });
  likes.onChange((id, on) => { const t = player.current(); if (t && t.id === id) likeUI(t, on); });

  // volume
  const vol = $("pb-vol");
  vol.addEventListener("input", () => player.setVolume(parseFloat(vol.value)));
  $("pb-mute").addEventListener("click", () => player.toggleMute());
  player.addEventListener("volume", () => {
    vol.value = player.audio.volume;
    $("pb-mute").textContent = player.audio.volume === 0 ? "🔇" : player.audio.volume < 0.5 ? "🔉" : "🔊";
  });
  vol.value = player.audio.volume;

  // expand / collapse
  $("pb-art").addEventListener("click", () => { if (player.current()) { np.hidden = false; npWave.redraw(); } });
  $("np-close").addEventListener("click", () => (np.hidden = true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !np.hidden) np.hidden = true; });

  // theme change → recolor waveforms
  document.addEventListener("volna:theme", () => { pbWave.redraw(); npWave.redraw(); });

  function renderState() {
    const p = player.isPlaying;
    groups.play.forEach((b) => { b.textContent = p ? "⏸" : "▶"; b.setAttribute("aria-label", p ? "Пауза" : "Воспроизвести"); });
    document.body.classList.toggle("is-paused", !p);
  }
  function renderModes() {
    groups.shuffle.forEach((b) => { b.classList.toggle("is-on", player.shuffle); b.setAttribute("aria-pressed", String(player.shuffle)); });
    groups.repeat.forEach((b) => { b.setAttribute("data-mode", player.repeat); b.setAttribute("aria-label", player.repeat === "one" ? "Повтор одного" : player.repeat === "all" ? "Повтор всех" : "Повтор"); });
  }

  let errStreak = 0;
  player.addEventListener("trackchange", (e) => {
    const t = e.detail; if (!t) return;
    $("pb-title").textContent = t.title;
    $("pb-artist").textContent = t.artist;
    $("pb-art").style.background = artworkCss(t.id);
    $("np-title").textContent = t.title;
    $("np-artist").textContent = t.artist;
    $("np-from").textContent = player.queueName || "VOLNA";
    $("np-art").style.background = artworkCss(t.id);
    const hue = artHue(t.id);
    np.style.setProperty("--np-bg", `linear-gradient(160deg, hsl(${hue} 42% 14%), hsl(${(hue + 38) % 360} 46% 8%))`);
    np.style.setProperty("--np-glow", `radial-gradient(circle at 30% 18%, hsl(${hue} 90% 55% / .5), transparent 55%)`);
    pbWave.setTrack(t.id); npWave.setTrack(t.id);
    likeUI(t);
    $("pb-dur").textContent = fmtTime(t.duration || 0);
    $("np-dur").textContent = fmtTime(t.duration || 0);
  });

  player.addEventListener("time", () => {
    const a = player.audio, d = a.duration || 0, ct = a.currentTime || 0;
    if (ct > 0.5) errStreak = 0;
    const f = d ? ct / d : 0;
    pbWave.setProgress(f); npWave.setProgress(f);
    $("pb-cur").textContent = fmtTime(ct); $("np-cur").textContent = fmtTime(ct);
    if (isFinite(d) && d) { $("pb-dur").textContent = fmtTime(d); $("np-dur").textContent = fmtTime(d); }
  });

  player.addEventListener("state", renderState);
  player.addEventListener("modes", renderModes);
  player.addEventListener("trackerror", () => {
    errStreak++;
    if (errStreak <= 4) { toast("Трек недоступен — пропускаю"); player.next(); }
    else toast("Не удаётся загрузить аудио. Проверьте сеть.");
  });

  renderState(); renderModes();
}
