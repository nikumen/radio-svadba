// Queue drawer — shows the upcoming play order, click to jump, × to remove.
import { h, $, $$, artworkCss } from "../lib/util.js";

export function initQueue(player) {
  const app = document.querySelector(".app");
  const panel = $("queue");
  const list = $("queue-list");
  const btn = $("pb-queue");

  function open(force) {
    const on = force != null ? force : panel.hidden;
    if (on) { panel.hidden = false; requestAnimationFrame(() => app.classList.add("has-queue")); }
    else { app.classList.remove("has-queue"); setTimeout(() => (panel.hidden = true), 280); }
    btn.setAttribute("aria-pressed", String(on));
  }
  btn.addEventListener("click", () => open());
  $("queue-close").addEventListener("click", () => open(false));

  function render() {
    list.innerHTML = "";
    if (!player.queue.length) {
      list.append(h("li", { class: "empty", style: { padding: "2rem 1rem" } }, "Очередь пуста"));
      return;
    }
    player.order.forEach((qi, p) => {
      const t = player.queue[qi];
      if (!t) return;
      const row = h("li", {},
        h("div", {
          class: "qrow" + (p === player.pos ? " is-current" : ""),
          role: "button", tabindex: "0",
          onclick: () => player.playPos(p),
          onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); player.playPos(p); } },
        },
          h("span", { class: "qrow__art", style: { background: artworkCss(t.id) } }),
          h("span", { style: { minWidth: 0 } },
            h("div", { class: "qrow__t" }, t.title),
            h("div", { class: "qrow__a" }, t.artist)),
          h("button", {
            class: "iconbtn", style: { width: "30px", height: "30px", fontSize: "1rem" },
            "aria-label": "Убрать из очереди", title: "Убрать",
            onclick: (e) => { e.stopPropagation(); player.removeAt(qi); },
          }, "×"))
      );
      list.append(row);
    });
  }

  player.addEventListener("queuechange", render);
  player.addEventListener("trackchange", render);
  render();
}
