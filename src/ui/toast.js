import { $ } from "../lib/util.js";

export function toast(msg, variant) {
  const wrap = $("toasts");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className = "toast" + (variant ? " toast--" + variant : "");
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .3s, transform .3s";
    t.style.opacity = "0";
    t.style.transform = "translateY(8px)";
    setTimeout(() => t.remove(), 320);
  }, 2600);
}
