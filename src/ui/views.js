// VOLNA views — сайт посвящён единственному плейлисту РАДИО СВАДЬБА.
import { WEDDING, PLAYLISTS, getTrack, getPlaylist, playlistTracks } from "../data/catalog.js";
import { h, $, $$, fmtTime, artworkCss, genWaveform, applyCover } from "../lib/util.js";
import { likes } from "../lib/likes.js";
import { shareUrl, playlistShareUrl } from "../share/share.js";
import { ICONS } from "../lib/icons.js";

export function mountViews(player, { play }) {
  const view = $("view");
  let current = "home", query = "";

  /* ── small builders ── */
  const eqEl = () => h("span", { class: "eq", "aria-hidden": "true" }, h("i"), h("i"), h("i"));
  const cover = (track, cls) => { const e = h("span", { class: cls }); applyCover(e, track); return e; };

  function waveSvg(seed, n = 64) {
    const bars = genWaveform(seed, n);
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 30");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "trow__wave");
    svg.style.color = "var(--wave-bg)";
    const bw = (100 / n) * 0.6;
    for (let i = 0; i < n; i++) {
      const hh = Math.max(1, bars[i] * 28);
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", ((i / n) * 100).toFixed(2));
      r.setAttribute("y", ((30 - hh) / 2).toFixed(2));
      r.setAttribute("width", bw.toFixed(2));
      r.setAttribute("height", hh.toFixed(2));
      r.setAttribute("rx", "0.6");
      r.setAttribute("fill", "currentColor");
      svg.appendChild(r);
    }
    return svg;
  }

  function likeBtn(track) {
    const liked0 = likes.has(track.id);
    const setLk = (on) => { b.classList.toggle("is-liked", on); b.innerHTML = ICONS[on ? "heartFilled" : "heart"]; };
    const b = h("span", {
      class: "trow__like" + (liked0 ? " is-liked" : ""),
      role: "button", tabindex: "0", "aria-label": "В любимые", title: "В любимые",
      html: ICONS[liked0 ? "heartFilled" : "heart"],
      onclick: (e) => { e.stopPropagation(); setLk(likes.toggle(track.id)); },
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setLk(likes.toggle(track.id)); } },
    });
    return b;
  }

  function trackRow(track, idx, tracks, name) {
    return h("div", {
      class: "trow", role: "button", tabindex: "0",
      dataset: { trackId: track.id }, style: { "--i": idx },
      onclick: () => play(tracks, idx, name),
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(tracks, idx, name); } },
    },
      h("span", { class: "trow__idx" },
        h("span", { class: "num" }, String(idx + 1)),
        h("span", { class: "play", html: ICONS.play }),
        eqEl()),
      cover(track, "trow__art"),
      h("span", { class: "trow__main" },
        h("span", { class: "trow__title" }, track.title),
        h("span", { class: "trow__artist" }, track.artist)),
      waveSvg(track.id),
      h("span", { class: "trow__right" },
        likeBtn(track),
        h("span", { class: "trow__dur", dataset: { durFor: track.id } }, track.duration ? fmtTime(track.duration) : "–:–"))
    );
  }

  const tracklist = (tracks, name) =>
    h("div", { class: "tracklist" }, ...tracks.map((t, i) => trackRow(t, i, tracks, name)));

  function section(title, content, more) {
    return h("section", { class: "section" },
      h("div", { class: "section__head" }, h("h2", {}, title), more ? h("span", { class: "section__more" }, more) : null),
      content);
  }

  function plCard(pl) {
    const tracks = playlistTracks(pl.id);
    const art = h("div", { class: "pcard__art" },
      h("button", {
        class: "pcard__play", type: "button", "aria-label": "Слушать " + pl.title, html: ICONS.play,
        onclick: (e) => { e.stopPropagation(); play(tracks, 0, pl.title); },
      }));
    applyCover(art, pl);
    return h("div", {
      class: "pcard", role: "button", tabindex: "0",
      onclick: () => openPlaylist(pl.id),
      onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPlaylist(pl.id); } },
    },
      art,
      h("div", {},
        h("div", { class: "pcard__title" }, pl.title),
        h("div", { class: "pcard__sub" }, pl.subtitle))
    );
  }

  /* ── views ── */
  function viewHome() { return viewPlaylist("wedding"); } // единственный плейлист = главная

  function viewPlaylists() {
    return h("div", {}, section("Плейлисты",
      h("div", { style: { display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" } },
        ...PLAYLISTS.map(plCard))));
  }

  function viewPlaylist(id) {
    const pl = getPlaylist(id);
    if (!pl) return emptyState("search", "Плейлист не найден", "");
    const tracks = playlistTracks(id);
    const art = h("div", { class: "pl-cover", style: { width: "150px", height: "150px", borderRadius: "18px", boxShadow: "var(--shadow)", flex: "none" } });
    applyCover(art, pl);
    return h("div", {},
      h("div", { class: "section", style: { display: "flex", gap: "1.25rem", alignItems: "flex-end", flexWrap: "wrap" } },
        art,
        h("div", {},
          h("p", { class: "hero__eyebrow", style: { color: "var(--text-3)" } }, "Плейлист"),
          h("h1", { style: { fontSize: "var(--t-xl)" } }, pl.title),
          h("p", { style: { color: "var(--text-2)" } }, `${pl.subtitle} · ${tracks.length} ${tracks.length === 1 ? "трек" : "трека"}`),
          h("div", { class: "hero__actions", style: { marginTop: "1rem" } },
            h("button", { class: "pill-btn", type: "button", html: ICONS.play + "<span>Слушать</span>", onclick: () => play(tracks, 0, pl.title) }),
            h("button", { class: "pill-btn pill-btn--ghost", type: "button", html: ICONS.share + "<span>Поделиться</span>", onclick: () => shareUrl(playlistShareUrl(id), pl.title) })))),
      h("div", { class: "section" }, tracklist(tracks, pl.title))
    );
  }

  function viewLiked() {
    const tracks = likes.list().map(getTrack).filter(Boolean);
    if (!tracks.length)
      return emptyState("heart", "Пока пусто", "Нажимайте на сердечко у треков — они появятся здесь.");
    return h("div", {}, section("Любимое", tracklist(tracks, "Любимое"), `${tracks.length}`));
  }

  function viewSearch(q) {
    const lq = q.toLowerCase();
    const res = WEDDING.filter((t) => t.title.toLowerCase().includes(lq) || t.artist.toLowerCase().includes(lq));
    if (!res.length) return emptyState("search", "Ничего не нашлось", `По запросу «${q}» нет треков. Можно добавить трек по ссылке.`);
    return h("div", {}, section(`Результаты: «${q}»`, tracklist(res, "Поиск"), `${res.length}`));
  }

  const emptyState = (iconName, title, text) =>
    h("div", { class: "empty" }, h("div", { class: "empty__ico", html: ICONS[iconName] || "" }), h("h3", {}, title), h("p", {}, text));

  /* ── controller ── */
  function setNavActive(v) { $$(".nav__item").forEach((b) => b.classList.toggle("is-active", b.dataset.view === v)); }

  function paint() {
    view.innerHTML = "";
    if (current === "search") view.append(viewSearch(query));
    else if (current === "playlists") view.append(viewPlaylists());
    else if (current === "liked") view.append(viewLiked());
    else if (current.startsWith("pl:")) view.append(viewPlaylist(current.slice(3)));
    else view.append(viewHome());
    updateCurrent(player.current());
  }

  function show(v) { current = v; query = ""; setNavActive(v); paint(); view.scrollTop = 0; }
  function openPlaylist(id) { current = "pl:" + id; query = ""; setNavActive("playlists"); paint(); view.scrollTop = 0; }
  function search(q) { query = q.trim(); current = query ? "search" : "home"; setNavActive("home"); paint(); }

  function updateCurrent(track) {
    const id = track && track.id;
    $$(".trow", view).forEach((r) => r.classList.toggle("is-current", r.dataset.trackId === id));
  }
  function updateDur() {
    const t = player.current();
    if (!t || !t.duration) return;
    $$(`[data-dur-for="${t.id}"]`, view).forEach((el) => (el.textContent = fmtTime(t.duration)));
  }

  player.addEventListener("trackchange", (e) => updateCurrent(e.detail));
  player.addEventListener("meta", updateDur);
  likes.onChange(() => { if (current === "liked") paint(); });

  return { show, search, paint, openPlaylist };
}
