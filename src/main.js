// VOLNA — app bootstrap.
import { player } from "./engine/player.js";
import { bindMediaSession } from "./engine/mediaSession.js";
import { setupOutput } from "./engine/output.js";
import { initPlayerBar } from "./ui/playerBar.js";
import { initQueue } from "./ui/queue.js";
import { mountViews } from "./ui/views.js";
import { initShare, parseShareLink } from "./share/share.js";
import { TRACKS, waveBatch } from "./data/catalog.js";
import { toast } from "./ui/toast.js";
import { $, $$, h, store, hashStr } from "./lib/util.js";

/* central play() — fed to the views */
function play(tracks, index = 0, name = "", { wave = false } = {}) {
  if (!tracks || !tracks.length) return;
  player.queueName = name;
  player.autoExtend = wave ? () => waveBatch(6) : null;
  player.setQueue(tracks, index, { play: true, name });
}

bindMediaSession(player);
initPlayerBar(player);
initQueue(player);
initShare(player);
setupOutput(player, $("pb-output"), $("pb-output-dot"));
const views = mountViews(player, { play });
window.VOLNA = player; // console handle for power users / debugging

/* ── navigation ── */
$$(".nav__item").forEach((b) =>
  b.addEventListener("click", () => { views.show(b.dataset.view); closeNav(); })
);

/* ── mobile sidebar ── */
function closeNav() { document.body.classList.remove("nav-open"); $("scrim").hidden = true; }
$("btn-menu").addEventListener("click", () => {
  const open = !document.body.classList.contains("nav-open");
  document.body.classList.toggle("nav-open", open);
  $("scrim").hidden = !open;
});
$("scrim").addEventListener("click", closeNav);

/* ── sidebar playlist shortcuts ── */
import("./data/catalog.js").then(({ PLAYLISTS }) => {
  const wrap = $("side-playlists");
  PLAYLISTS.forEach((pl) =>
    wrap.append(
      h("button", { class: "side-pl", type: "button", onclick: () => { views.openPlaylist(pl.id); closeNav(); } },
        h("span", { class: "side-pl__sw", style: { background: `linear-gradient(140deg, hsl(${hashStr(pl.id) % 360} 86% 63%), hsl(${(hashStr(pl.id) % 360 + 38) % 360} 80% 45%))` } }),
        h("span", {}, pl.title))
    )
  );
});

/* ── search ── */
$("search").addEventListener("input", (e) => views.search(e.target.value));

/* ── theme ── */
const root = document.documentElement;
root.dataset.theme = store.get("theme", "light");
$("btn-theme").addEventListener("click", () => {
  const t = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = t;
  store.set("theme", t);
  document.dispatchEvent(new Event("volna:theme"));
});

/* ── add track by URL ── */
const dialog = h("div", { class: "dialog", hidden: true },
  h("form", { class: "dialog__panel" },
    h("h2", {}, "Добавить трек по ссылке"),
    h("p", { style: { color: "var(--text-2)", fontSize: "var(--t-sm)" } }, "Прямая ссылка на аудиофайл (mp3, m4a, ogg…). Играет сразу, отовсюду."),
    field("url", "Ссылка на аудио", "https://…/track.mp3", "url"),
    field("title", "Название", "Без названия"),
    field("artist", "Исполнитель", "Неизвестен"),
    h("div", { class: "dialog__row" },
      h("button", { class: "ghost-btn", type: "button", "data-close": "1" }, "Отмена"),
      h("button", { class: "pill-btn", type: "submit" }, "Слушать"))
  )
);
document.body.append(dialog);
function field(name, label, ph, type = "text") {
  return h("div", { class: "field" },
    h("label", { for: "f-" + name }, label),
    h("input", { id: "f-" + name, name, type, placeholder: ph, autocomplete: "off" }));
}
const openDialog = () => { dialog.hidden = false; dialog.querySelector("#f-url").focus(); };
const closeDialog = () => { dialog.hidden = true; dialog.querySelector("form").reset(); };
$("btn-add").addEventListener("click", openDialog);
dialog.addEventListener("click", (e) => { if (e.target === dialog || e.target.dataset.close) closeDialog(); });
dialog.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const src = dialog.querySelector("#f-url").value.trim();
  if (!src) return;
  const title = dialog.querySelector("#f-title").value.trim() || "Трек по ссылке";
  const artist = dialog.querySelector("#f-artist").value.trim() || "Неизвестен";
  play([{ id: "u" + hashStr(src), title, artist, src, custom: true, duration: null }], 0, "По ссылке");
  closeDialog();
  toast("Добавлено в плеер", "accent");
});

/* ── keyboard shortcuts ── */
document.addEventListener("keydown", (e) => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || e.target.isContentEditable || !dialog.hidden) return;
  switch (e.key) {
    case " ": e.preventDefault(); player.toggle(); break;
    case "ArrowRight": player.seekBy(5); break;
    case "ArrowLeft": player.seekBy(-5); break;
    case "ArrowUp": e.preventDefault(); player.setVolume(player.audio.volume + 0.05); break;
    case "ArrowDown": e.preventDefault(); player.setVolume(player.audio.volume - 0.05); break;
    case "n": case "т": player.next(); break;
    case "p": case "з": player.prev(); break;
    case "s": case "ы": player.toggleShuffle(); break;
    case "r": case "к": player.cycleRepeat(); break;
    case "m": case "ь": player.toggleMute(); break;
    case "l": case "д": { const t = player.current(); if (t) import("./lib/likes.js").then((m) => m.likes.toggle(t.id)); break; }
    case "q": case "й": $("pb-queue").click(); break;
  }
});

/* ── resume / restore ── */
function snapshot() {
  const t = player.current();
  if (!t) return;
  store.set("lastState", {
    name: player.queueName,
    idx: player.order[player.pos],
    time: player.audio.currentTime,
    tracks: player.queue.map((x) => ({ id: x.id, title: x.title, artist: x.artist, src: x.src, custom: !!x.custom, duration: x.duration })),
  });
}
let lastSave = 0;
player.addEventListener("trackchange", snapshot);
player.addEventListener("state", snapshot);
player.addEventListener("time", () => {
  const ct = player.audio.currentTime;
  if (Math.abs(ct - lastSave) > 5) { lastSave = ct; snapshot(); }
});
window.addEventListener("beforeunload", snapshot);

(function boot() {
  const shared = parseShareLink();
  if (shared && shared.tracks.length) {
    player.queueName = shared.name;
    player.autoExtend = shared.wave ? () => waveBatch(6) : null;
    player.setQueue(shared.tracks, shared.index, { play: false, name: shared.name });
    toast("Плейлист по ссылке: " + shared.name, "accent");
    if (shared.id) views.openPlaylist(shared.id);   // именованный плейлист → открыть его экран
    else views.show("home");
    return;
  }
  const saved = store.get("lastState", null);
  if (saved && saved.tracks && saved.tracks.length) {
    player.queueName = saved.name || "";
    if (saved.time) player.audio.addEventListener("loadedmetadata", function once() { try { player.audio.currentTime = saved.time; } catch {} player.audio.removeEventListener("loadedmetadata", once); });
    player.setQueue(saved.tracks, saved.idx || 0, { play: false, name: saved.name || "" });
  }
  views.show("home");
})();
